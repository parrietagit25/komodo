"""
Wallet and Transaction models.
Transactions are immutable: only creation allowed; use compensating transactions for reversals.
Wallet balance operations (debit/credit) are concurrency-safe via select_for_update().
"""
from decimal import Decimal
from django.db import models, transaction as db_transaction
from django.core.exceptions import ValidationError
from apps.core.models import TimeStampedModel

# System user for platform commission wallet (get_or_create in get_platform_wallet).
PLATFORM_USERNAME = '__komodo_platform__'


class TransactionType(models.TextChoices):
    CREDIT = 'CREDIT', 'Credit'
    DEBIT = 'DEBIT', 'Debit'


class Wallet(TimeStampedModel):
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='wallet',
    )
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    currency = models.CharField(max_length=3, default='USD')

    class Meta:
        db_table = 'wallet_wallet'
        verbose_name = 'Wallet'
        verbose_name_plural = 'Wallets'

    def __str__(self):
        return f'{self.user.username} - {self.balance} {self.currency}'

    def debit(self, amount, order=None, description=''):
        """
        Concurrency-safe debit. Locks wallet row, validates balance, then subtracts and creates Transaction.
        amount must be positive. Never use a previously fetched wallet instance; always re-fetched inside.
        """
        if amount <= 0:
            raise ValidationError('Debit amount must be positive.')
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(pk=self.pk)
            if wallet.balance < amount:
                raise ValidationError('Insufficient balance')
            wallet.balance -= amount
            wallet.save(update_fields=['balance'])
            Transaction.objects.create(
                wallet=wallet,
                amount=amount,
                transaction_type=TransactionType.DEBIT,
                order=order,
                description=description or 'Debit',
            )

    def credit(self, amount, order=None, description=''):
        """
        Concurrency-safe credit. Locks wallet row, adds amount, creates Transaction.
        amount must be positive.
        """
        if amount <= 0:
            raise ValidationError('Credit amount must be positive.')
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(pk=self.pk)
            wallet.balance += amount
            wallet.save(update_fields=['balance'])
            Transaction.objects.create(
                wallet=wallet,
                amount=amount,
                transaction_type=TransactionType.CREDIT,
                order=order,
                description=description or 'Credit',
            )

    def add_balance(self, amount, transaction_type, order=None, description=''):
        """Atomically update balance and create a transaction. amount must be positive. Uses debit/credit for safety."""
        assert amount > 0
        if transaction_type == TransactionType.DEBIT:
            self.debit(amount, order=order, description=description or transaction_type)
        else:
            self.credit(amount, order=order, description=description or transaction_type)


class Transaction(TimeStampedModel):
    """Movement of balance: CREDIT adds, DEBIT subtracts. Immutable: only creation allowed."""
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions',
        db_index=True,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wallet_transactions',
        db_index=True,
    )
    description = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = 'wallet_transaction'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', 'order'], name='wallet_tx_wallet_order'),
        ]

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValidationError('Transaction records are immutable; updates are not allowed.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError('Transaction records are immutable; deletions are not allowed. Use compensating transactions for reversals.')


def get_platform_wallet():
    """Return the platform wallet (commission bucket). Creates platform user and wallet if needed."""
    from apps.users.models import User
    from apps.users.models import UserRole

    user, created = User.objects.get_or_create(
        username=PLATFORM_USERNAME,
        defaults={
            'role': UserRole.SUPERADMIN,
            'is_active': True,
            'email': 'platform@system.local',
        },
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=['password'])
    wallet, _ = Wallet.objects.get_or_create(
        user=user,
        defaults={'balance': Decimal('0.00')},
    )
    return wallet
