from django.urls import path

from . import views

app_name = 'fairvis'
urlpatterns = [
    path('', views.index, name='index'),
    path('upload_data', views.upload_data, name='upload_data'),
]