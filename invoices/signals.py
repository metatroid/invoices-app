from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from invoices.statements.models import Statement
from invoices.profiles.models import Profile
from django.contrib.auth.models import User
from django.shortcuts import redirect
from decimal import *
import logging
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Statement)
def gen_pdf_post_save(sender, **kwargs):
  if kwargs.get('created', True):
    statement = kwargs.get('instance')
    redirect('/invoice?statement='+str(statement.id))

@receiver(post_save, sender=User)
def ensure_profile_exists(sender, **kwargs):
  if kwargs.get('created', False):
    Profile.objects.get_or_create(user=kwargs.get('instance'))

@receiver(post_save, sender=Interval)
def after_save_interval(sender, **kwargs):
    interval = kwargs.get('instance')
    if(interval.end):
      intervalDuration = interval.end - interval.start
      if(interval.total != intervalDuration):
        interval.total = intervalDuration
        interval.save()
      project = Project.objects.get(pk=interval.project.id)
      seconds = 0
      for i in project.intervals.all():
        seconds = seconds + i.total.total_seconds()
      project.total_time = seconds
      project.balance = project.fixed_rate if project.fixed_rate > 0 else (project.hourly_rate * Decimal(project.total_time/3600))
      project.save()

@receiver(post_delete, sender=Interval)
def after_delete_interval(sender, **kwargs):
    interval = kwargs.get('instance')
    project = Project.objects.get(pk=interval.project.id)
    seconds = 0
    for i in project.intervals.all():
      seconds = seconds + i.total.total_seconds()
    project.total_time = seconds
    project.balance = project.fixed_rate if project.fixed_rate > 0 else (project.hourly_rate * Decimal(project.total_time/3600))
    project.save()

@receiver(pre_delete, sender=Interval)
def before_delete_interval(sender, **kwargs):
  print("pre delete interval")
  interval = kwargs.get('instance')
  intervalDuration = interval.end - interval.start
  print("Duration: "+str(intervalDuration))
  project = Project.objects.get(pk=interval.project.id)
  print("start time: "+str(project.total_time))
  project.total_time = project.total_time - intervalDuration.total_seconds()
  print("end time: "+str(project.total_time))
  project.balance = project.fixed_rate if project.fixed_rate > 0 else (project.hourly_rate * Decimal(project.total_time/3600))
  project.save()

@receiver(pre_delete, sender=Project)
def delete_logo_with_project(sender, **kwargs):
  kwargs.get('instance').project_logo.delete(False)