
from django.contrib.auth.models import Group, User
from rest_framework.response import Response
from rest_framework.decorators import api_view
from backtube1.serializers import UserSerializer, GroupSerializer, ItemSerializer
from .models import Items

# Create your views here.
@api_view(["GET"])
def UserView(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(["GET"])
def GroupView(request):
    queryset = Group.objects.all()
    serializer = GroupSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(["GET"])
def ItemView(request):
    data = Items.objects.all()
    serializer = ItemSerializer(data, many=True)
    return Response(serializer.data)