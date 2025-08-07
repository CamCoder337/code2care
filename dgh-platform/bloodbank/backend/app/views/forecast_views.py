
# app/views/forecast_views.py (minimal pour éviter les erreurs)
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse

class SmartForecastingAPIView(APIView):
    def get(self, request):
        return Response({"message": "Forecast API placeholder"})

def simple_forecast_test(request):
    return JsonResponse({"status": "test"})

def forecast_dashboard(request):
    return JsonResponse({"dashboard": "placeholder"})

def forecast_api_test(request):
    return JsonResponse({"test": "ok"})