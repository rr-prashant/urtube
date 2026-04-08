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
10. [Services](#services)
11. [Views](#views)
12. [Project Structure](#project-structure)

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
- Overall sentiment summary (% positive/neutral/negative, avg score)
- Re-analyze channel button (refreshes videos, comments, embeddings, clusters)

### Sentiment Analysis
- VADER sentiment analysis on top-level YouTube comments
- Per-comment scoring (compound score: -1 to +1) and labeling (positive/neutral/negative)
- Thresholds: ≥ 0.05 = positive, ≤ -0.05 = negative, between = neutral
- Analysis runs automatically during comment fetch
- Snapshot saved before each reanalysis for before/after comparison

### Video Clustering
- OpenAI `text-embedding-3-small` generates 1536-dimension embeddings for each video title
- Embeddings stored in pgvector field on Video model
- K-means clustering (scikit-learn) groups videos by topic similarity
- Silhouette score automatically selects optimal K (range: 2 to min(6, n-1))
- Clusters store avg views and avg engagement for topic performance comparison
- Clusters used behind-the-scenes for AI recommendations (not shown directly in UI)
- `cluster_name` intentionally null — pending GPT-based naming in future

### Public Research Mode
- Search any YouTube topic without login (no auth required)
- Fetches 50 videos via YouTube Search API
- Returns top 10 trending titles by views, engagement stats, and full video list
- 7-day database cache to avoid redundant API calls (same query reuses cached results)
- Cache key normalized to lowercase for consistency

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
- Supabase account with project created (pgvector extension enabled)
- Google Cloud Console project with OAuth credentials
- YouTube Data API v3 enabled
- OpenAI API key with credits ($5 minimum)

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

# OpenAI
OPENAI_API_KEY=your-openai-api-key
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

### TopicCluster Model

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

### ResearchCache Model

```python
class ResearchCache(models.Model):
    query = models.CharField(max_length=255, unique=True)
    results = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cache: {self.query}"
```

### Field Mapping (Google → Django)

| Django Field | Supabase Source |
|--------------|-----------------|
| `sub` | `user.user_metadata.sub` |
| `email` | `user.email` |
| `first_name` | `user.user_metadata.full_name` |
| `email_verified` | `user.user_metadata.email_verified` |
| `picture` | `user.user_metadata.picture` |
| `username` | `user.email` |
| `access_token` | `session.provider_token` |

---

## API Endpoints

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sync-user/` | JWT | Create or update user from Supabase auth |

### Video Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fetch-videos/` | JWT | Fetch user's 30 videos, generate embeddings, run clustering |
| GET | `/api/get-videos/` | JWT | Get user's videos, profile, and sentiment summary |

### Comment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fetch-comments/` | JWT | Fetch top 100 comments per video, run VADER sentiment, store in DB |
| GET | `/api/get-comments/<id>/` | JWT | Get comments with sentiment scores for a specific video |

### Cluster Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/get-clusters/` | JWT | Get topic clusters with nested videos |

### Public Research Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/research/` | None | Search YouTube topic, returns trending titles + engagement stats (7-day cache) |

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

**Creator Mode (Authenticated):**

1. User logs in with Google (YouTube scope requested)
2. Google access token saved to User model
3. On first login (`is_analyzed=False`), `/api/fetch-videos/` auto-fetches 30 videos
4. Old videos deleted, new ones created fresh (cascade deletes comments)
5. OpenAI embedding generated for each video title and stored in pgvector field
6. K-means clustering groups videos by topic, saves to TopicCluster table
7. `is_analyzed` set to `True` after first fetch
8. `/api/fetch-comments/` fetches top 100 comments per video (public API, no auth token needed)
9. VADER sentiment analysis runs on each comment during save
10. Before reanalysis: current sentiment state saved to `AnalysisSnapshot` (only if comments exist)
11. Re-analyze button triggers manual refresh of videos, comments, embeddings, and clusters

**Public Research Mode (No Auth):**

1. User submits a search query via `/api/research/`
2. Backend checks `ResearchCache` for a matching query under 7 days old
3. If cache hit → return cached results immediately (no API call)
4. If cache miss → call YouTube Search API for 50 videos, fetch full details
5. Calculate engagement stats (avg views, likes, engagement rate)
6. Sort top 10 trending titles by view count
7. Save full results to `ResearchCache` for future queries
8. Return results to frontend

### YouTube API Endpoints Used

| Endpoint | Purpose | Quota Cost |
|----------|---------|------------|
| `channels().list(mine=True)` | Get user's channel ID | 1 unit |
| `playlistItems().list()` | Get video IDs from uploads playlist | 1 unit |
| `videos().list()` | Get video details (title, stats) | 1 unit |
| `commentThreads().list()` | Get top-level comments per video | 1 unit |
| `search().list()` | Search public videos by query (public mode) | 100 units |

**Creator mode per fetch:** ~32-33 units for 30 videos (10,000 daily limit)
**Public mode per search:** ~101 units (search + video details), cached for 7 days

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

---

## Services

All service functions live in `backtube1/services.py`. They handle external API calls, AI processing, and data transformation — keeping views clean.

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

### Sentiment Stats Helper (Backend)

```python
def get_sentiment_stats(user):
    """Calculate overall sentiment breakdown for a user's comments"""
    videos = Video.objects.filter(user=user)
    comments = Comment.objects.filter(video__in=videos)
    total = comments.count()

    if total == 0:
        return None

    positive = comments.filter(sentiment_label='positive').count()
    neutral = comments.filter(sentiment_label='neutral').count()
    negative = comments.filter(sentiment_label='negative').count()
    avg = comments.aggregate(Avg('sentiment_score'))['sentiment_score__avg'] or 0.0

    return {
        'video_count': videos.count(),
        'total_comments': total,
        'avg_score': round(avg, 4),
        'positive_percent': round((positive / total) * 100, 2),
        'neutral_percent': round((neutral / total) * 100, 2),
        'negative_percent': round((negative / total) * 100, 2),
    }
```

### Embedding Generation Service (Backend)

```python
# backtube1/services.py
from openai import OpenAI

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_embedding(title):
    """Generate 1536-dimension embedding for a video title using OpenAI"""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=title
    )
    return response.data[0].embedding
```

### Video Clustering Service (Backend)

```python
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import numpy as np

def cluster_videos(user):
    """Run K-means on video title embeddings, auto-select optimal K via silhouette score"""
    videos = Video.objects.filter(user=user, title_embedding__isnull=False)

    if videos.count() < 3:
        return []

    embeddings = np.array([video.title_embedding for video in videos])

    best_k = 2
    best_score = -1
    max_k = min(6, videos.count() - 1)

    for k in range(2, max_k + 1):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(embeddings)
        score = silhouette_score(embeddings, labels)
        if score > best_score:
            best_score = score
            best_k = k

    kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)

    results = []
    for video, label in zip(videos, labels):
        results.append({
            'video': video,
            'cluster_label': int(label),
        })

    return results
```

### Public Video Search Service (Backend)

```python
def search_public_videos(query, max_results=50):
    """Search YouTube for public videos by query, return full details"""
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
```

---

## Views

All views live in `backtube1/views.py`. Authenticated endpoints use the `@require_supabase_auth` decorator. Helper functions like `save_analysis_snapshot` and `save_cluster` are called from within views but don't have decorators themselves.

### Fetch Videos View (Backend)

The main data pipeline for creator mode. Triggered on first login and manual re-analyze. Snapshots existing sentiment data before wiping, deletes all old videos (which cascades to comments), fetches 30 fresh videos from YouTube, generates an OpenAI embedding for each title, and runs K-means clustering to group them by topic.

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

Loops through all of a user's stored videos, fetches the top 100 top-level comments for each from YouTube's public API, and runs VADER sentiment analysis on every comment before saving. Uses delete-then-create pattern per video — old comments are wiped before new ones are stored.

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

Called inside `fetch_videos` before deleting old data. Captures the current sentiment breakdown (% positive/neutral/negative, avg score, top video) so it can be compared after reanalysis. Only fires when comments already exist — skipped on first analysis since there's no "before" state to capture.

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

The dashboard's main data source. Returns the user's profile, all stored videos sorted by publish date, and an overall sentiment summary calculated from all comments via the `get_sentiment_stats` helper. If no comments exist yet, returns zeroed-out sentiment stats.

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

Returns all comments for a specific video with their individual sentiment scores and labels. Used when a user clicks into a video's detail view to see the full comment breakdown. Takes the video's database ID as a URL parameter.

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

### Topic Clustering Helper (Backend)

Called at the end of `fetch_videos` after all embeddings are generated. Runs `cluster_videos()` to get K-means assignments, clears old cluster data, groups videos by label, calculates per-cluster avg views and engagement rate, creates TopicCluster rows, and assigns each video its cluster FK.

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

Returns all topic clusters for the authenticated user with their nested videos. Uses `TopicClusterSerializer` with a nested `VideoSerializer` so each cluster includes its full list of assigned videos. Currently used behind-the-scenes — will power AI recommendations in a future phase.

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

### Public Research View (Backend)

The only unauthenticated endpoint. Takes a search query, checks the 7-day cache first — if a matching entry exists and is fresh, returns cached results immediately without hitting the YouTube API. Otherwise fetches 50 videos via YouTube Search, calculates engagement stats (avg views, likes, engagement rate), sorts the top 10 trending titles by view count, caches the full result set, and returns everything to the frontend.

```python
@api_view(['POST'])
def public_research(request):
    """Public endpoint — no auth required. Results cached for 7 days."""
    query = request.data.get('query', '')
    if not query:
        return Response({'error': 'Query is required'}, status=400)

    # Check cache first
    cache = ResearchCache.objects.filter(query=query.lower()).first()
    if cache and cache.created_at > timezone.now() - timedelta(days=7):
        return Response(cache.results)

    # No cache or expired — fetch fresh
    videos = search_public_videos(query)
    if not videos:
        return Response({'error': 'No videos found'}, status=404)

    top_10 = sorted(videos, key=lambda v: v['views'], reverse=True)[:10]

    total = len(videos)
    total_views = sum(v['views'] for v in videos)
    total_likes = sum(v['likes'] for v in videos)
    total_comments = sum(v['comments_count'] for v in videos)

    avg_views = total_views / total
    avg_likes = total_likes / total
    avg_engagement = (total_likes / total_views * 100) if total_views > 0 else 0

    results = {
        'query': query,
        'total_videos': total,
        'videos': videos,
        'trending_titles': [
            {
                'title': v['title'],
                'views': v['views'],
                'likes': v['likes'],
                'comments_count': v['comments_count'],
            } for v in top_10
        ],
        'engagement': {
            'avg_views': round(avg_views),
            'avg_likes': round(avg_likes),
            'avg_engagement_percent': round(avg_engagement, 2),
            'total_comments': total_comments,
        },
    }

    # Save to cache
    ResearchCache.objects.filter(query=query.lower()).delete()
    ResearchCache.objects.create(query=query.lower(), results=results)

    return Response(results)
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
│   │   ├── models.py        # User, Video, Comment, AnalysisSnapshot, TopicCluster, ResearchCache
│   │   ├── views.py         # API views (sync, fetch, analytics, public research)
│   │   ├── services.py      # YouTube API, VADER sentiment, OpenAI embeddings, K-means clustering
│   │   ├── serializers.py   # DRF serializers (User, Video, Comment, TopicCluster)
│   │   ├── decorators.py    # JWT auth decorator
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Home page (login/logout)
│   │   ├── dashboard/
│   │   │   └── page.tsx     # Creator dashboard (videos, sentiment, re-analyze)
│   │   ├── publicmode/
│   │   │   └── page.tsx     # Public research page (search bar, results)
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