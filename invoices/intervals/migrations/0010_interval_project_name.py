# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0009_interval_paid'),
    ]

    operations = [
        migrations.AddField(
            model_name='interval',
            name='project_name',
            field=models.CharField(max_length=50, blank=True, null=True),
        ),
    ]
