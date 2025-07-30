"""
Proxy views pour le feedback-service via API Gateway
Authentification et routage sécurisé pour les patients
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from ..users.models import Patient
from .swagger_schemas import (
    create_feedback_decorator, my_feedbacks_decorator, 
    feedback_status_decorator, test_feedback_decorator
)
import httpx
import json
import logging

logger = logging.getLogger(__name__)


@create_feedback_decorator
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_feedback(request):
    """
    Endpoint pour création de feedback par un patient
    Route: POST /api/v1/patient/feedback/
    """
    # Vérification que l'utilisateur est un patient
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux patients uniquement'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Préparation des données avec patient_id automatique
    feedback_data = request.data.copy()
    feedback_data['patient_id'] = str(patient.patient_id)
    
    # Validation des champs requis
    required_fields = ['description', 'rating', 'department_id']
    missing_fields = [field for field in required_fields if field not in feedback_data]
    
    if missing_fields:
        return Response(
            {'error': f'Champs manquants: {", ".join(missing_fields)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Headers pour le feedback-service
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': str(patient.patient_id),
        'X-User-Type': 'patient',
        'X-Request-ID': request.headers.get('X-Request-ID', ''),
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        # Forward vers feedback-service avec les bonnes URLs
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        if not service_url:
            return Response(
                {'error': 'Service feedback temporairement indisponible'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{service_url}/api/v1/feedbacks/",  # URL corrigée
                headers=headers,
                json=feedback_data
            )
        
        if response.status_code == 201:
            return Response(
                {
                    'message': 'Feedback créé avec succès',
                    'feedback': response.json(),
                    'processing_info': 'L\'analyse de sentiment se fait automatiquement en arrière-plan'
                }, 
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                response.json(), 
                status=response.status_code
            )
                
    except httpx.TimeoutException:
        logger.error("Timeout lors de la création du feedback")
        return Response(
            {'error': 'Délai d\'attente dépassé, veuillez réessayer'}, 
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except Exception as e:
        logger.error(f"Erreur lors de la création du feedback: {str(e)}")
        return Response(
            {'error': 'Erreur interne, veuillez réessayer plus tard'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@my_feedbacks_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_feedbacks(request):
    """
    Récupère les feedbacks du patient connecté
    Route: GET /api/v1/patient/feedbacks/
    """
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux patients uniquement'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    headers = {
        'X-User-ID': str(patient.patient_id),
        'X-User-Type': 'patient',
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/feedbacks/my_feedbacks/",  # URL corrigée
                headers=headers,
                params=request.query_params.dict()
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des feedbacks: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des feedbacks'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@feedback_status_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feedback_status(request, feedback_id):
    """
    Vérifie le statut de traitement d'un feedback
    Route: GET /api/v1/patient/feedback/{feedback_id}/status/
    """
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux patients uniquement'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    headers = {
        'X-User-ID': str(patient.patient_id),
        'X-User-Type': 'patient',
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/feedbacks/{feedback_id}/processing_status/",  # URL corrigée
                headers=headers
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du statut: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la vérification du statut'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@test_feedback_decorator
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_feedback(request):
    """
    Endpoint de test pour créer un feedback avec données par défaut
    Route: POST /api/v1/patient/feedback/test/
    """
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux patients uniquement'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Données de test avec possibilité de personnalisation
    test_data = {
        'description': request.data.get('description', 'Service médical excellent, personnel très professionnel et accueillant'),
        'rating': request.data.get('rating', 5),
        'language': request.data.get('language', 'fr'),
        'input_type': request.data.get('input_type', 'text'),
        'patient_id': str(patient.patient_id),
        'department_id': request.data.get('department_id', '87654321-4321-4321-4321-cba987654321')
    }
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': str(patient.patient_id),
        'X-User-Type': 'patient',
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{service_url}/api/v1/feedbacks/",  # URL corrigée
                headers=headers,
                json=test_data
            )
        
        if response.status_code == 201:
            feedback_data = response.json()
            return Response(
                {
                    'message': 'Feedback de test créé avec succès',
                    'feedback': feedback_data,
                    'test_info': {
                        'description': 'Ce feedback sera automatiquement analysé en arrière-plan',
                        'check_status_url': f'/api/v1/patient/feedback/{feedback_data["feedback_id"]}/status/',
                        'wait_time': 'Attendez 10-30 secondes puis vérifiez le statut'
                    }
                }, 
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(response.json(), status=response.status_code)
                
    except Exception as e:
        logger.error(f"Erreur lors de la création du feedback de test: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la création du feedback de test'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )