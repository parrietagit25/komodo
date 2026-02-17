"""
Event model linked to Organization.
"""
from django.db import models
from apps.core.models import TimeStampedModel


class Event(TimeStampedModel):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='events',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'events_event'
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['-start_date']

    def __str__(self):
        return self.name
