"""
Basic tests for financial audit: reconciliation and global balance verification.
"""
from decimal import Decimal

from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.users.models import User, UserRole
from apps.organizations.models import Organization
from apps.events.models import Event
from apps.stands.models import Stand
from apps.orders.models import Order, OrderStatus
from apps.wallet.models import Wallet, Transaction, TransactionType, get_platform_wallet
from apps.audit.models import FinancialAuditLog
from apps.audit.services.financial_audit import reconcile_order, verify_global_balance


class ReconcileOrderTests(TestCase):
    """Test reconcile_order returns expected structure and validates correctly."""

    def test_reconcile_order_not_found_returns_invalid(self):
        result = reconcile_order(99999)
        self.assertFalse(result['is_valid'])
        self.assertIn('order_id', result)
        self.assertEqual(result['order_id'], 99999)
        self.assertIn('errors', result)
        self.assertGreater(len(result['errors']), 0)

    def test_reconcile_order_not_completed_returns_invalid(self):
        user = User.objects.create_user(username='u1', password='test', role=UserRole.USER)
        org = Organization.objects.create(name='Org', commission_rate=Decimal('10.00'))
        event = Event.objects.create(name='Ev', organization=org)
        stand = Stand.objects.create(name='St', event=event)
        order = Order.objects.create(user=user, stand=stand, status=OrderStatus.PENDING, total_amount=Decimal('100.00'))
        result = reconcile_order(order.id)
        self.assertFalse(result['is_valid'])
        self.assertIn('Order not found or not COMPLETED', result['errors'][0])

    def test_reconcile_order_no_audit_log_returns_invalid(self):
        user = User.objects.create_user(username='u2', password='test', role=UserRole.USER)
        org = Organization.objects.create(name='Org2', commission_rate=Decimal('10.00'))
        event = Event.objects.create(name='Ev2', organization=org)
        stand = Stand.objects.create(name='St2', event=event)
        order = Order.objects.create(user=user, stand=stand, status=OrderStatus.COMPLETED, total_amount=Decimal('100.00'))
        # No FinancialAuditLog created (e.g. if created before audit was installed)
        result = reconcile_order(order.id)
        self.assertFalse(result['is_valid'])
        self.assertIn('No FinancialAuditLog', result['errors'][0])

    def test_reconcile_order_valid_returns_valid(self):
        user = User.objects.create_user(username='u3', password='test', role=UserRole.USER)
        org = Organization.objects.create(name='Org3', commission_rate=Decimal('10.00'))
        event = Event.objects.create(name='Ev3', organization=org)
        stand = Stand.objects.create(name='St3', event=event)
        order = Order.objects.create(user=user, stand=stand, status=OrderStatus.COMPLETED, total_amount=Decimal('100.00'))
        FinancialAuditLog.objects.create(
            order=order,
            total_amount=Decimal('100.00'),
            commission_amount=Decimal('10.00'),
            net_amount=Decimal('90.00'),
            organization=org,
            stand=stand,
            user=user,
        )
        user_wallet = Wallet.objects.create(user=user, balance=Decimal('0.00'))
        platform_wallet = get_platform_wallet()
        Transaction.objects.create(wallet=user_wallet, amount=Decimal('100.00'), transaction_type=TransactionType.DEBIT, order=order)
        Transaction.objects.create(wallet=platform_wallet, amount=Decimal('10.00'), transaction_type=TransactionType.CREDIT, order=order)
        stand_admin = User.objects.create_user(username='stand_admin', password='test', role=UserRole.STAND_ADMIN, stand=stand)
        stand_wallet = Wallet.objects.create(user=stand_admin, balance=Decimal('0.00'))
        Transaction.objects.create(wallet=stand_wallet, amount=Decimal('90.00'), transaction_type=TransactionType.CREDIT, order=order)

        result = reconcile_order(order.id)
        self.assertTrue(result['is_valid'], result.get('errors'))
        self.assertEqual(result['order_id'], order.id)
        self.assertEqual(result['errors'], [])


class VerifyGlobalBalanceTests(TestCase):
    """Test verify_global_balance returns expected structure."""

    def test_verify_global_balance_returns_keys(self):
        result = verify_global_balance()
        self.assertIn('wallet_total', result)
        self.assertIn('ledger_total', result)
        self.assertIn('difference', result)

    def test_verify_global_balance_empty_ledger(self):
        result = verify_global_balance()
        self.assertEqual(result['wallet_total'], 0.0)
        self.assertEqual(result['ledger_total'], 0.0)
        self.assertEqual(result['difference'], 0.0)


class TransactionImmutabilityTests(TestCase):
    """Test Transaction model rejects update and delete."""

    def test_transaction_update_raises_validation_error(self):
        user = User.objects.create_user(username='txuser', password='test', role=UserRole.USER)
        wallet = Wallet.objects.create(user=user, balance=Decimal('100.00'))
        tx = Transaction.objects.create(
            wallet=wallet,
            amount=Decimal('10.00'),
            transaction_type=TransactionType.DEBIT,
        )
        with self.assertRaises(ValidationError) as ctx:
            tx.amount = Decimal('20.00')
            tx.save()
        self.assertIn('immutable', str(ctx.exception).lower())

    def test_transaction_delete_raises_validation_error(self):
        user = User.objects.create_user(username='txuser2', password='test', role=UserRole.USER)
        wallet = Wallet.objects.create(user=user, balance=Decimal('100.00'))
        tx = Transaction.objects.create(
            wallet=wallet,
            amount=Decimal('10.00'),
            transaction_type=TransactionType.DEBIT,
        )
        with self.assertRaises(ValidationError) as ctx:
            tx.delete()
        self.assertIn('immutable', str(ctx.exception).lower())
