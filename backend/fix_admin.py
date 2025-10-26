#!/usr/bin/env python
import os
import sys
import django

# Add project path and setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'document_system.settings')
django.setup()

from django.contrib.auth.models import User
from documents.models import UserProfile


def ensure_admin(username='admin', password='admin123'):
	user, created = User.objects.get_or_create(
		username=username,
		defaults={'email': 'admin@example.com'}
	)
	user.is_staff = True
	# Admin ma być zwykłym adminem (panel /admin), nie superuserem
	user.is_superuser = False
	user.set_password(password)
	user.save()

	profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'admin'})
	if profile.role != 'admin':
		profile.role = 'admin'
		profile.save()

	print(f"Admin ensured: {user.username} / {password}")


if __name__ == '__main__':
	ensure_admin()

