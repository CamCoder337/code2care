# api-gateway/apps/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterPatientView,
    RegisterProfessionalView,
    login_view,
    logout_view,
    list_patients
)

urlpatterns = [
    path('register/patient/', RegisterPatientView.as_view(), name='register-patient'),
    path('register/professional/', RegisterProfessionalView.as_view(), name='register-professional'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('patients/', list_patients, name='list-patients'),
]