"""
Create Wallet when User is created.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Wallet


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_wallet_for_user(sender, instance, created, **kwargs):
    if created and not kwargs.get('raw', False):
        Wallet.objects.get_or_create(user=instance)
