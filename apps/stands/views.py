"""
Stand CRUD (EventAdmin only). Product CRUD (EventAdmin for stands they manage).
"""
from rest_framework import viewsets
from apps.core.permissions import IsEventAdminOrSuperAdmin
from .models import Stand, Product
from .serializers import StandSerializer, ProductSerializer


class StandViewSet(viewsets.ModelViewSet):
    serializer_class = StandSerializer
    permission_classes = [IsEventAdminOrSuperAdmin]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    filterset_fields = ['event', 'is_active']

    def get_queryset(self):
        qs = Stand.objects.select_related('event').prefetch_related('products').all()
        user = self.request.user
        if user.role == 'EVENT_ADMIN' and user.organization_id:
            qs = qs.filter(event__organization_id=user.organization_id)
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsEventAdminOrSuperAdmin]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    filterset_fields = ['stand', 'is_available']

    def get_queryset(self):
        qs = Product.objects.select_related('stand', 'stand__event').all()
        user = self.request.user
        if user.role == 'EVENT_ADMIN' and user.organization_id:
            qs = qs.filter(stand__event__organization_id=user.organization_id)
        return qs
