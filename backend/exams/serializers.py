from rest_framework import serializers
from .models import Exam, Question, Choice, ExamSubmission, Answer
from accounts.serializers import UserSerializer


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text', 'is_correct')


class ChoiceStudentSerializer(serializers.ModelSerializer):
    """برای دانش‌آموز موقع دادن امتحان - جواب درست رو نشون نمی‌ده"""
    class Meta:
        model = Choice
        fields = ('id', 'text')


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ('id', 'exam', 'text', 'question_type', 'max_score', 'order', 'choices')

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        return question


class QuestionStudentSerializer(serializers.ModelSerializer):
    """نسخه‌ای که دانش‌آموز موقع امتحان دادن می‌بینه - بدون جواب درست"""
    choices = ChoiceStudentSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ('id', 'text', 'question_type', 'max_score', 'order', 'choices')

class ExamStudentSerializer(serializers.ModelSerializer):
    questions = QuestionStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = ('id', 'classroom', 'title', 'date', 'questions', 'created_at')

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = ('id', 'classroom', 'title', 'date', 'questions', 'created_at')


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'submission', 'question', 'selected_choice', 'essay_text', 'score')


class ExamSubmissionSerializer(serializers.ModelSerializer):
    student_detail = UserSerializer(source='student', read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = ExamSubmission
        fields = ('id', 'exam', 'student', 'student_detail', 'answers', 'total_score', 'is_graded', 'submitted_at')


class AnswerStudentSerializer(serializers.ModelSerializer):
    """برای دانش‌آموز - نمیتونه score رو دستکاری کنه"""
    class Meta:
        model = Answer
        fields = ('id', 'submission', 'question', 'selected_choice', 'essay_text')