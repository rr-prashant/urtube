from googleapiclient.discovery import build
from django.conf import settings


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
    
    # Step 4: Get video details (can batch up to 50 IDs)
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