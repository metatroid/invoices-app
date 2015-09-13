# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import invoices.projects.models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='balance',
            field=models.DecimalField(default=0, decimal_places=2, max_digits=8),
        ),
        migrations.AlterField(
            model_name='project',
            name='client_email',
            field=models.EmailField(max_length=254, blank=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='deadline',
            field=models.DateTimeField(blank=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='fixed_rate',
            field=models.DecimalField(default=0, decimal_places=2, max_digits=8),
        ),
        migrations.AlterField(
            model_name='project',
            name='hourly_rate',
            field=models.DecimalField(default=0, decimal_places=2, max_digits=8),
        ),
        migrations.AlterField(
            model_name='project',
            name='payments',
            field=models.DecimalField(default=0, decimal_places=2, max_digits=8),
        ),
        migrations.AlterField(
            model_name='project',
            name='project_description',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='project_logo',
            field=models.ImageField(upload_to=invoices.projects.models.logo_path, blank=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='project_url',
            field=models.URLField(blank=True),
        ),
    ]
