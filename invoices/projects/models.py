from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from django.db import models
from positions.fields import PositionField

def logo_path(instance, filename):
    return 'project_logos/%d/%s/%s' % (instance.user.id, instance.project_name, filename)

class Project(models.Model):
  def __str__(self):
    return self.project_name+" ("+str(self.id)+")"
  user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='projects', on_delete=models.CASCADE, null=True, blank=True)
  project_name = models.CharField(max_length=50)
  position = PositionField(collection="user", default=0)
  project_description = models.TextField(blank=True, null=True)
  project_url = models.URLField(max_length=200, blank=True, null=True)
  project_logo = models.ImageField(upload_to=logo_path, blank=True, null=True)
  deadline = models.DateTimeField(blank=True, null=True)
  client_name = models.CharField(max_length=50, blank=True, null=True)
  client_email = models.EmailField(blank=True, null=True)
  total_time = models.PositiveIntegerField(default=0)
  hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'), blank=True, null=True)
  fixed_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'), blank=True, null=True)
  balance = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
  payments = models.DecimalField(max_digits=8, decimal_places=2, default=0, blank=True)
  completed = models.BooleanField(default=False)
  paid = models.BooleanField(default=False)
  created_at = models.DateTimeField(default=timezone.now)
  updated_at = models.DateTimeField(auto_now=True)
  
  def _invoice_balance(self):
    intervals = self.intervals.all().filter(included=True, paid=False)
    seconds = 0
    for i in intervals:
      seconds = seconds + i.total.total_seconds()
    balance = self.hourly_rate * Decimal(seconds/3600)
    return self.fixed_rate if self.fixed_rate > 0 else balance
  invoice_balance = property(_invoice_balance)

  def _invoice_hours(self):
    intervals = self.intervals.all().filter(included=True, paid=False)
    seconds = 0
    for i in intervals:
      seconds = seconds + i.total.total_seconds()
    return "{0:.4f}".format(Decimal(seconds/3600))
  invoice_balance = property(_invoice_balance)
  invoice_hours = property(_invoice_hours)

  class Meta:
    ordering = ('position','created_at',)
