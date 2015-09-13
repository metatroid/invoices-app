# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_auto_20150913_0614'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='balance',
            field=models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00')),
        ),
        migrations.AlterField(
            model_name='project',
            name='fixed_rate',
            field=models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00')),
        ),
        migrations.AlterField(
            model_name='project',
            name='hourly_rate',
            field=models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00')),
        ),
    ]
