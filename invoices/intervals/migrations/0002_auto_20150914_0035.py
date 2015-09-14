# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('intervals', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='interval',
            name='project',
            field=models.ForeignKey(on_delete='models.CASCADE', to='projects.Project', related_name='intervals'),
        ),
    ]
