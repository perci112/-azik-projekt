from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from django.http import JsonResponse
import json
from docx import Document as DocxDocument
# import mammoth - zakomentowane tymczasowo

from .models import (
    UserProfile, Document, EditableField, 
    DocumentAssignment, FieldValue, DocumentVersion
)
from .serializers import (
    UserSerializer, DocumentSerializer, EditableFieldSerializer,
    DocumentAssignmentSerializer, FieldValueSerializer, DocumentVersionSerializer,
    LoginSerializer, DocumentUploadSerializer, FieldCreationSerializer,
    AssignDocumentSerializer, SubmitFieldValuesSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Endpoint do logowania użytkowników"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=username, password=password)
        if user and user.is_active:
            login(request, user)
            
            # Pobierz lub stwórz profil użytkownika
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'admin' if user.is_superuser else 'user'}
            )
            
            # Ensure correct role for superuser
            if user.is_superuser and profile.role != 'admin':
                profile.role = 'admin'
                profile.save()
            
            user_data = UserSerializer(user).data
            return Response({
                'success': True,
                'user': user_data,
                'message': 'Zalogowano pomyślnie'
            })
        else:
            return Response({
                'success': False,
                'message': 'Nieprawidłowe dane logowania'
            }, status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response({
            'success': False,
            'message': 'Błędne dane wejściowe',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Endpoint do wylogowania"""
    logout(request)
    return Response({'success': True, 'message': 'Wylogowano pomyślnie'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Endpoint do pobrania danych aktualnego użytkownika"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    """Lista wszystkich użytkowników (tylko dla adminów)"""
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'admin':
        return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.filter(userprofile__role='user')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_document(request):
    """Upload dokumentu Word"""
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'admin':
        return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = DocumentUploadSerializer(data=request.data)
    if serializer.is_valid():
        file = serializer.validated_data['file']
        name = serializer.validated_data.get('name', file.name)
        
        # Konwertuj dokument Word do HTML
        try:
            # Tymczasowo wyłączone - będzie dodane później
            html_content = "Zawartość dokumentu zostanie przetworzona..."
            # with file.open('rb') as docx_file:
            #     result = mammoth.convert_to_html(docx_file)
            #     html_content = result.value
        except Exception as e:
            return Response({'error': f'Błąd przetwarzania pliku: {str(e)}'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Stwórz dokument w bazie
        document = Document.objects.create(
            name=name,
            file=file,
            original_content=html_content,
            created_by=request.user
        )
        
        serializer = DocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_field(request):
    """Stworzenie pola do edycji w dokumencie"""
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'admin':
        return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = FieldCreationSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        try:
            document = Document.objects.get(id=data['document_id'], created_by=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Dokument nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
        
        field = EditableField.objects.create(
            document=document,
            field_id=data['field_id'],
            label=data['label'],
            placeholder=data.get('placeholder', ''),
            field_type=data['field_type'],
            original_value=data.get('original_value', ''),
            position_start=data['position_start'],
            position_end=data['position_end']
        )
        
        serializer = EditableFieldSerializer(field)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_document(request):
    """Przypisanie dokumentu do użytkowników"""
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'admin':
        return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = AssignDocumentSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        try:
            document = Document.objects.get(id=data['document_id'], created_by=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Dokument nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
        
        # Sprawdź czy dokument ma pola do edycji
        if not document.editable_fields.exists():
            return Response({'error': 'Dokument musi mieć przynajmniej jedno pole do edycji'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        assignments_created = []
        for user_id in data['user_ids']:
            try:
                user = User.objects.get(id=user_id)
                assignment, created = DocumentAssignment.objects.get_or_create(
                    document=document,
                    user=user,
                    defaults={'status': 'pending'}
                )
                if created:
                    assignments_created.append(assignment)
            except User.DoesNotExist:
                continue
        
        # Zmień status dokumentu na wysłany
        document.status = 'sent'
        document.save()
        
        return Response({
            'success': True,
            'message': f'Dokument przypisano do {len(assignments_created)} użytkowników'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_documents(request):
    """Lista dokumentów administratora"""
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'admin':
        return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
    
    documents = Document.objects.filter(created_by=request.user).order_by('-created_at')
    serializer = DocumentSerializer(documents, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_assignments(request):
    """Lista przypisań dla użytkownika"""
    assignments = DocumentAssignment.objects.filter(user=request.user).order_by('-assigned_at')
    serializer = DocumentAssignmentSerializer(assignments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_field_values(request):
    """Zapisanie wartości pól przez użytkownika"""
    serializer = SubmitFieldValuesSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        try:
            assignment = DocumentAssignment.objects.get(
                id=data['assignment_id'], 
                user=request.user
            )
        except DocumentAssignment.DoesNotExist:
            return Response({'error': 'Przypisanie nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
        
        # Zapisz wartości pól
        for field_id, value in data['field_values'].items():
            try:
                field = EditableField.objects.get(
                    document=assignment.document,
                    field_id=field_id
                )
                field_value, created = FieldValue.objects.update_or_create(
                    assignment=assignment,
                    field=field,
                    defaults={'value': value}
                )
            except EditableField.DoesNotExist:
                continue
        
        # Zaktualizuj status przypisania
        if assignment.status == 'pending':
            assignment.status = 'in_progress'
            assignment.started_at = timezone.now()
        
        assignment.save()
        
        return Response({'success': True, 'message': 'Wartości zostały zapisane'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_assignment(request, assignment_id):
    """Finalizacja wypełniania dokumentu"""
    try:
        assignment = DocumentAssignment.objects.get(
            id=assignment_id,
            user=request.user
        )
    except DocumentAssignment.DoesNotExist:
        return Response({'error': 'Przypisanie nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
    
    # Sprawdź czy wszystkie pola zostały wypełnione
    required_fields = assignment.document.editable_fields.all()
    filled_fields = assignment.field_values.all()
    
    if required_fields.count() != filled_fields.count():
        return Response({'error': 'Nie wszystkie pola zostały wypełnione'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    assignment.status = 'completed'
    assignment.completed_at = timezone.now()
    assignment.save()
    
    return Response({'success': True, 'message': 'Dokument został wysłany pomyślnie'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def completed_assignments(request):
    """Lista ukończonych przypisań (dla adminów)"""
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'admin':
        return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
    
    assignments = DocumentAssignment.objects.filter(
        document__created_by=request.user,
        status='completed'
    ).order_by('-completed_at')
    
    serializer = DocumentAssignmentSerializer(assignments, many=True)
    return Response(serializer.data)
