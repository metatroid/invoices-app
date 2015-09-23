# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0002_auto_20150914_0035'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='interval',
            options={'ordering': ('created_at',)},
        ),
        migrations.AlterField(
            model_name='interval',
            name='project',
            field=models.ForeignKey(related_name='intervals', to='projects.Project', on_delete='models.CASCADE', null=True, blank=True),
        ),
    ]
