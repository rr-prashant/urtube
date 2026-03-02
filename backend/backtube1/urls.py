from django.urls import path, include
from .views import ItemView

urlpatterns = [
    path('items/', ItemView)

]
