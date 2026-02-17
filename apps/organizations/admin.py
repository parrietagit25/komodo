from django.contrib import admin
from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan', 'commission_rate', 'is_active', 'is_deleted', 'created_at']
    list_filter = ['is_active', 'is_deleted']
    search_fields = ['name', 'plan']
    ordering = ['name']
