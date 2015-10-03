# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0004_auto_20150930_0323'),
    ]

    operations = [
        migrations.AlterField(
            model_name='interval',
            name='project',
            field=models.ForeignKey(on_delete='models.SET_NULL', null=True, related_name='intervals', blank=True, to='projects.Project'),
        ),
    ]
