from rest_framework import serializers
from .models import Term, ClassRoom, Enrollment
from accounts.serializers import UserSerializer


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    student_detail = UserSerializer(source='student', read_only=True)

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'student_detail', 'classroom', 'enrolled_at')


class ClassRoomSerializer(serializers.ModelSerializer):
    teacher_detail = UserSerializer(source='teacher', read_only=True)
    enrollments = EnrollmentSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassRoom
        fields = ('id', 'name', 'term', 'teacher', 'teacher_detail', 'enrollments', 'student_count', 'created_at')

    def get_student_count(self, obj):
        return obj.enrollments.count()