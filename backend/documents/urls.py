from django.urls import path
from . import views

urlpatterns = [
    # Autentykacja
    path('auth/csrf/', views.csrf_token, name='csrf'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/current-user/', views.current_user, name='current_user'),
    path('auth/complete-profile/', views.complete_profile, name='complete_profile'),
    
    # Użytkownicy
    path('users/', views.users_list, name='users_list'),
    path('users/all/', views.users_all, name='users_all'),
    path('users/<int:user_id>/set-role/', views.set_user_role, name='set_user_role'),
    
    # Dokumenty
    path('documents/upload/', views.upload_document, name='upload_document'),
    path('documents/<int:document_id>/reprocess/', views.reprocess_document, name='reprocess_document'),
    path('documents/<int:document_id>/', views.delete_document, name='delete_document'),
    path('documents/admin/', views.admin_documents, name='admin_documents'),
    path('documents/create-field/', views.create_field, name='create_field'),
    path('documents/fields/<int:field_id>/', views.delete_field, name='delete_field'),
    path('documents/assign/', views.assign_document, name='assign_document'),
    
    # Przypisania
    path('assignments/user/', views.user_assignments, name='user_assignments'),
    path('assignments/completed/', views.completed_assignments, name='completed_assignments'),
    path('assignments/completed/download-zip/', views.download_completed_zip, name='download_completed_zip'),
    path('assignments/submit-values/', views.submit_field_values, name='submit_field_values'),
    path('assignments/<int:assignment_id>/complete/', views.complete_assignment, name='complete_assignment'),
    path('assignments/<int:assignment_id>/download-docx/', views.download_assignment_docx, name='download_assignment_docx'),
    path('assignments/<int:assignment_id>/', views.delete_assignment, name='delete_assignment'),
]
