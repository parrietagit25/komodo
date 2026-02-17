"""
Public read-only API for USER purchase flow.
Mount at: /api/public/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicEventViewSet, PublicStandViewSet

router = DefaultRouter()
router.register(r'events', PublicEventViewSet, basename='public-event')
router.register(r'stands', PublicStandViewSet, basename='public-stand')

urlpatterns = [
    path('', include(router.urls)),
]
