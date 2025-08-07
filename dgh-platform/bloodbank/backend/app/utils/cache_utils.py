# Ajoutez ce fichier : app/utils/cache_utils.py

import logging
import time
from django.core.cache import cache
from django.conf import settings
from functools import wraps

logger = logging.getLogger(__name__)


def safe_cache_operation(func):
    """Décorateur pour gérer les erreurs Redis gracieusement"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.warning(f"Cache operation failed: {e}")
            return None

    return wrapper


@safe_cache_operation
def safe_cache_get(key, default=None):
    """Récupère une valeur du cache avec gestion d'erreur"""
    return cache.get(key, default)


@safe_cache_operation
def safe_cache_set(key, value, timeout=None):
    """Définit une valeur dans le cache avec gestion d'erreur"""
    cache.set(key, value, timeout)
    return True


@safe_cache_operation
def safe_cache_delete(key):
    """Supprime une clé du cache avec gestion d'erreur"""
    cache.delete(key)
    return True


def cache_key_builder(*parts):
    """Construit une clé de cache cohérente"""
    return f"bloodbank:{''.join(str(p) for p in parts)}"


def cached_view(timeout=1800, key_func=None):
    """Décorateur pour mettre en cache le résultat d'une vue"""

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Générer la clé de cache
            if key_func:
                cache_key = key_func(request, *args, **kwargs)
            else:
                cache_key = cache_key_builder(
                    func.__name__,
                    request.path,
                    str(hash(str(request.GET.urlencode())))
                )

            # Tenter de récupérer depuis le cache
            cached_result = safe_cache_get(cache_key)
            if cached_result is not None:
                logger.info(f"Cache hit for {cache_key}")
                return cached_result

            # Exécuter la vue et mettre en cache
            start_time = time.time()
            result = func(self, request, *args, **kwargs)
            execution_time = time.time() - start_time

            # Mettre en cache seulement si succès
            if hasattr(result, 'status_code') and result.status_code == 200:
                safe_cache_set(cache_key, result, timeout)
                logger.info(f"Cached {cache_key} (exec: {execution_time:.2f}s)")

            return result

        return wrapper

    return decorator


# Exemple d'utilisation dans vos vues :
"""
from app.utils.cache_utils import safe_cache_get, safe_cache_set, cached_view

class DashboardOverviewAPIView(APIView):
    @cached_view(timeout=900)  # Cache 15 minutes
    def get(self, request):
        # Votre logique de vue
        pass
"""