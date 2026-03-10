
from .models import User, Video
from rest_framework.response import Response
from rest_framework.decorators import api_view
from backtube1.serializers import UserSerializer
from backtube1.decorators import require_supabase_auth
from backtube1.services import get_channel_videos

# Create your views here.
@api_view(["GET"])
def UserView(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

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
    return Response({'id': user.id, 'created': created, 'is_analyzed': user.is_analyzed})


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
    videos_data = get_channel_videos(user.access_token, max_results=30)
    
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
    
    user.is_analyzed = True
    user.save()

    # Delete older videos beyond 30
    user_videos = Video.objects.filter(user=user).order_by('-published_at')
    if user_videos.count() > 30:
        old_ids = list(user_videos[30:].values_list('id', flat=True))
        Video.objects.filter(id__in=old_ids).delete()
    
    return Response({
        'message': f'Synced {len(videos_data)} videos',
        'count': len(videos_data)
    })

@api_view(['GET'])
@require_supabase_auth
def get_videos(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    videos = Video.objects.filter(user=user).order_by('-published_at')
    videos_data = []
    for video in videos:
        videos_data.append({
            'youtube_video_id': video.youtube_video_id,
            'title': video.title,
            'description': video.description,
            'thumbnail_url': video.thumbnail_url,
            'published_at': video.published_at,
            'views': video.views,
            'likes': video.likes,
            'comments_count': video.comments_count,
        })
    
    return Response({
        'user': {
            'email': user.email,
            'name': user.first_name,
            'picture': user.picture,
            'is_analyzed': user.is_analyzed,
        },
        'videos': videos_data,
        'count': len(videos_data),
        })