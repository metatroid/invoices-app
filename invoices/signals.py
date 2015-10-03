from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from decimal import *

@receiver(post_save, sender=Interval)
def after_save_interval(sender, **kwargs):
    if(kwargs.get('created') == False):
      interval = kwargs.get('instance')
      if(len(interval.description) > 0):
        if(interval.end is not None and interval.start is not None):
          intervalDuration = interval.end - interval.start
          project = Project.objects.get(pk=interval.project.id)
          project.total_time = project.total_time + intervalDuration.total_seconds()
          project.balance = project.fixed_rate if project.fixed_rate > 0 else (project.hourly_rate * Decimal(project.total_time/3600))
          project.save()
          interval.total = intervalDuration
          interval.end = None
          interval.start = None
          interval.save()
