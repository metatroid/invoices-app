from django.db.models.signals import post_save
from django.dispatch import receiver
from invoices.projects.models import Project
from invoices.intervals.models import Interval

@receiver(post_save, sender=Interval)
def after_save_interval(sender, **kwargs):
    if(kwargs.get('created') == False):
      interval = kwargs.get('instance')
      if(len(interval.description) > 0):
        if(interval.end is not None and interval.start is not None):
          intervalDuration = interval.end - interval.start
          project = Project.objects.get(pk=interval.project.id)
          project.total_time = project.total_time + intervalDuration.total_seconds()
          project.save()
          interval.total = intervalDuration
          interval.end = None
          interval.start = None
          interval.save()