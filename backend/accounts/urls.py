from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import UserViewSet, LoginView

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]