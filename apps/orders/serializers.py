"""
Order and OrderItem serializers.
Checkout/payment logic lives in apps.orders.services.checkout (create_order_with_payment).
"""
from decimal import Decimal
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import Order, OrderItem, OrderStatus
from .services.checkout import create_order_with_payment
from apps.users.serializers import UserMinimalSerializer
from apps.users.models import UserRole
from apps.stands.serializers import StandMinimalSerializer, ProductMinimalSerializer
from apps.stands.models import Stand


class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductMinimalSerializer(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'product', 'product_detail',
            'quantity', 'unit_price', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    user_detail = UserMinimalSerializer(source='user', read_only=True)
    stand_detail = StandMinimalSerializer(source='stand', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_detail', 'stand', 'stand_detail',
            'status', 'total_amount', 'notes', 'items',
            'idempotency_key', 'is_reversed',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'idempotency_key', 'is_reversed']


class OrderItemCreateSerializer(serializers.ModelSerializer):
    """For nested write: product, quantity, unit_price only."""
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)
    idempotency_key = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Order
        fields = ['id', 'stand', 'status', 'total_amount', 'notes', 'items', 'idempotency_key']

    def create(self, validated_data, **kwargs):
        items_data = validated_data.pop('items', [])
        validated_data.pop('user', None)
        user = kwargs.get('user') or self.context['request'].user
        total_amount = validated_data.get('total_amount') or Decimal('0.00')
        idempotency_key = validated_data.pop('idempotency_key', None) or None
        if idempotency_key is not None and not idempotency_key.strip():
            idempotency_key = None
        notes = validated_data.get('notes') or ''
        stand = validated_data.get('stand')

        if user.role == UserRole.USER and total_amount > 0 and stand:
            try:
                order = create_order_with_payment(
                    user=user,
                    stand=stand,
                    items=items_data,
                    idempotency_key=idempotency_key,
                    notes=notes,
                )
            except DjangoValidationError as e:
                msg = getattr(e, 'messages', None) or getattr(e, 'message', None) or str(e)
                if isinstance(msg, list):
                    msg = msg[0] if msg else str(e)
                raise serializers.ValidationError({'detail': msg})
            return order

        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            order = Order.objects.create(
                user=user,
                stand=stand,
                status=validated_data.get('status', OrderStatus.PENDING),
                total_amount=total_amount,
                notes=notes,
            )
            for item in items_data:
                OrderItem.objects.create(order=order, **item)
        return order
