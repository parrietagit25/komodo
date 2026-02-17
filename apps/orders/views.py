"""
Order CRUD. Users see own orders; admins see filtered by scope.
Only SUPERADMIN and STAND_ADMIN can update (change status); USER and EVENT_ADMIN are read-only.
When status changes COMPLETED -> CANCELLED, compensating transactions are created (reverse_order).
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsActiveUser
from apps.users.models import UserRole
from .models import Order, OrderStatus
from .serializers import OrderSerializer, OrderCreateSerializer


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsActiveUser]
    search_fields = ['notes', 'status']
    ordering_fields = ['created_at', 'total_amount', 'status']
    filterset_fields = ['stand', 'status', 'user']

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        qs = Order.objects.select_related('user', 'stand').prefetch_related('items').all()
        user = self.request.user
        if user.role == 'USER':
            qs = qs.filter(user=user)
        elif user.role == 'STAND_ADMIN' and user.stand_id:
            qs = qs.filter(stand_id=user.stand_id)
        elif user.role == 'EVENT_ADMIN' and user.organization_id:
            qs = qs.filter(stand__event__organization_id=user.organization_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        old_status = instance.status
        serializer.save()
        instance.refresh_from_db()
        if (
            old_status == OrderStatus.COMPLETED
            and instance.status == OrderStatus.CANCELLED
            and not getattr(instance, 'is_reversed', False)
        ):
            from apps.audit.services.financial_audit import reverse_order
            try:
                reverse_order(instance)
            except ValueError as e:
                raise serializers.ValidationError({'detail': str(e)})

    def update(self, request, *args, **kwargs):
        if request.user.role not in (UserRole.SUPERADMIN, UserRole.STAND_ADMIN):
            return Response(
                {'detail': 'Only Super Admin or Stand Admin can update orders.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role not in (UserRole.SUPERADMIN, UserRole.STAND_ADMIN):
            return Response(
                {'detail': 'Only Super Admin or Stand Admin can update orders.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)
