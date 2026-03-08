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
9. [Project Structure](#project-structure)
10. [Diagrams](#diagrams)

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
- *Coming soon*

### Sentiment Analysis
- *Coming soon*

### Video Clustering
- *Coming soon*

### Creator Dashboard
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
| **AI/ML** | OpenAI API, VADER Sentiment, scikit-learn |
| **Deployment** | Vercel (frontend), Railway (backend) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                      (Next.js + TypeScript)                      │
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐      │
│  │  Pages   │    │  Components  │    │  Supabase Client  │      │
│  │          │    │              │    │  (Browser Auth)   │      │
│  └──────────┘    └──────────────┘    └─────────┬─────────┘      │
└─────────────────────────────────────────────────┼────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────┐
                    │                             │                 │
                    ▼                             ▼                 │
┌─────────────────────────────┐    ┌─────────────────────────────┐ │
│       SUPABASE AUTH         │    │         DJANGO API          │ │
│                             │    │                             │ │
│  ┌───────────────────────┐  │    │  ┌───────────────────────┐  │ │
│  │   Google OAuth        │  │    │  │   JWT Verification    │  │ │
│  │   Session Management  │  │    │  │   (ES256 via JWKS)    │  │ │
│  │   JWT Token Issuing   │──┼────┼──▶   User Sync          │  │ │
│  └───────────────────────┘  │    │  │   API Endpoints       │  │ │
│                             │    │  └───────────────────────┘  │ │
│  ┌───────────────────────┐  │    │                             │ │
│  │   auth.users table    │  │    │  ┌───────────────────────┐  │ │
│  │   (auto-managed)      │  │    │  │   Custom User Model   │  │ │
│  └───────────────────────┘  │    │  │   Videos, Comments    │  │ │
└─────────────────────────────┘    │  └───────────────────────┘  │ │
                                   │              │               │ │
                                   └──────────────┼───────────────┘ │
                                                  │                 │
                                   ┌──────────────▼───────────────┐ │
                                   │    SUPABASE PostgreSQL       │ │
                                   │    (Django Tables)           │ │
                                   └──────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase account with project created
- Google Cloud Console project with OAuth credentials

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

### Video Model
*Coming soon*

### Comment Model
*Coming soon*

---

## API Endpoints

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sync-user/` | JWT | Create or update user from Supabase auth |

### YouTube Endpoints
*Coming soon*

### Analytics Endpoints
*Coming soon*

---

## Authentication

### Authentication Flow

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐     ┌────────┐
│  User  │     │ Next.js │     │ Supabase │     │ Google │     │ Django │
└───┬────┘     └────┬────┘     └────┬─────┘     └───┬────┘     └───┬────┘
    │               │               │               │               │
    │ Click Login   │               │               │               │
    │──────────────▶│               │               │               │
    │               │ signInWithOAuth               │               │
    │               │──────────────▶│               │               │
    │               │               │ Redirect      │               │
    │◀──────────────┼───────────────┼──────────────▶│               │
    │               │               │               │               │
    │ Login to Google               │               │               │
    │──────────────────────────────────────────────▶│               │
    │               │               │               │               │
    │               │               │◀──────────────│               │
    │               │               │ Auth Code     │               │
    │◀──────────────┼───────────────│               │               │
    │ Redirect to /auth/callback    │               │               │
    │               │               │               │               │
    │               │ exchangeCodeForSession        │               │
    │               │──────────────▶│               │               │
    │               │◀──────────────│               │               │
    │               │ JWT Token + User Data         │               │
    │               │               │               │               │
    │               │ POST /api/sync-user/ + JWT    │               │
    │               │──────────────────────────────────────────────▶│
    │               │               │               │               │
    │               │               │               │    Verify JWT │
    │               │               │◀─────────────────────────────┤│
    │               │               │ Fetch JWKS    │               │
    │               │               │──────────────▶│               │
    │               │               │               │               │
    │               │               │               │ Create/Update │
    │               │               │               │     User      │
    │               │◀──────────────────────────────────────────────│
    │               │ Success       │               │               │
    │◀──────────────│               │               │               │
    │ Redirect Home │               │               │               │
```

### OAuth Initiation (Frontend)

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
})
```

### OAuth Callback (Frontend)

```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Sync user to Django with JWT
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync-user/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          sub: user.user_metadata.sub,
          email: user.email,
          full_name: user.user_metadata.full_name,
          picture: user.user_metadata.picture,
          email_verified: user.user_metadata.email_verified,
        })
      })
      
      return NextResponse.redirect(`${origin}/`)
    }
  }
  
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
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
            'first_name': data['full_name'],
            'picture': data['picture'],
            'email_verified': data['email_verified'],
        }
    )
    return Response({'id': user.id, 'created': created})
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
│   ├── backtube1/           # django app

│   │   ├── models.py        # User model
│   │   ├── views.py         # API views
│   │   ├── serializers.py   # DRF serializers
│   │   ├── decorators.py    # JWT auth decorator
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── proxy.ts
│   ├── proxy.ts
│   ├── package.json
│   └── .env.local
│
└── README.md
```

---