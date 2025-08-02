# bloodbank/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

def api_root(request):
    """Point d'entrée principal de l'API"""
    return JsonResponse({
        'message': 'API Blood Bank System v1.0',
        'endpoints': {
            'dashboard': {
                'overview': '/api/dashboard/overview/',
                'alerts': '/api/dashboard/alerts/'
            },
            'forecasting': {
                'demand_forecast': '/api/forecast/demand/',
                'optimization': '/api/optimization/recommendations/'
            },
            'inventory': {
                'units': '/api/inventory/units/',
                'requests': '/api/inventory/requests/',
                'consumption': '/api/inventory/consumption/'
            },
            'analytics': {
                'inventory': '/api/analytics/inventory/'
            },
            'reports': {
                'export': '/api/reports/export/'
            },
            'data_management': {
                'import': '/api/data/import/'
            },
            'system': {
                'config': '/api/config/system/',
                'blood_compatibility': '/api/config/blood-compatibility/',
                'health': '/api/health/'
            }
        },
        'documentation': '/api/docs/',
        'admin': '/admin/'
    })

urlpatterns = [
    # ==================== ADMINISTRATION ====================
    path('admin/', admin.site.urls),

    # ==================== API ROOT ====================
    path('api/', api_root, name='api-root'),

    # ==================== APPLICATION URLS ====================
    path('', include('app.urls')),

    # ==================== API DOCUMENTATION (optionnel) ====================
    # path('api/docs/', TemplateView.as_view(template_name='api_docs.html'), name='api-docs'),
]

# ==================== CONFIGURATION DE DÉVELOPPEMENT ====================
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Ajout d'un endpoint de debug
    def debug_info(request):
        return JsonResponse({
            'debug': True,
            'django_version': settings.SECRET_KEY[:10] + '...',
            'database': 'Connected',
            'static_files': 'Enabled'
        })

    urlpatterns.append(path('debug/', debug_info, name='debug-info'))

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
    ]

# ==================== Handler pour les erreurs personnalisées ====================
handler404 = 'app.views.custom_404_view'
handler500 = 'app.views.custom_500_view'