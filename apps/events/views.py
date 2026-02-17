"""
Event CRUD (EventAdmin + SuperAdmin).
"""
from rest_framework import viewsets
from apps.core.permissions import IsEventAdminOrSuperAdmin
from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsEventAdminOrSuperAdmin]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'start_date', 'created_at']
    filterset_fields = ['organization', 'is_active']

    def get_queryset(self):
        qs = Event.objects.select_related('organization').all()
        user = self.request.user
        if user.role == 'EVENT_ADMIN' and user.organization_id:
            qs = qs.filter(organization_id=user.organization_id)
        return qs
