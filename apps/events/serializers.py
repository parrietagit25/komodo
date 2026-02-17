"""
Event serializers.
"""
from rest_framework import serializers
from .models import Event
from apps.organizations.serializers import OrganizationMinimalSerializer


class EventSerializer(serializers.ModelSerializer):
    organization_detail = OrganizationMinimalSerializer(source='organization', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'organization', 'organization_detail', 'name', 'description',
            'start_date', 'end_date', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EventMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'name', 'start_date', 'end_date']
