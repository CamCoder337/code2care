"""
Proxy views pour le feedback-service via API Gateway
Authentification et routage sécurisé pour les patients et professionnels
Inclut: Feedbacks, Appointments, et autres endpoints du feedback-service
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from ..users.models import Patient, Professional
from .swagger_schemas import (
    create_feedback_decorator, my_feedbacks_decorator, 
    feedback_status_decorator, test_feedback_decorator,
    list_appointments_decorator, create_appointment_decorator,
    get_appointment_decorator, update_appointment_decorator,
    delete_appointment_decorator, upcoming_appointments_decorator,
    today_appointments_decorator,
    list_prescriptions_decorator, create_prescription_decorator,
    get_prescription_decorator, update_prescription_decorator,
    delete_prescription_decorator,
    list_medications_decorator, get_medication_decorator
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


# ========== APPOINTMENT PROXY ENDPOINTS ==========

@list_appointments_decorator
@create_appointment_decorator  
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def appointments_view(request):
    """
    Vue combinée pour les appointments:
    GET: Liste tous les rendez-vous
    POST: Crée un nouveau rendez-vous
    """
    if request.method == 'GET':
        return list_appointments(request)
    elif request.method == 'POST':
        return create_appointment_logic(request)

@get_appointment_decorator
@update_appointment_decorator
@delete_appointment_decorator
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def appointment_detail_view(request, appointment_id):
    """
    Vue combinée pour les détails d'un appointment:
    GET: Récupère un rendez-vous
    PUT/PATCH: Modifie un rendez-vous
    DELETE: Supprime un rendez-vous
    """
    if request.method == 'GET':
        return get_appointment(request, appointment_id)
    elif request.method in ['PUT', 'PATCH']:
        return update_appointment(request, appointment_id)
    elif request.method == 'DELETE':
        return delete_appointment(request, appointment_id)

@list_appointments_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_appointments(request):
    """
    Liste tous les rendez-vous selon le type d'utilisateur
    Route: GET /api/v1/appointments/
    """
    user_type = None
    user_id = None
    
    try:
        # Déterminer le type d'utilisateur
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'  
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/appointments/",
                headers=headers,
                params=request.query_params.dict()
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des appointments: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des rendez-vous'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def create_appointment_logic(request):
    """
    Création de rendez-vous
    Route: POST /api/v1/appointments/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    appointment_data = request.data.copy()
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{service_url}/api/v1/appointments/",
                headers=headers,
                json=appointment_data
            )
        
        return Response(response.json(), status=response.status_code)
                
    except Exception as e:
        logger.error(f"Erreur lors de la création du rendez-vous: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la création du rendez-vous'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@get_appointment_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_appointment(request, appointment_id):
    """
    Récupération d'un rendez-vous spécifique
    Route: GET /api/v1/appointments/{appointment_id}/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/appointments/{appointment_id}/",
                headers=headers
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du rendez-vous: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération du rendez-vous'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@update_appointment_decorator
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_appointment(request, appointment_id):
    """
    Mise à jour d'un rendez-vous
    Route: PUT/PATCH /api/v1/appointments/{appointment_id}/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        method = request.method.lower()
        
        with httpx.Client(timeout=30.0) as client:
            if method == 'put':
                response = client.put(
                    f"{service_url}/api/v1/appointments/{appointment_id}/",
                    headers=headers,
                    json=request.data
                )
            else:  # PATCH
                response = client.patch(
                    f"{service_url}/api/v1/appointments/{appointment_id}/",
                    headers=headers,
                    json=request.data
                )
        
        return Response(response.json(), status=response.status_code)
                
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du rendez-vous: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la mise à jour du rendez-vous'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@delete_appointment_decorator
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_appointment(request, appointment_id):
    """
    Suppression d'un rendez-vous
    Route: DELETE /api/v1/appointments/{appointment_id}/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.delete(
                f"{service_url}/api/v1/appointments/{appointment_id}/",
                headers=headers
            )
        
        return Response(status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du rendez-vous: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la suppression du rendez-vous'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@upcoming_appointments_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_appointments(request):
    """
    Rendez-vous à venir
    Route: GET /api/v1/appointments/upcoming/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/appointments/upcoming/",
                headers=headers
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des rendez-vous à venir: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des rendez-vous à venir'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@today_appointments_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_appointments(request):
    """
    Rendez-vous du jour
    Route: GET /api/v1/appointments/today/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/appointments/today/",
                headers=headers
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des rendez-vous du jour: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des rendez-vous du jour'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========== PRESCRIPTION PROXY ENDPOINTS ==========

@list_prescriptions_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_prescriptions(request):
    """
    Liste toutes les prescriptions selon le type d'utilisateur
    Route: GET /api/v1/prescriptions/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/prescriptions/",
                headers=headers,
                params=request.query_params.dict()
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des prescriptions: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des prescriptions'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@create_prescription_decorator
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_prescription(request):
    """
    Création de prescription (réservé aux professionnals)
    Route: POST /api/v1/prescriptions/
    """
    try:
        professional = Professional.objects.get(user=request.user)
        user_type = 'professional'
        user_id = str(professional.professional_id)
    except Professional.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux professionnels de santé'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    prescription_data = request.data.copy()
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{service_url}/api/v1/prescriptions/",
                headers=headers,
                json=prescription_data
            )
        
        return Response(response.json(), status=response.status_code)
                
    except Exception as e:
        logger.error(f"Erreur lors de la création de la prescription: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la création de la prescription'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@get_prescription_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prescription(request, prescription_id):
    """
    Récupération d'une prescription spécifique
    Route: GET /api/v1/prescriptions/{prescription_id}/
    """
    user_type = None
    user_id = None
    
    try:
        if hasattr(request.user, 'patient'):
            patient = Patient.objects.get(user=request.user)
            user_type = 'patient'
            user_id = str(patient.patient_id)
        elif hasattr(request.user, 'professional'):
            professional = Professional.objects.get(user=request.user)
            user_type = 'professional'
            user_id = str(professional.professional_id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except (Patient.DoesNotExist, Professional.DoesNotExist):
        return Response(
            {'error': 'Profil utilisateur introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/prescriptions/{prescription_id}/",
                headers=headers
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de la prescription: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération de la prescription'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@update_prescription_decorator
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_prescription(request, prescription_id):
    """
    Mise à jour d'une prescription (réservé aux professionnals)
    Route: PUT/PATCH /api/v1/prescriptions/{prescription_id}/
    """
    try:
        professional = Professional.objects.get(user=request.user)
        user_type = 'professional'
        user_id = str(professional.professional_id)
    except Professional.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux professionnels de santé'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        method = request.method.lower()
        
        with httpx.Client(timeout=30.0) as client:
            if method == 'put':
                response = client.put(
                    f"{service_url}/api/v1/prescriptions/{prescription_id}/",
                    headers=headers,
                    json=request.data
                )
            else:  # PATCH
                response = client.patch(
                    f"{service_url}/api/v1/prescriptions/{prescription_id}/",
                    headers=headers,
                    json=request.data
                )
        
        return Response(response.json(), status=response.status_code)
                
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de la prescription: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la mise à jour de la prescription'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@delete_prescription_decorator
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_prescription(request, prescription_id):
    """
    Suppression d'une prescription (réservé aux professionnals)
    Route: DELETE /api/v1/prescriptions/{prescription_id}/
    """
    try:
        professional = Professional.objects.get(user=request.user)
        user_type = 'professional'
        user_id = str(professional.professional_id)
    except Professional.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux professionnels de santé'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        
        with httpx.Client(timeout=30.0) as client:
            response = client.delete(
                f"{service_url}/api/v1/prescriptions/{prescription_id}/",
                headers=headers
            )
        
        return Response(status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la suppression de la prescription: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la suppression de la prescription'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========== COMBINED PRESCRIPTION VIEWS FOR REST ==========

@list_prescriptions_decorator
@create_prescription_decorator  
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def prescriptions_view(request):
    """
    Vue combinée pour les prescriptions:
    GET: Liste toutes les prescriptions
    POST: Crée une nouvelle prescription
    """
    if request.method == 'GET':
        return list_prescriptions(request)
    elif request.method == 'POST':
        return create_prescription(request)

@get_prescription_decorator
@update_prescription_decorator
@delete_prescription_decorator
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def prescription_detail_view(request, prescription_id):
    """
    Vue combinée pour les détails d'une prescription:
    GET: Récupère une prescription
    PUT/PATCH: Modifie une prescription
    DELETE: Supprime une prescription
    """
    if request.method == 'GET':
        return get_prescription(request, prescription_id)
    elif request.method in ['PUT', 'PATCH']:
        return update_prescription(request, prescription_id)
    elif request.method == 'DELETE':
        return delete_prescription(request, prescription_id)


# ========== MEDICATION PROXY ENDPOINTS ==========

@list_medications_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_medications(request):
    """
    Liste tous les médicaments disponibles dans le système
    Route: GET /api/v1/medications/
    """
    headers = {
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        if not service_url:
            return Response(
                {'error': 'Service feedback temporairement indisponible'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/medications/",
                headers=headers,
                params=request.query_params.dict()
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des médicaments: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des médicaments'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@get_medication_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_medication(request, medication_id):
    """
    Récupération d'un médicament spécifique
    Route: GET /api/v1/medications/{medication_id}/
    """
    headers = {
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        if not service_url:
            return Response(
                {'error': 'Service feedback temporairement indisponible'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/medications/{medication_id}/",
                headers=headers
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du médicament: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération du médicament'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )