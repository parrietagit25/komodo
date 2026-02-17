from django.contrib import admin
from .models import Stand, Product


@admin.register(Stand)
class StandAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'is_active', 'created_at']
    list_filter = ['is_active', 'event']
    search_fields = ['name']
    ordering = ['name']
    raw_id_fields = ['event']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'stand', 'price', 'stock_quantity', 'is_available', 'created_at']
    list_filter = ['is_available', 'stand']
    search_fields = ['name']
    ordering = ['name']
    raw_id_fields = ['stand']
