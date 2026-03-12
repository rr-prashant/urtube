
from .models import User, Video
from rest_framework.response import Response
from rest_framework.decorators import api_view
from backtube1.serializers import UserSerializer, VideoSerializer
from backtube1.decorators import require_supabase_auth
from backtube1.services import get_channel_videos


@api_view(["POST"])
@require_supabase_auth
def sync_user(request):
    data = request.data
    user, created = User.objects.update_or_create(
        sub = data['sub'],
        defaults = {
            'username': data['email'],
            'email': data['email'],
            'first_name': data['full_name'],
            'picture': data['picture'],
            'email_verified': data['email_verified'],
            'access_token': data.get('google_access_token', ''),
        }
    )
    return Response({'is_analyzed': user.is_analyzed})


@api_view(['POST'])
@require_supabase_auth
def fetch_videos(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if not user.access_token:
        return Response({'error': 'No YouTube access token. Please re-login.'}, status=400)
    
    # Fetch videos from YouTube: user.access_token = token to access the YT account
    channel_id, videos_data = get_channel_videos(user.access_token, max_results=30)
    
    if not videos_data:
        return Response({'error': 'No videos found or invalid token'}, status=404)
    
    # Save videos to database : using update_or_create to avoid duplicates and keep data updated
    for video_data in videos_data:
        Video.objects.update_or_create(
            youtube_video_id=video_data['youtube_video_id'],
            defaults={
                'user': user,
                'title': video_data['title'],
                'description': video_data['description'],
                'thumbnail_url': video_data['thumbnail_url'],
                'published_at': video_data['published_at'],
                'views': video_data['views'],
                'likes': video_data['likes'],
                'comments_count': video_data['comments_count'],
            }
        )

    # Delete older videos beyond 30
    user_videos = Video.objects.filter(user=user).order_by('-published_at')
    if user_videos.count() > 30:
        old_ids = list(user_videos[30:].values_list('id', flat=True))
        Video.objects.filter(id__in=old_ids).delete()

    user.youtube_channel_id = channel_id
    user.is_analyzed = True
    user.save()

    
    return Response({
        'message': f'Synced {len(videos_data)} videos',
    })

@api_view(['GET'])
@require_supabase_auth
def get_videos(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    videos = Video.objects.filter(user=user).order_by('-published_at')
    
    return Response({
        'user': UserSerializer(user).data,
        'videos': VideoSerializer(videos, many=True).data,
        'count': videos.count(),
    })