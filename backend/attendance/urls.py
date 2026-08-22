from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SessionViewSet, AttendanceRecordViewSet

router = DefaultRouter()
router.register('sessions', SessionViewSet, basename='session')
router.register('records', AttendanceRecordViewSet, basename='attendance-record')

urlpatterns = [
    path('', include(router.urls)),
]