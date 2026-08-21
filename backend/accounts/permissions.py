from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsSecretary(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'secretary'


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teacher'


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsAdminOrSecretary(BasePermission):
    """مدیر و منشی هر دو دسترسی کامل به مدیریت کاربران و کلاس‌ها دارن"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'secretary')