"""
Wallet: all users see own wallet and transactions.
Only EVENT_ADMIN and SUPERADMIN can add funds to a user's wallet.
"""
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsActiveUser, IsEventAdminOrSuperAdmin
from apps.users.models import User
from .models import Wallet, Transaction, TransactionType
from .serializers import WalletSerializer, TransactionSerializer, AddFundsSerializer


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Get or create current user's wallet (single resource)."""
        wallet, _ = Wallet.objects.get_or_create(
            user=request.user,
            defaults={'balance': Decimal('0.00')},
        )
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='transactions')
    def transactions(self, request):
        """List transactions for current user's wallet."""
        wallet = get_object_or_404(Wallet, user=request.user)
        qs = Transaction.objects.filter(wallet=wallet).order_by('-created_at')[:100]
        serializer = TransactionSerializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['post'],
        url_path='add-funds',
        permission_classes=[IsAuthenticated, IsActiveUser, IsEventAdminOrSuperAdmin],
    )
    def add_funds(self, request):
        """Add balance to a user's wallet (EVENT_ADMIN, SUPERADMIN only)."""
        ser = AddFundsSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        target_user = get_object_or_404(User, id=ser.validated_data['user_id'])
        amount = ser.validated_data['amount']
        description = ser.validated_data.get('description') or 'Admin credit'
        wallet, _ = Wallet.objects.get_or_create(
            user=target_user,
            defaults={'balance': Decimal('0.00')},
        )
        wallet.add_balance(amount, TransactionType.CREDIT, order=None, description=description)
        return Response(WalletSerializer(wallet).data, status=status.HTTP_200_OK)
