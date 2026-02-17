"""
Read-only public API for USER purchase flow.
- GET /api/public/events/           -> active events
- GET /api/public/events/{id}/stands/ -> active stands for event
- GET /api/public/stands/{id}/products/ -> available products (stock > 0)
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.events.models import Event
from apps.stands.models import Stand, Product
from .permissions import IsAuthenticatedUserRole
from .serializers import (
    PublicEventSerializer,
    PublicStandSerializer,
    PublicProductSerializer,
)


class PublicEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve active events only.
    Nested action: GET /events/{id}/stands/ for active stands.
    """
    serializer_class = PublicEventSerializer
    permission_classes = [IsAuthenticatedUserRole]
    queryset = Event.objects.filter(is_active=True).order_by('-start_date')

    @action(detail=True, url_path='stands', url_name='stands')
    def stands(self, request, pk=None):
        event = self.get_object()
        stands_qs = Stand.objects.filter(event=event, is_active=True).order_by('name')
        serializer = PublicStandSerializer(stands_qs, many=True)
        return Response(serializer.data)


class PublicStandViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Retrieve a stand; list not used by frontend but allowed (active stands).
    Nested action: GET /stands/{id}/products/ for available products (stock > 0).
    """
    serializer_class = PublicStandSerializer
    permission_classes = [IsAuthenticatedUserRole]
    queryset = Stand.objects.filter(is_active=True).order_by('name')

    @action(detail=True, url_path='products', url_name='products')
    def products(self, request, pk=None):
        stand = self.get_object()
        products_qs = Product.objects.filter(
            stand=stand,
            is_available=True,
            stock_quantity__gt=0,
        ).order_by('name')
        serializer = PublicProductSerializer(products_qs, many=True)
        return Response(serializer.data)
