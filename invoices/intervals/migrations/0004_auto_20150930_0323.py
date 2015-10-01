# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0003_auto_20150923_0604'),
    ]

    operations = [
        migrations.AlterField(
            model_name='interval',
            name='start',
            field=models.DateTimeField(default=django.utils.timezone.now, blank=True, null=True),
        ),
    ]
