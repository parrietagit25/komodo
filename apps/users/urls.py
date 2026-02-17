"""
Users & Auth URLs.
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, ProfileView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
