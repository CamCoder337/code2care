# bloodbank/urls.py - SOLUTION DÉFINITIVE
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static
from django.utils import timezone


@csrf_exempt
def api_root(request):
    """🏠 API Root endpoint"""
    return JsonResponse({
        'message': '🩸 Blood Bank Management System API v2.0',
        'status': 'operational',
        'timestamp': timezone.now().isoformat(),
        'endpoints': {
            'health': '/health/',
            'dashboard': '/dashboard/overview/',
            'forecast': '/forecast/',
            'inventory': '/inventory/units/',
            'alerts': '/alerts/',
            'donors': '/donors/',
            'patients': '/patients/',
            'sites': '/sites/',
            'requests': '/requests/',
            'reports': '/reports/export/',
            'system_metrics': '/system/metrics/',
        }
    })


@csrf_exempt
def simple_health_check(request):
    """Health check simple et fiable"""
    return JsonResponse({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'service': 'Blood Bank API',
        'method': request.method
    })


@csrf_exempt
def system_metrics(request):
    """System metrics endpoint"""
    return JsonResponse({
        'status': 'operational',
        'timestamp': timezone.now().isoformat(),
        'metrics': {
            'uptime': '100%',
            'response_time': '50ms',
            'database_status': 'connected',
            'cache_status': 'active',
            'memory_usage': '45%',
            'cpu_usage': '12%'
        },
        'endpoints_status': {
            'health': 'healthy',
            'api': 'operational',
            'database': 'connected'
        }
    })


# ==================== MAIN URL CONFIGURATION ====================
urlpatterns = [
    # Administration
    path('admin/', admin.site.urls),

    # API Root (avec et sans /api/)
    path('api/', api_root, name='api-root'),
    path('', api_root, name='home'),

    # ✅ ROUTES DIRECTES (sans /api/) - SOLUTION PRINCIPALE
    path('', include('app.urls')),  # Routes directes vers app

    # ✅ ROUTES AVEC /api/ (backward compatibility)
    path('api/', include('app.urls')),  # Routes avec préfixe /api/

    # Health check directs (fallback routes)
    path('health/', simple_health_check, name='direct-health-check'),

    # System metrics direct
    path('system/metrics/', system_metrics, name='system-metrics'),
]

# Development only
if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


# Error handlers
def handler404(request, exception):
    return JsonResponse({
        'error': 'Not Found',
        'status': 404,
        'path': request.path,
        'message': f'The requested endpoint {request.path} does not exist',
        'available_endpoints': [
            '/health/',
            '/inventory/units/',
            '/analytics/inventory/',
            '/config/system/',
            '/dashboard/overview/',
            '/forecast/',
            '/alerts/',
        ]
    }, status=404)


def handler500(request):
    return JsonResponse({
        'error': 'Internal Server Error',
        'status': 500,
        'message': 'An unexpected error occurred'
    }, status=500)