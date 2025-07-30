# Generated manually for creating default superadmin

from django.db import migrations
from django.contrib.auth.hashers import make_password
import os
import uuid


def create_default_superadmin(apps, schema_editor):
    """
    Crée un superadmin par défaut si aucun admin n'existe
    """
    User = apps.get_model('users', 'User')

    # Vérifier s'il existe déjà un utilisateur admin ou superuser
    if not User.objects.filter(user_type='admin').exists() and not User.objects.filter(is_superuser=True).exists():

        # Récupérer les credentials depuis les variables d'environnement ou utiliser des valeurs par défaut
        admin_username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
        admin_password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin123')
        admin_email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@dgh-platform.com')
        admin_phone = os.getenv('DJANGO_SUPERUSER_PHONE', '+237000000000')

        # Vérifier que le username et le phone ne sont pas déjà pris
        if User.objects.filter(username=admin_username).exists():
            admin_username = f"{admin_username}_{uuid.uuid4().hex[:6]}"

        if User.objects.filter(phone_number=admin_phone).exists():
            admin_phone = f"+237{uuid.uuid4().hex[:8]}"

        # Créer le superadmin
        User.objects.create(
            username=admin_username,
            password=make_password(admin_password),
            email=admin_email,
            phone_number=admin_phone,
            user_type='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            is_verified=True,
            first_name='Super',
            last_name='Admin'
        )

        print(f"✅ Superadmin créé avec succès:")
        print(f"   Username: {admin_username}")
        print(f"   Email: {admin_email}")
        print(f"   Phone: {admin_phone}")
        print(f"   Password: {admin_password}")


def reverse_create_default_superadmin(apps, schema_editor):
    """
    Supprime le superadmin par défaut (pour rollback)
    """
    User = apps.get_model('users', 'User')

    # Supprimer le superadmin créé par cette migration
    admin_username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
    try:
        user = User.objects.get(username=admin_username, user_type='admin')
        user.delete()
        print(f"🗑️ Superadmin {admin_username} supprimé")
    except User.DoesNotExist:
        print(f"⚠️ Aucun superadmin {admin_username} trouvé pour suppression")


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            create_default_superadmin,
            reverse_create_default_superadmin,
        ),
    ]