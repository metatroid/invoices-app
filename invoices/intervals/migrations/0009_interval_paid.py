# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0008_auto_20151025_1441'),
    ]

    operations = [
        migrations.AddField(
            model_name='interval',
            name='paid',
            field=models.BooleanField(default=False),
        ),
    ]
