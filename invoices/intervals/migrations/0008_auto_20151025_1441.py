# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone
import positions.fields


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0007_auto_20151003_1058'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='interval',
            options={'ordering': ('position',)},
        ),
        migrations.AddField(
            model_name='interval',
            name='included',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='interval',
            name='position',
            field=positions.fields.PositionField(default=0),
        ),
        migrations.AddField(
            model_name='interval',
            name='work_day',
            field=models.DateTimeField(null=True, blank=True, default=django.utils.timezone.now),
        ),
    ]
