from django.contrib import admin
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from invoices.statements.models import Statement

administerableModels = [Project, Interval, Statement]
admin.site.register(administerableModels)