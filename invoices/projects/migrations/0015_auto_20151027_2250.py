# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import positions.fields


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0014_auto_20151027_2246'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='position',
            field=positions.fields.PositionField(default=0),
        ),
    ]
