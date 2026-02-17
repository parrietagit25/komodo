"""
Dashboard metrics by role. Uses timezone-aware today and aggregations.
"""
from datetime import datetime, timedelta

from decimal import Decimal
from django.db.models import Sum, Count, F, Value, DecimalField, ExpressionWrapper
from django.db.models.functions import TruncDate, TruncMonth, Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsSuperAdmin, IsEventAdminOrSuperAdmin
from apps.orders.models import Order
from apps.wallet.models import Transaction, TransactionType, get_platform_wallet
from apps.users.models import User, UserRole


def _zero():
    return Decimal('0.00')


def _to_float(value):
    """Convert Decimal or None to float for JSON response (2 decimal places)."""
    if value is None:
        return 0.0
    return round(float(value), 2)


def _today_start_end():
    """Timezone-aware today (start and end as datetimes for __range)."""
    tz_now = timezone.now()
    start = tz_now.replace(hour=0, minute=0, second=0, microsecond=0)
    from datetime import timedelta
    end = start + timedelta(days=1)
    return start, end


class SuperAdminDashboardView(APIView):
    """GET /api/dashboard/superadmin/ — global metrics. SuperAdmin only."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        start, end = _today_start_end()
        orders_qs = Order.objects.all()
        orders_today = orders_qs.filter(created_at__gte=start, created_at__lt=end).count()
        total_sales = orders_qs.aggregate(s=Sum('total_amount'))['s'] or _zero()

        platform_wallet = get_platform_wallet()
        total_commission = Transaction.objects.filter(
            wallet=platform_wallet,
            transaction_type=TransactionType.CREDIT,
            order__isnull=False,
        ).aggregate(s=Sum('amount'))['s'] or _zero()

        total_net_to_stands = Transaction.objects.filter(
            transaction_type=TransactionType.CREDIT,
            order__isnull=False,
        ).exclude(wallet=platform_wallet).aggregate(s=Sum('amount'))['s'] or _zero()

        return Response({
            'total_sales': str(total_sales),
            'total_commission': str(total_commission),
            'total_net_to_stands': str(total_net_to_stands),
            'orders_today': orders_today,
        }, status=status.HTTP_200_OK)


class EventAdminDashboardView(APIView):
    """GET /api/dashboard/eventadmin/ — metrics scoped to user's organization."""
    permission_classes = [IsAuthenticated, IsEventAdminOrSuperAdmin]

    def get(self, request):
        user = request.user
        if user.role != UserRole.EVENT_ADMIN or not user.organization_id:
            return Response(
                {'detail': 'Event Admin with organization required.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        org_id = user.organization_id

        start, end = _today_start_end()
        orders_qs = Order.objects.filter(stand__event__organization_id=org_id)
        orders_today = orders_qs.filter(created_at__gte=start, created_at__lt=end).count()
        total_sales = orders_qs.aggregate(s=Sum('total_amount'))['s'] or _zero()

        platform_wallet = get_platform_wallet()
        tx_commission_qs = Transaction.objects.filter(
            wallet=platform_wallet,
            transaction_type=TransactionType.CREDIT,
            order__isnull=False,
            order__stand__event__organization_id=org_id,
        )
        total_commission = tx_commission_qs.aggregate(s=Sum('amount'))['s'] or _zero()

        total_net_to_stands = Transaction.objects.filter(
            transaction_type=TransactionType.CREDIT,
            order__isnull=False,
            order__stand__event__organization_id=org_id,
        ).exclude(wallet=platform_wallet).aggregate(s=Sum('amount'))['s'] or _zero()

        return Response({
            'total_sales': str(total_sales),
            'total_commission': str(total_commission),
            'total_net_to_stands': str(total_net_to_stands),
            'orders_today': orders_today,
        }, status=status.HTTP_200_OK)


class StandAdminDashboardView(APIView):
    """GET /api/dashboard/standadmin/ — metrics scoped to user's stand."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in (UserRole.STAND_ADMIN, UserRole.SUPERADMIN):
            return Response(
                {'detail': 'Stand Admin or Super Admin only.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        stand_id = getattr(user, 'stand_id', None)
        if user.role == UserRole.STAND_ADMIN and not stand_id:
            return Response(
                {'detail': 'No stand assigned.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if stand_id is None:
            return Response(
                {'detail': 'Stand required for scoped metrics.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        start, end = _today_start_end()
        orders_qs = Order.objects.filter(stand_id=stand_id)
        orders_today = orders_qs.filter(created_at__gte=start, created_at__lt=end).count()
        total_sales = orders_qs.aggregate(s=Sum('total_amount'))['s'] or _zero()

        from apps.wallet.models import Wallet
        stand_admin_wallet = Wallet.objects.filter(user__stand_id=stand_id, user__role=UserRole.STAND_ADMIN).first()
        if stand_admin_wallet:
            total_net_received = Transaction.objects.filter(
                wallet=stand_admin_wallet,
                transaction_type=TransactionType.CREDIT,
                order__isnull=False,
            ).aggregate(s=Sum('amount'))['s'] or _zero()
        else:
            total_net_received = _zero()

        return Response({
            'total_sales': str(total_sales),
            'total_net_received': str(total_net_received),
            'orders_today': orders_today,
        }, status=status.HTTP_200_OK)


def _last_7_dates():
    """Last 7 calendar days (oldest first), timezone-aware."""
    tz = timezone.get_current_timezone()
    today = timezone.now().astimezone(tz).date()
    return [today - timedelta(days=(6 - i)) for i in range(7)]


def _sales_chart_orders_qs(user, start, end):
    """Order queryset for sales chart scoped by role."""
    qs = Order.objects.filter(created_at__gte=start, created_at__lt=end)
    if user.role == UserRole.SUPERADMIN:
        return qs
    if user.role == UserRole.EVENT_ADMIN and getattr(user, 'organization_id', None):
        return qs.filter(stand__event__organization_id=user.organization_id)
    if user.role == UserRole.STAND_ADMIN and getattr(user, 'stand_id', None):
        return qs.filter(stand_id=user.stand_id)
    return qs.none()


class SalesChartView(APIView):
    """
    GET /api/dashboard/sales-chart/
    Returns last 7 days (timezone-aware) with TruncDate + Sum aggregation.
    Response: [{ "date": "YYYY-MM-DD", "total_sales": float, "commission": float, "net": float }].
    Scope: SUPERADMIN → all orders; EVENT_ADMIN → their organization; STAND_ADMIN → their stand.
    Days with no sales are included with zero values. All numeric values are float.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in (UserRole.SUPERADMIN, UserRole.EVENT_ADMIN, UserRole.STAND_ADMIN):
            return Response(
                {'detail': 'Access restricted to Super Admin, Event Admin, or Stand Admin.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.role == UserRole.EVENT_ADMIN and not getattr(user, 'organization_id', None):
            return Response(
                {'detail': 'Event Admin must be linked to an organization.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.role == UserRole.STAND_ADMIN and not getattr(user, 'stand_id', None):
            return Response(
                {'detail': 'Stand Admin must be linked to a stand.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        tz = timezone.get_current_timezone()
        last_7 = _last_7_dates()
        start_dt = timezone.make_aware(
            datetime.combine(last_7[0], datetime.min.time()),
            tz,
        )
        end_dt = start_dt + timedelta(days=7)

        orders_qs = _sales_chart_orders_qs(user, start_dt, end_dt)

        # Daily total_sales (TruncDate in project timezone)
        daily_sales = (
            orders_qs.annotate(date=TruncDate('created_at', tz=tz))
            .values('date')
            .annotate(total_sales=Sum('total_amount'))
            .order_by('date')
        )
        sales_by_date = {row['date']: (row['total_sales'] or _zero()) for row in daily_sales}

        # Daily commission (platform wallet CREDIT with order)
        platform_wallet = get_platform_wallet()
        daily_commission_qs = (
            Transaction.objects.filter(
                wallet=platform_wallet,
                transaction_type=TransactionType.CREDIT,
                order__isnull=False,
            )
            .filter(order__in=orders_qs)
            .annotate(date=TruncDate('order__created_at', tz=tz))
            .values('date')
            .annotate(commission=Sum('amount'))
            .order_by('date')
        )
        commission_by_date = {row['date']: (row['commission'] or _zero()) for row in daily_commission_qs}

        # Build response: always 7 days, zero values when no data; decimals as float
        result = []
        for d in last_7:
            total_sales = sales_by_date.get(d, _zero())
            commission = commission_by_date.get(d, _zero())
            net = total_sales - commission
            result.append({
                'date': d.isoformat(),
                'total_sales': _to_float(total_sales),
                'commission': _to_float(commission),
                'net': _to_float(net),
            })
        return Response(result, status=status.HTTP_200_OK)


def _commission_expr():
    """Expression: total_amount * commission_rate / 100 (use after annotating rate)."""
    return ExpressionWrapper(
        F('total_amount') * F('rate') / Value(100),
        output_field=DecimalField(),
    )


class FinancialOverviewView(APIView):
    """
    GET /api/dashboard/financial-overview/
    SUPERADMIN only. Aggregated financial and operational metrics.
    Commission derived from Organization.commission_rate. total_paid_to_stands = total_revenue - total_commission.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        tz = timezone.get_current_timezone()

        # Base queryset with org commission_rate for commission math
        orders_with_rate = Order.objects.select_related(
            'stand__event__organization',
        ).annotate(
            rate=Coalesce(F('stand__event__organization__commission_rate'), Value(0)),
        )

        # Totals: revenue, orders, commission (from Organization.commission_rate)
        order_agg = orders_with_rate.aggregate(
            total_revenue=Sum('total_amount'),
            total_orders=Count('id'),
            total_commission=Sum(_commission_expr()),
        )
        total_revenue = order_agg['total_revenue'] or _zero()
        total_orders = order_agg['total_orders'] or 0
        total_commission = order_agg['total_commission'] or _zero()

        # total_paid_to_stands = total_revenue - total_commission
        total_paid_to_stands = total_revenue - total_commission

        # Active users: non-deleted
        active_users = User.objects.filter(is_deleted=False).count()

        # Avg ticket (division by zero handled)
        avg_ticket = (total_revenue / total_orders) if total_orders else _zero()

        # Growth projection: last 30 days vs previous 30 days (optimized: two filtered aggregates)
        now = timezone.now()
        last_30_end = now
        last_30_start = now - timedelta(days=30)
        prev_30_start = now - timedelta(days=60)

        last_30_agg = orders_with_rate.filter(
            created_at__gte=last_30_start,
            created_at__lt=last_30_end,
        ).aggregate(
            revenue=Sum('total_amount'),
            commission=Sum(_commission_expr()),
        )
        revenue_last_30 = last_30_agg['revenue'] or _zero()
        commission_last_30 = last_30_agg['commission'] or _zero()

        prev_30_agg = orders_with_rate.filter(
            created_at__gte=prev_30_start,
            created_at__lt=last_30_start,
        ).aggregate(revenue=Sum('total_amount'))
        revenue_prev_30 = prev_30_agg['revenue'] or _zero()

        if revenue_prev_30 > 0:
            growth_percentage = float(
                (revenue_last_30 - revenue_prev_30) / revenue_prev_30 * Decimal('100')
            )
        else:
            growth_percentage = 100.0 if revenue_last_30 > 0 else 0.0

        projected_annual_revenue = float(revenue_last_30 * 12)
        projected_annual_commission = float(commission_last_30 * 12)

        # Top organizations: limit 5 by revenue; commission from commission_rate
        top_orgs_qs = (
            orders_with_rate.filter(stand__event__organization__isnull=False)
            .values('stand__event__organization_id', 'stand__event__organization__name')
            .annotate(
                revenue=Sum('total_amount'),
                commission=Sum(_commission_expr()),
                orders=Count('id'),
            )
            .order_by('-revenue')[:5]
        )
        top_organizations = [
            {
                'id': r['stand__event__organization_id'],
                'name': r['stand__event__organization__name'] or '—',
                'revenue': _to_float(r['revenue']),
                'commission': _to_float(r['commission'] or _zero()),
                'orders': r['orders'],
            }
            for r in top_orgs_qs
        ]

        # Top stands: limit 5 by revenue
        top_stands_qs = (
            Order.objects.values('stand_id', 'stand__name')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('-revenue')[:5]
        )
        top_stands = [
            {
                'id': r['stand_id'],
                'name': r['stand__name'] or '—',
                'revenue': _to_float(r['revenue']),
                'orders': r['orders'],
            }
            for r in top_stands_qs
        ]

        # Monthly revenue and commission (last 6 months); commission from commission_rate
        from datetime import date
        start_month = timezone.now().astimezone(tz).date().replace(day=1)
        months_data = []
        for i in range(6):
            year = start_month.year
            month = start_month.month - i
            if month <= 0:
                month += 12
                year -= 1
            months_data.append(date(year, month, 1))
        months_data.reverse()

        def _month_key(d):
            return d.date() if hasattr(d, 'date') else d

        monthly_qs = (
            orders_with_rate.annotate(month=TruncMonth('created_at', tz=tz))
            .values('month')
            .annotate(
                revenue=Sum('total_amount'),
                commission=Sum(_commission_expr()),
            )
            .order_by('month')
        )
        monthly_map = {
            _month_key(r['month']): {
                'revenue': r['revenue'] or _zero(),
                'commission': r['commission'] or _zero(),
            }
            for r in monthly_qs
        }

        monthly_revenue = [
            {
                'month': d.isoformat()[:7],
                'revenue': _to_float(monthly_map.get(d, {}).get('revenue', _zero())),
                'commission': _to_float(monthly_map.get(d, {}).get('commission', _zero())),
            }
            for d in months_data
        ]

        return Response({
            'total_revenue': _to_float(total_revenue),
            'total_commission': _to_float(total_commission),
            'total_paid_to_stands': _to_float(total_paid_to_stands),
            'total_orders': total_orders,
            'active_users': active_users,
            'avg_ticket': _to_float(avg_ticket),
            'revenue_last_30': round(float(revenue_last_30), 2),
            'commission_last_30': round(float(commission_last_30), 2),
            'revenue_prev_30': round(float(revenue_prev_30), 2),
            'growth_percentage': round(growth_percentage, 2),
            'projected_annual_revenue': round(projected_annual_revenue, 2),
            'projected_annual_commission': round(projected_annual_commission, 2),
            'top_organizations': top_organizations,
            'top_stands': top_stands,
            'monthly_revenue': monthly_revenue,
        }, status=status.HTTP_200_OK)
