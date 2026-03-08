from django.urls import path, include
from .views import sync_user

urlpatterns = [
    path('sync-user/', sync_user)
]
