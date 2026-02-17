"""
Custom User model with role, status, and tenant FKs.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    SUPERADMIN = 'SUPERADMIN', 'Super Admin'
    EVENT_ADMIN = 'EVENT_ADMIN', 'Event Admin'
    STAND_ADMIN = 'STAND_ADMIN', 'Stand Admin'
    USER = 'USER', 'User'


class UserStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ACTIVE = 'ACTIVE', 'Active'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    DELETED = 'DELETED', 'Deleted'


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.USER,
    )
    status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.PENDING,
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
    )
    stand = models.ForeignKey(
        'stands.Stand',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
    )
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def soft_delete(self):
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.status = UserStatus.DELETED
        self.save(update_fields=['is_deleted', 'deleted_at', 'status'])
