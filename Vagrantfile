# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "trusty64"
  config.vm.box_url = "http://cloud-images.ubuntu.com/vagrant/trusty/current/trusty-server-cloudimg-amd64-vagrant-disk1.box"

  # allows running commands globally in shell for installed composer libraries
  config.vm.provision :shell, path: 'bootstrap.sh'

  # setup virtual hostname and provision local IP
  config.vm.hostname = "django.dev"
  config.vm.network :private_network, :ip => "192.168.50.13"
  config.hostsupdater.aliases = %w{www.django.dev}
  config.hostsupdater.remove_on_suspend = true
  
  # Fix for slow external network connections
  config.vm.provider :virtualbox do |vb|
    vb.customize ['modifyvm', :id, '--natdnshostresolver1', 'on']
    vb.customize ['modifyvm', :id, '--natdnsproxy1', 'on']
    vb.name = "django_dev"
  end
end
