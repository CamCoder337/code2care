from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)


class APINotFoundMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Si c'est une requête API et qu'on a une 404
        if (request.path.startswith('/api/') or
            request.path.startswith('/dashboard/') or
            request.path.startswith('/inventory/') or
            request.path.startswith('/analytics/') or
            request.path.startswith('/config/') or
            request.path.startswith('/health/')) and response.status_code == 404:
            logger.warning(f"API endpoint not found: {request.path}")
            return JsonResponse({
                'error': 'Endpoint non trouvé',
                'path': request.path,
                'available_endpoints': self.get_available_endpoints()
            }, status=404)

        return response

    def get_available_endpoints(self):
        return {
            'dashboard': ['/dashboard/overview/', '/dashboard/alerts/'],
            'inventory': ['/inventory/units/'],
            'analytics': ['/analytics/inventory/'],
            'config': ['/config/system/'],
            'health': ['/health/']
        }