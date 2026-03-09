from django.urls import path, include
from .views import sync_user, fetch_videos

urlpatterns = [
    path('sync-user/', sync_user),
    path('fetch-videos/', fetch_videos),
]
