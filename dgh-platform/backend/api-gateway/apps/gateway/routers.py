# api-gateway/apps/gateway/routers.py
from typing import Dict, Optional, Tuple
import httpx
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class ServiceRouter:
    """Router intelligent pour diriger les requêtes vers les microservices"""

    # Mapping des routes vers les services
    ROUTE_MAPPING = {
        '/api/v1/feedback': 'FEEDBACK_SERVICE',
        '/api/v1/departments': 'FEEDBACK_SERVICE',
        '/api/v1/appointments': 'FEEDBACK_SERVICE',
        '/api/v1/reminders': 'FEEDBACK_SERVICE',
        '/api/v1/prescriptions': 'FEEDBACK_SERVICE',
        '/api/v1/chat': 'CHAT_SERVICE',
        '/api/v1/analytics': 'ANALYTICS_SERVICE',
        '/api/v1/blood-bank': 'ANALYTICS_SERVICE',
    }

    @classmethod
    def get_service_for_path(cls, path: str) -> Optional[Tuple[str, str]]:
        """Détermine quel service doit traiter cette route"""
        for route_prefix, service_key in cls.ROUTE_MAPPING.items():
            if path.startswith(route_prefix):
                service_url = settings.MICROSERVICES.get(service_key)
                if service_url:
                    return service_key, service_url
        return None

    @classmethod
    async def forward_request(
            cls,
            service_url: str,
            method: str,
            path: str,
            headers: Dict,
            params: Optional[Dict] = None,
            json_data: Optional[Dict] = None,
            data: Optional[bytes] = None
    ):
        """Forward la requête au microservice approprié"""
        # Nettoyer les headers
        forwarded_headers = cls._clean_headers(headers)

        # Ajouter les headers de traçage
        forwarded_headers['X-Forwarded-For'] = headers.get('REMOTE_ADDR', '')
        forwarded_headers['X-Request-ID'] = headers.get('X-Request-ID', '')

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.request(
                    method=method,
                    url=f"{service_url}{path}",
                    headers=forwarded_headers,
                    params=params,
                    json=json_data,
                    content=data
                )
                return response
            except httpx.TimeoutException:
                logger.error(f"Timeout calling {service_url}{path}")
                raise
            except Exception as e:
                logger.error(f"Error calling {service_url}{path}: {str(e)}")
                raise

    @staticmethod
    def _clean_headers(headers: Dict) -> Dict:
        """Nettoie les headers pour le forwarding"""
        # Headers à ne pas forward
        skip_headers = {
            'content-length', 'host', 'connection',
            'transfer-encoding', 'upgrade'
        }

        cleaned = {}
        for key, value in headers.items():
            if key.lower() not in skip_headers:
                cleaned[key] = value

        return cleaned
