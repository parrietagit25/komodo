from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    raw_id_fields = ['product']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'stand', 'status', 'total_amount', 'is_reversed', 'created_at']
    list_filter = ['status', 'is_reversed', 'stand']
    search_fields = ['notes', 'user__username']
    ordering = ['-created_at']
    raw_id_fields = ['user', 'stand']
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'unit_price']
    raw_id_fields = ['order', 'product']
