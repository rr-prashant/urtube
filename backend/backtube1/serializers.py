from django.contrib.auth.models import Group, User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'sub', 'first_name', 'last_name', 'email', 'email_verified', 'picture', 'youtube_channel_id']



