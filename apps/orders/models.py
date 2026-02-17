"""
Order model linked to User and Stand.
"""
from decimal import Decimal
from django.db import models
from apps.core.models import TimeStampedModel


class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Order(TimeStampedModel):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='orders',
    )
    stand = models.ForeignKey(
        'stands.Stand',
        on_delete=models.CASCADE,
        related_name='orders',
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True, default='')
    idempotency_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text='Client-generated key to prevent duplicate charges (e.g. UUID).',
    )
    is_reversed = models.BooleanField(
        default=False,
        help_text='True when this order has been financially reversed (e.g. COMPLETED -> CANCELLED).',
    )

    class Meta:
        db_table = 'orders_order'
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.id} - {self.user.username}'


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'stands.Product',
        on_delete=models.CASCADE,
        related_name='order_items',
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        db_table = 'orders_orderitem'
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'
