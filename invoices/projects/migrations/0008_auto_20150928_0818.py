# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0007_auto_20150923_0548'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='fixed_rate',
            field=models.DecimalField(default=Decimal('0.00'), decimal_places=2, null=True, max_digits=8, blank=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='hourly_rate',
            field=models.DecimalField(default=Decimal('0.00'), decimal_places=2, null=True, max_digits=8, blank=True),
        ),
    ]
