from django.db import models
from django.conf import settings
from classes.models import ClassRoom


class Session(models.Model):
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('classroom', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.classroom.name} - {self.date}"


class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'present', 'حاضر'
        ABSENT = 'absent', 'غایب'
        LATE = 'late', 'تاخیر'
        EXCUSED = 'excused', 'غیبت موجه'

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        limit_choices_to={'role': 'student'},
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.session.date} - {self.get_status_display()}"