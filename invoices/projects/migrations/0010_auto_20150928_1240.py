# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0009_auto_20150928_0824'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='user',
            field=models.ForeignKey(related_name='projects', on_delete='models.CASCADE', to=settings.AUTH_USER_MODEL, null=True, blank=True),
        ),
    ]
