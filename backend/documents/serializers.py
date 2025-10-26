from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Document, EditableField, 
    DocumentAssignment, FieldValue, DocumentVersion
)


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='userprofile.role', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'role', 'created_at']


class EditableFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditableField
        fields = [
            'id', 'field_id', 'label', 'placeholder', 'field_type',
            'position_start', 'position_end', 'original_value', 'created_at'
        ]


class DocumentSerializer(serializers.ModelSerializer):
    editable_fields = EditableFieldSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'name', 'file', 'original_content', 'created_by', 
            'created_by_username', 'created_at', 'updated_at', 'status',
            'editable_fields', 'assigned_users_count'
        ]
        read_only_fields = ['created_by', 'original_content']
    
    def get_assigned_users_count(self, obj):
        return obj.assignments.count()


class FieldValueSerializer(serializers.ModelSerializer):
    field_label = serializers.CharField(source='field.label', read_only=True)
    field_type = serializers.CharField(source='field.field_type', read_only=True)
    
    class Meta:
        model = FieldValue
        fields = [
            'id', 'field', 'field_label', 'field_type', 'value', 
            'created_at', 'updated_at'
        ]


class DocumentAssignmentSerializer(serializers.ModelSerializer):
    document_name = serializers.CharField(source='document.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    field_values = FieldValueSerializer(many=True, read_only=True)
    editable_fields = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentAssignment
        fields = [
            'id', 'document', 'document_name', 'user', 'user_username',
            'status', 'assigned_at', 'started_at', 'completed_at',
            'field_values', 'editable_fields'
        ]
    
    def get_editable_fields(self, obj):
        fields = obj.document.editable_fields.all()
        return EditableFieldSerializer(fields, many=True).data


class DocumentVersionSerializer(serializers.ModelSerializer):
    assignment_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentVersion
        fields = [
            'id', 'assignment', 'assignment_info', 'content', 
            'generated_file', 'created_at'
        ]
    
    def get_assignment_info(self, obj):
        return {
            'document_name': obj.assignment.document.name,
            'user_username': obj.assignment.user.username,
            'status': obj.assignment.status
        }


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    name = serializers.CharField(max_length=255, required=False)
    
    def validate_file(self, value):
        if not value.name.endswith(('.doc', '.docx')):
            raise serializers.ValidationError("Tylko pliki Word (.doc, .docx) są dozwolone.")
        return value


class FieldCreationSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()
    field_id = serializers.CharField(max_length=100)
    label = serializers.CharField(max_length=255)
    placeholder = serializers.CharField(max_length=255, required=False)
    field_type = serializers.ChoiceField(choices=EditableField.FIELD_TYPES, default='text')
    original_value = serializers.CharField(required=False)
    position_start = serializers.IntegerField(default=0)
    position_end = serializers.IntegerField(default=0)


class AssignDocumentSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )


class SubmitFieldValuesSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    field_values = serializers.DictField(
        child=serializers.CharField(allow_blank=True)
    )
