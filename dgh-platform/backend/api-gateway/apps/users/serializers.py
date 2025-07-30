# api-gateway/apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Patient, Professional
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'phone_number', 'user_type', 'is_verified', 'created_at']
        read_only_fields = ['id', 'created_at']


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    age = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'patient_id', 'first_name', 'last_name', 'date_of_birth',
            'gender', 'preferred_language', 'preferred_contact_method',
            'user', 'age'
        ]

    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                    (today.month, today.day) <
                    (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None


class ProfessionalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Professional
        fields = [
            'professional_id', 'first_name', 'last_name', 'gender',
            'date_of_birth', 'department_id', 'specialization',
            'license_number', 'user'
        ]


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer pour les données utilisateur lors de l'inscription"""
    username = serializers.CharField(
        max_length=150,
        help_text="Nom d'utilisateur unique",
        required=True
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text="Mot de passe (minimum 8 caractères)",
        required=True
    )
    phone_number = serializers.CharField(
        max_length=15,
        help_text="Numéro de téléphone (format: +237XXXXXXXXX)",
        required=True
    )


class RegisterPatientSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription d'un patient"""
    user = UserRegistrationSerializer(write_only=True, help_text="Données utilisateur")
    patient_id = serializers.CharField(
        max_length=50, 
        read_only=True,
        help_text="ID patient (généré automatiquement)"
    )
    first_name = serializers.CharField(
        max_length=100,
        help_text="Prénom du patient",
        required=True
    )
    last_name = serializers.CharField(
        max_length=100,
        help_text="Nom de famille du patient",
        required=True
    )
    date_of_birth = serializers.DateField(
        help_text="Date de naissance (format: YYYY-MM-DD)",
        required=True
    )
    gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
        help_text="Genre du patient",
        required=True
    )
    preferred_language = serializers.ChoiceField(
        choices=[('fr', 'Français'), ('en', 'English'), ('dua', 'Douala'), ('bas', 'Bassa'), ('ewo', 'Ewondo')],
        default='fr',
        help_text="Langue préférée"
    )
    preferred_contact_method = serializers.ChoiceField(
        choices=[('sms', 'SMS'), ('voice', 'Voice Call'), ('whatsapp', 'WhatsApp')],
        default='sms',
        help_text="Méthode de contact préférée"
    )

    class Meta:
        model = Patient
        fields = [
            'user', 'patient_id', 'first_name', 'last_name',
            'date_of_birth', 'gender', 'preferred_language',
            'preferred_contact_method'
        ]

    def validate_user(self, value):
        # Valider les données utilisateur
        if not value.get('username') or not value.get('password'):
            raise serializers.ValidationError("Username and password are required")

        # Valider le mot de passe
        validate_password(value['password'])

        # Vérifier l'unicité
        if User.objects.filter(username=value['username']).exists():
            raise serializers.ValidationError("Username already exists")

        if User.objects.filter(phone_number=value.get('phone_number')).exists():
            raise serializers.ValidationError("Phone number already registered")

        return value


class RegisterProfessionalSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription d'un professionnel de santé"""
    user = UserRegistrationSerializer(write_only=True, help_text="Données utilisateur")
    professional_id = serializers.CharField(
        max_length=50, 
        read_only=True,
        help_text="ID professionnel (généré automatiquement)"
    )
    first_name = serializers.CharField(
        max_length=100,
        help_text="Prénom du professionnel",
        required=True
    )
    last_name = serializers.CharField(
        max_length=100,
        help_text="Nom de famille du professionnel",
        required=True
    )
    gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
        help_text="Genre du professionnel",
        required=True
    )
    date_of_birth = serializers.DateField(
        help_text="Date de naissance (format: YYYY-MM-DD)",
        required=True
    )
    specialization = serializers.CharField(
        max_length=100,
        required=False,
        help_text="Spécialisation médicale"
    )
    license_number = serializers.CharField(
        max_length=50,
        required=False,
        help_text="Numéro de licence médicale"
    )

    class Meta:
        model = Professional
        fields = [
            'user', 'professional_id', 'first_name', 'last_name',
            'gender', 'date_of_birth', 'specialization', 'license_number'
        ]

    def validate_license_number(self, value):
        if value and Professional.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("License number already registered")
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion utilisateur"""
    username = serializers.CharField(
        max_length=150,
        help_text="Nom d'utilisateur ou numéro de téléphone",
        required=True
    )
    password = serializers.CharField(
        write_only=True,
        help_text="Mot de passe",
        required=True
    )


class LogoutSerializer(serializers.Serializer):
    """Serializer pour la déconnexion utilisateur"""
    refresh = serializers.CharField(
        help_text="Refresh token à blacklister",
        required=True
    )