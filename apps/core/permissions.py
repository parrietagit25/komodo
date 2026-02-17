"""
Role-based permission classes for komodo_api.
"""
from rest_framework import permissions
from apps.users.models import UserRole


class IsSuperAdmin(permissions.BasePermission):
    """Only SuperAdmin can access."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.SUPERADMIN
            and not request.user.is_deleted
        )


class IsEventAdminOrSuperAdmin(permissions.BasePermission):
    """EventAdmin or SuperAdmin can access."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or request.user.is_deleted:
            return False
        return request.user.role in (UserRole.SUPERADMIN, UserRole.EVENT_ADMIN)


class IsStandAdminOrAbove(permissions.BasePermission):
    """StandAdmin, EventAdmin or SuperAdmin can access."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or request.user.is_deleted:
            return False
        return request.user.role in (
            UserRole.SUPERADMIN,
            UserRole.EVENT_ADMIN,
            UserRole.STAND_ADMIN,
        )


class IsActiveUser(permissions.BasePermission):
    """User must be active (not suspended/deleted)."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        from apps.users.models import UserStatus
        return (
            not request.user.is_deleted
            and request.user.status == UserStatus.ACTIVE
        )
