"""
Stands API URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StandViewSet, ProductViewSet

router = DefaultRouter()
# Register 'products' first so /api/stands/products/ is not matched as stand pk="products"
router.register(r'products', ProductViewSet, basename='product')
router.register(r'', StandViewSet, basename='stand')

urlpatterns = [
    path('', include(router.urls)),
]
