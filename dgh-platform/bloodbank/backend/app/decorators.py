# app/decorators.py
from functools import wraps
from rest_framework.permissions import AllowAny


def global_allow_any(cls):
    """
    Décorateur de classe pour permettre l'accès sans authentification
    """
    if hasattr(cls, 'permission_classes'):
        cls.permission_classes = [AllowAny]
    else:
        cls.permission_classes = [AllowAny]

    return cls


def api_permission_required(permission_classes=None):
    """
    Décorateur pour spécifier des permissions personnalisées
    """
    if permission_classes is None:
        permission_classes = [AllowAny]

    def decorator(cls):
        cls.permission_classes = permission_classes
        return cls

    return decorator


def handle_api_exceptions(func):
    """
    Décorateur pour gérer les exceptions dans les vues API
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            from rest_framework.response import Response
            from rest_framework import status
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"API Exception in {func.__name__}: {str(e)}")

            return Response(
                {'error': f'Une erreur s\'est produite: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return wrapper