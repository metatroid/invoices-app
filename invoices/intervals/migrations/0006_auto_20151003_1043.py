# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0005_auto_20151003_1040'),
    ]

    operations = [
        migrations.AlterField(
            model_name='interval',
            name='project',
            field=models.ForeignKey(null=True, to='projects.Project', on_delete='models.CASCADE', blank=True, related_name='intervals'),
        ),
    ]
