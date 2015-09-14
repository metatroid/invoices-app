# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0005_auto_20150913_0845'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='user',
            field=models.ForeignKey(on_delete='models.CASCADE', to=settings.AUTH_USER_MODEL, related_name='projects'),
        ),
    ]
