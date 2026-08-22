from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import TermViewSet, ClassRoomViewSet, EnrollmentViewSet

router = DefaultRouter()
router.register('terms', TermViewSet, basename='term')
router.register('classrooms', ClassRoomViewSet, basename='classroom')
router.register('enrollments', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('', include(router.urls)),
]