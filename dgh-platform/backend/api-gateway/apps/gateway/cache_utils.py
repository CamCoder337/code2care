"""
Utilitaires de cache Redis pour optimiser les performances
"""
from django.core.cache import cache
from django.conf import settings
import json
import hashlib
from functools import wraps
import logging

logger = logging.getLogger(__name__)

def cache_key(*args, **kwargs):
    """Génère une clé de cache unique basée sur les arguments"""
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()

def cache_result(timeout=300, key_prefix=""):
    """
    Décorateur pour mettre en cache les résultats de fonction
    
    Args:
        timeout: Durée en secondes (défaut: 5 minutes)
        key_prefix: Préfixe pour la clé de cache
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Générer la clé de cache
            cache_key_str = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Essayer de récupérer du cache
            result = cache.get(cache_key_str)
            if result is not None:
                logger.debug(f"Cache HIT: {cache_key_str}")
                return result
            
            # Calculer et mettre en cache
            logger.debug(f"Cache MISS: {cache_key_str}")
            result = func(*args, **kwargs)
            cache.set(cache_key_str, result, timeout)
            
            return result
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern):
    """Invalide tous les caches correspondant à un pattern"""
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")
        keys = redis_conn.keys(f"*{pattern}*")
        if keys:
            redis_conn.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys for pattern: {pattern}")
    except Exception as e:
        logger.error(f"Error invalidating cache: {e}")

# Cache spécifique pour les profils utilisateurs
@cache_result(timeout=600, key_prefix="user_profile")
def get_cached_user_profile(user_type, user_id):
    """Cache les profils utilisateurs pour éviter les requêtes DB répétitives"""
    from .models import Patient, Professional
    
    if user_type == 'patient':
        return Patient.objects.select_related('user').get(user_id=user_id)
    elif user_type == 'professional':
        return Professional.objects.select_related('user').get(professional_id=user_id)
    return None

# Cache pour les données statiques
@cache_result(timeout=3600, key_prefix="departments")
def get_cached_departments():
    """Cache la liste des départements"""
    # Cette fonction sera appelée depuis le feedback-service
    pass

@cache_result(timeout=1800, key_prefix="jwt_decode")
def get_cached_jwt_decode(token_hash):
    """Cache les tokens JWT décodés"""
    pass