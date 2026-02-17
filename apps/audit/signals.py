"""
Create FinancialAuditLog when an Order becomes COMPLETED.
"""
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.orders.models import Order, OrderStatus
from apps.stands.models import Stand
from .models import FinancialAuditLog


@receiver(post_save, sender=Order)
def create_financial_audit_log_on_completed(sender, instance, created, **kwargs):
    if instance.status != OrderStatus.COMPLETED:
        return
    if FinancialAuditLog.objects.filter(order=instance).exists():
        return
    stand = Stand.objects.select_related('event__organization').filter(pk=instance.stand_id).first()
    organization = stand.event.organization if stand and getattr(stand, 'event', None) else None
    commission_rate = (organization.commission_rate or Decimal('0')) if organization else Decimal('0')
    total = instance.total_amount or Decimal('0.00')
    commission = (total * commission_rate / Decimal('100')).quantize(Decimal('0.01'))
    net = (total - commission).quantize(Decimal('0.01'))
    FinancialAuditLog.objects.create(
        order=instance,
        total_amount=total,
        commission_amount=commission,
        net_amount=net,
        organization=organization,
        stand=stand,
        user=instance.user,
    )
