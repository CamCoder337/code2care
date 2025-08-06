# api-gateway/apps/gateway/middleware.py
import uuid
import time
import json
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .routers import ServiceRouter
import asyncio
import logging

logger = logging.getLogger(__name__)


class ServiceRoutingMiddleware(MiddlewareMixin):
    """Middleware pour router les requêtes vers les microservices"""

    def process_request(self, request):
        # Skip pour les routes internes
        if request.path.startswith('/admin/') or \
                request.path.startswith('/api/v1/auth/') or \
                request.path.startswith('/swagger/'):
            return None

        # Déterminer le service cible
        service_info = ServiceRouter.get_service_for_path(request.path)
        if not service_info:
            return None  # Laisser Django gérer

        service_key, service_url = service_info

        # Forward la requête de manière asynchrone
        try:
            # Préparer les données
            headers = self._extract_headers(request)

            # Données de la requête
            if request.content_type == 'application/json' and request.body:
                json_data = json.loads(request.body)
                data = None
            else:
                json_data = None
                data = request.body if request.body else None

            # Appel asynchrone
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            response = loop.run_until_complete(
                ServiceRouter.forward_request(
                    service_url=service_url,
                    method=request.method,
                    path=request.path,
                    headers=headers,
                    params=dict(request.GET),
                    json_data=json_data,
                    data=data
                )
            )

            # Construire la réponse Django
            django_response = JsonResponse(
                response.json() if response.headers.get('content-type', '').startswith('application/json') else {},
                status=response.status_code,
                safe=False
            )

            # Copier certains headers
            for header in ['content-type', 'cache-control']:
                if header in response.headers:
                    django_response[header] = response.headers[header]

            return django_response

        except Exception as e:
            logger.error(f"Error routing to {service_key}: {str(e)}")
            return JsonResponse(
                {'error': 'Service temporarily unavailable'},
                status=503
            )

    def _extract_headers(self, request):
        """Extrait les headers de la requête Django"""
        headers = {}
        for key, value in request.META.items():
            if key.startswith('HTTP_'):
                # Convertir HTTP_HEADER_NAME en Header-Name
                header_name = key[5:].replace('_', '-').title()
                headers[header_name] = value
            elif key in ['CONTENT_TYPE', 'CONTENT_LENGTH']:
                headers[key.replace('_', '-').title()] = value

        # Ajouter l'authentification JWT
        user = self._authenticate_jwt(request)
        if user and user.is_authenticated:
            # Récupérer le bon ID selon le type d'utilisateur
            user_id = self._get_user_specific_id(user)
            headers['X-User-ID'] = str(user_id)
            headers['X-User-Type'] = user.user_type
            logger.info(f"Middleware adding headers: X-User-Type={user.user_type}, X-User-ID={user_id}")

        return headers
    
    def _authenticate_jwt(self, request):
        """Authentifie l'utilisateur via JWT token"""
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            from django.contrib.auth.models import AnonymousUser
            
            auth = JWTAuthentication()
            result = auth.authenticate(request)
            
            if result:
                user, token = result
                return user
            return AnonymousUser()
            
        except Exception as e:
            logger.error(f"JWT Authentication error: {e}")
            from django.contrib.auth.models import AnonymousUser
            return AnonymousUser()
    
    def _get_user_specific_id(self, user):
        """Récupère le bon ID selon le type d'utilisateur"""
        try:
            if user.user_type == 'patient':
                from apps.users.models import Patient
                patient = Patient.objects.get(user=user)
                return patient.patient_id
            elif user.user_type == 'professional':
                from apps.users.models import Professional
                professional = Professional.objects.get(user=user)
                return professional.professional_id
            elif user.user_type == 'admin':
                return user.id  # Pour admin, utiliser l'ID user direct
            else:
                return user.id  # Fallback
        except Exception as e:
            logger.error(f"Error getting user specific ID: {e}")
            return user.id  # Fallback vers user.id


class RequestTracingMiddleware(MiddlewareMixin):
    """Middleware pour le tracing des requêtes"""

    def process_request(self, request):
        # Générer un ID unique pour la requête
        request.id = str(uuid.uuid4())
        request.META['X-Request-ID'] = request.id
        request.start_time = time.time()

        logger.info(f"Request started: {request.method} {request.path} [ID: {request.id}]")

    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            response['X-Request-ID'] = getattr(request, 'id', 'unknown')
            response['X-Response-Time'] = f"{duration:.3f}s"

            logger.info(
                f"Request completed: {request.method} {request.path} "
                f"[ID: {request.id}] [Status: {response.status_code}] "
                f"[Duration: {duration:.3f}s]"
            )

        return response