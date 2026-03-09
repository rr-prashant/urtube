from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    picture = models.URLField(null=True, blank=True)
    
    youtube_channel_id = models.CharField(max_length=100, null=True, blank=True)
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    total_subscribers = models.IntegerField(default=0)
    total_views = models.IntegerField(default=0)
    total_videos = models.IntegerField(default=0)
    
class Video(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos')
    youtube_video_id = models.CharField(max_length=50, unique=True)
    title = models.TextField()
    description = models.TextField(null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    published_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title