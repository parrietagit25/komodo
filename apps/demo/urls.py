"""
Demo API. Mount at: /api/demo/
"""
from django.urls import path
from .views import DemoGenerateView, DemoFlushView, DemoFlushAllView

urlpatterns = [
    path('generate/', DemoGenerateView.as_view(), name='demo-generate'),
    path('flush/', DemoFlushView.as_view(), name='demo-flush'),
    path('flush-all/', DemoFlushAllView.as_view(), name='demo-flush-all'),
]
