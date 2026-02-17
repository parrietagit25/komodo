"""
Wallet and Transaction serializers.
"""
from decimal import Decimal
from rest_framework import serializers
from .models import Wallet, Transaction


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['id', 'user', 'balance', 'currency', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'balance', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'wallet', 'amount', 'transaction_type',
            'order', 'description', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AddFundsSerializer(serializers.Serializer):
    """Payload for EVENT_ADMIN/SUPERADMIN to add balance to a user's wallet."""
    user_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    description = serializers.CharField(required=False, default='', allow_blank=True)
