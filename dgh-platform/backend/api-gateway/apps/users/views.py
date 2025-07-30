# api-gateway/apps/users/views.py
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from .models import User, Patient, Professional
from .serializers import (
    UserSerializer, PatientSerializer, ProfessionalSerializer,
    LoginSerializer, RegisterPatientSerializer, RegisterProfessionalSerializer, LogoutSerializer
)
import logging
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

logger = logging.getLogger(__name__)


class RegisterPatientView(generics.CreateAPIView):
    """Inscription des patients"""
    serializer_class = RegisterPatientSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Créer l'utilisateur
        user_data = serializer.validated_data.pop('user')
        user = User.objects.create_user(
            username=user_data['username'],
            password=user_data['password'],
            phone_number=user_data['phone_number'],
            user_type='patient'
        )

        # Créer le profil patient
        patient = Patient.objects.create(
            user=user,
            **serializer.validated_data
        )

        # Générer les tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'patient': PatientSerializer(patient).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class RegisterProfessionalView(generics.CreateAPIView):
    """Inscription des professionnels de santé"""
    serializer_class = RegisterProfessionalSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Créer l'utilisateur
        user_data = serializer.validated_data.pop('user')
        user = User.objects.create_user(
            username=user_data['username'],
            password=user_data['password'],
            phone_number=user_data['phone_number'],
            user_type='professional'
        )

        # Créer le profil professionnel
        professional = Professional.objects.create(
            user=user,
            **serializer.validated_data
        )

        # Générer les tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'professional': ProfessionalSerializer(professional).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


@swagger_auto_schema(
    method='post',
    operation_summary="Connexion utilisateur",
    operation_description="Authentifie un utilisateur (patient ou professionnel) et retourne les tokens JWT",
    request_body=LoginSerializer,
    responses={
        200: openapi.Response(
            description="Connexion réussie",
            examples={
                "application/json": {
                    "user": {
                        "id": "uuid-here",
                        "username": "patient_test",
                        "user_type": "patient"
                    },
                    "profile": {
                        "patient_id": "PAT12345678",
                        "first_name": "Jean",
                        "last_name": "Dupont"
                    },
                    "tokens": {
                        "refresh": "eyJ0eXAiOiJKV1Q...",
                        "access": "eyJ0eXAiOiJKV1Q..."
                    }
                }
            }
        ),
        401: "Identifiants invalides"
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Connexion pour patients et professionnels"""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Récupérer le profil selon le type
    profile_data = {}
    if user.user_type == 'patient':
        try:
            patient = Patient.objects.get(user=user)
            profile_data = PatientSerializer(patient).data
        except Patient.DoesNotExist:
            pass
    elif user.user_type == 'professional':
        try:
            professional = Professional.objects.get(user=user)
            profile_data = ProfessionalSerializer(professional).data
        except Professional.DoesNotExist:
            pass

    # Générer les tokens
    refresh = RefreshToken.for_user(user)

    # Log de connexion
    logger.info(f"User {user.username} ({user.user_type}) logged in successfully")

    return Response({
        'user': UserSerializer(user).data,
        'profile': profile_data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })


@swagger_auto_schema(
    method='post',
    operation_summary="Déconnexion utilisateur",
    operation_description="Déconnecte un utilisateur en blacklistant son refresh token",
    request_body=LogoutSerializer,
    responses={
        200: openapi.Response(
            description="Déconnexion réussie",
            examples={
                "application/json": {
                    "detail": "Successfully logged out"
                }
            }
        ),
        400: "Token invalide ou manquant"
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Déconnexion avec blacklist du token"""
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Successfully logged out"})
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response(
            {"error": f"Invalid token: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

