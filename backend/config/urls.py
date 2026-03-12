
from django.contrib import admin
from django.urls import include, path
from backtube1 import views


urlpatterns = [
    path("api/", include('backtube1.urls')),
    path('admin/', admin.site.urls),
]
