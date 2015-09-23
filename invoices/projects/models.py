from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from django.db import models

def logo_path(instance, filename):
    return 'project_logos/%d/%s' % (instance.user.id, filename)

class Project(models.Model):
  def __str__(self):
    return self.project_name+" ("+str(self.id)+")"
  user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='projects', on_delete='models.CASCADE')
  project_name = models.CharField(max_length=50)
  project_description = models.TextField(blank=True)
  project_url = models.URLField(max_length=200, blank=True)
  project_logo = models.ImageField(upload_to=logo_path, blank=True)
  deadline = models.DateTimeField(blank=True, null=True)
  client_name = models.CharField(max_length=50, blank=True)
  client_email = models.EmailField(blank=True)
  total_time = models.PositiveIntegerField(default=0)
  hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
  fixed_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
  balance = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
  payments = models.DecimalField(max_digits=8, decimal_places=2, default=0, blank=True)
  completed = models.BooleanField(default=False)
  paid = models.BooleanField(default=False)
  created_at = models.DateTimeField(default=timezone.now)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    ordering = ('created_at',)