from django.shortcuts import render, redirect, render_to_response
from django.contrib.auth import logout as auth_logout
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework import status
from invoices.projects.serializers import UserSerializer, ProjectSerializer, IntervalSerializer, StatementSerializer
from django.contrib.auth.models import User
from invoices.projects.models import Project
from invoices.intervals.models import Interval
from invoices.statements.models import Statement
from invoices.projects.forms import ProjectForm
import os
from configparser import RawConfigParser
import logging
logger = logging.getLogger(__name__)

class UserStatus(APIView):
  permission_classes = (AllowAny,)
  def get(self, request, format=None):
    user = request.user
    if(user.is_active):
      return Response(UserSerializer(user).data)
    return Response(None)

class UserDetail(APIView):
  permission_classes = (IsAuthenticated,)
  def get_object(self, pk, req):
    try:
      if(req.user.is_superuser):
        return User.objects.get(pk=pk)
      return User.objects.get(pk=req.user.id)
    except User.DoesNotExist:
      # raise Http404
      return User.objects.get(pk=req.user.id)
  def get(self, request, pk, format=None):
    user = self.get_object(pk, request)
    serializer = UserSerializer(user)
    return Response(serializer.data)
  def put(self, request, pk, format=None):
    user = self.get_object(pk, request)
    serializer = UserSerializer(user, data=request.data)
    if serializer.is_valid():
      serializer.save()
      return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
  def delete(self, request, pk, format=None):
    user = self.get_object(pk, request)
    user.is_active = False
    user.save()
    return Response(status=status.HTTP_204_NO_CONTENT)

class ProjectList(APIView):
  permission_classes = (IsAuthenticated,)
  def get(self, request, format=None):
    projects = Project.objects.all().filter(user=request.user.id).order_by('-created_at')
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)
  def post(self, request, format=None):
    serializer = ProjectSerializer(data=request.data)
    if serializer.is_valid():
      serializer.save(user=request.user)
      return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectDetail(APIView):
  permission_classes = (IsAuthenticated,)
  def get_object(self, pk, req):
    try:
      return Project.objects.get(pk=pk, user=req.user.id)
    except Project.DoesNotExist:
      raise Http404
  def get(self, request, pk, format=None):
    project = self.get_object(pk, request)
    serializer = ProjectSerializer(project)
    return Response(serializer.data)
  def put(self, request, pk, format=None):
    project = self.get_object(pk, request)
    serializer = ProjectSerializer(project, data=request.data)
    if serializer.is_valid():
      serializer.save(user=request.user)
      return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
  def delete(self, request, pk, format=None):
    project = self.get_object(pk, request)
    project.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

class IntervalList(APIView):
  permission_classes = (IsAuthenticated,)
  def get(self, request, project_id, format=None):
    project = Project.objects.get(pk=project_id, user=request.user.id)
    intervals = project.intervals.all().order_by('-created_at')
    serializer = IntervalSerializer(intervals, many=True)
    return Response(serializer.data)
  def post(self, request, project_id, format=None):
    serializer = IntervalSerializer(data=request.data)
    project = Project.objects.get(pk=project_id, user=request.user.id)
    if serializer.is_valid():
      serializer.save(project=project)
      # projectSerial = ProjectSerializer(project)
      # return Response(projectSerial.data, status=status.HTTP_201_CREATED)
      return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IntervalDetail(APIView):
  permission_classes = (IsAuthenticated,)
  def get_project(self, project_id, req):
    try:
      return Project.objects.get(pk=project_id, user=req.user.id)
    except Project.DoesNotExist:
      raise Http404
  def get_object(self, project_id, pk, req):
    try:
      project = self.get_project(project_id, req)
      return project.intervals.get(pk=pk)
    except Interval.DoesNotExist:
      raise Http404
  def get(self, request, project_id, pk, format=None):
    interval = self.get_object(project_id, pk, request)
    serializer = IntervalSerializer(interval)
    return Response(serializer.data)
  def put(self, request, project_id, pk, format=None):
    interval = self.get_object(project_id, pk, request)
    serializer = IntervalSerializer(interval, data=request.data)
    if serializer.is_valid():
      serializer.save()
      project_object = self.get_project(project_id, request)
      project = ProjectSerializer(project_object)
      return Response(project.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
  def delete(self, request, project_id, pk, format=None):
    interval = self.get_object(project_id, pk, request)
    interval.delete()
    project_object = self.get_project(project_id, request)
    project = ProjectSerializer(project_object)
    return Response(project.data)

class StatementList(APIView):
  permission_classes = (IsAuthenticated,)
  def get(self, request, project_id, format=None):
    project = Project.objects.get(pk=project_id, user=request.user.id)
    statements = project.statements.all().order_by('-created_at')
    serializer = StatementSerializer(statements, many=True)
    return Response(serializer.data)
  def post(self, request, project_id, format=None):
    serializer = StatementSerializer(data=request.data)
    project = Project.objects.get(pk=project_id, user=request.user.id)
    if serializer.is_valid():
      serializer.save(project=project)
      return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StatementDetail(APIView):
  permission_classes = (IsAuthenticated,)
  def get_project(self, project_id, req):
    try:
      return Project.objects.get(pk=project_id, user=req.user.id)
    except Project.DoesNotExist:
      raise Http404
  def get_object(self, project_id, pk, req):
    try:
      project = self.get_project(project_id, req)
      return project.statements.get(pk=pk)
    except Statement.DoesNotExist:
      raise Http404
  def get(self, request, project_id, pk, format=None):
    statement = self.get_object(project_id, pk, request)
    serializer = StatementSerializer(statement)
    return Response(serializer.data)
  def put(self, request, project_id, pk, format=None):
    statement = self.get_object(project_id, pk, request)
    serializer = StatementSerializer(statement, data=request.data)
    if serializer.is_valid():
      project_object = self.get_project(project_id, request)
      project = ProjectSerializer(project_object)
      return Response(project.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
  def delete(self, request, project_id, pk, format=None):
    statement = self.get_object(project_id, pk, request)
    statement.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

def project_new(request):
  form = ProjectForm()
  return render(request, 'project/project_edit.html', {'form': form})

def index_view(request):
  # logger.debug("")
  return render(request, 'index.html')

def logout(request):
  auth_logout(request)
  return redirect('/')

  # def render_to_pdf(template_src, context_dict):
  #   template = get_template(template_src)
  #   context = Context(context_dict)
  #   html  = template.render(context)
  #   result = StringIO.StringIO()

  #   pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("ISO-8859-1")), result)
  #   if not pdf.err:
  #     return HttpResponse(result.getvalue(), content_type='application/pdf')
  #   return HttpResponse('We had some errors<pre>%s</pre>' % escape(html))

def generate_invoice(request):
  statement = Statement.objects.get(pk=request.GET.get('statement', None))
  #rudimentary security
  BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
  config = RawConfigParser()
  if(os.path.isfile(os.path.join(BASE_DIR, 'config.overrides.ini'))):
      config.readfp(open(os.path.join(BASE_DIR, 'config.overrides.ini')))
  else:
      config.readfp(open(os.path.join(BASE_DIR, 'config.ini')))
  valid_host = config.get('hostname', 'SITE_HOST')
  request_host = request.META['SERVER_NAME']
  if(valid_host == request_host):
    project = Project.objects.get(pk=statement.project.id)
    if(str(project.user.id) == str(request.user.id) or "wkhtmltopdf" in request.META['HTTP_USER_AGENT']):
      invoice = statement.markup
      return render(request, 'invoice.html', {"pagesize": "A4", "invoice": invoice})
    else:
      return HttpResponse('Unauthorized', status=401)
  else:
    return HttpResponse('Unauthorized', status=401)
  