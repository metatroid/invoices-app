# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0016_project_active'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ('active', 'position', 'created_at')},
        ),
    ]
