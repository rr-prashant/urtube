from django.contrib import admin
from .models import User, Video, AnalysisSnapshot, Comments
# Register your models here.
admin.site.register(User)
admin.site.register(Video)
admin.site.register(AnalysisSnapshot)
admin.site.register(Comments)