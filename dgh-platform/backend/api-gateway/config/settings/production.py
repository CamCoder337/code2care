from .base import *
from decouple import config
import os

# Database
DATABASES = {
    'default': config('DATABASE_URL', cast=db_url)
}
# CSRF trusted origins pour Railway
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='https://h5-gateway.up.railway.app', cast=lambda v: [s.strip() for s in v.split(',')])

# CSRF Security Settings for Production
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True  
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = False
# Static files avec WhiteNoise
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.gateway.middleware.ServiceRoutingMiddleware',
    'apps.gateway.middleware.RequestTracingMiddleware',
]

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Security
DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('DJANGO_SECRET_KEY', default=SECRET_KEY)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=lambda v: [s.strip() for s in v.split(',')])

# Sécurité pour production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'SAMEORIGIN'  # Permet l'admin Django au lieu de 'DENY'