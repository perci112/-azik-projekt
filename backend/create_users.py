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
            'is_superuser': False,
        }
    )
    if created:
        admin_user.set_password('admin123')
    # Ensure flags even if not created
    admin_user.is_staff = True
    admin_user.is_superuser = False
    admin_user.save()
    
    admin_profile, created = UserProfile.objects.get_or_create(
        user=admin_user,
        defaults={'role': 'admin'}
    )
    
    print(f"Admin {'utworzony' if created else 'zaktualizowany'}: {admin_user.username}")

    # Stwórz lub zaktualizuj superadmina (osobne konto do panelu Super Admina)
    super_user, super_created = User.objects.get_or_create(
        username='superadmin',
        defaults={
            'email': 'superadmin@example.com',
            'first_name': 'Super',
            'last_name': 'Admin',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if super_created:
        super_user.set_password('superadmin123')
    # Ensure flags even if not created
    super_user.is_staff = True
    super_user.is_superuser = True
    super_user.save()

    super_profile, sp_created = UserProfile.objects.get_or_create(
        user=super_user,
        defaults={'role': 'admin'}
    )
    if super_profile.role != 'admin':
        super_profile.role = 'admin'
        super_profile.save()

    print(f"Superadmin {'utworzony' if super_created else 'zaktualizowany'}: {super_user.username}")

    # Admini sekcyjni: IT i Elektronika
    admins_by_section = [
        { 'username': 'admin_it', 'email': 'admin.it@example.com', 'first_name': 'Admin', 'last_name': 'IT', 'section': 'IT' },
        { 'username': 'admin_elektronika', 'email': 'admin.elektronika@example.com', 'first_name': 'Admin', 'last_name': 'Elektronika', 'section': 'Elektronika' },
    ]
    for a in admins_by_section:
        u, created = User.objects.get_or_create(
            username=a['username'],
            defaults={
                'email': a['email'],
                'first_name': a['first_name'],
                'last_name': a['last_name'],
                'is_staff': True,
                'is_superuser': False,
            }
        )
        if created:
            u.set_password('admin123')
        u.is_staff = True
        u.is_superuser = False
        u.save()

        p, _ = UserProfile.objects.get_or_create(user=u, defaults={'role': 'admin'})
        p.role = 'admin'
        p.section = a['section']
        p.save()
        print(f"Admin sekcyjny {'utworzony' if created else 'zaktualizowany'}: {u.username} (sekcja: {p.section})")
    
    # Lista użytkowników do stworzenia
    test_users = [
        # Sekcja IT
        {'username': 'it_user1', 'email': 'it_user1@example.com', 'first_name': 'Iwona', 'last_name': 'Tech', 'section': 'IT'},
        {'username': 'it_user2', 'email': 'it_user2@example.com', 'first_name': 'Igor', 'last_name': 'Tester', 'section': 'IT'},
        # Sekcja Elektronika
        {'username': 'el_user1', 'email': 'el_user1@example.com', 'first_name': 'Ela', 'last_name': 'Lutron', 'section': 'Elektronika'},
        {'username': 'el_user2', 'email': 'el_user2@example.com', 'first_name': 'Eryk', 'last_name': 'Logic', 'section': 'Elektronika'},
        # Dotychczasowe konta przykładowe bez sekcji (pozostawiamy)
        {'username': 'user1', 'email': 'user1@example.com', 'first_name': 'Jan', 'last_name': 'Kowalski', 'section': ''},
        {'username': 'user2', 'email': 'user2@example.com', 'first_name': 'Anna', 'last_name': 'Nowak', 'section': ''},
        {'username': 'user3', 'email': 'user3@example.com', 'first_name': 'Piotr', 'last_name': 'Wiśniewski', 'section': ''},
        {'username': 'jan.kowalski', 'email': 'jan.kowalski@example.com', 'first_name': 'Jan', 'last_name': 'Kowalski', 'section': ''},
        {'username': 'anna.nowak', 'email': 'anna.nowak@example.com', 'first_name': 'Anna', 'last_name': 'Nowak', 'section': ''},
        {'username': 'piotr.wisniewski', 'email': 'piotr.wisniewski@example.com', 'first_name': 'Piotr', 'last_name': 'Wiśniewski', 'section': ''},
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
        # Ustaw sekcję jeśli podana
        if 'section' in user_data:
            profile.section = user_data['section']
        if profile.role != 'user':
            profile.role = 'user'
        profile.save()
        
        print(f"Użytkownik {'utworzony' if created else 'zaktualizowany'}: {user.username}")
    
    print("\n✅ Wszyscy testowi użytkownicy zostali utworzeni!")
    print("\n📝 Dane logowania:")
    print("👨‍💼 Admin: admin / admin123 (sekcja nieustawiona)")
    print("🧑‍💻 Admin IT: admin_it / admin123 (sekcja: IT)")
    print("🔧 Admin Elektronika: admin_elektronika / admin123 (sekcja: Elektronika)")
    print("👑 SuperAdmin: superadmin / superadmin123 (panel: /super)")
    print("👤 Użytkownicy IT: it_user1, it_user2 / user123")
    print("👤 Użytkownicy Elektronika: el_user1, el_user2 / user123")
    print("👤 Pozostali użytkownicy: user1, user2, user3, jan.kowalski, anna.nowak, piotr.wisniewski / user123")

if __name__ == '__main__':
    create_test_users()
