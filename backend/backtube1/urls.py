from django.urls import path, include
from .views import fetch_comments, sync_user, fetch_videos, get_videos, get_comments, get_clusters

urlpatterns = [
    path('sync-user/', sync_user),
    path('fetch-videos/', fetch_videos),
    path('get-videos/', get_videos),
    path('fetch-comments/', fetch_comments),
    path('get-comments/<int:id>/', get_comments),
    path('get-clusters/', get_clusters),
]
