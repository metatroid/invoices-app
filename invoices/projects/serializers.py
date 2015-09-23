from rest_framework import serializers
from django.contrib.auth.models import User
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from invoices.statements.models import Statement

class IntervalSerializer(serializers.ModelSerializer):
  class Meta:
    model = Interval
    fields = (
      'id',
      'start',
      'end',
      'total',
      'description',
      'project',
      'created_at',
      'updated_at'
    )

class StatementSerializer(serializers.ModelSerializer):
  class Meta:
    model = Statement
    fields = (
      'id',
      'url',
      'markup',
      'project',
      'created_at',
      'updated_at'
    )

class ProjectSerializer(serializers.ModelSerializer):
  intervals = IntervalSerializer(many=True, read_only=True)
  statements = StatementSerializer(many=True, read_only=True)
  class Meta:
    model = Project
    fields = (
      'id',
      'project_name',
      'project_description',
      'project_url',
      'project_logo',
      'deadline',
      'client_name',
      'client_email',
      'total_time',
      'hourly_rate',
      'fixed_rate',
      'balance',
      'payments',
      'completed',
      'paid',
      'created_at',
      'updated_at',
      'user',
      'intervals',
      'statements'
    )

class UserSerializer(serializers.ModelSerializer):
  projects = ProjectSerializer(many=True, read_only=True)
  class Meta:
    model = User
    fields = (
      'id',
      'username',
      'email',
      'first_name',
      'last_name',
      'date_joined',
      'last_login',
      'projects'
    )