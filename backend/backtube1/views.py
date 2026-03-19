
from .models import User, Video, Comments, AnalysisSnapshot
from rest_framework.response import Response
from rest_framework.decorators import api_view
from backtube1.serializers import UserSerializer, VideoSerializer, CommentSerializer
from backtube1.decorators import require_supabase_auth
from backtube1.services import get_channel_videos, get_video_comments, comment_sentiment_analyze
from django.db.models import Avg

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
    
    channel_id, videos_data = get_channel_videos(user.access_token, max_results=30)
    
    if not videos_data:
        return Response({'error': 'No videos found or invalid token'}, status=404)
    
    # Delete old videos (cascades to comments too)
    Video.objects.filter(user=user).delete()
    
    # Create fresh
    for video_data in videos_data:
        Video.objects.create(
            user=user,
            youtube_video_id=video_data['youtube_video_id'],
            title=video_data['title'],
            description=video_data['description'],
            thumbnail_url=video_data['thumbnail_url'],
            published_at=video_data['published_at'],
            views=video_data['views'],
            likes=video_data['likes'],
            comments_count=video_data['comments_count'],
        )

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


@api_view(['POST'])
@require_supabase_auth
def fetch_comments(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    videos = Video.objects.filter(user=user).order_by('-published_at')

    save_analysis_snapshot(user)  # Save snapshot before updating comments
    
    for video in videos:
        com_data = get_video_comments(video.youtube_video_id)
        
        

        Comments.objects.filter(video=video).delete()  # Clear old comments before adding new ones
        
        total_comment = 0
        for comment in com_data:
            score, label = comment_sentiment_analyze(comment['text'])
            Comments.objects.create(
                youtube_comment_id=comment['youtube_comment_id'],
                video=video,
                text=comment['text'],
                author=comment['author'],
                published_at=comment['published_at'],
                sentiment_score=score,
                sentiment_label=label,
            )
        total_comment += len(com_data)

    return Response({
        'message': f'Synced {total_comment} comments',
    })


def save_analysis_snapshot(user):
    videos = Video.objects.filter(user=user)
    comments = Comments.objects.filter(video__in=videos)

    # Only snapshot if there's existing analyzed data
    if not comments.filter(sentiment_score__isnull=False).exists():
        return

    total = comments.count()
    positive = comments.filter(sentiment_label='positive').count()
    neutral = comments.filter(sentiment_label='neutral').count()
    negative = comments.filter(sentiment_label='negative').count()

    avg = comments.aggregate(Avg('sentiment_score'))['sentiment_score__avg'] or 0.0

    # Find top video by views
    top_video = videos.order_by('-views').first()

    AnalysisSnapshot.objects.create(
        user=user,
        video_count=videos.count(),
        total_comments=total,
        avg_sentiment=round(avg, 4),
        positive_percent=round((positive / total) * 100, 2) if total > 0 else 0,
        neutral_percent=round((neutral / total) * 100, 2) if total > 0 else 0,
        negative_percent=round((negative / total) * 100, 2) if total > 0 else 0,
        top_video_id=top_video.youtube_video_id if top_video else None,
        top_video_title=top_video.title if top_video else None,
    )


@api_view(['GET'])
@require_supabase_auth
def get_comments(request, id):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    comment = Comments.objects.filter(video__user=user, video__id=id).order_by('-published_at')
    
    return Response({
        'user': UserSerializer(user).data,
        'comments': CommentSerializer(comment, many=True).data,
        'count': comment.count(),
    })