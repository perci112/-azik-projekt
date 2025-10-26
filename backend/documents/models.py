from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
import json


class UserProfile(models.Model):
    """Rozszerzenie standardowego modelu User o dodatkowe informacje"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=10,
        choices=[('admin', 'Administrator'), ('user', 'Użytkownik')],
        default='user'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Document(models.Model):
    """Model dokumentu Word przesłanego przez administratora"""
    name = models.CharField(max_length=255)
    file = models.FileField(
        upload_to='documents/',
        validators=[FileExtensionValidator(allowed_extensions=['docx', 'doc'])]
    )
    original_content = models.TextField(blank=True)  # Zawartość HTML z mammoth
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_documents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    STATUS_CHOICES = [
        ('draft', 'Szkic'),
        ('sent', 'Wysłany'),
        ('completed', 'Ukończony'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    
    def __str__(self):
        return self.name


class EditableField(models.Model):
    """Model pola do edycji w dokumencie"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='editable_fields')
    field_id = models.CharField(max_length=100)  # Unikalny ID pola w dokumencie
    label = models.CharField(max_length=255)
    placeholder = models.CharField(max_length=255, blank=True)
    
    FIELD_TYPES = [
        ('text', 'Tekst'),
        ('email', 'Email'),
        ('number', 'Liczba'),
        ('date', 'Data'),
    ]
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES, default='text')
    
    # Pozycja w dokumencie (dla przyszłej implementacji)
    position_start = models.IntegerField(default=0)
    position_end = models.IntegerField(default=0)
    
    # Oryginalna wartość z dokumentu
    original_value = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['document', 'field_id']
    
    def __str__(self):
        return f"{self.document.name} - {self.label}"


class DocumentAssignment(models.Model):
    """Model przypisania dokumentu do użytkownika"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='assignments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_assignments')
    
    STATUS_CHOICES = [
        ('pending', 'Oczekuje'),
        ('in_progress', 'W trakcie'),
        ('completed', 'Ukończone'),
    ]
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['document', 'user']
    
    def __str__(self):
        return f"{self.document.name} -> {self.user.username}"


class FieldValue(models.Model):
    """Model wartości wypełnionej przez użytkownika"""
    assignment = models.ForeignKey(DocumentAssignment, on_delete=models.CASCADE, related_name='field_values')
    field = models.ForeignKey(EditableField, on_delete=models.CASCADE)
    value = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['assignment', 'field']
    
    def __str__(self):
        return f"{self.assignment} - {self.field.label}: {self.value[:50]}"


class DocumentVersion(models.Model):
    """Model wersji dokumentu z wypełnionymi polami"""
    assignment = models.ForeignKey(DocumentAssignment, on_delete=models.CASCADE, related_name='versions')
    content = models.TextField()  # HTML z wypełnionymi polami
    generated_file = models.FileField(upload_to='generated/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Wersja {self.assignment} - {self.created_at}"
