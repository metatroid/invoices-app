# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0002_auto_20150913_0611'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='balance',
            field=models.DecimalField(default=0, blank=True, decimal_places=2, max_digits=8),
        ),
        migrations.AlterField(
            model_name='project',
            name='fixed_rate',
            field=models.DecimalField(default=0, blank=True, decimal_places=2, max_digits=8),
        ),
        migrations.AlterField(
            model_name='project',
            name='hourly_rate',
            field=models.DecimalField(default=0, blank=True, decimal_places=2, max_digits=8),
        ),
        migrations.AlterField(
            model_name='project',
            name='payments',
            field=models.DecimalField(default=0, blank=True, decimal_places=2, max_digits=8),
        ),
    ]
