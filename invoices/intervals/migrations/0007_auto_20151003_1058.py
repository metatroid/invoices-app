# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0006_auto_20151003_1043'),
    ]

    operations = [
        migrations.AlterField(
            model_name='interval',
            name='project',
            field=models.ForeignKey(to='projects.Project', blank=True, null=True, related_name='intervals'),
        ),
    ]
