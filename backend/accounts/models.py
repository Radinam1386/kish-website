from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'مدیر'
        SECRETARY = 'secretary', 'منشی'
        TEACHER = 'teacher', 'معلم'
        STUDENT = 'student', 'دانش‌آموز'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    plain_password = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        verbose_name="رمز عبور خام (جهت مشاهده مدیر و منشی)",
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
