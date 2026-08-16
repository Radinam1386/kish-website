from django.contrib import admin
from .models import Exam, Question, Choice, ExamSubmission, Answer


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('title', 'classroom', 'date')
    list_filter = ('classroom',)
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('exam', 'question_type', 'max_score', 'order')
    list_filter = ('question_type', 'exam')
    inlines = [ChoiceInline]


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0


@admin.register(ExamSubmission)
class ExamSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'total_score', 'is_graded')
    list_filter = ('exam', 'is_graded')
    inlines = [AnswerInline]


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('submission', 'question', 'score')
    list_filter = ('question__question_type',)