from django.db import models
from invoices.projects.models import Project
from django.utils import timezone
from datetime import timedelta

class Interval(models.Model):
  def __str__(self):
    return self.project.project_name + ": " + self.description[:50] + " (" + str(self.id) + ")"
  project = models.ForeignKey(Project, related_name='intervals', on_delete='models.CASCADE', null=True, blank=True)
  start = models.DateTimeField(default=timezone.now, null=True, blank=True)
  end = models.DateTimeField(null=True, blank=True)
  total = models.DurationField(default=timedelta, blank=True)
  description = models.TextField(blank=True)
  created_at = models.DateTimeField(default=timezone.now)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    ordering = ('created_at',)