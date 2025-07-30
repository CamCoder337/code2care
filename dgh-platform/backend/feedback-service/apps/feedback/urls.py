from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'departments', views.DepartmentViewSet)
router.register(r'feedback-themes', views.FeedbackThemeViewSet)
router.register(r'feedbacks', views.FeedbackViewSet)
router.register(r'appointments', views.AppointmentViewSet)
router.register(r'reminders', views.ReminderViewSet)
router.register(r'medications', views.MedicationViewSet)
router.register(r'prescriptions', views.PrescriptionViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
]