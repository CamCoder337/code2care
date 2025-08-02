# app/management/commands/create_default_superuser.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from decouple import config

User = get_user_model()


class Command(BaseCommand):
    help = 'Créer un superuser par défaut pour la production'

    def handle(self, *args, **options):
        # Vérifier si un superuser existe déjà
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.WARNING('Un superuser existe déjà.')
            )
            return

        # Récupérer les credentials depuis les variables d'environnement
        username = config('DJANGO_SUPERUSER_USERNAME', default='admin')
        email = config('DJANGO_SUPERUSER_EMAIL', default='admin@bloodbank.com')
        password = config('DJANGO_SUPERUSER_PASSWORD', default='BloodBank2024!')

        try:
            # Créer le superuser
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Superuser "{username}" créé avec succès!'
                )
            )

            # Afficher les informations de connexion (en dev seulement)
            if settings.DEBUG:
                self.stdout.write(f'Username: {username}')
                self.stdout.write(f'Email: {email}')
                self.stdout.write(f'Password: {password}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de la création du superuser: {e}')
            )