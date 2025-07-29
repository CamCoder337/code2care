# api-gateway/apps/gateway/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.core.cache import cache
import httpx
import asyncio
from datetime import datetime
from .swagger_schemas import departments_list_decorator


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check de l'API Gateway"""
    checks = {
        'gateway': 'healthy',
        'database': check_database(),
        'cache': check_cache(),
        'timestamp': datetime.now().isoformat()
    }

    all_healthy = all(v == 'healthy' for k, v in checks.items() if k != 'timestamp')
    status_code = 200 if all_healthy else 503

    return Response(checks, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_status(request):
    """Vérification du statut des microservices"""
    services_health = asyncio.run(check_all_services())

    all_healthy = all(s['status'] == 'healthy' for s in services_health.values())
    status_code = 200 if all_healthy else 503

    return Response({
        'services': services_health,
        'overall_status': 'healthy' if all_healthy else 'degraded',
        'timestamp': datetime.now().isoformat()
    }, status=status_code)


def check_database():
    """Vérifie la connexion à la base de données"""
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return 'healthy'
    except:
        return 'unhealthy'


def check_cache():
    """Vérifie la connexion au cache Redis"""
    try:
        cache.set('health_check', 'ok', 1)
        if cache.get('health_check') == 'ok':
            return 'healthy'
        return 'unhealthy'
    except:
        return 'unhealthy'


async def check_all_services():
    """Vérifie le statut de tous les microservices"""
    services = {}

    async with httpx.AsyncClient(timeout=5.0) as client:
        for service_name, service_url in settings.MICROSERVICES.items():
            try:
                response = await client.get(f"{service_url}/health/")
                services[service_name] = {
                    'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                    'response_time': response.elapsed.total_seconds(),
                    'status_code': response.status_code
                }
            except Exception as e:
                services[service_name] = {
                    'status': 'unhealthy',
                    'error': str(e),
                    'response_time': None
                }

    return services


@departments_list_decorator
@api_view(['GET'])
@permission_classes([AllowAny])
def list_departments(request):
    """
    Proxy endpoint pour récupérer la liste des départements depuis le feedback-service
    """
    try:
        feedback_service_url = settings.MICROSERVICES.get('FEEDBACK_SERVICE')
        if not feedback_service_url:
            return Response(
                {'error': 'Feedback service non configuré'},
                status=503
            )
        
        # Construire l'URL avec les paramètres de recherche
        url = f"{feedback_service_url}/api/v1/departments/"
        params = {}
        
        # Ajouter le paramètre de recherche s'il existe
        search = request.GET.get('search')
        if search:
            params['search'] = search
        
        # Appel au service de feedback
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        response = loop.run_until_complete(
            call_feedback_service(url, params)
        )
        
        if response.status_code == 200:
            return Response(response.json(), status=200)
        else:
            return Response(
                {'error': 'Erreur lors de la récupération des départements'},
                status=response.status_code
            )
            
    except Exception as e:
        return Response(
            {'error': 'Service temporairement indisponible'},
            status=503
        )


async def call_feedback_service(url, params=None):
    """Helper pour appeler le feedback service"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        return response
