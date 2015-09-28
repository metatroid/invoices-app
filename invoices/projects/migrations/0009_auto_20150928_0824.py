# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import invoices.projects.models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0008_auto_20150928_0818'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='client_email',
            field=models.EmailField(max_length=254, blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='client_name',
            field=models.CharField(max_length=50, blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='project_description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='project_logo',
            field=models.ImageField(blank=True, upload_to=invoices.projects.models.logo_path, null=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='project_url',
            field=models.URLField(blank=True, null=True),
        ),
    ]
