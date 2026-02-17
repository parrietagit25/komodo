"""
Idempotent, concurrency-safe checkout: create order and process payment in one atomic transaction.
Prevents double charges, race conditions, and duplicate orders.
"""
from decimal import Decimal
from django.db import transaction as db_transaction, IntegrityError
from django.core.exceptions import ValidationError

from apps.orders.models import Order, OrderItem, OrderStatus
from apps.wallet.models import Wallet, TransactionType, get_platform_wallet
from apps.users.models import UserRole
from apps.stands.models import Stand, Product


def create_order_with_payment(user, stand, items, idempotency_key=None, notes=''):
    """
    Create an order and process payment atomically. Idempotent when idempotency_key is provided.

    - user: buyer (must be USER role for payment).
    - stand: Stand instance (will be re-fetched with select_related for organization).
    - items: list of dicts with keys product (id or Product), quantity, unit_price.
    - idempotency_key: optional unique key (e.g. UUID). If provided and an order already exists
      with this key, returns that order without charging again.
    - notes: optional order notes.

    Returns: Order (with status COMPLETED after successful payment).
    Raises: ValidationError on validation or insufficient balance.
    """
    if user.role != UserRole.USER:
        raise ValidationError('Only USER role can create paid orders via checkout.')

    stand = Stand.objects.select_related('event__organization').get(pk=stand.pk)
    organization = stand.event.organization if stand.event else None
    commission_rate = (organization.commission_rate or Decimal('0')) if organization else Decimal('0')

    # Resolve items: product id -> Product, validate belong to stand
    resolved_items = []
    total_amount = Decimal('0.00')
    for it in items:
        product_id = it.get('product')
        if hasattr(product_id, 'pk'):
            product_id = product_id.pk
        product = Product.objects.filter(pk=product_id, stand=stand).first()
        if not product:
            raise ValidationError(f'Product {product_id} not found or does not belong to this stand.')
        qty = max(0, int(it.get('quantity') or 0))
        if qty <= 0:
            continue
        unit_price = Decimal(str(it.get('unit_price') or 0))
        if unit_price < 0:
            raise ValidationError('Unit price cannot be negative.')
        resolved_items.append({'product': product, 'quantity': qty, 'unit_price': unit_price})
        total_amount += unit_price * qty

    total_amount = total_amount.quantize(Decimal('0.01'))
    if total_amount <= 0:
        raise ValidationError('Order total must be positive.')

    with db_transaction.atomic():
        # Idempotency: if key provided and order already exists, return it (no second charge)
        if idempotency_key:
            existing = Order.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                return existing

        # Lock buyer wallet (create if missing, then lock)
        buyer_wallet, _ = Wallet.objects.get_or_create(
            user=user,
            defaults={'balance': Decimal('0.00')},
        )
        buyer_wallet = Wallet.objects.select_for_update().get(pk=buyer_wallet.pk)

        if buyer_wallet.balance < total_amount:
            raise ValidationError('Insufficient wallet balance.')

        commission = (total_amount * commission_rate / Decimal('100')).quantize(Decimal('0.01'))
        net_to_stand = (total_amount - commission).quantize(Decimal('0.01'))

        try:
            order = Order.objects.create(
                user=user,
                stand=stand,
                status=OrderStatus.PENDING,
                total_amount=total_amount,
                notes=notes or '',
                idempotency_key=idempotency_key or None,
            )
        except IntegrityError as e:
            if idempotency_key and 'idempotency_key' in str(e).lower():
                existing = Order.objects.filter(idempotency_key=idempotency_key).first()
                if existing:
                    return existing
            raise

        for it in resolved_items:
            OrderItem.objects.create(
                order=order,
                product=it['product'],
                quantity=it['quantity'],
                unit_price=it['unit_price'],
            )

        buyer_wallet.debit(
            total_amount,
            order=order,
            description=f'Order #{order.id}',
        )

        stand_admin = stand.users.filter(role=UserRole.STAND_ADMIN).first()
        if stand_admin and stand_admin.id != user.id and net_to_stand > 0:
            admin_wallet = Wallet.objects.select_for_update().filter(user=stand_admin).first()
            if not admin_wallet:
                admin_wallet = Wallet.objects.create(user=stand_admin, balance=Decimal('0.00'))
                admin_wallet = Wallet.objects.select_for_update().get(pk=admin_wallet.pk)
            admin_wallet.credit(
                net_to_stand,
                order=order,
                description=f'Order #{order.id} (net)',
            )

        if commission > 0:
            platform_wallet = get_platform_wallet()
            platform_wallet = Wallet.objects.select_for_update().get(pk=platform_wallet.pk)
            platform_wallet.credit(
                commission,
                order=order,
                description=f'Order #{order.id} (commission)',
            )

        order.status = OrderStatus.COMPLETED
        order.save(update_fields=['status'])

        return order
