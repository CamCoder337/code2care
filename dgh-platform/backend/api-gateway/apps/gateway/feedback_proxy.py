"""
Proxy views pour le feedback-service via API Gateway
Authentification et routage sécurisé pour les patients et professionnels
Inclut: Feedbacks, Appointments, et autres endpoints du feedback-service
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
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
    list_medications_decorator, get_medication_decorator,
    list_reminders_decorator, get_reminder_decorator, update_reminder_decorator,
    list_patients_decorator
)
import httpx
import json
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([])  # Pas de permission requise - on gère manuellement
def patient_profile(request, patient_id):
    """
    Endpoint pour récupérer le profil d'un patient par son ID
    Route: GET /api/v1/patient/{patient_id}/profile/
    
    Accepte les appels système (avec Authorization: Bearer system_token)
    et les appels authentifiés normaux
    """
    # Vérifier si c'est un appel système interne
    auth_header = request.headers.get('Authorization', '')
    is_system_call = auth_header == 'Bearer system_token'
    
    # Si ce n'est pas un appel système, vérifier l'authentification normale
    if not is_system_call and not request.user.is_authenticated:
        return Response(
            {'error': 'Authentification requise'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        # Recherche du patient par patient_id (UUID)
        patient = Patient.objects.select_related('user').get(patient_id=patient_id)
        
        # Construction de la réponse avec toutes les infos nécessaires
        profile_data = {
            'patient_id': str(patient.patient_id),
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            'gender': patient.gender,
            'preferred_language': patient.preferred_language,
            'preferred_contact_method': patient.preferred_contact_method,
            'user': {
                'id': str(patient.user.id),
                'phone_number': patient.user.phone_number,
                'email': patient.user.email,
                'is_verified': patient.user.is_verified
            }
        }
        
        return Response(profile_data, status=status.HTTP_200_OK)
        
    except Patient.DoesNotExist:
        return Response(
            {'error': f'Patient avec ID {patient_id} introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du profil patient {patient_id}: {e}")
        return Response(
            {'error': 'Erreur interne du serveur'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
    if request.method == 'POST':
        return create_appointment_logic(request)
    
    # === LOGIQUE GET (liste des appointments) ===
    logger.error("=== APPOINTMENTS_VIEW GET CALLED - VERSION AVEC ENRICHISSEMENT ===")
    user_type = None
    user_id = None
    
    try:
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                logger.error(f"Patient non trouvé pour user {request.user.id}")
                return Response(
                    {'error': 'Profil patient non trouvé'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                logger.error(f"Professional non trouvé pour user {request.user.id}")
                return Response(
                    {'error': 'Profil professionnel non trouvé'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.error(f"Type d'utilisateur non géré: {request.user.user_type}")
            return Response(
                {'error': 'Type d\'utilisateur non autorisé'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {'error': 'Erreur lors de l\'authentification'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        
        # Enrichir la réponse avec les noms des patients
        appointments_data = response.json()
        logger.info(f"Response status: {response.status_code}, Type de données: {type(appointments_data)}")
        
        if response.status_code == 200:
            # Vérifier si c'est une réponse paginée ou une liste simple
            if isinstance(appointments_data, dict) and 'results' in appointments_data:
                logger.info(f"Réponse paginée détectée avec {len(appointments_data['results'])} appointments")
                # Réponse paginée
                appointments_data['results'] = _enrich_appointments_with_patient_names(appointments_data['results'])
            elif isinstance(appointments_data, list):
                logger.info(f"Liste simple détectée avec {len(appointments_data)} appointments")
                # Liste simple (pas de pagination)
                appointments_data = _enrich_appointments_with_patient_names(appointments_data)
            else:
                logger.warning(f"Structure de données non reconnue: {type(appointments_data)}, keys: {appointments_data.keys() if isinstance(appointments_data, dict) else 'N/A'}")
        else:
            logger.error(f"Status non-200 reçu: {response.status_code}")
        
        return Response(appointments_data, status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des appointments: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des rendez-vous'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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


def _enrich_appointments_with_patient_names(appointments_data):
    """Enrichit la liste des appointments avec les noms des patients"""
    try:
        logger.info(f"Début enrichissement pour {len(appointments_data)} appointments")
        
        # Récupérer tous les patient_ids uniques
        patient_ids = list(set([apt.get('patient_id') for apt in appointments_data if apt.get('patient_id')]))
        logger.info(f"Patient IDs à enrichir: {patient_ids[:3]}..." if len(patient_ids) > 3 else f"Patient IDs: {patient_ids}")
        
        if not patient_ids:
            logger.warning("Aucun patient_id trouvé dans les appointments")
            return appointments_data
        
        # Récupérer les informations des patients en une seule requête
        patients = Patient.objects.filter(patient_id__in=patient_ids).select_related('user')
        logger.info(f"Trouvé {patients.count()} patients dans la DB")
        
        patient_names = {
            str(patient.patient_id): f"{patient.first_name} {patient.last_name}".strip() 
            for patient in patients
        }
        logger.info(f"Mapping des noms créé: {len(patient_names)} entrées")
        
        # Enrichir chaque appointment
        enriched_count = 0
        for appointment in appointments_data:
            patient_id = appointment.get('patient_id')
            if patient_id:
                patient_name = patient_names.get(
                    str(patient_id), 
                    f"Patient {str(patient_id)[:8]}..."
                )
                appointment['patient_name'] = patient_name
                enriched_count += 1
                
        # Test forcé pour s'assurer que le code s'exécute
        if appointments_data and len(appointments_data) > 0:
            appointments_data[0]['patient_name'] = "TEST - FONCTION EXECUTEE"
        
        logger.info(f"Enrichissement terminé: {enriched_count} appointments enrichis")
        return appointments_data
        
    except Exception as e:
        logger.error(f"Erreur lors de l'enrichissement des noms patients: {str(e)}", exc_info=True)
        # Retourner les données originales en cas d'erreur
        return appointments_data


def create_appointment_logic(request):
    """
    Création de rendez-vous
    Route: POST /api/v1/appointments/
    """
    user_type = None
    user_id = None
    
    try:
        # Utiliser directement le user_type depuis le modèle User au lieu de hasattr
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    appointment_data = request.data.copy()
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user_id,
        'X-User-Type': user_type,
        'Authorization': request.headers.get('Authorization', '')
    }
    
    # DEBUG: Log des headers envoyés
    logger.info(f"API Gateway sending to feedback-service:")
    logger.info(f"  user_type: {user_type}")
    logger.info(f"  user_id: {user_id}")
    logger.info(f"  headers: {headers}")
    
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
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        # Utiliser directement le user_type depuis le modèle User
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {
                    'error': 'Type d\'utilisateur non supporté',
                    'debug_info': {
                        'user_type_from_model': request.user.user_type,
                        'user_id': str(request.user.id)
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {
                'error': 'Erreur lors de la vérification du profil utilisateur',
                'debug_info': {
                    'user_type_from_model': getattr(request.user, 'user_type', None),
                    'user_id': str(request.user.id),
                    'error_details': str(e)
                }
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
@permission_classes([AllowAny])
def list_medications(request):
    """
    Liste tous les médicaments disponibles dans le système
    Route: GET /api/v1/medications/
    Accessible avec ou sans authentification
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
@permission_classes([AllowAny])
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


# ========== REMINDER PROXY ENDPOINTS ==========

@list_reminders_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_patient_reminders(request):
    """
    Liste tous les rappels du patient authentifié
    Route: GET /api/v1/patient/reminders/
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
        if not service_url:
            return Response(
                {'error': 'Service feedback temporairement indisponible'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/reminders/",
                headers=headers,
                params=request.query_params.dict()
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des rappels: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des rappels'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@get_reminder_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_reminder(request, reminder_id):
    """
    Récupération d'un rappel spécifique du patient
    Route: GET /api/v1/patient/reminders/{reminder_id}/
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
        if not service_url:
            return Response(
                {'error': 'Service feedback temporairement indisponible'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{service_url}/api/v1/reminders/{reminder_id}/",
                headers=headers
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du rappel: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération du rappel'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@update_reminder_decorator
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_patient_reminder(request, reminder_id):
    """
    Mise à jour d'un rappel par le patient (marquer comme pris/ignoré)
    Route: PATCH /api/v1/patient/reminders/{reminder_id}/
    """
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Accès réservé aux patients uniquement'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validation de l'action
    action = request.data.get('action')
    if action not in ['taken', 'ignored']:
        return Response(
            {'error': 'Action invalide. Utilisez "taken" ou "ignored"'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': str(patient.patient_id),
        'X-User-Type': 'patient',
        'Authorization': request.headers.get('Authorization', '')
    }
    
    try:
        service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        if not service_url:
            return Response(
                {'error': 'Service feedback temporairement indisponible'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Préparation des données pour le feedback-service
        update_data = {
            'action': action,
            'notes': request.data.get('notes', ''),
            'patient_action_time': timezone.now().isoformat()
        }
        
        with httpx.Client(timeout=30.0) as client:
            response = client.patch(
                f"{service_url}/api/v1/reminders/{reminder_id}/patient_action/",
                headers=headers,
                json=update_data
            )
        
        if response.status_code == 200:
            return Response({
                'message': f'Rappel marqué comme {action}',
                'reminder_id': reminder_id,
                'action': action,
                'updated_at': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
        else:
            return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du rappel: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la mise à jour du rappel'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========== PATIENT LIST ENDPOINT ==========

@list_patients_decorator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_patients(request):
    """
    Liste tous les patients avec pagination et recherche (réservé aux professionnels et admins)
    Route: GET /api/v1/patients/
    
    Paramètres de requête:
    - page: Numéro de page (défaut: 1)
    - page_size: Taille de page (défaut: 20, max: 100)
    - search: Recherche par nom, prénom ou téléphone
    - ordering: Tri par champ (ex: first_name, -created_at)
    """
    # Vérifier les permissions
    if request.user.user_type not in ['professional', 'admin']:
        return Response(
            {
                'error': 'Accès réservé aux professionnels et administrateurs',
                'user_type': request.user.user_type
            }, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from django.core.paginator import Paginator
        from django.db.models import Q
        
        # Récupérer les paramètres de requête
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        search = request.query_params.get('search', '').strip()
        ordering = request.query_params.get('ordering', 'first_name')
        
        # Construire la requête de base
        patients = Patient.objects.select_related('user').all()
        
        # Appliquer la recherche si fournie
        if search:
            patients = patients.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(user__phone_number__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        # Appliquer le tri
        valid_ordering_fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'user__phone_number']
        if ordering.lstrip('-') in valid_ordering_fields:
            patients = patients.order_by(ordering)
        else:
            patients = patients.order_by('first_name')
        
        # Appliquer la pagination
        paginator = Paginator(patients, page_size)
        
        if page > paginator.num_pages:
            page = paginator.num_pages if paginator.num_pages > 0 else 1
            
        page_obj = paginator.get_page(page)
        
        # Sérialiser les données
        patients_data = []
        for patient in page_obj:
            patients_data.append({
                'patient_id': str(patient.patient_id),
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                'gender': patient.gender,
                'preferred_language': patient.preferred_language,
                'preferred_contact_method': patient.preferred_contact_method,
                'user': {
                    'id': str(patient.user.id),
                    'phone_number': patient.user.phone_number,
                    'email': patient.user.email,
                    'is_verified': patient.user.is_verified,
                    'created_at': patient.user.created_at.isoformat(),
                }
            })
        
        # Réponse avec métadonnées de pagination
        response_data = {
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page,
            'page_size': page_size,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next_page': page + 1 if page_obj.has_next() else None,
            'previous_page': page - 1 if page_obj.has_previous() else None,
            'results': patients_data
        }
        
        logger.info(f"Liste patients récupérée: {paginator.count} total, page {page}/{paginator.num_pages}")
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': f'Paramètre invalide: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des patients: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des patients'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========== DASHBOARD METRICS ENDPOINT ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """
    Proxy pour récupérer les métriques du dashboard professionnel
    Route: GET /api/v1/dashboard/metrics/
    """
    user_type = None
    user_id = None
    
    try:
        # Détermination du type d'utilisateur
        if request.user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=request.user)
                user_type = 'patient'
                user_id = str(patient.patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Profil patient introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'professional':
            try:
                professional = Professional.objects.get(user=request.user)
                user_type = 'professional'
                user_id = str(professional.professional_id)
            except Professional.DoesNotExist:
                return Response(
                    {'error': 'Profil professionnel introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif request.user.user_type == 'admin':
            user_type = 'admin'
            user_id = str(request.user.id)
        else:
            return Response(
                {'error': 'Type d\'utilisateur non supporté'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type d'utilisateur: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la vérification du profil utilisateur'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Headers pour l'authentification avec le feedback-service
    headers = {
        'X-User-ID': user_id,
        'X-User-Type': user_type,
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
                f"{service_url}/api/v1/dashboard/metrics/",
                headers=headers,
                params=request.query_params.dict()
            )
        
        return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des métriques dashboard: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des métriques dashboard'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )