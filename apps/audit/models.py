"""
Financial audit: immutable snapshot when an order is completed.
"""
from decimal import Decimal
from django.db import models


class FinancialAuditLog(models.Model):
    """
    Snapshot of order financials at completion time. Created when Order becomes COMPLETED.
    Never update this record.
    """
    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='financial_audit_log',
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='financial_audit_logs',
    )
    stand = models.ForeignKey(
        'stands.Stand',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='financial_audit_logs',
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='financial_audit_logs',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_financialauditlog'
        verbose_name = 'Financial Audit Log'
        verbose_name_plural = 'Financial Audit Logs'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.pk is not None:
            from django.core.exceptions import ValidationError
            raise ValidationError('FinancialAuditLog records are immutable; updates are not allowed.')
        super().save(*args, **kwargs)
