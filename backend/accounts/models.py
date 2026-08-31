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
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="شماره تماس")
    national_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="کد ملی")
    birth_date = models.CharField(max_length=50, blank=True, null=True, verbose_name="تاریخ تولد")
    address = models.TextField(blank=True, null=True, verbose_name="آدرس محل سکونت")
    level = models.CharField(max_length=100, blank=True, null=True, verbose_name="سطح آموزشی / مدرک / تخصص")
    plain_password = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        verbose_name="رمز عبور خام (جهت مشاهده مدیر و منشی)",
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
