from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'start_date', 'end_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'organization']
    search_fields = ['name', 'description']
    ordering = ['-start_date']
    raw_id_fields = ['organization']
