
from .models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view
from backtube1.serializers import UserSerializer

# Create your views here.
@api_view(["GET"])
def UserView(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(["POST"])
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
        }
    )
    return Response({'id': user.id, 'created': created})