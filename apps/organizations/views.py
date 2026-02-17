"""
Organization CRUD (SuperAdmin only).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsSuperAdmin
from .models import Organization
from .serializers import OrganizationSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]
    search_fields = ['name', 'plan']
    ordering_fields = ['name', 'created_at']
    filterset_fields = ['is_active']

    def get_queryset(self):
        return Organization.objects.all()

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        org = self.get_object()
        org.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        org = self.get_object()
        org.restore()
        return Response(status=status.HTTP_204_NO_CONTENT)
