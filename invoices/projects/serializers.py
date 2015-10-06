from rest_framework import serializers
from django.contrib.auth.models import User
from invoices.profiles.models import Profile
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from invoices.statements.models import Statement

class Base64ImageField(serializers.ImageField):
  """
  A Django REST framework field for handling image-uploads through raw post data.
  It uses base64 for encoding and decoding the contents of the file.

  Heavily based on
  https://github.com/tomchristie/django-rest-framework/pull/1268

  Updated for Django REST framework 3.
  """
  def to_internal_value(self, data):
      from django.core.files.base import ContentFile
      import base64
      import six
      import uuid
      # Check if this is a base64 string
      if isinstance(data, six.string_types):
          # Check if the base64 string is in the "data:" format
          if 'data:' in data and ';base64,' in data:
              # Break out the header from the base64 content
              header, data = data.split(';base64,')
          # Try to decode the file. Return validation error if it fails.
          try:
              decoded_file = base64.b64decode(data)
          except TypeError:
              self.fail('invalid_image')
          # Generate file name:
          file_name = str(uuid.uuid4())[:12] # 12 characters are more than enough.
          # Get the file name extension:
          file_extension = self.get_file_extension(file_name, decoded_file)
          complete_file_name = "%s.%s" % (file_name, file_extension, )
          data = ContentFile(decoded_file, name=complete_file_name)
      return super(Base64ImageField, self).to_internal_value(data)

  def get_file_extension(self, file_name, decoded_file):
      import imghdr
      extension = imghdr.what(file_name, decoded_file)
      extension = "jpg" if extension == "jpeg" else extension
      return extension

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
  project_logo = Base64ImageField(max_length=None, use_url=True, required=False)
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

class ProfileSerializer(serializers.ModelSerializer):
  logo = Base64ImageField(max_length=None, use_url=True, required=False)
  class Meta:
    model = Profile
    fields = (
      'id',
      'fullname',
      'email',
      'phone',
      'address_1',
      'address_2',
      'region',
      'website',
      'logo',
      'default_rate',
      'invoice_theme',
      'created_at',
      'updated_at'
    )

class UserSerializer(serializers.ModelSerializer):
  projects = ProjectSerializer(many=True, read_only=True)
  profile = ProfileSerializer(read_only=True)
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
      'projects',
      'profile'
    )