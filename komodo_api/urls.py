"""
komodo_api URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/users/', include('apps.users.management_urls')),
    path('api/organizations/', include('apps.organizations.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/stands/', include('apps.stands.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/wallet/', include('apps.wallet.urls')),
    path('api/public/', include('apps.public.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/demo/', include('apps.demo.urls')),
    path('api/audit/', include('apps.audit.urls')),
]
