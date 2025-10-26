from django.urls import path
from . import views

urlpatterns = [
    # Autentykacja
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/current-user/', views.current_user, name='current_user'),
    
    # Użytkownicy
    path('users/', views.users_list, name='users_list'),
    
    # Dokumenty
    path('documents/upload/', views.upload_document, name='upload_document'),
    path('documents/admin/', views.admin_documents, name='admin_documents'),
    path('documents/create-field/', views.create_field, name='create_field'),
    path('documents/assign/', views.assign_document, name='assign_document'),
    
    # Przypisania
    path('assignments/user/', views.user_assignments, name='user_assignments'),
    path('assignments/completed/', views.completed_assignments, name='completed_assignments'),
    path('assignments/submit-values/', views.submit_field_values, name='submit_field_values'),
    path('assignments/<int:assignment_id>/complete/', views.complete_assignment, name='complete_assignment'),
]
