from django.conf.urls import patterns, include, url
from django.contrib import admin
from rest_framework.urlpatterns import format_suffix_patterns
from invoices import projects, views

urlpatterns = patterns('',
    url(r'^$', views.index_view, name="index_view"),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^api/user', views.UserStatus.as_view()),
    url(r'^api/user/(?P<pk>[0-9]+)/$', views.UserDetail.as_view()),
    url(r'^api/projects/$', views.ProjectList.as_view()),
    url(r'^api/project/(?P<pk>[0-9]+)/$', views.ProjectDetail.as_view()),
    url(r'^api/project/(?P<project_id>[0-9]+)/intervals/$', views.IntervalList.as_view()),
    url(r'^api/project/(?P<project_id>[0-9]+)/interval/(?P<pk>[0-9]+)/$', views.IntervalDetail.as_view()),
    url(r'^api/project/(?P<project_id>[0-9]+)/statements/$', views.StatementList.as_view()),
    url(r'^api/project/(?P<project_id>[0-9]+)/statement/(?P<pk>[0-9]+)/$', views.StatementDetail.as_view())
)

urlpatterns = format_suffix_patterns(urlpatterns)