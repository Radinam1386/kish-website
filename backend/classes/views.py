from rest_framework import viewsets, permissions
from .models import Term, ClassRoom, Enrollment
from .serializers import TermSerializer, ClassRoomSerializer, EnrollmentSerializer
from accounts.permissions import IsAdminOrSecretary


class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all()
    serializer_class = TermSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsAdminOrSecretary()]
        return [permissions.IsAuthenticated()]


class ClassRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassRoomSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsAdminOrSecretary()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = ClassRoom.objects.all()

        # معلم فقط کلاس‌های خودش رو می‌بینه
        if user.role == 'teacher':
            qs = qs.filter(teacher=user)

        # دانش‌آموز فقط کلاس‌هایی که توشون ثبت‌نامه رو می‌بینه
        elif user.role == 'student':
            qs = qs.filter(enrollments__student=user)

        return qs.distinct()


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsAdminOrSecretary()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.all()

        if user.role == 'teacher':
            qs = qs.filter(classroom__teacher=user)
        elif user.role == 'student':
            qs = qs.filter(student=user)

        return qs