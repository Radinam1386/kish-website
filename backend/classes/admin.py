from django.contrib import admin
from .models import Term, ClassRoom, Enrollment


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active',)


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 1


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'term', 'teacher', 'created_at')
    list_filter = ('term', 'teacher')
    inlines = [EnrollmentInline]


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'classroom', 'enrolled_at')
    list_filter = ('classroom',)