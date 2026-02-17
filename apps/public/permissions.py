"""
Read-only public API: only authenticated users with role USER.
"""
from rest_framework import permissions
from apps.users.models import UserRole


class IsAuthenticatedUserRole(permissions.BasePermission):
    """
    Allow only authenticated users with role USER.
    Used for public purchase-flow endpoints (read-only).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_deleted:
            return False
        if request.method not in permissions.SAFE_METHODS:
            return False
        return request.user.role == UserRole.USER
