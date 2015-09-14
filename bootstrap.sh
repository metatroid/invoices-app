#!/usr/bin/env bash

#install requirements
apt-get update
apt-get install -y nginx python3-pip python3-dev libpq-dev postgresql postgresql-contrib

#source variables
DATABASE_NAME=`awk -F '= ' '{if (! ($0 ~ /^;/) && $0 ~ /DATABASE_NAME/) print $2}' /vagrant/config.ini`
DATABASE_USER=`awk -F '= ' '{if (! ($0 ~ /^;/) && $0 ~ /DATABASE_USER/) print $2}' /vagrant/config.ini`
DATABASE_PASSWORD=`awk -F '= ' '{if (! ($0 ~ /^;/) && $0 ~ /DATABASE_PASSWORD/) print $2}' /vagrant/config.ini`

#setup postgresql
sudo -u postgres psql --command "CREATE DATABASE $DATABASE_NAME;"
sudo -u postgres psql --command "CREATE USER $DATABASE_USER WITH PASSWORD $DATABASE_PASSWORD;"
sudo -u postgres psql --command "GRANT ALL PRIVILEGES ON DATABASE $DATABASE_NAME TO $DATABASE_USER;"

#continue setup as vagrant user
su -c 'bash /vagrant/user-bootstrap.sh' vagrant