
from rest_framework import serializers
from .models import User, Video, Comments, TopicCluster


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'sub', 'first_name', 'email', 'is_analyzed', 'picture', 'youtube_channel_id']



class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = [
            'id', 
            'youtube_video_id',  
            'title',
            'description', 
            'thumbnail_url', 
            'views', 
            'likes', 
            'comments_count', 
            'published_at',
        ]

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comments
        fields = [
            'id',
            'youtube_comment_id',
            'text',
            'author',
            'published_at',
            'sentiment_score',
            'sentiment_label',
        ]

class TopicClusterSerializer(serializers.ModelSerializer):
    videos = VideoSerializer(read_only=True, many=True)
    class Meta:
        model = TopicCluster
        fields = [
            'id',
            'cluster_label',
            'cluster_name',
            'avg_views',
            'avg_engagement',
            'videos',
        ]