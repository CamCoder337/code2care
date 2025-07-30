"""
URL configuration for feedback-service project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """Health check endpoint for API Gateway"""
    try:
        # Test database connectivity
        connection.ensure_connection()
        return JsonResponse({
            'status': 'healthy', 
            'service': 'feedback-service',
            'database': 'connected'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'service': 'feedback-service', 
            'error': str(e)
        }, status=503)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health'),
    path('', include('apps.feedback.urls')),
]
