from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ExamViewSet, QuestionViewSet, ExamSubmissionViewSet, AnswerViewSet

router = DefaultRouter()
router.register('exams', ExamViewSet, basename='exam')
router.register('questions', QuestionViewSet, basename='question')
router.register('submissions', ExamSubmissionViewSet, basename='submission')
router.register('answers', AnswerViewSet, basename='answer')

urlpatterns = [
    path('', include(router.urls)),
]