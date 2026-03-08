import jwt
from jwt import PyJWKClient
from functools import wraps
from django.http import JsonResponse
from django.conf import settings

def require_supabase_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):

        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Missing or invalid Authorization header'}, 
                status=401
            )

        token = auth_header.split(' ')[1]
        
        try:
         
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json" # getting public key
            jwks_client = PyJWKClient(jwks_url) # PyJWKClient to fetch/parse the public key to make it usable for jwt.decode
            signing_key = jwks_client.get_signing_key_from_jwt(token) # get the signing key from the token's header (kid) and the JWKS endpoint
            
            # get the payload from matching the details with the public key
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=['ES256'],
                audience='authenticated'
            )
            
            # after successful authentication, user palyload is attached to the request object for use in the view
            request.user_payload = payload
            
        # checks for exceptions
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError as e:
            return JsonResponse({'error': f'Invalid token: {str(e)}'}, status=401)
        except Exception as e:
            return JsonResponse({'error': f'Auth error: {str(e)}'}, status=401)
        
        # If authentication is successful, proceed to the original view function
        return view_func(request, *args, **kwargs)
    
    return wrapper

