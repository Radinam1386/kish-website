from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Exam, Question, ExamSubmission, Answer
from .serializers import (
    ExamSerializer, QuestionSerializer, QuestionStudentSerializer,
    ExamStudentSerializer, ExamSubmissionSerializer, AnswerSerializer,
    AnswerStudentSerializer,
)


class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer

    def get_serializer_class(self):
        # دانش‌آموز حتی از لیست/جزئیات معمولی هم نباید جواب درست رو ببینه
        if self.request.user.role == 'student' and self.action in ('list', 'retrieve'):
            return ExamStudentSerializer
        return ExamSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Exam.objects.all()

        if user.role == 'teacher':
            qs = qs.filter(classroom__teacher=user)
        elif user.role == 'student':
            qs = qs.filter(classroom__enrollments__student=user)

        return qs.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        classroom = serializer.validated_data['classroom']
        if user.role == 'teacher' and classroom.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("شما فقط می‌توانید برای کلاس خودتان امتحان بسازید.")
        if user.role == 'student':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("دانش‌آموز اجازه ساخت امتحان ندارد.")
        serializer.save()

    @action(detail=True, methods=['get'])
    def student_view(self, request, pk=None):
        exam = self.get_object()
        questions = exam.questions.all()
        serializer = QuestionStudentSerializer(questions, many=True)
        return Response({
            'exam': {'id': exam.id, 'title': exam.title, 'date': exam.date},
            'questions': serializer.data,
        })


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Question.objects.all()
        if user.role == 'teacher':
            qs = qs.filter(exam__classroom__teacher=user)
        return qs


class ExamSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ExamSubmission.objects.all()

        if user.role == 'teacher':
            qs = qs.filter(exam__classroom__teacher=user)
        elif user.role == 'student':
            qs = qs.filter(student=user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # دانش‌آموز فقط برای خودش می‌تونه submission بسازه
        if user.role == 'student':
            serializer.save(student=user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """بعد از اینکه معلم نمره‌ی سوالات تشریحی رو دستی وارد کرد، این endpoint نمره‌ی کل رو حساب می‌کنه"""
        submission = self.get_object()
        if request.user.role not in ('teacher', 'admin', 'secretary'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("شما اجازه‌ی نمره‌دهی ندارید.")
        total = submission.calculate_score()
        return Response({'total_score': total, 'is_graded': submission.is_graded})


class AnswerViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role == 'student':
            return AnswerStudentSerializer
        return AnswerSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Answer.objects.all()

        if user.role == 'teacher':
            qs = qs.filter(submission__exam__classroom__teacher=user)
        elif user.role == 'student':
            qs = qs.filter(submission__student=user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        submission = serializer.validated_data['submission']
        # دانش‌آموز فقط می‌تونه برای submission خودش جواب ثبت کنه
        if user.role == 'student' and submission.student != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("شما فقط می‌توانید برای امتحان خودتان پاسخ ثبت کنید.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        # دانش‌آموز فقط می‌تونه جواب خودش رو ویرایش کنه (تا قبل تصحیح نهایی)
        if user.role == 'student':
            if instance.submission.student != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("شما فقط می‌توانید پاسخ خودتان را ویرایش کنید.")
            if instance.submission.is_graded:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("این امتحان قبلاً تصحیح شده و قابل ویرایش نیست.")
        serializer.save()
