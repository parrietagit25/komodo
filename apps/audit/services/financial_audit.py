"""
Financial audit services: reconciliation, global balance verification, order reversal.
Do not raise exceptions from reconcile_order / verify_global_balance; return result dicts.
"""
from decimal import Decimal
from django.db import transaction as db_transaction
from django.db.models import Sum

from apps.orders.models import Order, OrderStatus
from apps.wallet.models import Wallet, Transaction, TransactionType, get_platform_wallet
from apps.users.models import UserRole
from apps.audit.models import FinancialAuditLog


def reconcile_order(order_id):
    """
    Verify that wallet transactions for an order match the financial audit snapshot.
    Returns a dict; does not raise.
    """
    result = {'order_id': order_id, 'is_valid': True, 'errors': []}
    try:
        order = Order.objects.select_related('user', 'stand__event__organization').filter(
            id=order_id,
            status=OrderStatus.COMPLETED,
        ).first()
        if not order:
            result['is_valid'] = False
            result['errors'].append('Order not found or not COMPLETED')
            return result

        audit = FinancialAuditLog.objects.filter(order_id=order_id).first()
        if not audit:
            result['is_valid'] = False
            result['errors'].append('No FinancialAuditLog for this order')
            return result

        total_amount = order.total_amount or Decimal('0.00')
        commission_amount = audit.commission_amount or Decimal('0.00')
        net_amount = audit.net_amount or Decimal('0.00')

        if total_amount != commission_amount + net_amount:
            result['is_valid'] = False
            result['errors'].append(
                f'total_amount ({total_amount}) != commission + net ({commission_amount + net_amount})'
            )

        order_txs = Transaction.objects.filter(order_id=order_id).select_related('wallet__user')

        user_debit = order_txs.filter(
            wallet__user_id=order.user_id,
            transaction_type=TransactionType.DEBIT,
        ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        if user_debit != total_amount:
            result['is_valid'] = False
            result['errors'].append(
                f'USER debit ({user_debit}) != order total_amount ({total_amount})'
            )

        platform_wallet = get_platform_wallet()
        platform_credit = order_txs.filter(
            wallet_id=platform_wallet.id,
            transaction_type=TransactionType.CREDIT,
        ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        if platform_credit != commission_amount:
            result['is_valid'] = False
            result['errors'].append(
                f'PLATFORM credit ({platform_credit}) != commission_amount ({commission_amount})'
            )

        stand_admin = order.stand.users.filter(role=UserRole.STAND_ADMIN).first()
        if stand_admin:
            stand_credit = order_txs.filter(
                wallet__user_id=stand_admin.id,
                transaction_type=TransactionType.CREDIT,
            ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            if stand_credit != net_amount:
                result['is_valid'] = False
                result['errors'].append(
                    f'STAND credit ({stand_credit}) != net_amount ({net_amount})'
                )
        elif net_amount > 0:
            result['is_valid'] = False
            result['errors'].append('Stand has no STAND_ADMIN but net_amount > 0')

    except Exception as e:
        result['is_valid'] = False
        result['errors'].append(str(e))

    return result


def verify_global_balance():
    """
    Verify SUM(wallet.balance) == SUM(CREDIT) - SUM(DEBIT).
    Returns a dict with wallet_total, ledger_total, difference; does not raise.
    """
    result = {'wallet_total': 0, 'ledger_total': 0, 'difference': 0}
    try:
        wallet_total = Wallet.objects.aggregate(s=Sum('balance'))['s'] or Decimal('0.00')
        credit_sum = Transaction.objects.filter(
            transaction_type=TransactionType.CREDIT,
        ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        debit_sum = Transaction.objects.filter(
            transaction_type=TransactionType.DEBIT,
        ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        ledger_total = credit_sum - debit_sum
        difference = wallet_total - ledger_total
        result['wallet_total'] = float(wallet_total)
        result['ledger_total'] = float(ledger_total)
        result['difference'] = float(difference)
    except Exception as e:
        result['error'] = str(e)
    return result


def reverse_order(order):
    """
    Create compensating transactions when an order is reversed (COMPLETED -> CANCELLED).
    Call only when order.status has been set to CANCELLED; uses FinancialAuditLog for amounts.
    Uses transaction.atomic; locks all involved wallets with select_for_update.
    Prevents double reversal via order.is_reversed. Does not delete any existing transactions.
    """
    with db_transaction.atomic():
        order_refreshed = Order.objects.select_for_update().filter(pk=order.pk).first()
        if not order_refreshed:
            raise ValueError('Order not found')
        order = order_refreshed

        if order.is_reversed:
            return

        audit = FinancialAuditLog.objects.filter(order=order).first()
        if not audit:
            raise ValueError('Cannot reverse: no FinancialAuditLog for this order')

        total_amount = audit.total_amount or Decimal('0.00')
        commission_amount = audit.commission_amount or Decimal('0.00')
        net_amount = audit.net_amount or Decimal('0.00')

        user_wallet, _ = Wallet.objects.get_or_create(
            user=order.user,
            defaults={'balance': Decimal('0.00')},
        )
        user_wallet = Wallet.objects.select_for_update().get(pk=user_wallet.pk)
        user_wallet.credit(
            total_amount,
            order=order,
            description=f'Order #{order.id} (reversal refund)',
        )

        stand_admin = order.stand.users.filter(role=UserRole.STAND_ADMIN).first()
        if stand_admin and net_amount > 0:
            admin_wallet, _ = Wallet.objects.get_or_create(
                user=stand_admin,
                defaults={'balance': Decimal('0.00')},
            )
            admin_wallet = Wallet.objects.select_for_update().get(pk=admin_wallet.pk)
            if admin_wallet.balance < net_amount:
                raise ValueError('Stand admin wallet has insufficient balance for reversal')
            admin_wallet.debit(
                net_amount,
                order=order,
                description=f'Order #{order.id} (reversal)',
            )

        if commission_amount > 0:
            platform_wallet = get_platform_wallet()
            platform_wallet = Wallet.objects.select_for_update().get(pk=platform_wallet.pk)
            if platform_wallet.balance < commission_amount:
                raise ValueError('Platform wallet has insufficient balance for reversal')
            platform_wallet.debit(
                commission_amount,
                order=order,
                description=f'Order #{order.id} (reversal)',
            )

        order.is_reversed = True
        order.save(update_fields=['is_reversed'])
