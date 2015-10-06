# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from decimal import Decimal
from django.conf import settings
import django.utils.timezone
import invoices.profiles.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('fullname', models.CharField(blank=True, max_length=25, null=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(blank=True, max_length=20, null=True)),
                ('address_1', models.CharField(blank=True, max_length=50, null=True)),
                ('address_2', models.CharField(blank=True, max_length=50, null=True)),
                ('region', models.CharField(blank=True, default='US/Eastern', max_length=10, null=True)),
                ('website', models.URLField(blank=True, null=True)),
                ('logo', models.ImageField(upload_to=invoices.profiles.models.logo_path, blank=True, null=True)),
                ('default_rate', models.DecimalField(decimal_places=2, blank=True, max_digits=8, default=Decimal('0.00'), null=True)),
                ('invoice_theme', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(blank=True, to=settings.AUTH_USER_MODEL, related_name='settings', null=True)),
            ],
        ),
    ]
