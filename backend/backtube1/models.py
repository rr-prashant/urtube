from django.db import models
from django.contrib.auth.models import AbstractUser
from pgvector.django import VectorField

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
    is_analyzed = models.BooleanField(default=False)
    
class Video(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos')
    youtube_video_id = models.CharField(max_length=50, unique=True)
    title = models.TextField()
    title_embedding = VectorField(dimensions=1536, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    published_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey('TopicCluster', on_delete=models.SET_NULL, null=True, blank=True, related_name='videos')

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title


class AnalysisSnapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='snapshots')
    created_at = models.DateTimeField(auto_now_add=True)

    video_count = models.IntegerField(default=0)
    total_comments = models.IntegerField(default=0)
    avg_sentiment = models.FloatField(default=0.0)
    positive_percent = models.FloatField(default=0.0)
    neutral_percent = models.FloatField(default=0.0)
    negative_percent = models.FloatField(default=0.0)
    
    # Top performing video at time of snapshot
    top_video_id = models.CharField(max_length=50, null=True, blank=True)
    top_video_title = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Snapshot for {self.user.email} at {self.created_at}"
    
class Comments(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    youtube_comment_id = models.CharField(max_length=100, unique=True)
    text = models.TextField()
    author = models.CharField(max_length=255)
    published_at = models.DateTimeField()
    sentiment_score = models.FloatField(null=True, blank=True)
    sentiment_label = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author}: {self.text[:50]}"
    

class TopicCluster(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clusters')
    cluster_label = models.IntegerField()
    cluster_name = models.CharField(max_length=255, null=True, blank=True)
    avg_views = models.FloatField(default=0)
    avg_engagement = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cluster {self.cluster_label} for {self.user.email}"