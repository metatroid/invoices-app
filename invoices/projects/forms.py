from django import forms
from .models import Project

class ProjectForm(forms.ModelForm):
  class Meta:
    model = Project
    fields = (
              'project_name',
              'project_description',
              'project_url',
              'project_description',
              'client_name',
              'client_email',
              'deadline',
              'hourly_rate',
              'fixed_rate',
              'project_logo'
            )