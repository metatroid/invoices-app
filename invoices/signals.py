from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from invoices.statements.models import Statement
from invoices.profiles.models import Profile
from django.contrib.auth.models import User
from django.shortcuts import redirect
from decimal import *
from django.db.models import Count
import datetime
import os
from configparser import RawConfigParser
import logging
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Statement)
def gen_pdf_post_save(sender, **kwargs):
  if kwargs.get('created', True):
    statement = kwargs.get('instance')
    project = Project.objects.get(pk=statement.project.id)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config = RawConfigParser()
    if(os.path.isfile(os.path.join(BASE_DIR, 'config.overrides.ini'))):
        config.readfp(open(os.path.join(BASE_DIR, 'config.overrides.ini')))
    else:
        config.readfp(open(os.path.join(BASE_DIR, 'config.ini')))
    host = config.get('hostname', 'SITE_HOST')
    invoiceUrl = "http://"+host+"/invoice?statement="+str(statement.id)
    invoicePath = os.path.abspath(os.path.dirname(__name__)) + "/static/uploads/invoices/"+str(project.user)+"/"+str(project.id)+"/"
    invoiceFilename = project.project_name+"_"+str(project.statements.count())+"_"+datetime.date.today().strftime('%m-%d-%Y')+".pdf"
    mkdirCmd = "mkdir -p %s"%(invoicePath)
    os.system(mkdirCmd)
    pdfCmd = "wkhtmltopdf.sh %s %s%s"%(invoiceUrl,invoicePath,invoiceFilename)
    os.system(pdfCmd)
    statement.url = "/static/uploads/invoices/"+str(project.user)+"/"+str(project.id)+"/"+invoiceFilename
    statement.save()

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
    if(project):
      seconds = 0
      for i in project.intervals.all():
        seconds = seconds + i.total.total_seconds()
      project.total_time = seconds
      project.balance = project.fixed_rate if project.fixed_rate > 0 else (project.hourly_rate * Decimal(project.total_time/3600))
      project.save()

# @receiver(pre_delete, sender=Interval)
# def before_delete_interval(sender, **kwargs):
#   interval = kwargs.get('instance')
#   intervalDuration = interval.end - interval.start
#   project = Project.objects.get(pk=interval.project.id)
#   project.total_time = project.total_time - intervalDuration.total_seconds()
#   project.balance = project.fixed_rate if project.fixed_rate > 0 else (project.hourly_rate * Decimal(project.total_time/3600))
#   project.save()

@receiver(pre_delete, sender=Project)
def delete_logo_with_project(sender, **kwargs):
  kwargs.get('instance').project_logo.delete(False)

@receiver(pre_delete, sender=Project)
def delete_pdfs_with_project(sender, **kwargs):
  project = kwargs.get('instance')
  invoiceDir = os.path.abspath(os.path.dirname(__name__)) + "/static/uploads/invoices/"+str(project.user)+"/"+str(project.id)+"/"
  rmCmd = "rm -rf %s"%(invoiceDir)
  os.system(rmCmd)