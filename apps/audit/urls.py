from django.urls import path
from .views import ReconcileView, GlobalBalanceView, ExportView

urlpatterns = [
    path('reconcile/', ReconcileView.as_view(), name='audit-reconcile'),
    path('balance/', GlobalBalanceView.as_view(), name='audit-balance'),
    path('export/', ExportView.as_view(), name='audit-export'),
]
