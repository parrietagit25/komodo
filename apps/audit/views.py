"""
Financial audit API: reconciliation, export, global balance. SUPERADMIN only.
"""
import csv
from io import StringIO
from datetime import datetime

from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsSuperAdmin
from apps.orders.models import Order, OrderStatus
from .models import FinancialAuditLog
from .services.financial_audit import reconcile_order, verify_global_balance


class ReconcileView(APIView):
    """GET /api/audit/reconcile/ — Run reconciliation on all COMPLETED orders. SUPERADMIN only."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        order_ids = Order.objects.filter(
            status=OrderStatus.COMPLETED,
        ).values_list('id', flat=True)

        details = []
        inconsistencies_found = 0
        for oid in order_ids:
            result = reconcile_order(oid)
            details.append(result)
            if not result.get('is_valid', True):
                inconsistencies_found += 1

        return Response({
            'total_orders_checked': len(details),
            'inconsistencies_found': inconsistencies_found,
            'details': details,
        }, status=status.HTTP_200_OK)


class GlobalBalanceView(APIView):
    """GET /api/audit/balance/ — Verify global wallet vs ledger. SUPERADMIN only."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        result = verify_global_balance()
        return Response(result, status=status.HTTP_200_OK)


class ExportView(APIView):
    """GET /api/audit/export/?start_date=&end_date= — CSV export of FinancialAuditLog. SUPERADMIN only."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = FinancialAuditLog.objects.select_related(
            'order', 'user', 'organization', 'stand',
        ).order_by('created_at')

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                qs = qs.filter(created_at__date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                qs = qs.filter(created_at__date__lte=end)
            except ValueError:
                pass

        buf = StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            'order_id', 'user', 'organization', 'stand',
            'total_amount', 'commission_amount', 'net_amount', 'created_at',
        ])
        for log in qs:
            writer.writerow([
                log.order_id,
                log.user.username if log.user else '',
                log.organization.name if log.organization else '',
                log.stand.name if log.stand else '',
                log.total_amount,
                log.commission_amount,
                log.net_amount,
                log.created_at.isoformat() if log.created_at else '',
            ])

        response = HttpResponse(buf.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="financial_audit_export.csv"'
        return response
