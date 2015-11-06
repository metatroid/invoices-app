from django.db import models
from invoices.projects.models import Project
from django.utils import timezone

class Statement(models.Model):
  def __str__(self):
    return self.project.project_name + ": Invoice (" + str(self.id) + ")"
  project = models.ForeignKey(Project, related_name='statements', on_delete=models.CASCADE, null=True, blank=True)
  url = models.URLField(max_length=200, blank=True)
  markup = models.TextField(blank=True)
  created_at = models.DateTimeField(default=timezone.now)
  updated_at = models.DateTimeField(auto_now=True)

  def _filename(self):
    url = self.url
    filename = url.split('/')[-1]
    return filename
  filename = property(_filename)

  class Meta:
    ordering = ('created_at',)
