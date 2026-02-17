"""
Organization serializers.
"""
from rest_framework import serializers
from .models import Organization
from apps.users.models import UserRole


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'plan', 'commission_rate', 'is_active', 'owner',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_owner(self, value):
        if value is None:
            return value
        if getattr(value, 'role', None) != UserRole.EVENT_ADMIN:
            raise serializers.ValidationError('Owner must have role EVENT_ADMIN.')
        return value


class OrganizationMinimalSerializer(serializers.ModelSerializer):
    """For nested reads (e.g. in events)."""
    class Meta:
        model = Organization
        fields = ['id', 'name', 'plan']
