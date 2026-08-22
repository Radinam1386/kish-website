from rest_framework import serializers
from .models import Session, AttendanceRecord
from accounts.serializers import UserSerializer


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_detail = UserSerializer(source='student', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ('id', 'session', 'student', 'student_detail', 'status', 'note')


class SessionSerializer(serializers.ModelSerializer):
    records = AttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ('id', 'classroom', 'date', 'records', 'created_at')