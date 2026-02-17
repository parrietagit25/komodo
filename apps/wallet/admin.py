from django.contrib import admin
from .models import Wallet


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'currency', 'created_at']
    search_fields = ['user__username']
    raw_id_fields = ['user']
