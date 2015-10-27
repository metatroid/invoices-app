# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import positions.fields


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0011_auto_20151004_0258'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ('position', 'created_at')},
        ),
        migrations.AddField(
            model_name='project',
            name='position',
            field=positions.fields.PositionField(default=0),
        ),
    ]
