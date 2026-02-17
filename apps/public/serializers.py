"""
Read-only serializers for public API (USER purchase flow).
"""
from rest_framework import serializers
from apps.events.models import Event
from apps.stands.models import Stand, Product


class PublicEventSerializer(serializers.ModelSerializer):
    """Active events only; read-only."""

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description',
            'start_date', 'end_date',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PublicStandSerializer(serializers.ModelSerializer):
    """Active stands only; read-only."""

    class Meta:
        model = Stand
        fields = [
            'id', 'name', 'description',
            'event',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PublicProductSerializer(serializers.ModelSerializer):
    """Available products with stock > 0; read-only."""

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description',
            'price', 'stock_quantity',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields
