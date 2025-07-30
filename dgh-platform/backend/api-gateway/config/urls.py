# api-gateway/config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="DGH API Gateway",
        default_version='v1',
        description="API Gateway pour le système DGH - Point d'entrée vers les microservices",
        terms_of_service="https://www.dgh.cm/terms/",
        contact=openapi.Contact(email="tech@dgh.cm"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    authentication_classes=[],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/v1/auth/', include('apps.users.urls')),
    
    # Feedback endpoints pour patients (via proxy)
    path('', include('apps.gateway.urls')),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Health check
    path('health/', include('apps.gateway.urls')),
]
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Note: Les autres routes sont gérées par le ServiceRoutingMiddleware
