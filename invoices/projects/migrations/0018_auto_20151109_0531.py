# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0017_auto_20151109_0529'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ('-active', 'position', 'created_at')},
        ),
    ]
