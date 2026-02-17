"""
Order and checkout tests. Concurrency and idempotency for production safety.
"""
from decimal import Decimal
import threading

from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.users.models import User, UserRole
from apps.organizations.models import Organization
from apps.events.models import Event
from apps.stands.models import Stand, Product
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.orders.services.checkout import create_order_with_payment
from apps.wallet.models import Wallet, Transaction, TransactionType


class CheckoutIdempotencyTests(TestCase):
    """Idempotency: same idempotency_key returns same order and does not double-charge."""

    def setUp(self):
        self.org = Organization.objects.create(name='Org', commission_rate=Decimal('10.00'))
        self.event = Event.objects.create(name='Ev', organization=self.org)
        self.stand = Stand.objects.create(name='St', event=self.event)
        self.product = Product.objects.create(
            stand=self.stand,
            name='P1',
            price=Decimal('50.00'),
            stock_quantity=10,
        )
        self.user = User.objects.create_user(username='buyer', password='test', role=UserRole.USER)
        Wallet.objects.create(user=self.user, balance=Decimal('200.00'))

    def test_idempotency_same_key_returns_same_order_no_double_charge(self):
        items = [
            {'product': self.product, 'quantity': 2, 'unit_price': Decimal('50.00')},
        ]
        key = 'idem-key-001'

        order1 = create_order_with_payment(
            user=self.user,
            stand=self.stand,
            items=items,
            idempotency_key=key,
            notes='First',
        )
        order2 = create_order_with_payment(
            user=self.user,
            stand=self.stand,
            items=items,
            idempotency_key=key,
            notes='Second',
        )

        self.assertEqual(order1.id, order2.id)
        self.assertEqual(Order.objects.count(), 1)

        debits = Transaction.objects.filter(
            wallet__user=self.user,
            transaction_type=TransactionType.DEBIT,
            order=order1,
        )
        self.assertEqual(debits.count(), 1)
        self.assertEqual(debits.get().amount, Decimal('100.00'))

        wallet = Wallet.objects.get(user=self.user)
        self.assertEqual(wallet.balance, Decimal('100.00'))

    def test_insufficient_balance_raises(self):
        Wallet.objects.filter(user=self.user).update(balance=Decimal('10.00'))
        items = [{'product': self.product, 'quantity': 1, 'unit_price': Decimal('50.00')}]

        with self.assertRaises(ValidationError):
            create_order_with_payment(
                user=self.user,
                stand=self.stand,
                items=items,
                idempotency_key='key-insufficient',
            )


class CheckoutConcurrencyTests(TestCase):
    """Concurrency: parallel checkout attempts with same idempotency_key; only one charge."""

    def setUp(self):
        self.org = Organization.objects.create(name='Org2', commission_rate=Decimal('5.00'))
        self.event = Event.objects.create(name='Ev2', organization=self.org)
        self.stand = Stand.objects.create(name='St2', event=self.event)
        self.product = Product.objects.create(
            stand=self.stand,
            name='P2',
            price=Decimal('25.00'),
            stock_quantity=10,
        )
        self.user = User.objects.create_user(username='buyer2', password='test', role=UserRole.USER)
        Wallet.objects.create(user=self.user, balance=Decimal('100.00'))

    def test_parallel_checkout_same_idempotency_key_only_one_succeeds_balance_correct(self):
        items = [{'product': self.product, 'quantity': 2, 'unit_price': Decimal('25.00')}]
        key = 'concurrent-idem-key'
        results = []
        errors = []

        def run_checkout():
            try:
                order = create_order_with_payment(
                    user=self.user,
                    stand=self.stand,
                    items=items,
                    idempotency_key=key,
                )
                results.append(order)
            except Exception as e:
                errors.append(e)

        t1 = threading.Thread(target=run_checkout)
        t2 = threading.Thread(target=run_checkout)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(Order.objects.filter(idempotency_key=key).count(), 1)
        self.assertEqual(Order.objects.count(), 1)

        order = Order.objects.get(idempotency_key=key)
        self.assertEqual(order.status, OrderStatus.COMPLETED)
        self.assertEqual(order.total_amount, Decimal('50.00'))

        debits = Transaction.objects.filter(
            wallet__user=self.user,
            transaction_type=TransactionType.DEBIT,
            order=order,
        )
        self.assertEqual(debits.count(), 1, 'Must not double-charge')
        self.assertEqual(debits.get().amount, Decimal('50.00'))

        wallet = Wallet.objects.get(user=self.user)
        self.assertEqual(wallet.balance, Decimal('50.00'))
