from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'status', 'organization', 'is_active', 'date_joined']
    list_filter = ['role', 'status', 'is_active', 'is_deleted']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    filter_horizontal = []
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Komodo', {'fields': ('role', 'status', 'organization', 'event', 'stand', 'is_deleted', 'deleted_at')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Komodo', {'fields': ('role', 'status', 'organization', 'event', 'stand')}),
    )
