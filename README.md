# URTube - YouTube Analytics Platform

A full-stack YouTube analytics tool that helps creators understand what content works using AI-powered insights.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Authentication](#authentication)
9. [YouTube Integration](#youtube-integration)
10. [Project Structure](#project-structure)

---

## Overview

URTube is a YouTube analytics platform with two modes:

1. **Public Research Mode** - Anyone can search YouTube topics and see patterns (no login required)
2. **Creator Dashboard** - OAuth login to analyze YOUR channel's videos with AI insights

The platform uses sentiment analysis, embeddings, and clustering to provide actionable insights for content creators.

---

## Features

### Authentication
- Google OAuth via Supabase
- JWT verification (ES256 asymmetric keys)
- User sync between Supabase Auth and Django

### User Management
- Custom User model with Google profile data
- Automatic profile updates on each login

### YouTube Integration
- Fetch user's latest 30 videos on first login
- Store video metadata (title, views, likes, comments count)
- Fetch top 100 top-level comments per video (ordered by relevance)
- Re-analyze button for manual refresh
- Old videos and comments deleted and replaced on each re-fetch

### Creator Dashboard
- Display user profile info
- List all fetched videos with thumbnails
- View counts, likes, and comments for each video
- Re-analyze channel button

### Sentiment Analysis
- VADER sentiment analysis on top-level YouTube comments
- Per-comment scoring (compound score: -1 to +1) and labeling (positive/neutral/negative)
- Thresholds: ≥ 0.05 = positive, ≤ -0.05 = negative, between = neutral
- Analysis runs automatically during comment fetch
- Snapshot saved before each reanalysis for before/after comparison

### Video Clustering
- *Coming soon*

### Public Research Mode
- *Coming soon*

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, React |
| **Backend** | Django 6, Django REST Framework |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (Google OAuth) |
| **YouTube API** | YouTube Data API v3 |
| **AI/ML** | OpenAI API, VADER Sentiment, scikit-learn |
| **Deployment** | Vercel (frontend), Railway (backend) |

---

## Architecture

![Architecture Flow](./docs/auth.png)

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase account with project created
- Google Cloud Console project with OAuth credentials
- YouTube Data API v3 enabled

### Backend Setup (Django)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file (see Environment Variables section)

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Django
SECRET_KEY=your-django-secret-key
DEBUG=True

# YouTube
YOUTUBE_API_KEY=your-youtube-api-key
```

#### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Database Schema

### Data Models
![Database Schema](./docs/database-schema.png)

### User Model

```python
class User(AbstractUser):
    # Google OAuth fields
    sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    picture = models.URLField(null=True, blank=True)
    
    # YouTube fields
    youtube_channel_id = models.CharField(max_length=100, null=True, blank=True)
    access_token = models.TextField(null=True, blank=True)
    refresh_token = models.TextField(null=True, blank=True)
    
    # Analysis tracking
    is_analyzed = models.BooleanField(default=False)
    
    # Channel stats
    total_subscribers = models.IntegerField(default=0)
    total_views = models.IntegerField(default=0)
    total_videos = models.IntegerField(default=0)
```

### Video Model

```python
class Video(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos')
    youtube_video_id = models.CharField(max_length=50, unique=True)
    title = models.TextField()
    title_embedding = VectorField(dimensions=1536, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    published_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey('TopicCluster', on_delete=models.SET_NULL, null=True, blank=True, related_name='videos')
```
### Analysis Snapshot Model

```python
class AnalysisSnapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='snapshots')
    created_at = models.DateTimeField(auto_now_add=True)

    video_count = models.IntegerField(default=0)
    total_comments = models.IntegerField(default=0)
    avg_sentiment = models.FloatField(default=0.0)
    positive_percent = models.FloatField(default=0.0)
    neutral_percent = models.FloatField(default=0.0)
    negative_percent = models.FloatField(default=0.0)
    
    # Top performing video at time of snapshot
    top_video_id = models.CharField(max_length=50, null=True, blank=True)
    top_video_title = models.TextField(null=True, blank=True)
    
```

### Comment Model

```python
class Comment(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    youtube_comment_id = models.CharField(max_length=100, unique=True)
    text = models.TextField()
    author = models.CharField(max_length=255)
    published_at = models.DateTimeField()
    sentiment_score = models.FloatField(null=True, blank=True)
    sentiment_label = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Clusters model

```python
class TopicCluster(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clusters')
    cluster_label = models.IntegerField()
    cluster_name = models.CharField(max_length=255, null=True, blank=True)
    avg_views = models.FloatField(default=0)
    avg_engagement = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cluster {self.cluster_label} for {self.user.email}"
```

### Public mode

```python
class ResearchCache(models.Model):
    query = models.CharField(max_length=255, unique=True)
    results = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cache: {self.query}"
```


## API Endpoints

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sync-user/` | JWT | Create or update user from Supabase auth |

### Video Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fetch-videos/` | JWT | Fetch and store user's 30 latest YouTube videos |
| GET | `/api/get-videos/` | JWT | Get user's stored videos and profile |

### Comment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fetch-comments/` | JWT | Fetch top 100 comments per video, run VADER sentiment, store in DB |



---



## Authentication

### Authentication Flow

![Google Auth Flow](./docs/google-auth-seq.jpg)

### YouTube OAuth Scope

The app requests `youtube.readonly` scope to access user's YouTube channel data. Two tokens are captured:

- **Supabase JWT** (`session.access_token`) - Used for Django API authentication
- **Google Access Token** (`session.provider_token`) - Used for YouTube API calls, stored in User model

### OAuth Initiation (Frontend)

```typescript
await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
```

### OAuth Callback (Frontend)

```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
```

### JWT Verification

Supabase uses ES256 (asymmetric keys). Django verifies tokens using the public key from Supabase's JWKS endpoint.

#### Token Structure

```
eyJhbGciOiJFUzI1NiIs.eyJzdWIiOiIxMTQwODY4.SflKxwRJSMeKKF2QT4
├── Header ──────────┤├── Payload ────────┤├── Signature ────────┤

Header:  { "alg": "ES256", "kid": "083a8ce8-...", "typ": "JWT" }
Payload: { "sub": "114086...", "email": "user@gmail.com", "aud": "authenticated" }
```

#### Verification Flow

1. Extract token from `Authorization: Bearer <token>` header
2. Read `kid` (key ID) from token header
3. Fetch matching public key from JWKS endpoint
4. Verify signature using public key
5. Check expiration and audience claims
6. Return payload if valid

### JWT Flow Diagram
![JWT Flow](./docs/JWT-auth.png)

#### JWT Decorator (Backend)

```python
# backtube1/decorators.py
import jwt
from jwt import PyJWKClient

def require_supabase_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing token'}, status=401)
        
        token = auth_header.split(' ')[1]
        
        try:
            # Fetch public key from Supabase JWKS endpoint
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            # Verify and decode
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=['ES256'],
                audience='authenticated'
            )
            
            request.user_payload = payload
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper
```

#### User Sync (Backend)

```python
# backtube1/views.py
@api_view(['POST'])
@require_supabase_auth
def sync_user(request):
    data = request.data
    user, created = User.objects.update_or_create(
        sub=data['sub'],
        defaults={
            'username': data['email'],
            'email': data['email'],
            'first_name': data.get('full_name', ''),
            'picture': data.get('picture', ''),
            'email_verified': data.get('email_verified', False),
            'access_token': data.get('google_access_token', ''),
        }
    )
    return Response({
        'id': user.id,
        'created': created,
        'is_analyzed': user.is_analyzed
    })
```

---

## YouTube Integration

### Flow

1. User logs in with Google (YouTube scope requested)
2. Google access token saved to User model
3. On first login (`is_analyzed=False`), `/api/fetch-videos/` auto-fetches 30 videos
4. Old videos deleted, new ones created fresh
5. `is_analyzed` set to `True` after first fetch
6. `/api/fetch-comments/` fetches top 100 comments per video (public API, no auth token needed)
7. VADER sentiment analysis runs on each comment during save
8. Before reanalysis: current sentiment state saved to `AnalysisSnapshot`
9. Re-analyze button triggers manual refresh of videos and comments

### YouTube API Endpoints Used

| Endpoint | Purpose | Quota Cost |
|----------|---------|------------|
| `channels().list(mine=True)` | Get user's channel ID | 1 unit |
| `playlistItems().list()` | Get video IDs from uploads playlist | 1 unit |
| `videos().list()` | Get video details (title, stats) | 1 unit |
| `commentThreads().list()` | Get top-level comments per video | 1 unit |

**Total per fetch:** ~32-33 units for 30 videos (10,000 daily limit)

### YouTube Service (Backend)

```python
# backtube1/services.py
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def get_youtube_service(access_token=None):
    """Create YouTube API client"""
    if access_token:
        # For authenticated requests (user's own data)
        credentials = Credentials(token=access_token)
        return build('youtube', 'v3', credentials=credentials)
    else:
        # For public data (API key only)
        return build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)

def get_channel_id(youtube):
    """Get the authenticated user's YouTube channel ID"""
    request = youtube.channels().list(part='id', mine=True)
    response = request.execute()
    
    if 'items' in response and len(response['items']) > 0:
        return response['items'][0]['id']
    return None

def get_uploads_playlist_id(channel_id):
    """Convert channel ID to uploads playlist ID (UC... → UU...)"""
    if channel_id.startswith('UC'):
        return 'UU' + channel_id[2:]
    return None

def get_channel_videos(access_token, max_results=30):
    """Fetch user's latest videos from their uploads playlist"""
    youtube = get_youtube_service(access_token)
    
    channel_id = get_channel_id(youtube)
    playlist_id = get_uploads_playlist_id(channel_id)
    
    # Get video IDs from playlist
    request = youtube.playlistItems().list(
        part='contentDetails',
        playlistId=playlist_id,
        maxResults=max_results
    )
    response = request.execute()
    video_ids = [item['contentDetails']['videoId'] for item in response['items']]
    
    # Get video details
    request = youtube.videos().list(
        part='snippet,statistics',
        id=','.join(video_ids)
    )
    response = request.execute()
    
    # Return formatted video data
    return [{
        'youtube_video_id': item['id'],
        'title': item['snippet']['title'],
        'views': int(item['statistics'].get('viewCount', 0)),
        # ... other fields
    } for item in response['items']]

def get_video_comments(video_id, max_results=100):
    """Fetch top-level comments for a video using public API"""
    youtube = get_youtube_service()

    try:
        request = youtube.commentThreads().list(
            part='snippet',
            videoId=video_id,
            maxResults=max_results,
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
```

### Sentiment Analysis Service (Backend)

```python
# backtube1/services.py
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def analyze_comment_sentiment(text):
    """Run VADER sentiment on comment text, return (score, label)"""
    score = analyzer.polarity_scores(text)['compound']

    if score >= 0.05:
        label = 'positive'
    elif score <= -0.05:
        label = 'negative'
    else:
        label = 'neutral'

    return score, label
```

### Fetch Videos View (Backend)

```python
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
```

### Fetch Comments View (Backend)

```python
@api_view(['POST'])
@require_supabase_auth
def fetch_comments(request):
    try:
        user = User.objects.get(email=request.user_payload['email'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    videos = Video.objects.filter(user=user)
    total_comments = 0

    # Save snapshot of current state before re-fetching
    save_analysis_snapshot(user)

    for video in videos:
        com_data = get_video_comments(video.youtube_video_id)
        Comment.objects.filter(video=video).delete()

        for comment in com_data:
            score, label = analyze_comment_sentiment(comment['text'])
            Comment.objects.create(
                video=video,
                youtube_comment_id=comment['youtube_comment_id'],
                text=comment['text'],
                author=comment['author'],
                published_at=comment['published_at'],
                sentiment_score=score,
                sentiment_label=label,
            )
        total_comments += len(com_data)

    return Response({
        'message': f'Fetched {total_comments} comments across {videos.count()} videos',
    })
```

### Analysis Snapshot Helper (Backend)

```python
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
```

### Get Videos View (Backend)

```python
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

    return Response({
        'user': UserSerializer(user).data,
        'videos': VideoSerializer(videos, many=True).data,
        'count': videos.count(),
        'sentiment': sentiment,
    })
```

### Get Comments View (Backend)

```python
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
```

### topic Clustering View (Backend)

```python
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

        for video in videos:
            video.cluster = cluster
            video.save()
```
### Retrieving Clusters View (Backend)

```python
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

```

---

## Project Structure

```
urtube/
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── backtube1/
│   │   ├── models.py        # User, Video, Comment, AnalysisSnapshot models
│   │   ├── views.py         # API views (sync, fetch videos/comments, analytics)
│   │   ├── services.py      # YouTube API + VADER sentiment analysis
│   │   ├── serializers.py   # DRF serializers
│   │   ├── decorators.py    # JWT auth decorator
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Home page
│   │   ├── dashboard/
│   │   │   └── page.tsx     # User dashboard with video list
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── route.ts # OAuth callback handler
│   │       └── auth-code-error/
│   │           └── page.tsx # Auth error page
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── proxy.ts
│   ├── proxy.ts
│   ├── next.config.js
│   ├── package.json
│   └── .env.local
│
├── docs/
│   ├── auth.png
│   ├── database-schema.png
│   ├── google-auth-seq.jpg
│   └── JWT-auth.png
│
└── README.md
```

---