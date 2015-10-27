from rest_framework import serializers
from django.contrib.auth.models import User
from invoices.profiles.models import Profile
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from invoices.statements.models import Statement
from decimal import Decimal

class Base64ImageField(serializers.ImageField):
  def to_internal_value(self, data):
      from django.core.files.base import ContentFile
      import base64
      import six
      import uuid
      if isinstance(data, six.string_types):
          if 'data:' in data and ';base64,' in data:
              header, data = data.split(';base64,')
          try:
              decoded_file = base64.b64decode(data)
          except TypeError:
              self.fail('invalid_image')
          file_name = str(uuid.uuid4())[:12]
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
      'included',
      'position',
      'work_day',
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
  project_logo = Base64ImageField(max_length=None, use_url=True, required=False, allow_null=True)
  class Meta:
    model = Project
    fields = (
      'id',
      'project_name',
      'position',
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
      'invoice_balance',
      'invoice_hours',
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

class UserSerializer(serializers.HyperlinkedModelSerializer):
  projects = ProjectSerializer(many=True, read_only=True)
  fullname = serializers.CharField(source='profile.fullname', allow_blank=True)
  email = serializers.EmailField(source='profile.email', allow_blank=True)
  phone = serializers.CharField(source='profile.phone', allow_blank=True)
  address_1 = serializers.CharField(source='profile.address_1', allow_blank=True)
  address_2 = serializers.CharField(source='profile.address_2', allow_blank=True)
  region = serializers.CharField(source='profile.region', allow_blank=True, default="US/Eastern")
  website = serializers.URLField(source='profile.website', allow_blank=True)
  default_rate = serializers.DecimalField(source='profile.default_rate', max_digits=8, decimal_places=2, default=Decimal('0.00'))

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
      'fullname',
      'email',
      'phone',
      'address_1',
      'address_2',
      'region',
      'website',
      'default_rate'
    )
  
  def create(self, validated_data):
    profile_data = validated_data.pop('profile', None)
    user = super(UserSerializer, self).create(validated_data)
    self.create_or_update_profile(user, profile_data)
    return user

  def update(self, instance, validated_data):
    profile_data = validated_data.pop('profile', None)
    self.create_or_update_profile(instance, profile_data)
    return super(UserSerializer, self).update(instance, validated_data)

  def create_or_update_profile(self, user, profile_data):
    profile, created = Profile.objects.get_or_create(user=user, defaults=profile_data)
    if not created and profile_data is not None:
      super(UserSerializer, self).update(profile, profile_data)