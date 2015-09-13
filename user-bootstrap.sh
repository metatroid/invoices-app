#!/usr/bin/env bash

#source variables
. ./setup_vars.conf

#setup virtualenv
cd /vagrant
sudo pip3 install virtualenv
virtualenv invenv
source invenv/bin/activate
pip3 install django gunicorn psycopg2 djangorestframework markdown django-filter
django-admin.py startproject invoices .
./manage.py makemigrations
./manage.py migrate
echo "from django.contrib.auth.models import User; User.objects.create_superuser('$SUPERUSER_NAME', '$SUPERUSER_EMAIL', $SUPERUSER_PASSWORD)" | python manage.py shell
./manage.py collectstatic

#setup nginx + gunicorn
sudo mkdir /sockets #unix sockets don't seem to work inside vagrant's synced folders
sudo chmod 777 /sockets
sudo cp gunicorn.conf /etc/init/
sudo service gunicorn start
sudo rm -rf /usr/share/nginx/html/
sudo ln -fs /vagrant /usr/share/nginx/html
sudo sed -i "s|sendfile on;|sendfile off;|g" /etc/nginx/nginx.conf
sudo cp vhost /etc/nginx/sites-enabled/default
sudo service nginx restart
