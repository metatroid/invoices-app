# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import positions.fields


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0013_auto_20151027_2241'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ('position', 'created_at')},
        ),
        migrations.AlterField(
            model_name='project',
            name='position',
            field=positions.fields.PositionField(default=0),
        ),
    ]
