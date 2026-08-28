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

        # معلم فقط کلاس‌های ترم فعال خودش رو می‌بینه
        if user.role == 'teacher':
            qs = qs.filter(teacher=user, term__is_active=True)

        # دانش‌آموز فقط کلاس‌های ترم فعال که توشون ثبت‌نامه رو می‌بینه
        elif user.role == 'student':
            qs = qs.filter(enrollments__student=user, term__is_active=True)

        return qs.distinct()


from django.utils import timezone


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsAdminOrSecretary()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.all().select_related('student', 'classroom', 'classroom__term')

        if user.role == 'teacher':
            qs = qs.filter(classroom__teacher=user, classroom__term__is_active=True)
        elif user.role == 'student':
            qs = qs.filter(student=user, classroom__term__is_active=True)

        return qs

    def perform_create(self, serializer):
        is_paid = serializer.validated_data.get('is_paid', False)
        paid_at = serializer.validated_data.get('paid_at', None)
        if is_paid and not paid_at:
            paid_at = timezone.now()
        serializer.save(is_paid=is_paid, paid_at=paid_at)

    def perform_update(self, serializer):
        instance = serializer.instance
        is_paid = serializer.validated_data.get('is_paid', instance.is_paid)
        paid_at = serializer.validated_data.get('paid_at', instance.paid_at)
        if is_paid and not paid_at:
            paid_at = timezone.now()
        elif not is_paid:
            paid_at = None
        serializer.save(is_paid=is_paid, paid_at=paid_at)