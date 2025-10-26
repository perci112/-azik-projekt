from typing import Any, Dict
from django.contrib.auth.models import User
from .models import UserProfile


def save_discord_profile(backend, user: User, response: Dict[str, Any], *args, **kwargs):
    """Pipeline hook: zapisz Discord ID i utwórz profil jeśli trzeba.
    Działa dla social_core.backends.discord.DiscordOAuth2.
    """
    if backend.name != 'discord':
        return

    # Discord ID jest zwykle w uid (kwargs['uid']) albo w response['id']
    discord_id = None
    try:
        discord_id = kwargs.get('uid') or response.get('id')
    except Exception:
        pass

    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={
        'role': 'user'
    })

    if discord_id and not profile.discord_id:
        profile.discord_id = str(discord_id)

    # Uzupełnij podstawowe dane jeśli puste
    if not user.email:
        user.email = response.get('email') or ''
    if not user.first_name and response.get('global_name'):
        user.first_name = response.get('global_name')

    profile.save()
    user.save()
