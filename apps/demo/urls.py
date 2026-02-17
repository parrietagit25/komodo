"""
Demo API. Mount at: /api/demo/
"""
from django.urls import path
from .views import DemoGenerateView

urlpatterns = [
    path('generate/', DemoGenerateView.as_view(), name='demo-generate'),
]
