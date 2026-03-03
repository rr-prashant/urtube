
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view
from backtube1.serializers import UserSerializer

# Create your views here.
@api_view(["GET"])
def UserView(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


# @api_view(["GET"])
# def ItemView(request):
#     data = Items.objects.all()
#     serializer = ItemSerializer(data, many=True)
#     return Response(serializer.data)