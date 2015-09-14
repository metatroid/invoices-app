# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0006_auto_20150914_0035'),
    ]

    operations = [
        migrations.CreateModel(
            name='Statement',
            fields=[
                ('id', models.AutoField(serialize=False, auto_created=True, primary_key=True, verbose_name='ID')),
                ('url', models.URLField(blank=True)),
                ('markup', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(to='projects.Project', related_name='statements', on_delete='models.CASCADE')),
            ],
        ),
    ]
