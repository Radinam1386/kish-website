from django.db import models
from django.conf import settings


class Term(models.Model):
    name = models.CharField(max_length=100)  # مثلا "پاییز 1404"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if self.is_active:
            # اگر این ترم فعال شود، بقیه ترم‌ها غیرفعال شوند
            Term.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ClassRoom(models.Model):
    name = models.CharField(max_length=100)  # مثلا "Intermediate 2 - شنبه دوشنبه"
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='classes')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='classes_taught',
        limit_choices_to={'role': 'teacher'},
    )
    tuition_fee = models.PositiveIntegerField(default=2500000, verbose_name="شهریه کلاس (تومان)")
    schedule = models.CharField(max_length=150, blank=True, null=True, default="روزهای زوج (شنبه، دوشنبه، چهارشنبه)", verbose_name="برنامه و روزهای برگزاری")
    time_slot = models.CharField(max_length=100, blank=True, null=True, default="۱۶:۰۰ الی ۱۷:۳۰", verbose_name="ساعت برگزاری")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.term.name})"


class Enrollment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
    )
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='enrollments')
    is_paid = models.BooleanField(default=False, verbose_name="وضعیت پرداخت شهریه")
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ و زمان پرداخت")
    payment_notes = models.CharField(max_length=255, blank=True, verbose_name="توضیحات و یادداشت پرداخت")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'classroom')

    def __str__(self):
        return f"{self.student.username} → {self.classroom.name}"
