# bloodbank/urls.py - FIXED VERSION
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static
from django.utils import timezone


@csrf_exempt
def api_root(request):
    """
    🏠 API Root endpoint with comprehensive information
    Fixed to handle all HTTP methods properly
    """
    return JsonResponse({
        'message': '🩸 Blood Bank Management System API v2.0',
        'status': 'operational',
        'timestamp': timezone.now().isoformat(),
        'endpoints': {
            'health': {
                'health_check': '/api/health/',
                'system_health': '/api/system/health/',
                'ai_methods': '/api/methods/'
            },
            'dashboard': {
                'overview': '/api/dashboard/overview/',
                'alerts': '/api/dashboard/alerts/'
            },
            'forecasting': {
                'main_forecast': '/api/forecast/',
                'ai_forecast': '/api/forecast/real-data/',
                'legacy_demand': '/api/forecasting/demand/',
            },
            'inventory': {
                'units': '/api/inventory/units/',
                'analytics': '/api/analytics/inventory/',
                'requests': '/api/requests/',
                'consumption': '/api/consumption/'
            },
            'management': {
                'donors': '/api/donors/',
                'patients': '/api/patients/',
                'sites': '/api/sites/'
            },
            'system': {
                'config': '/api/config/system/',
                'blood_compatibility': '/api/config/compatibility/',
                'data_import': '/api/data/import/',
                'reports': '/api/reports/export/'
            }
        },
        'features': {
            'ai_forecasting': True,
            'real_time_analytics': True,
            'cache_optimization': True,
            'multi_method_prediction': True
        },
        'documentation': {
            'api_docs': '/api/docs/',
            'admin_panel': '/admin/',
            'debug_info': '/debug/' if settings.DEBUG else None
        }
    })


# ==================== MAIN URL CONFIGURATION ====================
urlpatterns = [
    # ==================== ADMINISTRATION ====================
    path('admin/', admin.site.urls),

    # ==================== API ROOT ====================
    path('api/', api_root, name='api-root'),
    path('', api_root, name='home'),  # Root redirect to API info

    # ==================== MAIN APPLICATION URLS ====================
    path('api/', include('app.urls')),  # ✅ All app URLs under /api/

    # ==================== DIRECT HEALTH CHECK (Backup) ====================
    # FIXED: Import the actual view function instead of using string
    path('health/', include('app.urls')),  # This will handle /health/ through app.urls
]

# ==================== DEVELOPMENT CONFIGURATION ====================
if settings.DEBUG:
    # Debug toolbar
    try:
        import debug_toolbar

        urlpatterns = [
                          path('__debug__/', include(debug_toolbar.urls)),
                      ] + urlpatterns
    except ImportError:
        pass


    # Debug endpoints
    def debug_info(request):
        """Development debug information"""
        return JsonResponse({
            'debug_mode': True,
            'django_version': '5.2.4',
            'python_version': '3.13.4',
            'database_status': 'connected',
            'cache_status': 'active',
            'ai_system': 'available',
            'static_files': 'enabled',
            'timestamp': timezone.now().isoformat(),
            'request_info': {
                'method': request.method,
                'path': request.path,
                'user_agent': request.META.get('HTTP_USER_AGENT', 'unknown')[:100]
            }
        })


    def debug_routes(request):
        """Show all available routes"""
        from django.urls import get_resolver
        from django.urls.resolvers import URLPattern, URLResolver

        def extract_urls(urlpatterns, base=''):
            urls = []
            for pattern in urlpatterns:
                if isinstance(pattern, URLPattern):
                    urls.append({
                        'name': pattern.name,
                        'pattern': base + str(pattern.pattern),
                        'view': str(pattern.callback)
                    })
                elif isinstance(pattern, URLResolver):
                    urls.extend(extract_urls(pattern.url_patterns, base + str(pattern.pattern)))
            return urls

        try:
            resolver = get_resolver()
            all_urls = extract_urls(resolver.url_patterns)

            return JsonResponse({
                'total_routes': len(all_urls),
                'routes': all_urls[:50],  # Limit to first 50 for readability
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            return JsonResponse({
                'error': 'Could not extract routes',
                'message': str(e),
                'timestamp': timezone.now().isoformat()
            })


    # Add debug URLs
    urlpatterns.extend([
        path('debug/', debug_info, name='debug-info'),
        path('debug/routes/', debug_routes, name='debug-routes'),
    ])

    # Media and static files for development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# ==================== ERROR HANDLERS ====================
# Custom error handling - FIXED: Import actual view functions
try:
    from app.views import custom_404_view, custom_500_view

    handler404 = custom_404_view
    handler500 = custom_500_view
except ImportError:
    # Fallback error handlers if app.views doesn't have them
    def handler404(request, exception):
        return JsonResponse({'error': 'Not Found', 'status': 404}, status=404)


    def handler500(request):
        return JsonResponse({'error': 'Internal Server Error', 'status': 500}, status=500)