# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import invoices.projects.models
import django.utils.timezone
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(serialize=False, auto_created=True, primary_key=True, verbose_name='ID')),
                ('project_name', models.CharField(max_length=50)),
                ('project_description', models.TextField()),
                ('project_url', models.URLField()),
                ('project_logo', models.ImageField(upload_to=invoices.projects.models.logo_path)),
                ('deadline', models.DateTimeField()),
                ('client_name', models.CharField(max_length=50)),
                ('client_email', models.EmailField(max_length=254)),
                ('total_time', models.PositiveIntegerField(default=0)),
                ('hourly_rate', models.DecimalField(max_digits=8, decimal_places=2)),
                ('fixed_rate', models.DecimalField(max_digits=8, decimal_places=2)),
                ('balance', models.DecimalField(max_digits=8, decimal_places=2)),
                ('payments', models.DecimalField(max_digits=8, decimal_places=2)),
                ('completed', models.BooleanField(default=False)),
                ('paid', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
