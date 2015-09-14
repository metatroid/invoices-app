# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0005_auto_20150913_0845'),
    ]

    operations = [
        migrations.CreateModel(
            name='Interval',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', auto_created=True, serialize=False)),
                ('start', models.DateTimeField(default=django.utils.timezone.now)),
                ('end', models.DateTimeField(blank=True, null=True)),
                ('total', models.DurationField(blank=True, default=datetime.timedelta)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(to='projects.Project')),
            ],
        ),
    ]
