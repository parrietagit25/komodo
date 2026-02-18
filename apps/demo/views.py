"""
Demo data generation. SUPERADMIN only.
POST /api/demo/generate/ — create random orders with products, wallet logic, spread over last 30 days.
POST /api/demo/flush/ — delete all demo-generated orders and reverse their wallet impact (SUPERADMIN only).
"""
import random
from decimal import Decimal
from datetime import timedelta

from django.db import transaction as db_transaction, connection
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsSuperAdmin
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.stands.models import Stand
from apps.users.models import User, UserRole
from apps.wallet.models import Wallet, Transaction, TransactionType, get_platform_wallet

DEMO_ORDER_NOTES = 'Demo generated'


def _get_stands_with_products():
    """Return list of (stand, [(product_id, price), ...]) for stands that have at least one product."""
    stands = (
        Stand.objects.select_related('event__organization')
        .filter(event__isnull=False)
        .prefetch_related('products')
        .all()
    )
    result = []
    for stand in stands:
        products = [(p.id, p.price) for p in stand.products.all() if p.price is not None]
        if products:
            result.append((stand, products))
    return result


class DemoGenerateView(APIView):
    """POST /api/demo/generate/ — generate random demo orders (SUPERADMIN only)."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        users = list(
            User.objects.filter(role=UserRole.USER, is_deleted=False).values_list('id', flat=True)
        )
        stands_with_products = _get_stands_with_products()

        if not users or not stands_with_products:
            return Response(
                {
                    'orders_created': 0,
                    'total_generated_revenue': 0.0,
                    'total_commission_generated': 0.0,
                    'detail': 'Need at least one USER and one Stand with products to generate demo orders.',
                },
                status=status.HTTP_200_OK,
            )

        target_orders = random.randint(50, 200)
        orders_created = 0
        total_generated_revenue = Decimal('0.00')
        total_commission_generated = Decimal('0.00')
        now = timezone.now()

        for _ in range(target_orders):
            user_id = random.choice(users)
            stand, products_list = random.choice(stands_with_products)
            num_items = random.randint(1, min(3, len(products_list)))
            chosen = random.sample(products_list, num_items)
            items = [
                (product_id, unit_price, random.randint(1, 3))
                for (product_id, unit_price) in chosen
            ]
            total_amount = sum(
                (Decimal(str(unit_price)) * qty for (_, unit_price, qty) in items),
                Decimal('0.00'),
            ).quantize(Decimal('0.01'))

            if total_amount <= 0:
                continue

            random_days = random.randint(0, 30)
            random_seconds = random.randint(0, 86400)
            random_date = now - timedelta(days=random_days, seconds=random_seconds)

            try:
                with db_transaction.atomic():
                    order = Order.objects.create(
                        user_id=user_id,
                        stand=stand,
                        status=OrderStatus.COMPLETED,
                        total_amount=total_amount,
                        notes=DEMO_ORDER_NOTES,
                    )
                    for (product_id, unit_price, qty) in items:
                        OrderItem.objects.create(
                            order=order,
                            product_id=product_id,
                            quantity=qty,
                            unit_price=Decimal(str(unit_price)),
                        )
                    Order.objects.filter(pk=order.pk).update(
                        created_at=random_date,
                        updated_at=random_date,
                    )

                    user = User.objects.get(pk=user_id)
                    buyer_wallet, _ = Wallet.objects.get_or_create(
                        user=user,
                        defaults={'balance': Decimal('0.00')},
                    )
                    buyer_wallet.add_balance(
                        total_amount,
                        TransactionType.CREDIT,
                        order=order,
                        description='Demo seed',
                    )
                    buyer_wallet.add_balance(
                        total_amount,
                        TransactionType.DEBIT,
                        order=order,
                        description=f'Order #{order.id}',
                    )

                    organization = stand.event.organization
                    commission_rate = organization.commission_rate or Decimal('0')
                    commission = (
                        total_amount * commission_rate / Decimal('100')
                    ).quantize(Decimal('0.01'))
                    net_to_stand = (total_amount - commission).quantize(Decimal('0.01'))

                    stand_admin = stand.users.filter(role=UserRole.STAND_ADMIN).first()
                    if stand_admin and stand_admin.id != user_id and net_to_stand > 0:
                        admin_wallet, _ = Wallet.objects.get_or_create(
                            user=stand_admin,
                            defaults={'balance': Decimal('0.00')},
                        )
                        admin_wallet.add_balance(
                            net_to_stand,
                            TransactionType.CREDIT,
                            order=order,
                            description=f'Order #{order.id} (net)',
                        )
                    if commission > 0:
                        platform_wallet = get_platform_wallet()
                        platform_wallet.add_balance(
                            commission,
                            TransactionType.CREDIT,
                            order=order,
                            description=f'Order #{order.id} (commission)',
                        )

                    total_generated_revenue += total_amount
                    total_commission_generated += commission
                    orders_created += 1
            except Exception:
                continue

        return Response(
            {
                'orders_created': orders_created,
                'total_generated_revenue': round(float(total_generated_revenue), 2),
                'total_commission_generated': round(float(total_commission_generated), 2),
            },
            status=status.HTTP_200_OK,
        )


class DemoFlushView(APIView):
    """
    POST /api/demo/flush/ — delete all demo-generated orders and reverse their wallet impact.
    SUPERADMIN only. Orders with notes='Demo generated' are removed; compensating transactions
    are created so wallet balances stay correct (transactions are immutable).
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        demo_orders = Order.objects.filter(notes=DEMO_ORDER_NOTES).select_related('stand').order_by('id')
        count = 0
        errors = []

        for order in demo_orders:
            try:
                with db_transaction.atomic():
                    # Get all transactions linked to this order, ordered by wallet_id to avoid deadlocks
                    txs = list(
                        Transaction.objects.filter(order=order).select_related('wallet').order_by('wallet_id')
                    )
                    for tx in txs:
                        wallet = Wallet.objects.select_for_update().get(pk=tx.wallet_id)
                        rev_desc = f'Reversal demo order #{order.id}'
                        if tx.transaction_type == TransactionType.CREDIT:
                            if wallet.balance < tx.amount:
                                raise ValueError(
                                    f'Wallet {wallet.id} balance {wallet.balance} < {tx.amount} for reversal'
                                )
                            wallet.balance -= tx.amount
                            wallet.save(update_fields=['balance'])
                            Transaction.objects.create(
                                wallet=wallet,
                                amount=tx.amount,
                                transaction_type=TransactionType.DEBIT,
                                order=None,
                                description=rev_desc,
                            )
                        else:
                            wallet.balance += tx.amount
                            wallet.save(update_fields=['balance'])
                            Transaction.objects.create(
                                wallet=wallet,
                                amount=tx.amount,
                                transaction_type=TransactionType.CREDIT,
                                order=None,
                                description=rev_desc,
                            )
                    order.delete()
                    count += 1
            except Exception as e:
                errors.append(f'Order #{order.id}: {e}')

        return Response(
            {
                'orders_deleted': count,
                'detail': f'Deleted {count} demo orders.' + (f' Errors: {errors}' if errors else ''),
                'errors': errors if errors else None,
            },
            status=status.HTTP_200_OK,
        )


class DemoFlushAllView(APIView):
    """
    POST /api/demo/flush-all/ — delete ALL orders and ALL transactions, set all wallet balances to 0.
    SUPERADMIN only. Use for cleaning test data. Bypasses transaction immutability via raw SQL.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        with db_transaction.atomic():
            orders_count, _ = Order.objects.all().delete()
            with connection.cursor() as cursor:
                cursor.execute(f'DELETE FROM {Transaction._meta.db_table}')
                transactions_count = cursor.rowcount
            Wallet.objects.all().update(balance=Decimal('0.00'))

        return Response(
            {
                'orders_deleted': orders_count,
                'transactions_deleted': transactions_count,
                'detail': f'Deleted {orders_count} orders and {transactions_count} transactions. All wallet balances set to 0.',
            },
            status=status.HTTP_200_OK,
        )
