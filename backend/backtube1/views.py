
from .models import User, Video, Comments, AnalysisSnapshot, TopicCluster, ResearchCache
from rest_framework.response import Response
from rest_framework.decorators import api_view
from backtube1.serializers import UserSerializer, VideoSerializer, CommentSerializer, TopicClusterSerializer, AnalysisSnapshotSerializer
from backtube1.decorators import require_supabase_auth
from backtube1.services import generate_embedding, get_channel_videos, get_video_comments, sentiment_analyze, get_sentiment_stats, cluster_video, public_search_video, ai_generate, name_cluster
from django.utils import timezone
from datetime import timedelta
from backtube1.prompts import VIDEO_INSIGHTS_PROMPT
from django.db.models import Avg

# this helps to create user linking with the frontend
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

# this fetches videos from user channel while handling data unloading
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
    
    # Saving before delete previous data
    if Comments.objects.filter(video__user=user).exists():
        save_analysis_snapshot(user)
    
    # Delete old videos (cascades to comments too)
    Video.objects.filter(user=user).delete()
    
    # Create fresh
    for video_data in videos_data:
        video = Video.objects.create(
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
        video.title_embedding = generate_embedding(video.title)
        video.save()

    user.youtube_channel_id = channel_id
    user.is_analyzed = True
    user.save()

    save_cluster(user)

    return Response({
        'message': f'Synced {len(videos_data)} videos',
    })


# getting videos from user channel alon with sentiment stats for dashboard display
@api_view(['GET'])
@require_supabase_auth
def get_videos(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    videos = Video.objects.filter(user=user).order_by('-published_at')
    sentiment = get_sentiment_stats(user) or {
        'avg_score': 0,
        'positive_percent': 0,
        'neutral_percent': 0,
        'negative_percent': 0,
        'total_comments': 0,
        'video_count': 0,
    }

    best_videos = Video.objects.filter(user=user).order_by('-views')[:3]
    snapshots = AnalysisSnapshot.objects.filter(user=user)


    return Response({
        'user': UserSerializer(user).data,
        'videos': VideoSerializer(videos, many=True).data,
        'best_videos': VideoSerializer(best_videos, many=True).data,
        'snapshots': AnalysisSnapshotSerializer(snapshots, many=True).data,
        'count': videos.count(),
        'sentiment': sentiment,
    })

# fetching comments from user yt channel and generating analyze sentiment for each comment
@api_view(['POST'])
@require_supabase_auth
def fetch_comments(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    videos = Video.objects.filter(user=user).order_by('-published_at')
    
    for video in videos:
        com_data = get_video_comments(video.youtube_video_id)
        
        Comments.objects.filter(video=video).delete()  # Clear old comments before adding new ones
        
        total_comment = 0
        for comment in com_data:
            score, label = sentiment_analyze(comment['text'])
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


# helper func: save snapshot of the overrall channel sentiment and stats before deleting old data for history
def save_analysis_snapshot(user):
    stats = get_sentiment_stats(user)
    if not stats:
        return

    top_video = Video.objects.filter(user=user).order_by('-views').first()

    AnalysisSnapshot.objects.create(
        user=user,
        video_count=stats['video_count'],
        total_comments=stats['total_comments'],
        avg_sentiment=stats['avg_score'],
        positive_percent=stats['positive_percent'],
        neutral_percent=stats['neutral_percent'],
        negative_percent=stats['negative_percent'],
        top_video_id=top_video.youtube_video_id if top_video else None,
        top_video_title=top_video.title if top_video else None,
    )


# Get comments for a specific video
@api_view(['GET'])
@require_supabase_auth
def get_comments(request, id):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    comment = Comments.objects.filter(video__user=user, video__id=id).order_by('-published_at')
    
    return Response({
        'comments': CommentSerializer(comment, many=True).data,
        'count': comment.count(),
    })


# helper func: to do the clustering for the videos
def save_cluster(user):
    new_clusters = cluster_video(user)
    if not new_clusters:
        return
    
    Video.objects.filter(user=user).update(cluster=None)  # clearing old cluster for videos before assigning new ones
    
    TopicCluster.objects.filter(user=user).delete()  # Clear old clusters before creating new ones  

    # first group the new clusters with their respective labels
    cluster_map = {}
    for c in new_clusters:
        label = c['cluster_label']
        if label not in cluster_map:
            cluster_map[label] = []
        cluster_map[label].append(c['video'])
    
    # now creating cluster objects and assigning videos to them
    for label, videos in cluster_map.items():
        avg_views = sum(v.views for v in videos) / len(videos)
        avg_engagement = sum(
            (v.likes + v.comments_count) / v.views if v.views > 0 else 0
            for v in videos
        ) / len(videos)

        cluster = TopicCluster.objects.create(
            user=user,
            cluster_label=label,
            avg_views=round(avg_views, 2),
            avg_engagement=round(avg_engagement, 2),
        )

        # giving clusters title with AI
        video_titles = [v.title for v in videos]
        cluster.cluster_name = name_cluster(video_titles)
        cluster.save()

        for video in videos:
            video.cluster = cluster
            video.save()


# Get comments for a specific video
@api_view(['GET'])
@require_supabase_auth
def get_clusters(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    clusters = TopicCluster.objects.filter(user=user)
    
    return Response({
        'clusters': TopicClusterSerializer(clusters, many=True).data,
    })


# search videos for public mode
@api_view(['POST'])
def public_research(request):
    query = request.data.get('query', '')

    if not query:
        return Response({'error': 'Query is required'}, status=400)

    # Check cache first
    cache = ResearchCache.objects.filter(query=query.lower()).first()
    if cache and cache.created_at > timezone.now() - timedelta(days=7):
        return Response(cache.results)

    # No cache or expired — fetch fresh

    videos = public_search_video(query)

    if not videos:
        return Response({'error': 'No videos found'}, status=404)
    

    # for top 10 videos
    top_ten = sorted(videos, key= lambda v: v['views'], reverse=True)[:10]  

    # sentiment brekdown
    total = len(videos)
    total_views = sum(v['views'] for v in videos)
    total_likes = sum(v['likes'] for v in videos)
    total_comments = sum(v['comments_count'] for v in videos)
    

    avg_views = total_views / total
    avg_likes = total_likes / total
    avg_engagement = (total_likes / total_views * 100) if total_views > 0 else 0

    results = {
        'query' : query,
        'total_results': total,
        'videos': videos,
        'trending_titles': [
            {
                'title': v['title'], 
                'views': v['views'],
                'likes': v['likes'],
                'comments_count': v['comments_count'],
            } for v in top_ten
        ],
        'engagement':{
            'avg_views': round(avg_views),
            'avg_likes': round(avg_likes),
            'avg_engagement_percent': round(avg_engagement, 2),
            'total_comments': total_comments,
        },
    }

    # Save to cache — delete old entry if exists, create fresh
    ResearchCache.objects.filter(query=query.lower()).delete()
    ResearchCache.objects.create(query=query.lower(), results=results)

    return Response(results)


@api_view(['POST'])
@require_supabase_auth
def video_insights(request, id):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    try:
        video = Video.objects.get(id=id, user=user)
    except Video.DoesNotExist:
        return Response({'error': 'Video not found'}, status=404)
    
    comments = Comments.objects.filter(video=video)
    total = comments.count()

    if total > 0:
        positive = comments.filter(sentiment_label='positive').count()
        neutral = comments.filter(sentiment_label='neutral').count()
        negative = comments.filter(sentiment_label='negative').count()
        avg_score = comments.aggregate(Avg('sentiment_score'))['sentiment_score__avg'] or 0
    else:
        positive, neutral, negative, avg_score = 0, 0, 0, 0

    # User's average views for comparison
    avg_views = Video.objects.filter(user=user).aggregate(Avg('views'))['views__avg'] or 0

    prompt = VIDEO_INSIGHTS_PROMPT.format(
        title=video.title,
        description=video.description or '',
        views=video.views,
        likes=video.likes,
        comments_count=video.comments_count,
        sentiment_score=round(avg_score, 4),
        positive_percent=round((positive / total) * 100, 2) if total > 0 else 0,
        neutral_percent=round((neutral / total) * 100, 2) if total > 0 else 0,
        negative_percent=round((negative / total) * 100, 2) if total > 0 else 0,
        avg_views=round(avg_views),
    )

    result = ai_generate(prompt)

    return Response(result)