"""
Stand model linked to Event. Product linked to Stand.
"""
from decimal import Decimal
from django.db import models
from apps.core.models import TimeStampedModel


class Stand(TimeStampedModel):
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='stands',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_stands',
    )

    class Meta:
        db_table = 'stands_stand'
        verbose_name = 'Stand'
        verbose_name_plural = 'Stands'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    stand = models.ForeignKey(
        Stand,
        on_delete=models.CASCADE,
        related_name='products',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    stock_quantity = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'stands_product'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']

    def __str__(self):
        return self.name
