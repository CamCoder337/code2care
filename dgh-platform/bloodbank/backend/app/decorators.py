# app/decorators.py
from functools import wraps
from rest_framework.permissions import AllowAny

def global_allow_any(view_class):
    """
    Décorateur pour appliquer AllowAny à toutes les vues de classe
    """
    view_class.permission_classes = [AllowAny]
    return view_class

def method_permission_classes(permissions):
    """
    Décorateur pour appliquer des permissions spécifiques à une méthode
    """
    def decorator(method):
        @wraps(method)
        def wrapper(self, request, *args, **kwargs):
            self.permission_classes = permissions
            return method(self, request, *args, **kwargs)
        return wrapper
    return decorator