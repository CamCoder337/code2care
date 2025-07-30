# api-gateway/apps/gateway/urls.py
from django.urls import path
from .views import health_check, service_status
from .feedback_proxy import create_feedback, my_feedbacks, feedback_status, test_feedback

urlpatterns = [
    path('', health_check, name='health-check'),
    path('services/', service_status, name='service-status'),
    
    # Routes feedback pour patients
    path('api/v1/patient/feedback/', create_feedback, name='create-feedback'),
    path('api/v1/patient/feedbacks/', my_feedbacks, name='my-feedbacks'),
    path('api/v1/patient/feedback/<str:feedback_id>/status/', feedback_status, name='feedback-status'),
    path('api/v1/patient/feedback/test/', test_feedback, name='test-feedback'),
]