from django.contrib.auth.models import Group, User
from rest_framework import serializers
from .models import Items

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model= User
        fields= ["id", "username", "email", "groups"]


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Items
        fields = ["id", "name"]