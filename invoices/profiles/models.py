from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

def logo_path(instance, filename):
    return 'user_logos/%d/%s' % (instance.user.id, filename)

class Profile(models.Model):
  user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE, null=True, blank=True)
  fullname = models.CharField(max_length=25, blank=True, null=True)
  email = models.EmailField(blank=True, null=True)
  phone = models.CharField(max_length=20, blank=True, null=True)
  address_1 = models.CharField(max_length=50, blank=True, null=True)
  address_2 = models.CharField(max_length=50, blank=True, null=True)
  region = models.CharField(max_length=10, blank=True, null=True, default="US/Eastern")
  website = models.URLField(max_length=200, blank=True, null=True)
  logo = models.ImageField(upload_to=logo_path, blank=True, null=True)
  default_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'), blank=True, null=True)
  invoice_theme = models.TextField(blank=True, null=True)
  created_at = models.DateTimeField(default=timezone.now)
  updated_at = models.DateTimeField(auto_now=True)