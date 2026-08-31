from rest_framework import serializers
from .models import Term, ClassRoom, Enrollment
from accounts.serializers import UserSerializer


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    student_detail = UserSerializer(source='student', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_tuition_fee = serializers.IntegerField(source='classroom.tuition_fee', read_only=True)
    term_id = serializers.IntegerField(source='classroom.term.id', read_only=True)
    term_name = serializers.CharField(source='classroom.term.name', read_only=True)
    is_term_active = serializers.BooleanField(source='classroom.term.is_active', read_only=True)

    class Meta:
        model = Enrollment
        fields = (
            'id',
            'student',
            'student_detail',
            'classroom',
            'classroom_name',
            'classroom_tuition_fee',
            'term_id',
            'term_name',
            'is_term_active',
            'is_paid',
            'paid_at',
            'payment_notes',
            'enrolled_at',
        )


class ClassRoomSerializer(serializers.ModelSerializer):
    teacher_detail = UserSerializer(source='teacher', read_only=True)
    term_detail = TermSerializer(source='term', read_only=True)
    enrollments = EnrollmentSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassRoom
        fields = (
            'id',
            'name',
            'term',
            'term_detail',
            'teacher',
            'teacher_detail',
            'tuition_fee',
            'schedule',
            'time_slot',
            'enrollments',
            'student_count',
            'created_at',
        )

    def get_student_count(self, obj):
        return obj.enrollments.count()