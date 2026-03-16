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
- Re-analyze button for manual refresh
- Automatic cleanup of videos beyond 30

### Creator Dashboard
- Display user profile info
- List all fetched videos with thumbnails
- View counts, likes, and comments for each video
- Re-analyze channel button

### Sentiment Analysis
- *Coming soon*

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
    description = models.TextField(null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    published_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']
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
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Snapshot for {self.user.email} at {self.created_at}"
```

### Comment Model

```python
class Comment(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    sentiment_score = models.FloatField()
    sentiment_label = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
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
| POST | `/api/fetch-videos/` | JWT | Fetch and store user's 30 latest YouTube videos |
| GET | `/api/get-videos/` | JWT | Get user's stored videos and profile |

### Analytics Endpoints
*Coming soon*

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
4. Videos stored in database, older than 30 deleted
5. `is_analyzed` set to `True` after first fetch
6. Re-analyze button triggers manual refresh (bypasses `is_analyzed` check)

### YouTube API Endpoints Used

| Endpoint | Purpose | Quota Cost |
|----------|---------|------------|
| `channels().list(mine=True)` | Get user's channel ID | 1 unit |
| `playlistItems().list()` | Get video IDs from uploads playlist | 1 unit |
| `videos().list()` | Get video details (title, stats) | 1 unit |

**Total per fetch:** ~2-3 units (10,000 daily limit)

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
    
    return Response({
        'user': UserSerializer(user).data,
        'videos': VideoSerializer(videos, many=True).data,
        'count': videos.count(),
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
│   │   ├── models.py        # User, Video models
│   │   ├── views.py         # API views
│   │   ├── services.py      # YouTube API integration
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