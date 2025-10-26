from django.contrib import admin
from .models import (
    UserProfile, Document, EditableField, 
    DocumentAssignment, FieldValue, DocumentVersion
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username', 'user__email']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'created_by__username']
    readonly_fields = ['original_content', 'created_at', 'updated_at']


@admin.register(EditableField)
class EditableFieldAdmin(admin.ModelAdmin):
    list_display = ['document', 'label', 'field_type', 'created_at']
    list_filter = ['field_type', 'created_at']
    search_fields = ['label', 'document__name']


@admin.register(DocumentAssignment)
class DocumentAssignmentAdmin(admin.ModelAdmin):
    list_display = ['document', 'user', 'status', 'assigned_at', 'completed_at']
    list_filter = ['status', 'assigned_at', 'completed_at']
    search_fields = ['document__name', 'user__username']


@admin.register(FieldValue)
class FieldValueAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'field', 'value', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['assignment__document__name', 'field__label', 'value']


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['content', 'created_at']
