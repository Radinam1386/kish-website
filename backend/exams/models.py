from django.db import models
from django.conf import settings
from classes.models import ClassRoom


class Exam(models.Model):
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='exams')
    title = models.CharField(max_length=200)
    date = models.DateField()
    duration_minutes = models.PositiveIntegerField(default=45, verbose_name="مدت زمان آزمون (دقیقه)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.classroom.name}"


class Question(models.Model):
    class QuestionType(models.TextChoices):
        MULTIPLE_CHOICE = 'multiple_choice', 'تستی'
        ESSAY = 'essay', 'تشریحی'

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QuestionType.choices)
    max_score = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def save(self, *args, **kwargs):
        if self._state.adding and not self.order:
            last_order = Question.objects.filter(exam=self.exam).count()
            self.order = last_order + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.exam.title} - Q{self.order}"
    

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text


class ExamSubmission(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_submissions',
        limit_choices_to={'role': 'student'},
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    def calculate_score(self):
        total = 0
        fully_graded = True

        for answer in self.answers.select_related('question', 'selected_choice'):
            if answer.question.question_type == 'multiple_choice':
                if answer.score is not None:
                    total += answer.score
                elif answer.selected_choice and answer.selected_choice.is_correct:
                    total += answer.question.max_score
            else:  # essay
                if answer.score is not None:
                    total += answer.score
                else:
                    fully_graded = False

        self.total_score = total
        self.is_graded = fully_graded
        self.save()
        return total


    total_score = models.FloatField(null=True, blank=True)  # بعد از تصحیح کامل محاسبه میشه
    is_graded = models.BooleanField(default=False)

    class Meta:
        unique_together = ('exam', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.exam.title}"


class Answer(models.Model):
    submission = models.ForeignKey(ExamSubmission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')

    # برای سوالات تستی
    selected_choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, null=True, blank=True)

    # برای سوالات تشریحی
    essay_text = models.TextField(blank=True)
    score = models.FloatField(null=True, blank=True)  # معلم دستی وارد می‌کنه

    class Meta:
        unique_together = ('submission', 'question')

    def __str__(self):
        return f"{self.submission.student.username} - {self.question}"