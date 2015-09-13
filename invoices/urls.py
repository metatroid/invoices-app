# from django.conf.urls import url, include
# from django.contrib import admin
# from rest_framework import routers
# from invoices.projects import views

# router = routers.DefaultRouter()
# router.register(r'projects', views.ProjectViewSet)

# urlpatterns = [
#   # url(r'^', include(router.urls)),
#   url(r'^admin/', include(admin.site.urls)),
#   url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
# ]

from django.conf.urls import patterns, include, url
from django.contrib import admin
from rest_framework.urlpatterns import format_suffix_patterns
from invoices import projects, views

urlpatterns = patterns('',
    url(r'^$', views.index_view, name="index_view"),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^api/projects/$', views.ProjectList.as_view()),
    url(r'^api/projects/(?P<pk>[0-9]+)/$', views.ProjectDetail.as_view())
)

urlpatterns = format_suffix_patterns(urlpatterns)