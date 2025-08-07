"""
Migration pour créer un utilisateur admin par défaut
"""
from django.db import migrations
from django.contrib.auth.models import User


def create_admin_user(apps, schema_editor):
    """Crée un superutilisateur par défaut"""
    username = 'adminfeedback'
    email = 'admin@feedback.local'
    password = 'admin123'
    
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"Superutilisateur créé: {username} / {password}")


def remove_admin_user(apps, schema_editor):
    """Supprime l'utilisateur admin (rollback)"""
    User.objects.filter(username='adminfeedback').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_admin_user, remove_admin_user),
    ]