import jwt
from jwt import PyJWKClient
from functools import wraps
from django.http import JsonResponse
from django.conf import settings

def require_supabase_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Step 1: Check for Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Missing or invalid Authorization header'}, 
                status=401
            )
        
        # Step 2: Extract the token
        token = auth_header.split(' ')[1]
        
        try:
            # Step 3: Fetch public key from Supabase JWKS endpoint
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            # Step 4: Verify and decode the token
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=['ES256'],
                audience='authenticated'
            )
            
            # Step 5: Attach payload to request for use in view
            request.user_payload = payload
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError as e:
            return JsonResponse({'error': f'Invalid token: {str(e)}'}, status=401)
        except Exception as e:
            return JsonResponse({'error': f'Auth error: {str(e)}'}, status=401)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper