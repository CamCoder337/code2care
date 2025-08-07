from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import (
    Department, FeedbackTheme, Feedback, Appointment, 
    Reminder, Medication, Prescription, PrescriptionMedication
)
from .serializers import (
    DepartmentSerializer, FeedbackThemeSerializer, FeedbackSerializer, FeedbackCreateSerializer,
    AppointmentSerializer, AppointmentCreateSerializer, ReminderSerializer, MedicationSerializer,
    PrescriptionSerializer, PrescriptionCreateSerializer
)
from .services import process_feedback


class CustomPagination(PageNumberPagination):
    """Pagination personnalisée pour les appointments"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']


class FeedbackThemeViewSet(viewsets.ModelViewSet):
    queryset = FeedbackTheme.objects.filter(is_active=True)
    serializer_class = FeedbackThemeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['theme_name']


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['input_type', 'language', 'rating', 'is_processed']
    search_fields = ['description']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FeedbackCreateSerializer
        return FeedbackSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrer par patient si header présent
        user_id = self.request.headers.get('X-User-ID')
        user_type = self.request.headers.get('X-User-Type')
        
        if user_type == 'patient' and user_id:
            queryset = queryset.filter(patient_id=user_id)
        
        # Filtres additionnels
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crée le feedback et retourne une réponse avec feedback_id"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-assigner le patient_id depuis les headers si non fourni
        user_id = request.headers.get('X-User-ID')
        user_type = request.headers.get('X-User-Type')
        
        if user_type == 'patient' and user_id and 'patient_id' not in serializer.validated_data:
            feedback = serializer.save(patient_id=user_id)
        else:
            feedback = serializer.save()
        
        # Retourner la réponse avec feedback_id
        response_data = serializer.data.copy()
        response_data['feedback_id'] = str(feedback.feedback_id)
        
        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'])
    def my_feedbacks(self, request):
        """Récupère les feedbacks du patient connecté"""
        user_id = request.headers.get('X-User-ID')
        user_type = request.headers.get('X-User-Type')
        
        if user_type != 'patient' or not user_id:
            return Response(
                {'error': 'Accessible uniquement aux patients'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedbacks = self.queryset.filter(patient_id=user_id)
        serializer = self.get_serializer(feedbacks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_theme(self, request):
        """Groupe les feedbacks par thème"""
        from django.db.models import Count
        
        themes = FeedbackTheme.objects.annotate(
            feedback_count=Count('feedback')
        ).filter(feedback_count__gt=0)
        
        result = []
        for theme in themes:
            feedbacks = self.get_queryset().filter(theme=theme)
            feedback_data = self.get_serializer(feedbacks, many=True).data
            
            result.append({
                'theme_name': theme.theme_name,
                'feedback_count': theme.feedback_count,
                'feedbacks': feedback_data
            })
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def test_feedback_processing(self, request):
        """Endpoint de test pour créer un feedback et vérifier le traitement"""
        test_data = {
            'description': request.data.get('description', 'Test de satisfaction du service médical'),
            'rating': request.data.get('rating', 4),
            'language': request.data.get('language', 'fr'),
            'input_type': request.data.get('input_type', 'text'),
            'patient_id': request.data.get('patient_id', '12345678-1234-1234-1234-123456789abc'),
            'department_id': request.data.get('department_id', '87654321-4321-4321-4321-cba987654321')
        }
        
        # Création du feedback de test
        serializer = FeedbackCreateSerializer(data=test_data)
        if serializer.is_valid():
            feedback = serializer.save()
            
            return Response({
                'message': 'Feedback de test créé avec succès',
                'feedback_id': feedback.feedback_id,
                'status': 'Le traitement asynchrone va commencer automatiquement',
                'check_processing_url': f'/api/feedbacks/{feedback.feedback_id}/',
                'test_data': test_data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def processing_status(self, request, pk=None):
        """Vérifie le statut de traitement d'un feedback"""
        feedback = self.get_object()
        
        return Response({
            'feedback_id': feedback.feedback_id,
            'is_processed': feedback.is_processed,
            'processed_at': feedback.processed_at,
            'sentiment': feedback.sentiment,
            'sentiment_scores': {
                'positive': feedback.sentiment_positive_score,
                'negative': feedback.sentiment_negative_score,
                'neutral': feedback.sentiment_neutral_score
            },
            'theme': feedback.theme.theme_name if feedback.theme else None,
            'description': feedback.description,
            'rating': feedback.rating
        })


class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des rendez-vous - Version simplifiée"""
    queryset = Appointment.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'patient_id', 'professional_id']
    ordering_fields = ['scheduled']
    ordering = ['scheduled']
    pagination_class = CustomPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrage par utilisateur selon le type
        user_id = self.request.headers.get('X-User-ID')
        user_type = self.request.headers.get('X-User-Type')
        
        if user_type == 'patient' and user_id:
            queryset = queryset.filter(patient_id=user_id)
        elif user_type == 'professional' and user_id:
            queryset = queryset.filter(professional_id=user_id)
        
        # Filtres de date optionnels
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(scheduled__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(scheduled__date__lte=date_to)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Création de rendez-vous - réservé aux professionnels uniquement"""
        # Vérifier que seuls les professionnels peuvent créer des rendez-vous
        user_type = request.headers.get('X-User-Type')
        user_id = request.headers.get('X-User-ID')
        
        # Logging pour debugging si nécessaire
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Appointment creation attempt - User Type: {user_type}, User ID: {user_id}")
        
        if user_type not in ['professional', 'admin']:
            return Response({
                'error': 'Seuls les professionnels et admins peuvent créer des rendez-vous',
                'debug_info': {
                    'received_user_type': user_type,
                    'expected_user_types': ['professional', 'admin'],
                    'available_headers': list(request.headers.keys())
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Support auto-assignation professional_id depuis headers
            validated_data = serializer.validated_data.copy()
            
            if user_id and 'professional_id' not in validated_data:
                validated_data['professional_id'] = user_id
            
            appointment = Appointment.objects.create(**validated_data)
            
            response_data = AppointmentSerializer(appointment).data
            headers = self.get_success_headers(response_data)
            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            logger.error(f"Error creating appointment: {str(e)}")
            logger.error(f"Request data: {request.data}")
            logger.error(f"Validated data: {serializer.validated_data if 'serializer' in locals() else 'N/A'}")
            return Response({
                'error': 'Erreur lors de la création du rendez-vous',
                'details': str(e),
                'debug_info': {
                    'user_type': user_type,
                    'user_id': user_id,
                    'request_data': request.data
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Récupère les rendez-vous à venir"""
        queryset = self.get_queryset().filter(
            scheduled__gte=timezone.now()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Rendez-vous du jour"""
        from datetime import date
        
        queryset = self.get_queryset().filter(
            scheduled__date=date.today()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Groupe les rendez-vous par type"""
        from django.db.models import Count
        
        types_data = []
        for type_choice, type_display in Appointment.TYPE_CHOICES:
            appointments = self.get_queryset().filter(type=type_choice)
            count = appointments.count()
            
            if count > 0:
                types_data.append({
                    'type': type_choice,
                    'type_display': type_display,
                    'count': count,
                    'appointments': self.get_serializer(appointments, many=True).data
                })
        
        return Response(types_data)


class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'channel', 'language']
    ordering_fields = ['scheduled_time']
    ordering = ['scheduled_time']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        user_id = self.request.headers.get('X-User-ID')
        user_type = self.request.headers.get('X-User-Type')
        
        if user_type == 'patient' and user_id:
            queryset = queryset.filter(patient_id=user_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Récupère les rappels en attente"""
        queryset = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'dosage']


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['appointment_id']
    ordering = ['-created_at']
    pagination_class = CustomPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        user_id = self.request.headers.get('X-User-ID')
        user_type = self.request.headers.get('X-User-Type')
        
        # Les patients peuvent voir leurs propres prescriptions via les appointments
        if user_type == 'patient' and user_id:
            # On devrait faire un appel à l'API Gateway pour récupérer les appointment_ids du patient
            # Pour l'instant, on retourne toutes les prescriptions (à améliorer)
            pass
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_appointment(self, request):
        """Récupère les prescriptions par appointment"""
        appointment_id = request.query_params.get('appointment_id')
        
        if not appointment_id:
            return Response(
                {'error': 'appointment_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prescriptions = self.get_queryset().filter(appointment_id=appointment_id)
        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)