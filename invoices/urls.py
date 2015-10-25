from django.conf.urls import patterns, include, url
from django.contrib import admin
from rest_framework.urlpatterns import format_suffix_patterns
from invoices import projects, views

urlpatterns = patterns('',
    url(r'^$', views.index_view, name="index_view"),
    url(r'^admin/', include(admin.site.urls)),
    url('', include('social.apps.django_app.urls', namespace='social')),
    url('', include('django.contrib.auth.urls', namespace='auth')),
    url(r'^de-authenticate/$', views.logout),
    url(r'^invoice/$', views.generate_invoice),
    url(r'^project/new/$', views.project_new, name='project_new'),
    url(r'^api/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^api/user/', views.UserStatus.as_view()),
    url(r'^api/users/(?P<pk>[0-9]+)/$', views.UserDetail.as_view()),
    url(r'^api/projects/$', views.ProjectList.as_view()),
    url(r'^api/projects/(?P<pk>[0-9]+)/$', views.ProjectDetail.as_view()),
    url(r'^api/projects/(?P<pk>[0-9]+)/interval_sort/$', views.ProjectIntervalSort),
    url(r'^api/projects/(?P<project_id>[0-9]+)/intervals/$', views.IntervalList.as_view()),
    url(r'^api/projects/(?P<project_id>[0-9]+)/intervals/(?P<pk>[0-9]+)/$', views.IntervalDetail.as_view()),
    url(r'^api/projects/(?P<project_id>[0-9]+)/statements/$', views.StatementList.as_view()),
    url(r'^api/projects/(?P<project_id>[0-9]+)/statements/(?P<pk>[0-9]+)/$', views.StatementDetail.as_view())
)

urlpatterns = format_suffix_patterns(urlpatterns)