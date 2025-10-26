#!/usr/bin/env python
import os
import sys
import django

# Dodaj ścieżkę do projektu
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Skonfiguruj Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'document_system.settings')
django.setup()

from django.contrib.auth.models import User
from documents.models import UserProfile

def create_test_users():
    """Stwórz testowych użytkowników"""
    
    # Stwórz lub zaktualizuj admina
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'first_name': 'Administrator',
            'last_name': 'Systemu',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
    
    admin_profile, created = UserProfile.objects.get_or_create(
        user=admin_user,
        defaults={'role': 'admin'}
    )
    
    print(f"Admin {'utworzony' if created else 'zaktualizowany'}: {admin_user.username}")
    
    # Lista użytkowników do stworzenia
    test_users = [
        {'username': 'user1', 'email': 'user1@example.com', 'first_name': 'Jan', 'last_name': 'Kowalski'},
        {'username': 'user2', 'email': 'user2@example.com', 'first_name': 'Anna', 'last_name': 'Nowak'},
        {'username': 'user3', 'email': 'user3@example.com', 'first_name': 'Piotr', 'last_name': 'Wiśniewski'},
        {'username': 'jan.kowalski', 'email': 'jan.kowalski@example.com', 'first_name': 'Jan', 'last_name': 'Kowalski'},
        {'username': 'anna.nowak', 'email': 'anna.nowak@example.com', 'first_name': 'Anna', 'last_name': 'Nowak'},
        {'username': 'piotr.wisniewski', 'email': 'piotr.wisniewski@example.com', 'first_name': 'Piotr', 'last_name': 'Wiśniewski'},
    ]
    
    for user_data in test_users:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
            }
        )
        
        if created:
            user.set_password('user123')
            user.save()
        
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'user'}
        )
        
        print(f"Użytkownik {'utworzony' if created else 'zaktualizowany'}: {user.username}")
    
    print("\n✅ Wszyscy testowi użytkownicy zostali utworzeni!")
    print("\n📝 Dane logowania:")
    print("👨‍💼 Admin: admin / admin123")
    print("👤 Użytkownicy: user1, user2, user3, jan.kowalski, anna.nowak, piotr.wisniewski / user123")

if __name__ == '__main__':
    create_test_users()
