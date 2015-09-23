# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0006_auto_20150914_0035'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ('created_at',)},
        ),
        migrations.AlterField(
            model_name='project',
            name='client_name',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
