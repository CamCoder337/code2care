# app/urls.py - VERSION CORRIGÉE AVEC FALLBACKS
from django.urls import path
from . import views
from .views import AISystemHealthView, AIMethodsView

urlpatterns = [
    # ==================== HEALTH CHECKS MULTIPLES ====================
    path('health/', views.health_check, name='health_check'),
    path('health/simple/', views.simple_health, name='simple_health'),
    path('health/ai/', views.ai_system_health, name='ai_health'),

    # ==================== SYSTEM ====================
    path('system/health/', views.ai_system_health, name='ai_system_health'),
    path('system/metrics/', views.system_metrics, name='system_metrics'),

    # ==================== DASHBOARD ====================
    path('dashboard/overview/', views.DashboardOverviewAPIView.as_view(), name='dashboard_overview'),
    path('dashboard/alerts/', views.AlertsAPIView.as_view(), name='dashboard_alerts'),

    # ==================== ALERTS ====================
    path('alerts/', views.AlertsAPIView.as_view(), name='alerts_list'),
    path('alerts/<str:alert_id>/action/', views.AlertsAPIView.as_view(), name='alert_action'),

    # ==================== INVENTORY ====================
    path('inventory/units/', views.BloodUnitListAPIView.as_view(), name='blood_units_list'),
    path('analytics/inventory/', views.InventoryAnalyticsAPIView.as_view(), name='inventory_analytics'),

    # ==================== FORECASTING CONSOLIDÉ ====================
    path('forecast/', views.SmartForecastView.as_view(), name='forecast_main'),
    path('forecast/real-data/', views.SmartForecastView.as_view(), name='ai_forecast'),
    path('forecasting/demand/', views.SmartForecastView.as_view(), name='demand_forecast_legacy'),

    # ==================== AI METHODS ====================
    path('methods/', views.AIMethodsView.as_view(), name='ai_methods'),

    # ==================== CRUD ENDPOINTS ====================
    path('donors/', views.DonorListCreateAPIView.as_view(), name='donors_list_create'),
    path('donors/<str:donor_id>/', views.DonorDetailAPIView.as_view(), name='donor_detail'),

    path('patients/', views.PatientListCreateAPIView.as_view(), name='patients_list_create'),
    path('patients/<str:patient_id>/', views.PatientDetailAPIView.as_view(), name='patient_detail'),

    path('sites/', views.SiteListCreateAPIView.as_view(), name='sites_list_create'),
    path('sites/<str:site_id>/', views.SiteDetailAPIView.as_view(), name='site_detail'),

    path('requests/', views.BloodRequestListCreateAPIView.as_view(), name='blood_requests_list_create'),
    path('requests/<str:request_id>/', views.BloodRequestDetailAPIView.as_view(), name='blood_request_detail'),

    # ==================== REPORTS ====================
    path('reports/export/', views.ReportExportAPIView.as_view(), name='report_export'),

    # ==================== CONFIG ====================
    path('config/system/', views.SystemConfigAPIView.as_view(), name='system_config'),
    path('config/compatibility/', views.blood_compatibility, name='blood_compatibility'),
]

# Dans urls.py - Ajouter ces routes de debug
debug_patterns = [
    path('debug/ai-health/', AISystemHealthView.as_view(), name='ai_system_health'),
    path('debug/ai-methods/', AIMethodsView.as_view(), name='ai_methods_test'),
    path('debug/forecast-test/', AIMethodsView.as_view(), name='forecast_test'),
]

# Ajouter à vos urlpatterns existants
urlpatterns.extend(debug_patterns)