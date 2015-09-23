# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('statements', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='statement',
            options={'ordering': ('created_at',)},
        ),
        migrations.AlterField(
            model_name='statement',
            name='project',
            field=models.ForeignKey(to='projects.Project', null=True, related_name='statements', on_delete='models.CASCADE', blank=True),
        ),
    ]
