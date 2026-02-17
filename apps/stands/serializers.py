"""
Stand and Product serializers.
"""
from rest_framework import serializers
from .models import Stand, Product
from apps.events.serializers import EventMinimalSerializer
from apps.users.models import UserRole


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'stand', 'name', 'description', 'price',
            'stock_quantity', 'is_available', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'is_available']


class StandSerializer(serializers.ModelSerializer):
    event_detail = EventMinimalSerializer(source='event', read_only=True)
    products = ProductMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = Stand
        fields = [
            'id', 'event', 'event_detail', 'name', 'description', 'is_active', 'owner',
            'products', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_owner(self, value):
        if value is None:
            return value
        if getattr(value, 'role', None) != UserRole.STAND_ADMIN:
            raise serializers.ValidationError('Owner must have role STAND_ADMIN.')
        return value


class StandMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stand
        fields = ['id', 'name', 'event']
