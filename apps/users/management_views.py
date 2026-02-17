"""
User CRUD for SuperAdmin only: list, create, retrieve, update, deactivate (soft delete).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsSuperAdmin
from .models import User
from .serializers import UserSerializer, UserCreateSerializer


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined', 'role', 'status']
    filterset_fields = ['role', 'status', 'organization', 'is_active', 'is_deleted']
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']  # no DELETE, use deactivate

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.select_related('organization', 'event', 'stand').order_by('-date_joined')

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        user = self.get_object()
        user.is_deleted = False
        user.deleted_at = None
        from .models import UserStatus
        user.status = UserStatus.PENDING
        user.save(update_fields=['is_deleted', 'deleted_at', 'status'])
        return Response(status=status.HTTP_204_NO_CONTENT)
