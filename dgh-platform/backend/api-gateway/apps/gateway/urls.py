# api-gateway/apps/gateway/urls.py
from django.urls import path
from .views import health_check, service_status, list_departments, simple_patient_profile
from .feedback_proxy import (
    create_feedback, my_feedbacks, feedback_status, test_feedback,
    appointments_view, appointment_detail_view, upcoming_appointments, today_appointments,
    prescriptions_view, prescription_detail_view,
    list_medications, get_medication, patient_profile, list_patients,
    dashboard_metrics
)

urlpatterns = [
    path('', health_check, name='health-check'),
    path('services/', service_status, name='service-status'),
    
    # Routes feedback pour patients
    path('api/v1/patient/feedback/', create_feedback, name='create-feedback'),
    path('api/v1/patient/feedbacks/', my_feedbacks, name='my-feedbacks'),
    path('api/v1/patient/feedback/<str:feedback_id>/status/', feedback_status, name='feedback-status'),
    path('api/v1/patient/feedback/test/', test_feedback, name='test-feedback'),
    
    # Route patient profile
    path('api/v1/patient/<str:patient_id>/profile/', patient_profile, name='patient-profile'),
    
    # Route patient profile simple (sans auth)
    path('api/v1/patient-simple/<str:patient_id>/profile/', simple_patient_profile, name='simple-patient-profile'),
    
    # Routes départements
    path('api/v1/departments/', list_departments, name='list-departments'),
    
    # Routes appointments (REST standard)
    path('api/v1/appointments/', appointments_view, name='appointments'),  # GET pour lister, POST pour créer
    path('api/v1/appointments/<str:appointment_id>/', appointment_detail_view, name='appointment-detail'),  # GET pour récupérer, PUT/PATCH pour modifier, DELETE pour supprimer  
    path('api/v1/appointments/upcoming/', upcoming_appointments, name='upcoming-appointments'),
    path('api/v1/appointments/today/', today_appointments, name='today-appointments'),
    
    # Routes prescriptions (REST standard)
    path('api/v1/prescriptions/', prescriptions_view, name='prescriptions'),  # GET pour lister, POST pour créer
    path('api/v1/prescriptions/<str:prescription_id>/', prescription_detail_view, name='prescription-detail'),  # GET pour récupérer, PUT/PATCH pour modifier, DELETE pour supprimer
    
    # Routes medications (READ-ONLY)
    path('api/v1/medications/', list_medications, name='medications'),  # GET pour lister tous les médicaments
    path('api/v1/medications/<str:medication_id>/', get_medication, name='medication-detail'),  # GET pour récupérer un médicament spécifique
    
    # Routes patients (pour les professionnels/admins)
    path('api/v1/patients/', list_patients, name='list-patients'),  # GET pour lister tous les patients avec pagination/recherche
    
    # Route dashboard metrics
    path('api/v1/dashboard/metrics/', dashboard_metrics, name='dashboard-metrics'),  # GET pour récupérer les métriques du dashboard
]