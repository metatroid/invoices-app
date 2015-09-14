# # from django.contrib.auth.models import User
# # from rest_framework import viewsets
# # from .models import Project
# # from invoices.projects.serializers import UserSerializer, ProjectSerializer

# # class UserViewSet(viewsets.ModelViewSet):
# #   queryset = User.objects.all().order_by('-date_joined')
# #   serializer_class = UserSerializer

# # class ProjectViewSet(viewsets.ModelViewSet):
# #   queryset = Project.objects.all().order_by('-updated_at')
# #   serializer_class = ProjectSerializer

# from django.shortcuts import render
# from rest_framework import generics
# from serializers import ProjectSerializer
# from models import Project

# class ProjectList(generics.ListCreateAPIView):
#   queryset = Project.objects.all().filter(user_id=request.user.id).order_by('-updated_at')
#   serializer_class = ProjectSerializer

# class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
#   queryset = Project.objects.all().filter(user_id=request.user.id).order_by('-updated_at')
#   serializer_class = ProjectSerializer