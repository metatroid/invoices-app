# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('statements', '0002_auto_20150923_0604'),
    ]

    operations = [
        migrations.AlterField(
            model_name='statement',
            name='project',
            field=models.ForeignKey(blank=True, related_name='statements', null=True, to='projects.Project'),
        ),
    ]
