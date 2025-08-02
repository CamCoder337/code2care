from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, Http404, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.core.cache import cache
from django.core.paginator import Paginator

from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum, Q, Avg
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta, date
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
import json
import csv
import io
import logging
from django.db.models import Count, Sum, Q, Avg, Extract
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.utils import timezone
from datetime import datetime, timedelta, date
from .decorators import global_allow_any

# Imports conditionnels pour les bibliothèques ML
try:
    import pandas as pd
    import numpy as np

    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


    # Créer des alternatives pour numpy si pas disponible
    class FakeNumpy:
        @staticmethod
        def random():
            import random
            class RandomModule:
                @staticmethod
                def poisson(lam, size=None):
                    if size is None:
                        return random.randint(max(1, int(lam * 0.7)), int(lam * 1.3))
                    return [random.randint(max(1, int(lam * 0.7)), int(lam * 1.3)) for _ in range(size)]

                @staticmethod
                def uniform(low, high, size=None):
                    if size is None:
                        return random.uniform(low, high)
                    return [random.uniform(low, high) for _ in range(size)]

            return RandomModule()

        @staticmethod
        def array(data):
            return data

        @staticmethod
        def std(data):
            if not data:
                return 0
            mean_val = sum(data) / len(data)
            return (sum((x - mean_val) ** 2 for x in data) / len(data)) ** 0.5

        @staticmethod
        def mean(data):
            return sum(data) / len(data) if data else 0

        @staticmethod
        def maximum(a, b):
            if isinstance(a, list) and isinstance(b, (int, float)):
                return [max(x, b) for x in a]
            return max(a, b)


    np = FakeNumpy()

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not available")

from .models import (
    Donor, Site, Department, Patient, BloodRecord,
    BloodUnit, BloodRequest, BloodConsumption, Prevision
)
from .serializers import (
    DonorSerializer, SiteSerializer, DepartmentSerializer,
    PatientSerializer, BloodRecordSerializer, BloodUnitSerializer,
    BloodRequestSerializer, BloodConsumptionSerializer, PrevisionSerializer
)

try:
    from .forecasting.blood_demand_forecasting import EnhancedBloodDemandForecaster, LightweightForecaster
    ENHANCED_FORECASTING_AVAILABLE = True
except ImportError:
    ENHANCED_FORECASTING_AVAILABLE = False

logger = logging.getLogger(__name__)



#************************************************#


@global_allow_any
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

#************************************************#
@global_allow_any
# Base class for all your API views
class BaseAPIView(APIView):
    """
    Base API view with proper renderer configuration
    """
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    permission_classes = []  # Override with your permission classes

    def handle_exception(self, exc):
        """Handle exceptions gracefully"""
        try:
            return super().handle_exception(exc)
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@global_allow_any
# ==================== PAGINATION ====================
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@global_allow_any
# ==================== DASHBOARD VIEWS ====================
class DashboardOverviewAPIView(BaseAPIView):
    """Vue principale du dashboard avec métriques temps réel"""

    def get(self, request):
        cache_key = 'dashboard_overview'
        data = cache.get(cache_key)

        if not data:
            try:
                # Statistiques générales
                total_units = BloodUnit.objects.count()
                available_units = BloodUnit.objects.filter(status='Available').count()
                expired_units = BloodUnit.objects.filter(status='Expired').count()
                used_units = BloodUnit.objects.filter(status='Used').count()

                # Stock par groupe sanguin
                stock_by_blood_type = BloodUnit.objects.filter(
                    status='Available'
                ).values('donor__blood_type').annotate(
                    count=Count('unit_id'),
                    total_volume=Sum('volume_ml')
                ).order_by('donor__blood_type')

                # Unités expirant bientôt (7 jours)
                expiring_soon = BloodUnit.objects.filter(
                    status='Available',
                    date_expiration__lte=timezone.now().date() + timedelta(days=7)
                ).count()

                # Demandes en attente
                pending_requests = BloodRequest.objects.filter(status='Pending').count()
                urgent_requests = BloodRequest.objects.filter(
                    status='Pending',
                    priority='Urgent'
                ).count()

                # Transfusions aujourd'hui
                today_transfusions = BloodConsumption.objects.filter(
                    date=timezone.now().date()
                ).count()

                # Évolution des stocks (30 derniers jours)
                thirty_days_ago = timezone.now().date() - timedelta(days=30)
                stock_evolution = []
                for i in range(30):
                    check_date = thirty_days_ago + timedelta(days=i)
                    daily_stock = BloodUnit.objects.filter(
                        collection_date__lte=check_date,
                        date_expiration__gt=check_date
                    ).count()
                    stock_evolution.append({
                        'date': check_date.isoformat(),
                        'stock': daily_stock
                    })

                data = {
                    'overview': {
                        'total_units': total_units,
                        'available_units': available_units,
                        'expired_units': expired_units,
                        'used_units': used_units,
                        'utilization_rate': round((used_units / total_units * 100), 2) if total_units > 0 else 0,
                        'expiring_soon': expiring_soon,
                        'pending_requests': pending_requests,
                        'urgent_requests': urgent_requests,
                        'today_transfusions': today_transfusions
                    },
                    'stock_by_blood_type': list(stock_by_blood_type),
                    'stock_evolution': stock_evolution,
                    'last_updated': timezone.now().isoformat()
                }

                # Cache for 5 minutes
                cache.set(cache_key, data, 300)

            except Exception as e:
                logger.error(f"Dashboard error: {str(e)}")
                return Response(
                    {'error': 'Erreur lors du chargement du dashboard'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(data)

@global_allow_any
class AlertsAPIView(BaseAPIView):
    """Alertes critiques pour le dashboard"""

    def get(self, request):
        alerts = []

        try:
            # Alertes stock faible
            for blood_type in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
                stock_count = BloodUnit.objects.filter(
                    donor__blood_type=blood_type,
                    status='Available'
                ).count()

                if stock_count < 5:  # Seuil critique
                    alerts.append({
                        'id': f'low_stock_{blood_type}',  # Ajout d'un ID unique
                        'type': 'low_stock',
                        'severity': 'critical' if stock_count < 2 else 'warning',
                        'message': f'Stock critique pour {blood_type}: {stock_count} unités',
                        'blood_type': blood_type,
                        'count': stock_count
                    })

            # Alertes expiration
            expiring_units = BloodUnit.objects.filter(
                status='Available',
                date_expiration__lte=timezone.now().date() + timedelta(days=3)
            ).select_related('donor')

            for unit in expiring_units:
                days_left = (unit.date_expiration - timezone.now().date()).days
                alerts.append({
                    'id': f'expiring_{unit.unit_id}',  # ID unique
                    'type': 'expiring',
                    'severity': 'critical' if days_left <= 1 else 'warning',
                    'message': f'Unité {unit.unit_id} expire dans {days_left} jour(s)',
                    'unit_id': unit.unit_id,
                    'blood_type': unit.donor.blood_type,
                    'days_left': days_left
                })

            # Alertes demandes urgentes non satisfaites
            urgent_requests = BloodRequest.objects.filter(
                status='Pending',
                priority='Urgent'
            ).select_related('department')

            for req in urgent_requests:
                alerts.append({
                    'id': f'urgent_{req.request_id}',  # ID unique
                    'type': 'urgent_request',
                    'severity': 'critical',
                    'message': f'Demande urgente {req.request_id} non satisfaite',
                    'request_id': req.request_id,
                    'blood_type': req.blood_type,
                    'department': req.department.name,
                    'quantity': req.quantity
                })

        except Exception as e:
            logger.error(f"Alerts error: {str(e)}")
            alerts.append({
                'id': 'system_error',
                'type': 'system_error',
                'severity': 'critical',
                'message': 'Erreur système lors du chargement des alertes'
            })

        return Response({
            'alerts': alerts,
            'count': len(alerts),
            'last_updated': timezone.now().isoformat()
        })

    def post(self, request):
        """Marquer toutes les alertes comme acquittées"""
        try:
            action = request.data.get('action')
            if action == 'acknowledge_all':
                # Logique pour marquer les alertes comme vues
                return Response({
                    'success': True,
                    'message': 'Toutes les alertes ont été marquées comme vues'
                })
            return Response({'error': 'Action non reconnue'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def patch(self, request, alert_id=None):
        """Résoudre une alerte spécifique"""
        try:
            # Récupérer l'alert_id depuis l'URL
            alert_id = request.resolver_match.kwargs.get('alert_id')
            action = request.data.get('action')

            if action == 'resolve':
                # Logique pour résoudre l'alerte
                return Response({
                    'success': True,
                    'message': f'Alerte {alert_id} résolue'
                })
            return Response({'error': 'Action non reconnue'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


@global_allow_any
# ==================== FORECASTING AI VIEWS ====================
class DemandForecastAPIView(BaseAPIView):
    """
    Prévisions de demande utilisant l'IA hybride (ARIMA + ML)
    Version améliorée avec support ARIMA/STL
    """
    permission_classes = [AllowAny]

    def __init__(self):
        super().__init__()
        if ENHANCED_FORECASTING_AVAILABLE:
            self.forecaster = EnhancedBloodDemandForecaster()
            self.lightweight_forecaster = LightweightForecaster()
        else:
            self.forecaster = None
            self.lightweight_forecaster = None

    def get(self, request):
        blood_type = request.GET.get('blood_type', 'O+')
        days_ahead = int(request.GET.get('days', 7))
        method = request.GET.get('method', 'auto')  # auto, arima, stl_arima, random_forest, xgboost
        use_lightweight = request.GET.get('lightweight', 'false').lower() == 'true'

        try:
            # Récupérer les données historiques
            historical_data = self.get_historical_consumption(blood_type)

            if len(historical_data) < 10:  # Seuil minimum réduit
                return Response({
                    'error': 'Données insuffisantes pour la prévision',
                    'required_minimum': 10,
                    'available_data_points': len(historical_data),
                    'blood_type': blood_type,
                    'fallback_used': True
                }, status=status.HTTP_400_BAD_REQUEST)

            # Choisir le forecaster selon la disponibilité et les préférences
            if not ENHANCED_FORECASTING_AVAILABLE or use_lightweight:
                # Utiliser l'ancienne méthode simplifiée
                forecast = self.generate_lightweight_forecast(historical_data, days_ahead, blood_type)
            else:
                # Utiliser le nouveau forecaster hybride
                forecast = self.generate_enhanced_forecast(historical_data, days_ahead, blood_type, method)

            # Sauvegarder les prévisions en base
            self.save_predictions(forecast['predictions'], blood_type)

            return Response({
                'blood_type': blood_type,
                'forecast_period_days': days_ahead,
                'method_used': forecast.get('method_used', 'lightweight'),
                'predictions': forecast['predictions'],
                'confidence_intervals': forecast.get('confidence_intervals', {}),
                'model_accuracy': self.get_model_accuracy(blood_type),
                'model_performance': forecast.get('model_performance', {}),
                'enhanced_forecasting_available': ENHANCED_FORECASTING_AVAILABLE,
                'generated_at': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Forecast error for {blood_type}: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la génération des prévisions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def generate_enhanced_forecast(self, historical_data, days_ahead, blood_type, method):
        """
        Génère les prévisions avec le forecaster hybride amélioré
        """
        try:
            # Convertir les données en DataFrame pandas
            df = self.prepare_dataframe_for_forecasting(historical_data)

            # Entraîner les modèles si pas encore fait
            if not hasattr(self.forecaster, f'trained_models') or not self.forecaster.trained_models:
                print(f"Training models for {blood_type}...")
                results, best_method = self.forecaster.train_comprehensive(df, blood_type)
                print(f"Training completed. Best method: {best_method}")

            # Générer les prévisions
            forecast_result = self.forecaster.predict_hybrid(
                blood_type=blood_type,
                days_ahead=days_ahead,
                method=method
            )

            return forecast_result

        except Exception as e:
            logger.error(f"Enhanced forecast generation error: {str(e)}")
            # Fallback vers la méthode légère
            return self.generate_lightweight_forecast(historical_data, days_ahead, blood_type)

    def generate_lightweight_forecast(self, historical_data, days_ahead, blood_type):
        """
        Génère les prévisions avec la méthode légère (fallback)
        """
        try:
            if ENHANCED_FORECASTING_AVAILABLE and self.lightweight_forecaster:
                # Utiliser le forecaster léger
                df = self.prepare_dataframe_for_forecasting(historical_data)
                train_result = self.lightweight_forecaster.quick_train(df, blood_type)
                predictions_array = self.lightweight_forecaster.fast_predict(blood_type, days_ahead)

                # Convertir en format standard
                predictions = []
                for i, pred in enumerate(predictions_array):
                    future_date = (timezone.now() + timedelta(days=i + 1)).date()
                    predictions.append({
                        'date': future_date.isoformat(),
                        'predicted_demand': max(1, int(pred)),
                        'confidence': 0.7
                    })

                return {
                    'predictions': predictions,
                    'method_used': 'lightweight',
                    'confidence_intervals': self.calculate_simple_confidence_intervals(predictions_array)
                }
            else:
                # Utiliser l'ancienne méthode (votre code original)
                return self.generate_simple_forecast(historical_data, days_ahead, blood_type)

        except Exception as e:
            logger.error(f"Lightweight forecast error: {str(e)}")
            return self.generate_simple_forecast(historical_data, days_ahead, blood_type)

    def prepare_dataframe_for_forecasting(self, historical_data):
        """
        Convertit les données historiques en DataFrame pandas pour le forecasting
        """
        try:
            # Convertir les données en DataFrame
            if isinstance(historical_data, list):
                df = pd.DataFrame(historical_data)
                if 'day' in df.columns:
                    df['date'] = pd.to_datetime(df['day'])
                    df = df.set_index('date')
                elif 'date' in df.columns:
                    df['date'] = pd.to_datetime(df['date'])
                    df = df.set_index('date')
            else:
                df = historical_data.copy()

            # S'assurer que nous avons une colonne 'demand'
            if 'volume' in df.columns and 'demand' not in df.columns:
                df['demand'] = df['volume']
            elif 'count' in df.columns and 'demand' not in df.columns:
                df['demand'] = df['count']

            # Nettoyer et trier
            df = df.sort_index()
            df['demand'] = pd.to_numeric(df['demand'], errors='coerce').fillna(0)

            return df

        except Exception as e:
            logger.error(f"DataFrame preparation error: {str(e)}")
            # Créer un DataFrame minimal
            dates = pd.date_range(
                start=timezone.now().date() - timedelta(days=30),
                end=timezone.now().date(),
                freq='D'
            )
            return pd.DataFrame({
                'demand': np.random.poisson(10, len(dates))
            }, index=dates)

    def calculate_simple_confidence_intervals(self, predictions_array):
        """
        Calcul simple des intervalles de confiance
        """
        try:
            predictions_array = np.array(predictions_array)
            std_dev = np.std(predictions_array) if len(predictions_array) > 1 else np.mean(predictions_array) * 0.2

            lower_bound = np.maximum(predictions_array - 1.96 * std_dev, 0)
            upper_bound = predictions_array + 1.96 * std_dev

            return {
                'lower': lower_bound.tolist(),
                'upper': upper_bound.tolist()
            }
        except:
            return {'lower': [], 'upper': []}

    def generate_simple_forecast(self, historical_data, days_ahead, blood_type):
        """
        Méthode de prévision simple (votre code original amélioré)
        """
        try:
            if not historical_data:
                base_demand = 10
            else:
                # Calculer la moyenne des 30 derniers jours
                recent_data = historical_data[-30:] if len(historical_data) >= 30 else historical_data
                if isinstance(recent_data[0], dict):
                    volumes = [d.get('volume', d.get('count', 10)) for d in recent_data]
                else:
                    volumes = recent_data
                base_demand = sum(volumes) / len(volumes) if volumes else 10

            predictions = []

            for i in range(days_ahead):
                future_date = (timezone.now() + timedelta(days=i + 1)).date()

                # Facteurs saisonniers simples
                day_of_week = future_date.weekday()
                weekend_factor = 0.8 if day_of_week >= 5 else 1.0  # Moins de demande le weekend
                monday_factor = 1.2 if day_of_week == 0 else 1.0  # Plus de demande le lundi

                # Variation aléatoire légère
                random_factor = np.random.uniform(0.9, 1.1)

                # Calcul de la prédiction
                predicted_demand = base_demand * weekend_factor * monday_factor * random_factor

                predictions.append({
                    'date': future_date.isoformat(),
                    'predicted_demand': max(1, int(predicted_demand)),
                    'confidence': 0.65
                })

            return {
                'predictions': predictions,
                'method_used': 'simple_average',
                'confidence_intervals': {
                    'lower': [max(1, int(p['predicted_demand'] * 0.8)) for p in predictions],
                    'upper': [int(p['predicted_demand'] * 1.2) for p in predictions]
                }
            }

        except Exception as e:
            logger.error(f"Simple forecast error: {str(e)}")
            # Prédiction de secours ultra-simple
            predictions = []
            for i in range(days_ahead):
                future_date = (timezone.now() + timedelta(days=i + 1)).date()
                predictions.append({
                    'date': future_date.isoformat(),
                    'predicted_demand': 10,
                    'confidence': 0.5
                })

            return {
                'predictions': predictions,
                'method_used': 'fallback',
                'confidence_intervals': {'lower': [8] * days_ahead, 'upper': [12] * days_ahead}
            }

    def get_historical_consumption(self, blood_type):
        """Récupère les données historiques de consommation (votre méthode existante)"""
        try:
            from .models import BloodConsumption

            base_query = BloodConsumption.objects.select_related('unit__donor')

            if blood_type != 'all':
                base_query = base_query.filter(unit__donor__blood_type=blood_type)

            # Agrégation par jour
            daily_consumption = base_query.extra(
                select={'day': 'DATE(date)'}
            ).values('day').annotate(
                volume=Sum('volume'),
                count=Count('id')
            ).order_by('day')

            return list(daily_consumption)

        except Exception as e:
            logger.error(f"Error getting historical data: {str(e)}")
            # Données de test si erreur
            return [
                {'day': (timezone.now().date() - timedelta(days=i)).isoformat(), 'volume': np.random.poisson(10)}
                for i in range(30, 0, -1)
            ]

    def save_predictions(self, predictions, blood_type):
        """Sauvegarde les prévisions en base de données (votre méthode existante)"""
        try:
            from .models import Prevision

            for pred in predictions:
                if isinstance(pred, dict):
                    date_str = pred['date']
                    volume = pred.get('predicted_demand', pred.get('predicted_volume', 10))
                    confidence = pred.get('confidence', 0.8)
                else:
                    continue

                prevision_id = f"PRED_{blood_type}_{date_str.replace('-', '')}"

                Prevision.objects.update_or_create(
                    prevision_id=prevision_id,
                    defaults={
                        'blood_type': blood_type,
                        'prevision_date': date_str,
                        'previsional_volume': int(volume),
                        'fiability': confidence
                    }
                )
        except Exception as e:
            logger.error(f"Error saving predictions: {str(e)}")

    def get_model_accuracy(self, blood_type):
        """Calcule la précision du modèle (votre méthode existante)"""
        try:
            from .models import Prevision, BloodConsumption

            # Comparaison prévisions vs réalité des 7 derniers jours
            week_ago = timezone.now().date() - timedelta(days=7)

            predictions = Prevision.objects.filter(
                blood_type=blood_type,
                prevision_date__gte=week_ago
            )

            if not predictions.exists():
                return {'accuracy': 'N/A', 'samples': 0}

            total_error = 0
            sample_count = 0

            for pred in predictions:
                actual = BloodConsumption.objects.filter(
                    unit__donor__blood_type=blood_type,
                    date=pred.prevision_date
                ).aggregate(total=Sum('volume'))['total'] or 0

                if actual > 0:
                    error = abs(pred.previsional_volume - actual) / actual
                    total_error += error
                    sample_count += 1

            if sample_count > 0:
                accuracy = (1 - (total_error / sample_count)) * 100
                return {'accuracy': f"{accuracy:.1f}%", 'samples': sample_count}

            return {'accuracy': 'N/A', 'samples': 0}

        except Exception as e:
            logger.error(f"Error calculating accuracy: {str(e)}")
            return {'accuracy': 'Error', 'samples': 0}


@global_allow_any
# ==================== OPTIMIZATION VIEWS ====================
class OptimizationRecommendationsAPIView(BaseAPIView):
    """Recommandations d'optimisation des stocks"""

    def get(self, request):
        try:
            recommendations = []

            # Analyser chaque groupe sanguin
            for blood_type in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
                analysis = self.analyze_blood_type_optimization(blood_type)
                if analysis:
                    recommendations.append(analysis)

            # Recommandations générales
            general_recommendations = self.get_general_recommendations()

            return Response({
                'blood_type_recommendations': recommendations,
                'general_recommendations': general_recommendations,
                'generated_at': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Optimization error: {str(e)}")
            return Response(
                {'error': 'Erreur lors de la génération des recommandations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def analyze_blood_type_optimization(self, blood_type):
        """Analyse d'optimisation pour un groupe sanguin"""
        try:
            # Stock actuel
            current_stock = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                status='Available'
            ).count()

            # Consommation moyenne (30 derniers jours)
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            avg_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__gte=thirty_days_ago
            ).count() / 30

            # Unités expirant dans les 7 jours
            expiring_soon = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                status='Available',
                date_expiration__lte=timezone.now().date() + timedelta(days=7)
            ).count()

            # Calculs d'optimisation
            recommended_stock = max(7, int(avg_consumption * 10))  # 10 jours de stock
            stock_deficit = max(0, recommended_stock - current_stock)

            recommendation = {
                'blood_type': blood_type,
                'current_stock': current_stock,
                'recommended_stock': recommended_stock,
                'stock_deficit': stock_deficit,
                'avg_daily_consumption': round(avg_consumption, 2),
                'expiring_soon': expiring_soon,
                'days_of_supply': round(current_stock / avg_consumption, 1) if avg_consumption > 0 else float('inf'),
                'priority': self.calculate_priority(current_stock, avg_consumption, expiring_soon),
                'actions': self.generate_actions(blood_type, current_stock, avg_consumption, expiring_soon)
            }

            return recommendation

        except Exception as e:
            logger.error(f"Error analyzing {blood_type}: {str(e)}")
            return None

    def calculate_priority(self, current_stock, avg_consumption, expiring_soon):
        """Calcule la priorité d'action"""
        if current_stock < 2 or (avg_consumption > 0 and current_stock / avg_consumption < 3):
            return 'critical'
        elif expiring_soon > current_stock * 0.3:
            return 'high'
        elif current_stock < avg_consumption * 7:
            return 'medium'
        else:
            return 'low'

    def generate_actions(self, blood_type, current_stock, avg_consumption, expiring_soon):
        """Génère les actions recommandées"""
        actions = []

        if current_stock < 2:
            actions.append({
                'type': 'urgent_collection',
                'message': f'Collection urgente nécessaire pour {blood_type}',
                'priority': 'critical'
            })

        if expiring_soon > 0:
            actions.append({
                'type': 'use_expiring',
                'message': f'Utiliser en priorité les {expiring_soon} unités expirant bientôt',
                'priority': 'high'
            })

        if avg_consumption > 0 and current_stock > avg_consumption * 14:
            actions.append({
                'type': 'reduce_collection',
                'message': f'Réduire la collection pour {blood_type} (surstock)',
                'priority': 'medium'
            })

        return actions

    def get_general_recommendations(self):
        """Recommandations générales du système"""
        try:
            recommendations = []

            # Analyse des pertes par expiration
            expired_last_month = BloodUnit.objects.filter(
                status='Expired',
                date_expiration__gte=timezone.now().date() - timedelta(days=30)
            ).count()

            if expired_last_month > 10:
                recommendations.append({
                    'type': 'waste_reduction',
                    'message': f'{expired_last_month} unités expirées le mois dernier. Optimiser la rotation des stocks.',
                    'priority': 'high'
                })

            # Analyse des demandes non satisfaites
            pending_requests = BloodRequest.objects.filter(status='Pending').count()
            if pending_requests > 5:
                recommendations.append({
                    'type': 'fulfill_requests',
                    'message': f'{pending_requests} demandes en attente. Vérifier la disponibilité des stocks.',
                    'priority': 'medium'
                })

            return recommendations

        except Exception as e:
            logger.error(f"Error generating general recommendations: {str(e)}")
            return []

@global_allow_any
# ==================== DATA IMPORT VIEWS ====================
@method_decorator(csrf_exempt, name='dispatch')
class DataImportAPIView(BaseAPIView):
    """Import des données CSV fournies par les organisateurs"""

    def post(self, request):
        try:
            csv_file = request.FILES.get('csv_file')
            if not csv_file:
                return Response(
                    {'error': 'Fichier CSV requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Lire le fichier CSV
            file_data = csv_file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(file_data))

            imported_count = 0
            errors = []

            with transaction.atomic():
                for row_num, row in enumerate(csv_reader, start=2):
                    try:
                        self.process_csv_row(row, row_num)
                        imported_count += 1
                    except Exception as e:
                        errors.append(f"Ligne {row_num}: {str(e)}")
                        if len(errors) > 50:  # Limiter les erreurs affichées
                            errors.append("... (plus d'erreurs tronquées)")
                            break

            return Response({
                'success': True,
                'imported_records': imported_count,
                'errors': errors,
                'total_errors': len(errors)
            })

        except Exception as e:
            logger.error(f"CSV Import error: {str(e)}")
            return Response(
                {'error': f'Erreur lors de l\'import: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def process_csv_row(self, row, row_num):
        """Traite une ligne du CSV"""
        # Nettoyer les données
        record_id = row.get('record_id', '').strip()
        donor_id = row.get('donor_id', '').strip()

        # Valeurs par défaut si manquantes
        if not record_id:
            record_id = f"BB{str(row_num).zfill(6)}"

        if not donor_id:
            donor_id = f"D{str(row_num).zfill(6)}"

        # Créer ou récupérer le site
        collection_site = row.get('collection_site', 'Site Inconnu').strip()
        if not collection_site:
            collection_site = 'Site Inconnu'

        site, _ = Site.objects.get_or_create(
            site_id=f"SITE_{collection_site.replace(' ', '_').upper()}",
            defaults={
                'nom': collection_site,
                'ville': 'Douala'  # Valeur par défaut
            }
        )

        # Créer ou récupérer le donneur
        donor_age = self.safe_float(row.get('donor_age'))
        donor_gender = row.get('donor_gender', 'M').strip()
        blood_type = row.get('blood_type', 'O+').strip()

        # Calculer date de naissance approximative
        birth_date = date.today() - timedelta(days=int(donor_age * 365)) if donor_age else date(1980, 1, 1)

        donor, _ = Donor.objects.get_or_create(
            donor_id=donor_id,
            defaults={
                'first_name': f'Donneur_{donor_id}',
                'last_name': 'Anonyme',
                'date_of_birth': birth_date,
                'gender': donor_gender if donor_gender in ['M', 'F'] else 'M',
                'blood_type': blood_type if blood_type in [choice[0] for choice in Donor.BLOOD_TYPE_CHOICES] else 'O+',
                'phone_number': '000000000'
            }
        )

        # Créer l'enregistrement de don
        donation_date = self.parse_date(row.get('donation_date'))

        blood_record, _ = BloodRecord.objects.get_or_create(
            record_id=record_id,
            defaults={
                'site': site,
                'screening_results': 'Valid',
                'record_date': donation_date or date.today(),
                'quantity': 1
            }
        )

        # Créer l'unité de sang
        unit_id = record_id  # Utiliser le même ID
        collection_date = donation_date or date.today()
        expiry_date = self.parse_date(row.get('expiry_date'))

        # Si pas de date d'expiration, calculer (120 jours après collection)
        if not expiry_date:
            expiry_date = collection_date + timedelta(days=120)

        volume_ml = self.safe_int(row.get('collection_volume_ml'), 450)
        hemoglobin = self.safe_float(row.get('hemoglobin_g_dl'))

        # Déterminer le statut
        status = 'Available'
        if expiry_date < date.today():
            status = 'Expired'

        BloodUnit.objects.get_or_create(
            unit_id=unit_id,
            defaults={
                'donor': donor,
                'record': blood_record,
                'collection_date': collection_date,
                'volume_ml': volume_ml,
                'hemoglobin_g_dl': hemoglobin,
                'date_expiration': expiry_date,
                'status': status
            }
        )

    def safe_int(self, value, default=0):
        """Conversion sécurisée en entier"""
        try:
            return int(float(value)) if value and str(value).strip() else default
        except (ValueError, TypeError):
            return default

    def safe_float(self, value, default=None):
        """Conversion sécurisée en float"""
        try:
            return float(value) if value and str(value).strip() else default
        except (ValueError, TypeError):
            return default

    def parse_date(self, date_string):
        """Parse une date au format YYYY-MM-DD"""
        if not date_string or not str(date_string).strip():
            return None

        try:
            return datetime.strptime(str(date_string).strip(), '%Y-%m-%d').date()
        except ValueError:
            try:
                return datetime.strptime(str(date_string).strip(), '%d/%m/%Y').date()
            except ValueError:
                return None

@global_allow_any
# ==================== CRUD VIEWS ====================
class BloodUnitListAPIView(generics.ListAPIView):
    """Liste des unités de sang avec filtrage"""
    serializer_class = BloodUnitSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = BloodUnit.objects.select_related('donor', 'record__site').all()

        # Filtres
        blood_type = self.request.query_params.get('blood_type')
        status = self.request.query_params.get('status')
        expiring_days = self.request.query_params.get('expiring_days')

        if blood_type:
            queryset = queryset.filter(donor__blood_type=blood_type)

        if status:
            queryset = queryset.filter(status=status)

        if expiring_days:
            try:
                days = int(expiring_days)
                expiry_threshold = timezone.now().date() + timedelta(days=days)
                queryset = queryset.filter(
                    status='Available',
                    date_expiration__lte=expiry_threshold
                )
            except ValueError:
                pass

        return queryset.order_by('-collection_date')

@global_allow_any
class BloodRequestListCreateAPIView(generics.ListCreateAPIView):
    """Liste et création des demandes de sang"""
    serializer_class = BloodRequestSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = BloodRequest.objects.select_related('department', 'site').all()

        # Filtres
        status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        blood_type = self.request.query_params.get('blood_type')
        department = self.request.query_params.get('department')

        if status:
            queryset = queryset.filter(status=status)

        if priority:
            queryset = queryset.filter(priority=priority)

        if blood_type:
            queryset = queryset.filter(blood_type=blood_type)

        if department:
            queryset = queryset.filter(department__name__icontains=department)

        return queryset.order_by('-request_date', 'priority')






@global_allow_any
class BloodRequestDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Détail, mise à jour et suppression d'une demande de sang"""
    queryset = BloodRequest.objects.select_related('department', 'site').all()
    serializer_class = BloodRequestSerializer
    lookup_field = 'request_id'

    def get_object(self):
        """Récupérer l'objet avec gestion d'erreur"""
        try:
            return super().get_object()
        except BloodRequest.DoesNotExist:
            from django.http import Http404
            raise Http404("Demande de sang non trouvée")


@global_allow_any
class BloodConsumptionListCreateAPIView(generics.ListCreateAPIView):
    """Liste et création des consommations de sang"""
    serializer_class = BloodConsumptionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = BloodConsumption.objects.select_related(
            'request', 'unit__donor', 'patient'
        ).all()

        # Filtres
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        blood_type = self.request.query_params.get('blood_type')

        if date_from:
            try:
                queryset = queryset.filter(date__gte=date_from)
            except ValueError:
                pass

        if date_to:
            try:
                queryset = queryset.filter(date__lte=date_to)
            except ValueError:
                pass

        if blood_type:
            queryset = queryset.filter(unit__donor__blood_type=blood_type)

        return queryset.order_by('-date')

@global_allow_any
# ==================== ANALYTICS VIEWS ====================
class InventoryAnalyticsAPIView(BaseAPIView):
    """Analytics avancés des stocks - Version corrigée pour PostgreSQL"""

    def get(self, request):
        period = request.GET.get('period', '30')  # jours

        try:
            days = int(period)
            start_date = timezone.now().date() - timedelta(days=days)

            # Évolution des stocks par groupe sanguin
            stock_evolution = self.get_stock_evolution(start_date, days)

            # Taux d'utilisation
            utilization_rates = self.get_utilization_rates(start_date)

            # Analyse des pertes - Version PostgreSQL
            waste_analysis = self.get_waste_analysis_postgresql(start_date)

            # Tendances de demande - Version PostgreSQL
            demand_trends = self.get_demand_trends_postgresql(start_date)

            # Métriques de performance
            performance_metrics = self.get_performance_metrics(start_date)

            return Response({
                'period_days': days,
                'stock_evolution': stock_evolution,
                'utilization_rates': utilization_rates,
                'waste_analysis': waste_analysis,
                'demand_trends': demand_trends,
                'performance_metrics': performance_metrics,
                'generated_at': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Analytics error: {str(e)}")
            return Response(
                {'error': 'Erreur lors de la génération des analytics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_stock_evolution(self, start_date, days):
        """Évolution des stocks sur la période"""
        evolution = []

        for i in range(days):
            check_date = start_date + timedelta(days=i)

            daily_stocks = {}
            for blood_type in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
                stock_count = BloodUnit.objects.filter(
                    donor__blood_type=blood_type,
                    collection_date__lte=check_date,
                    date_expiration__gt=check_date
                ).count()
                daily_stocks[blood_type] = stock_count

            evolution.append({
                'date': check_date.isoformat(),
                'stocks': daily_stocks,
                'total': sum(daily_stocks.values())
            })

        return evolution

    def get_utilization_rates(self, start_date):
        """Taux d'utilisation par groupe sanguin"""
        rates = []

        for blood_type in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            # Unités collectées
            collected = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                collection_date__gte=start_date
            ).count()

            # Unités utilisées
            used = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                collection_date__gte=start_date,
                status='Used'
            ).count()

            # Unités expirées
            expired = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                collection_date__gte=start_date,
                status='Expired'
            ).count()

            utilization_rate = (used / collected * 100) if collected > 0 else 0
            waste_rate = (expired / collected * 100) if collected > 0 else 0

            rates.append({
                'blood_type': blood_type,
                'collected': collected,
                'used': used,
                'expired': expired,
                'utilization_rate': round(utilization_rate, 2),
                'waste_rate': round(waste_rate, 2)
            })

        return rates

    # Correction de la méthode get_waste_analysis_postgresql
    def get_waste_analysis_postgresql(self, start_date):
        """Analyse des pertes - Version corrigée"""
        try:
            # Utiliser TruncMonth correctement importé
            expired_units = BloodUnit.objects.filter(
                status='Expired',
                date_expiration__gte=start_date
            ).annotate(
                month=TruncMonth('date_expiration')
            ).values('month', 'donor__blood_type').annotate(
                count=Count('unit_id'),
                total_volume=Sum('volume_ml')
            ).order_by('month')

            # Conversion en format lisible
            monthly_waste = []
            for item in expired_units:
                month_str = item['month'].strftime('%Y-%m') if item['month'] else 'Unknown'
                monthly_waste.append({
                    'month': month_str,
                    'blood_type': item['donor__blood_type'],
                    'count': item['count'],
                    'total_volume': item['total_volume'] or 0
                })

            # Coût estimé des pertes
            total_expired = sum(item['count'] for item in monthly_waste)
            estimated_cost = total_expired * 50000  # 50000 FCFA par unité

            return {
                'monthly_waste': monthly_waste,
                'total_expired_units': total_expired,
                'estimated_cost_fcfa': estimated_cost,
                'main_causes': [
                    {'cause': 'Expiration naturelle', 'percentage': 70},
                    {'cause': 'Problèmes de rotation', 'percentage': 20},
                    {'cause': 'Défauts de stockage', 'percentage': 10}
                ]
            }
        except Exception as e:
            logger.error(f"Waste analysis error: {str(e)}")
            return {
                'monthly_waste': [],
                'total_expired_units': 0,
                'estimated_cost_fcfa': 0,
                'main_causes': []
            }

    def get_demand_trends_postgresql(self, start_date):
        """Tendances de demande - Version corrigée"""
        try:
            # Utiliser TruncWeek correctement importé
            weekly_demands = BloodRequest.objects.filter(
                request_date__gte=start_date
            ).annotate(
                week=TruncWeek('request_date'),
                year=Extract('request_date', 'year'),
                week_number=Extract('request_date', 'week')
            ).values('week', 'year', 'week_number', 'blood_type').annotate(
                total_quantity=Sum('quantity')
            ).order_by('week')

            # Conversion en format lisible
            weekly_trends = []
            for item in weekly_demands:
                week_str = f"{item['year']}-W{item['week_number']:02d}" if item['year'] and item[
                    'week_number'] else 'Unknown'
                weekly_trends.append({
                    'week': week_str,
                    'blood_type': item['blood_type'],
                    'total_quantity': item['total_quantity']
                })

            # Demandes par département
            dept_demands = BloodRequest.objects.filter(
                request_date__gte=start_date
            ).values('department__name').annotate(
                total_requests=Count('request_id'),
                total_quantity=Sum('quantity')
            ).order_by('-total_quantity')

            return {
                'weekly_trends': weekly_trends,
                'department_distribution': list(dept_demands),
                'peak_demand_days': self.get_peak_demand_days(start_date)
            }
        except Exception as e:
            logger.error(f"Demand trends error: {str(e)}")
            return {
                'weekly_trends': [],
                'department_distribution': [],
                'peak_demand_days': []
            }

    def get_peak_demand_days(self, start_date):
        """Jours de pic de demande"""
        try:
            daily_demands = BloodRequest.objects.filter(
                request_date__gte=start_date
            ).values('request_date').annotate(
                total_quantity=Sum('quantity')
            ).order_by('-total_quantity')[:10]

            return [
                {
                    'request_date': item['request_date'].isoformat() if item['request_date'] else None,
                    'total_quantity': item['total_quantity']
                }
                for item in daily_demands
            ]
        except Exception as e:
            logger.error(f"Peak demand days error: {str(e)}")
            return []

    def get_performance_metrics(self, start_date):
        """Métriques de performance globales"""
        try:
            # Temps moyen de satisfaction des demandes
            fulfilled_requests = BloodRequest.objects.filter(
                request_date__gte=start_date,
                status='Fulfilled'
            )

            # Stock de sécurité par groupe sanguin
            safety_stock_status = []
            for blood_type in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
                current_stock = BloodUnit.objects.filter(
                    donor__blood_type=blood_type,
                    status='Available'
                ).count()

                # Consommation moyenne des 7 derniers jours
                week_consumption = BloodConsumption.objects.filter(
                    unit__donor__blood_type=blood_type,
                    date__gte=timezone.now().date() - timedelta(days=7)
                ).count()

                avg_daily_consumption = week_consumption / 7
                days_of_supply = current_stock / avg_daily_consumption if avg_daily_consumption > 0 else float('inf')

                safety_stock_status.append({
                    'blood_type': blood_type,
                    'current_stock': current_stock,
                    'days_of_supply': round(days_of_supply, 1) if days_of_supply != float('inf') else 999,
                    'status': 'safe' if days_of_supply >= 7 else 'critical' if days_of_supply < 3 else 'warning'
                })

            total_requests = BloodRequest.objects.filter(request_date__gte=start_date).count()
            fulfillment_rate = round(fulfilled_requests.count() / total_requests * 100, 2) if total_requests > 0 else 0

            return {
                'total_requests': total_requests,
                'fulfilled_requests': fulfilled_requests.count(),
                'fulfillment_rate': fulfillment_rate,
                'safety_stock_status': safety_stock_status,
                'average_stock_turnover': self.calculate_stock_turnover(start_date)
            }
        except Exception as e:
            logger.error(f"Performance metrics error: {str(e)}")
            return {
                'total_requests': 0,
                'fulfilled_requests': 0,
                'fulfillment_rate': 0,
                'safety_stock_status': [],
                'average_stock_turnover': 0
            }

    def calculate_stock_turnover(self, start_date):
        """Calcule la rotation moyenne des stocks"""
        try:
            total_used = BloodUnit.objects.filter(
                collection_date__gte=start_date,
                status='Used'
            ).count()

            avg_stock = BloodUnit.objects.filter(
                collection_date__gte=start_date
            ).count() / 2  # Approximation du stock moyen

            return round(total_used / avg_stock, 2) if avg_stock > 0 else 0
        except:
            return 0


@global_allow_any
# ==================== REPORTING VIEWS ====================
class ReportExportAPIView(BaseAPIView):
    """Export de rapports en CSV"""

    def get(self, request):
        report_type = request.GET.get('type', 'inventory')
        format_type = request.GET.get('format', 'csv')

        try:
            if report_type == 'inventory':
                return self.export_inventory_report(format_type)
            elif report_type == 'consumption':
                return self.export_consumption_report(format_type)
            elif report_type == 'waste':
                return self.export_waste_report(format_type)
            elif report_type == 'donors':
                return self.export_donors_report(format_type)
            else:
                return Response(
                    {'error': 'Type de rapport non supporté'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Report export error: {str(e)}")
            return Response(
                {'error': 'Erreur lors de l\'export du rapport'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def export_inventory_report(self, format_type):
        """Export du rapport d'inventaire"""
        response = HttpResponse(content_type='text/csv')
        response[
            'Content-Disposition'] = f'attachment; filename="inventory_report_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Unit ID', 'Blood Type', 'Status', 'Collection Date',
            'Expiry Date', 'Volume (ml)', 'Hemoglobin (g/dl)',
            'Site', 'Days to Expiry'
        ])

        units = BloodUnit.objects.select_related('donor', 'record__site').all()

        for unit in units:
            writer.writerow([
                unit.unit_id,
                unit.donor.blood_type,
                unit.status,
                unit.collection_date,
                unit.date_expiration,
                unit.volume_ml,
                unit.hemoglobin_g_dl or '',
                unit.record.site.nom,
                unit.days_until_expiry
            ])

        return response

    def export_consumption_report(self, format_type):
        """Export du rapport de consommation"""
        response = HttpResponse(content_type='text/csv')
        response[
            'Content-Disposition'] = f'attachment; filename="consumption_report_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Date', 'Unit ID', 'Blood Type', 'Patient',
            'Department', 'Volume', 'Request ID'
        ])

        consumptions = BloodConsumption.objects.select_related(
            'unit__donor', 'patient', 'request__department'
        ).all()

        for consumption in consumptions:
            writer.writerow([
                consumption.date,
                consumption.unit.unit_id,
                consumption.unit.donor.blood_type,
                f"{consumption.patient.first_name} {consumption.patient.last_name}",
                consumption.request.department.name,
                consumption.volume,
                consumption.request.request_id
            ])

        return response

    def export_waste_report(self, format_type):
        """Export du rapport de gaspillage"""
        response = HttpResponse(content_type='text/csv')
        response[
            'Content-Disposition'] = f'attachment; filename="waste_report_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Unit ID', 'Blood Type', 'Collection Date',
            'Expiry Date', 'Volume (ml)', 'Site', 'Days Expired'
        ])

        expired_units = BloodUnit.objects.filter(status='Expired').select_related('donor', 'record__site')

        for unit in expired_units:
            days_expired = (timezone.now().date() - unit.date_expiration).days
            writer.writerow([
                unit.unit_id,
                unit.donor.blood_type,
                unit.collection_date,
                unit.date_expiration,
                unit.volume_ml,
                unit.record.site.nom,
                days_expired
            ])

        return response

    def export_donors_report(self, format_type):
        """Export du rapport des donneurs"""
        response = HttpResponse(content_type='text/csv')
        response[
            'Content-Disposition'] = f'attachment; filename="donors_report_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Donor ID', 'Name', 'Age', 'Gender', 'Blood Type',
            'Phone', 'Total Donations', 'Last Donation'
        ])

        donors = Donor.objects.all()

        for donor in donors:
            total_donations = BloodUnit.objects.filter(donor=donor).count()
            last_donation = BloodUnit.objects.filter(donor=donor).order_by('-collection_date').first()
            last_donation_date = last_donation.collection_date if last_donation else ''

            writer.writerow([
                donor.donor_id,
                f"{donor.first_name} {donor.last_name}",
                donor.age,
                donor.get_gender_display(),
                donor.blood_type,
                donor.phone_number,
                total_donations,
                last_donation_date
            ])

        return response

@global_allow_any
# ==================== CONFIGURATION VIEWS ====================
class SystemConfigAPIView(BaseAPIView):
    """Configuration du système"""

    def get(self, request):
        """Récupérer la configuration actuelle"""
        return Response({
            'blood_types': [choice[0] for choice in Donor.BLOOD_TYPE_CHOICES],
            'unit_statuses': [choice[0] for choice in BloodUnit.STATUS_CHOICES],
            'request_priorities': [choice[0] for choice in BloodRequest.PRIORITY_CHOICES],
            'default_expiry_days': 120,
            'minimum_stock_levels': {
                'A+': 10, 'A-': 5, 'B+': 8, 'B-': 4,
                'AB+': 3, 'AB-': 2, 'O+': 15, 'O-': 8
            },
            'alert_thresholds': {
                'low_stock': 5,
                'expiring_soon_days': 7,
                'critical_stock': 2
            }
        })

# ==================== ERROR HANDLERS ====================
from django.http import HttpResponse

def custom_404_view(request, exception):
    """Vue personnalisée pour les erreurs 404"""
    return JsonResponse({
        'error': 'Ressource non trouvée',
        'status_code': 404
    }, status=404)

def custom_500_view(request):
    """Vue personnalisée pour les erreurs 500"""
    return JsonResponse({
        'error': 'Erreur interne du serveur',
        'status_code': 500
    }, status=500)

# ==================== UTILITY FUNCTIONS ====================
def calculate_compatibility_matrix():
    """Calcule la matrice de compatibilité des groupes sanguins"""
    compatibility = {
        'A+': ['A+', 'AB+'],
        'A-': ['A+', 'A-', 'AB+', 'AB-'],
        'B+': ['B+', 'AB+'],
        'B-': ['B+', 'B-', 'AB+', 'AB-'],
        'AB+': ['AB+'],
        'AB-': ['AB+', 'AB-'],
        'O+': ['A+', 'B+', 'AB+', 'O+'],
        'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    }
    return compatibility

@api_view(['GET'])
@csrf_exempt
def blood_compatibility(request):
    """API pour récupérer la matrice de compatibilité"""
    return Response({
        'compatibility_matrix': calculate_compatibility_matrix(),
        'description': 'Groupes sanguins compatibles pour chaque donneur'
    })

# ==================== HEALTH CHECK ====================
@api_view(['GET'])
@csrf_exempt
def health_check(request):
    """Point de contrôle de santé de l'API"""
    try:
        # Test de connexion à la base de données
        donor_count = Donor.objects.count()
        unit_count = BloodUnit.objects.count()

        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'database_connection': 'ok',
            'total_donors': donor_count,
            'total_units': unit_count,
            'version': '1.0.0'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Dans views.py, ajouter ces vues après les vues existantes
@global_allow_any
# ==================== DONORS CRUD VIEWS ====================
class DonorListCreateAPIView(generics.ListCreateAPIView):
    """Liste et création des donneurs"""
    serializer_class = DonorSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Donor.objects.all()
        search = self.request.query_params.get('search')
        blood_type = self.request.query_params.get('blood_type')

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(donor_id__icontains=search) |
                Q(phone_number__icontains=search)
            )

        if blood_type:
            queryset = queryset.filter(blood_type=blood_type)

        return queryset.order_by('-donor_id')

@global_allow_any
class DonorDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Détail, mise à jour et suppression d'un donneur"""
    queryset = Donor.objects.all()
    serializer_class = DonorSerializer
    lookup_field = 'donor_id'

@global_allow_any
# ==================== PATIENTS CRUD VIEWS ====================
class PatientListCreateAPIView(generics.ListCreateAPIView):
    """Liste et création des patients"""
    serializer_class = PatientSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Patient.objects.all()
        search = self.request.query_params.get('search')
        blood_type = self.request.query_params.get('blood_type')

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(patient_id__icontains=search)
            )

        if blood_type:
            queryset = queryset.filter(blood_type=blood_type)

        return queryset.order_by('-patient_id')

@global_allow_any
class PatientDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Détail, mise à jour et suppression d'un patient"""
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    lookup_field = 'patient_id'

@global_allow_any
# ==================== SITES CRUD VIEWS ====================
class SiteListCreateAPIView(generics.ListCreateAPIView):
    """Liste et création des sites"""
    serializer_class = SiteSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Site.objects.all()
        search = self.request.query_params.get('search')

        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(ville__icontains=search) |
                Q(site_id__icontains=search)
            )

        return queryset.order_by('nom')

@global_allow_any
class SiteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Détail, mise à jour et suppression d'un site"""
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    lookup_field = 'site_id'

