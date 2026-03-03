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
    
    