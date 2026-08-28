from rest_framework import viewsets, permissions
from .models import Session, AttendanceRecord
from .serializers import SessionSerializer, AttendanceRecordSerializer
from accounts.permissions import IsAdminOrSecretary


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer

    def get_permissions(self):
        # معلم هم باید بتونه جلسه بسازه و حضور غیاب بزنه، نه فقط ادمین/منشی
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Session.objects.all()

        if user.role == 'teacher':
            qs = qs.filter(classroom__teacher=user, classroom__term__is_active=True)
        elif user.role == 'student':
            qs = qs.filter(classroom__enrollments__student=user, classroom__term__is_active=True)

        return qs.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        classroom = serializer.validated_data['classroom']
        # معلم فقط می‌تونه برای کلاس خودش جلسه بسازه
        if user.role == 'teacher' and classroom.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("شما فقط می‌توانید برای کلاس خودتان جلسه بسازید.")
        serializer.save()


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.all()

        if user.role == 'teacher':
            qs = qs.filter(session__classroom__teacher=user, session__classroom__term__is_active=True)
        elif user.role == 'student':
            qs = qs.filter(student=user, session__classroom__term__is_active=True)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        session = serializer.validated_data['session']
        if user.role == 'teacher' and session.classroom.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("شما فقط می‌توانید برای کلاس خودتان حضور و غیاب ثبت کنید.")
        if user.role == 'student':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("دانش‌آموز اجازه ثبت حضور و غیاب ندارد.")
        serializer.save()