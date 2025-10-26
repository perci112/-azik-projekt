#!/usr/bin/env python
import os
import django
import requests
import json

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'document_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from documents.models import UserProfile

def test_users():
    """Test all users and their authentication"""
    print("=== Testing Users ===")
    
    users_to_test = [
        ('admin', 'admin123'),
        ('user1', 'user123'),
        ('jan.kowalski', 'user123')
    ]
    
    for username, password in users_to_test:
        print(f"\nTesting {username}:")
        try:
            # Check if user exists
            user = User.objects.get(username=username)
            print(f"  ✓ User exists: {user.username}")
            print(f"  - Email: {user.email}")
            print(f"  - Active: {user.is_active}")
            print(f"  - Staff: {user.is_staff}")
            print(f"  - Superuser: {user.is_superuser}")
            
            # Test password
            if user.check_password(password):
                print(f"  ✓ Password correct")
            else:
                print(f"  ✗ Password incorrect")
                continue
            
            # Test authentication
            auth_user = authenticate(username=username, password=password)
            if auth_user:
                print(f"  ✓ Authentication successful")
            else:
                print(f"  ✗ Authentication failed")
                continue
            
            # Check profile
            try:
                profile = UserProfile.objects.get(user=user)
                print(f"  ✓ Profile exists: role={profile.role}")
            except UserProfile.DoesNotExist:
                print(f"  ! Profile missing - creating...")
                profile = UserProfile.objects.create(
                    user=user,
                    role='admin' if user.is_superuser else 'user'
                )
                print(f"  ✓ Profile created: role={profile.role}")
                
        except User.DoesNotExist:
            print(f"  ✗ User does not exist")

if __name__ == '__main__':
    test_users()
