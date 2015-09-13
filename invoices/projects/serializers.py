from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project

class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ('id', 'username', 'email', 'first_name', 'last_name')

class ProjectSerializer(serializers.ModelSerializer):
  user = UserSerializer()
  class Meta:
    model = Project
    field = ('id', 'project_name', 'project_description', 'project_url', 'project_logo', 'deadline', 'client_name', 'client_email', 'total_time', 'hourly_rate', 'fixed_rate', 'balance', 'payments', 'completed', 'paid', 'created_at', 'updated_at', 'user')
  