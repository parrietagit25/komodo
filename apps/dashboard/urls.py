"""
Dashboard metrics. Mount at: /api/dashboard/
"""
from django.urls import path
from .views import (
    SuperAdminDashboardView,
    EventAdminDashboardView,
    StandAdminDashboardView,
    SalesChartView,
    FinancialOverviewView,
    ProjectStatusView,
    InvestorReadinessView,
)

urlpatterns = [
    path('superadmin/', SuperAdminDashboardView.as_view(), name='dashboard-superadmin'),
    path('eventadmin/', EventAdminDashboardView.as_view(), name='dashboard-eventadmin'),
    path('standadmin/', StandAdminDashboardView.as_view(), name='dashboard-standadmin'),
    path('sales-chart/', SalesChartView.as_view(), name='dashboard-sales-chart'),
    path('financial-overview/', FinancialOverviewView.as_view(), name='dashboard-financial-overview'),
    path('project-status/', ProjectStatusView.as_view(), name='dashboard-project-status'),
    path('investor-readiness/', InvestorReadinessView.as_view(), name='dashboard-investor-readiness'),
]
