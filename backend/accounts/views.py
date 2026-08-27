from rest_framework import viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer, CreateUserSerializer
from .permissions import IsAdminOrSecretary, IsAdmin


class LoginView(ObtainAuthToken):
    """
    لاگین با username/password، برمی‌گردونه token + اطلاعات کاربر
    فرانت این token رو ذخیره می‌کنه و توی هر request بعدی می‌فرسته
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        return UserSerializer

    def get_permissions(self):
        # مدیر و منشی می‌تونن کاربر بسازن/ویرایش/حذف کنن
        # ولی خواندن لیست/اطلاعات برای همه کاربران لاگین‌شده مجازه
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdminOrSecretary()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all()
        if user.role == 'secretary':
            qs = qs.exclude(role__in=['admin', 'secretary'])
        return qs

    def perform_destroy(self, instance):
        if instance.role in ('admin', 'secretary') and self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("فقط مدیر می‌تواند منشی یا مدیر دیگری را حذف کند.")
        instance.delete()