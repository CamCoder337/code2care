# app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configuration des URLs pour l'API
urlpatterns = [
    # ==================== HEALTH CHECK ====================
    path('health/', views.health_check, name='health_check'),

    # ==================== DASHBOARD ====================
    path('dashboard/overview/', views.DashboardOverviewAPIView.as_view(), name='dashboard_overview'),
    path('dashboard/alerts/', views.AlertsAPIView.as_view(), name='dashboard_alerts'),

    # ==================== ALERTS ACTIONS ====================
    path('alerts/', views.AlertsAPIView.as_view(), name='alerts_list'),
    path('alerts/<str:alert_id>/action/', views.AlertsAPIView.as_view(), name='alert_action'),

    # ==================== INVENTORY ====================
    path('inventory/units/', views.BloodUnitListAPIView.as_view(), name='blood_units_list'),
    path('analytics/inventory/', views.InventoryAnalyticsAPIView.as_view(), name='inventory_analytics'),

    # ==================== FORECASTING ====================
    # ==================== FORECASTING - ROUTES CONSOLIDÉES ====================
    path('forecast/', views.SmartForecastView.as_view(), name='forecast_main'),  # ✅ Route principale
    path('forecast/real-data/', views.SmartForecastView.as_view(), name='ai_forecast'),  # ✅ Alias pour IA
    path('forecasting/demand/', views.DemandForecastAPIView.as_view(), name='demand_forecast'),  # Legacy
    path('forecasting/recommendations/', views.OptimizationRecommendationsAPIView.as_view(),
         name='optimization_recommendations'),

    # ==================== AI SYSTEM ENDPOINTS ====================
    path('methods/', views.AIMethodsView.as_view(), name='ai_methods'),
    path('system/metrics/', views.AISystemHealthView.as_view(), name='system_metrics'),

    # ==================== DATA IMPORT ====================
    path('data/import/', views.DataImportAPIView.as_view(), name='data_import'),

    # ==================== REPORTS ====================
    path('reports/export/', views.ReportExportAPIView.as_view(), name='report_export'),

    # ==================== DONORS CRUD ====================
    path('donors/', views.DonorListCreateAPIView.as_view(), name='donors_list_create'),
    path('donors/<str:donor_id>/', views.DonorDetailAPIView.as_view(), name='donor_detail'),

    # ==================== PATIENTS CRUD ====================
    path('patients/', views.PatientListCreateAPIView.as_view(), name='patients_list_create'),
    path('patients/<str:patient_id>/', views.PatientDetailAPIView.as_view(), name='patient_detail'),

    # ==================== SITES CRUD ====================
    path('sites/', views.SiteListCreateAPIView.as_view(), name='sites_list_create'),
    path('sites/<str:site_id>/', views.SiteDetailAPIView.as_view(), name='site_detail'),

    # ==================== BLOOD REQUESTS ====================
    path('requests/', views.BloodRequestListCreateAPIView.as_view(), name='blood_requests_list_create'),
    path('requests/<str:request_id>/', views.BloodRequestDetailAPIView.as_view(), name='blood_request_detail'),

    # ==================== BLOOD CONSUMPTION ====================
    path('consumption/', views.BloodConsumptionListCreateAPIView.as_view(), name='blood_consumption_list_create'),

    # ==================== CONFIGURATION ====================
    path('config/system/', views.SystemConfigAPIView.as_view(), name='system_config'),
    path('config/compatibility/', views.blood_compatibility, name='blood_compatibility'),

    # ==================== REPORTS - CORRECTION CRITIQUE ====================
    path('reports/export/', views.ReportExportAPIView.as_view(), name='report_export'),

    # ==================== UTILITIES ====================
    path('utils/blood-compatibility/', views.blood_compatibility, name='blood_compatibility'),
]