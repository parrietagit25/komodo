"""
Organization model with soft delete.
"""
from django.db import models
from apps.core.models import TimeStampedModel, SoftDeleteModel, SoftDeleteManager


class Organization(TimeStampedModel, SoftDeleteModel):
    name = models.CharField(max_length=255)
    plan = models.CharField(max_length=100, blank=True, default='')
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text='Commission rate as percentage (e.g. 10.00 for 10%)',
    )
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_organizations',
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'organizations_organization'
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
        ordering = ['name']

    def __str__(self):
        return self.name
