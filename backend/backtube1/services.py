from googleapiclient.discovery import build
from django.conf import settings
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .models import User, Video, Comments
from django.db.models import Avg
from openai import OpenAI
from sklearn.cluster import KMeans
import numpy as np
from sklearn.metrics import silhouette_score
import json

#OpenAI Client Initialization
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Getting Video Data from YouTube API
def get_youtube_service(access_token=None):
    """Create YouTube API service"""
    if access_token:
        # For authenticated requests (user's own data)
        from google.oauth2.credentials import Credentials
        credentials = Credentials(token=access_token)
        return build('youtube', 'v3', credentials=credentials)
    else:
        # For public data (API key only)
        return build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)


def get_channel_id(youtube):
    """Get the authenticated user's YouTube channel ID"""
    request = youtube.channels().list(
        part='id',
        mine=True
    )
    response = request.execute()
    
    if 'items' in response and len(response['items']) > 0:
        return response['items'][0]['id']
    return None


def get_uploads_playlist_id(channel_id):
    """Convert channel ID to uploads playlist ID"""
    if channel_id.startswith('UC'):
        return 'UU' + channel_id[2:]
    return None


def get_channel_videos(access_token, max_results=30):
    """Fetch user's latest videos from their uploads playlist"""
    
    youtube = get_youtube_service(access_token)
    
    # Step 1: Get channel ID
    channel_id = get_channel_id(youtube)
    if not channel_id:
        return []
    
    # Step 2: Get uploads playlist ID
    playlist_id = get_uploads_playlist_id(channel_id)
    if not playlist_id:
        return []
    
    # Step 3: Get video IDs from playlist
    request = youtube.playlistItems().list(
        part='contentDetails',
        playlistId=playlist_id,
        maxResults=max_results
    )
    response = request.execute()
    
    if 'items' not in response:
        return []
    
    video_ids = [item['contentDetails']['videoId'] for item in response['items']]
    
    # Step 4: Get video details
    request = youtube.videos().list(
        part='snippet,statistics',
        id=','.join(video_ids)
    )
    response = request.execute()
    
    videos = []
    for item in response.get('items', []):
        videos.append({
            'youtube_video_id': item['id'],
            'title': item['snippet']['title'],
            'description': item['snippet'].get('description', ''),
            'thumbnail_url': item['snippet']['thumbnails'].get('high', {}).get('url'),
            'published_at': item['snippet']['publishedAt'],
            'views': int(item['statistics'].get('viewCount', 0)),
            'likes': int(item['statistics'].get('likeCount', 0)),
            'comments_count': int(item['statistics'].get('commentCount', 0)),
        })
    
    return channel_id, videos




# Getting Comments Data from YouTube API
def get_video_comments(video_id, max_length=100):
    youtube = get_youtube_service()

    try:
        request= youtube.commentThreads().list(
            part='snippet',
            videoId=video_id,
            maxResults=max_length,
            order='relevance',
            textFormat='plainText'
        )
        response = request.execute()
    except Exception:
        return []

    comments = []

    for item in response.get('items', []):
        comment = item['snippet']['topLevelComment']['snippet']
        comments.append({
            'youtube_comment_id': item['id'],
            'text': comment['textDisplay'],
            'author': comment['authorDisplayName'],
            'published_at': comment['publishedAt']
        })
    
    return comments

# Sentiment Analysis
analyzer = SentimentIntensityAnalyzer()
def sentiment_analyze(text):
    sentiment_results = analyzer.polarity_scores(text)['compound']

    score = 0
    label = ''

    if sentiment_results >= 0.05:
        score = sentiment_results
        label = 'positive'
    elif sentiment_results <= -0.05:
        score = sentiment_results
        label = 'negative'
    else:
        score = sentiment_results
        label = 'neutral'

    return score, label


# to calculate the overall sentiment for logged in users
def get_sentiment_stats(user):
    videos = Video.objects.filter(user=user)
    comments = Comments.objects.filter(video__in=videos)
    total = comments.count()

    if total == 0:
        return {
            'avg_score': 0,
            'positive_percent': 0,
            'neutral_percent': 0,
            'negative_percent': 0,
            'total_comments': 0,
            'video_count': videos.count(),
        }

    positive = comments.filter(sentiment_label='positive').count()
    neutral = comments.filter(sentiment_label='neutral').count()
    negative = comments.filter(sentiment_label='negative').count()
    avg = comments.aggregate(Avg('sentiment_score'))['sentiment_score__avg'] or 0.0

    return {
        'avg_score': round(avg, 4),
        'positive_percent': round((positive / total) * 100, 2),
        'neutral_percent': round((neutral / total) * 100, 2),
        'negative_percent': round((negative / total) * 100, 2),
        'total_comments': total,
        'video_count': videos.count(),
    }



# embedding generation
def generate_embedding(title):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=title
    )
    return response.data[0].embedding


# Clustering videos based on title embeddings

def cluster_video(user):
    videos = Video.objects.filter(user=user, title_embedding__isnull=False)

    if videos.count() < 3:
        return {
            'message': 'Not enough videos with embeddings to perform clustering.',
        }
    
    embeddings = np.array([video.title_embedding for video in videos])


    best_k = 2
    best_score = -1

    # the silhouette loop to find the exact number of clusters needed
    max_k = min(6, len(videos) - 1)
    for k in range(2, max_k + 1):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(embeddings)
        score = silhouette_score(embeddings, labels)

        if score > best_score:
            best_k = k
            best_score = score
        
    # Final clustering with best K
    kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)

    # Assigning cluster labels to videos
    results = []
    for video, label in zip(videos, labels):
       results.append({
           'video' : video,
           'cluster_label' : int(label),
       })

    return results


# For public videos
def public_search_video(query,max_results=50):
    youtube = get_youtube_service()

    request = youtube.search().list(
        part='id',
        q=query,
        type='video',
        order='viewCount',
        maxResults=max_results
    )
    response = request.execute()
    
    video_ids = [item['id']['videoId'] for item in response.get('items', [])]

    if not video_ids:
        return []
    
    request = youtube.videos().list(
        part='snippet,statistics',
        id=','.join(video_ids)
    )
    response = request.execute()

    videos = []
    for item in response.get('items', []):
        videos.append({
            'youtube_video_id': item['id'],
            'title': item['snippet']['title'],
            'description': item['snippet'].get('description', ''),
            'thumbnail_url': item['snippet']['thumbnails'].get('high', {}).get('url'),
            'published_at': item['snippet']['publishedAt'],
            'views': int(item['statistics'].get('viewCount', 0)),
            'likes': int(item['statistics'].get('likeCount', 0)),
            'comments_count': int(item['statistics'].get('commentCount', 0)),
        })
    
    return videos

# GPT helper function
def ai_generate(prompt):
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role" : "user","content" : prompt}
            ],
            temperature=0.7 
        ).choices[0].message.content

        return json.loads(response)
    except:
        return {}
    