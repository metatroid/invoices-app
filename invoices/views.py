from django.shortcuts import render
from rest_framework import generics
from invoices.projects.serializers import ProjectSerializer
from invoices.projects.models import Project

class ProjectList(generics.ListCreateAPIView):
  queryset = Project.objects.all().order_by('-updated_at')
  serializer_class = ProjectSerializer

class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
  queryset = Project.objects.all()
  serializer_class = ProjectSerializer

def index_view(request):
  return render(request, 'index.html')