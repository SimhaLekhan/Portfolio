from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/contact/', views.contact_api, name='contact_api'),
    path('api/projects/', views.projects_api, name='projects_api'),
]