"""
User serializers.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserRole, UserStatus


def _validate_role_links(attrs, instance=None):
    """Enforce: EVENT_ADMIN needs organization; STAND_ADMIN needs stand; USER must not have org/stand."""
    role = attrs.get('role')
    if instance is not None and role is None:
        role = instance.role
    if not role:
        return
    org = attrs.get('organization') if 'organization' in attrs else (instance.organization_id if instance else None)
    stand = attrs.get('stand') if 'stand' in attrs else (instance.stand_id if instance else None)

    if role == UserRole.EVENT_ADMIN:
        if not org:
            raise serializers.ValidationError({
                'organization': 'EVENT_ADMIN must be linked to an organization.',
            })
    elif role == UserRole.STAND_ADMIN:
        if not stand:
            raise serializers.ValidationError({
                'stand': 'STAND_ADMIN must be linked to a stand.',
            })
    elif role == UserRole.USER:
        if org is not None and org != '':
            raise serializers.ValidationError({
                'organization': 'USER must not have an organization assigned.',
            })
        if stand is not None and stand != '':
            raise serializers.ValidationError({
                'stand': 'USER must not have a stand assigned.',
            })
        attrs['organization'] = None
        attrs['stand'] = None
        attrs['event'] = None


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'status', 'organization', 'event', 'stand',
            'is_active', 'is_deleted', 'deleted_at', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined', 'is_deleted', 'deleted_at']

    def validate(self, attrs):
        _validate_role_links(attrs, instance=self.instance)
        return attrs


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'status',
            'organization', 'event', 'stand',
        ]

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        attrs.pop('password_confirm')
        _validate_role_links(attrs, instance=None)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserMinimalSerializer(serializers.ModelSerializer):
    """For nested reads (e.g. order owner)."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
