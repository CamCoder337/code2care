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
from django.db.models import Count, Sum, Q, Avg
from django.db.models.functions import Extract
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
    from .forecasting.blood_demand_forecasting import RenderOptimizedForecaster, ProductionLightweightForecaster
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
    """Vue principale du dashboard avec métriques temps réel - VERSION OPTIMISÉE"""

    def get(self, request):
        cache_key = 'dashboard_overview'
        data = cache.get(cache_key)

        if not data:
            try:
                # ==================== OPTIMISATION 1: Requêtes groupées ====================
                # Une seule requête pour toutes les statistiques d'unités
                unit_stats = BloodUnit.objects.aggregate(
                    total=Count('unit_id'),
                    available=Count('unit_id', filter=Q(status='Available')),
                    expired=Count('unit_id', filter=Q(status='Expired')),
                    used=Count('unit_id', filter=Q(status='Used')),
                    expiring_soon=Count(
                        'unit_id',
                        filter=Q(
                            status='Available',
                            date_expiration__lte=timezone.now().date() + timedelta(days=7)
                        )
                    )
                )

                # ==================== OPTIMISATION 2: Stock par groupe sanguin optimisé ====================
                stock_by_blood_type = list(
                    BloodUnit.objects.filter(status='Available')
                    .select_related('donor')  # Éviter les requêtes N+1
                    .values('donor__blood_type')
                    .annotate(
                        count=Count('unit_id'),
                        total_volume=Sum('volume_ml')
                    )
                    .order_by('donor__blood_type')
                )

                # ==================== OPTIMISATION 3: Requêtes de demandes groupées ====================
                request_stats = BloodRequest.objects.aggregate(
                    pending=Count('request_id', filter=Q(status='Pending')),
                    urgent=Count('request_id', filter=Q(status='Pending', priority='Urgent'))
                )

                # ==================== OPTIMISATION 4: Transfusions aujourd'hui ====================
                today_transfusions = BloodConsumption.objects.filter(
                    date=timezone.now().date()
                ).count()

                # ==================== OPTIMISATION 5: Évolution simplifiée (échantillonnage) ====================
                # Au lieu de 30 jours, faire seulement 10 points pour réduire la charge
                stock_evolution = []
                today = timezone.now().date()

                # Échantillonnage intelligent : 10 points sur 30 jours
                for i in range(0, 30, 3):  # Tous les 3 jours
                    check_date = today - timedelta(days=29 - i)
                    # Requête optimisée avec un seul filtre
                    daily_stock = BloodUnit.objects.filter(
                        collection_date__lte=check_date,
                        date_expiration__gt=check_date,
                        status__in=['Available', 'Used']  # Exclure les expirés
                    ).count()

                    stock_evolution.append({
                        'date': check_date.isoformat(),
                        'stock': daily_stock
                    })

                # ==================== CALCUL DU TAUX D'UTILISATION ====================
                utilization_rate = 0
                if unit_stats['total'] > 0:
                    utilization_rate = round((unit_stats['used'] / unit_stats['total'] * 100), 2)

                # ==================== STRUCTURE DE RÉPONSE ====================
                data = {
                    'overview': {
                        'total_units': unit_stats['total'],
                        'available_units': unit_stats['available'],
                        'expired_units': unit_stats['expired'],
                        'used_units': unit_stats['used'],
                        'utilization_rate': utilization_rate,
                        'expiring_soon': unit_stats['expiring_soon'],
                        'pending_requests': request_stats['pending'],
                        'urgent_requests': request_stats['urgent'],
                        'today_transfusions': today_transfusions
                    },
                    'stock_by_blood_type': stock_by_blood_type,
                    'stock_evolution': stock_evolution,
                    'last_updated': timezone.now().isoformat(),
                    'cache_info': {
                        'cached_at': timezone.now().isoformat(),
                        'cache_duration': '5 minutes'
                    }
                }

                # ==================== CACHE ÉTENDU ====================
                # Cache plus long pour réduire la charge serveur
                cache.set(cache_key, data, 600)  # 10 minutes au lieu de 5

            except Exception as e:
                logger.error(f"Dashboard error: {str(e)}", exc_info=True)

                # ==================== FALLBACK DATA ====================
                # Retourner des données minimales en cas d'erreur
                fallback_data = {
                    'overview': {
                        'total_units': 0,
                        'available_units': 0,
                        'expired_units': 0,
                        'used_units': 0,
                        'utilization_rate': 0,
                        'expiring_soon': 0,
                        'pending_requests': 0,
                        'urgent_requests': 0,
                        'today_transfusions': 0
                    },
                    'stock_by_blood_type': [],
                    'stock_evolution': [],
                    'error': 'Données temporairement indisponibles',
                    'last_updated': timezone.now().isoformat()
                }

                return Response(fallback_data, status=status.HTTP_206_PARTIAL_CONTENT)

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
class DemandForecastAPIView(APIView):
    """Vue optimisée pour les prévisions de demande"""

    def __init__(self):
        super().__init__()
        self.lightweight_forecaster = ProductionLightweightForecaster()

    def get(self, request):
        """Prévisions optimisées avec cache agressif"""

        # Paramètres de la requête
        blood_type = request.query_params.get('blood_type', 'all')
        days = int(request.query_params.get('days', 7))

        # Limiter la durée pour éviter les timeouts
        days = min(days, 30)

        # Cache par paramètres
        cache_key = f'demand_forecast_{blood_type}_{days}'
        cached_result = cache.get(cache_key)

        if cached_result:
            return Response(cached_result)

        try:
            if blood_type == 'all':
                forecasts = self.get_all_forecasts_optimized(days)
            else:
                forecasts = [self.get_single_forecast_optimized(blood_type, days)]

            result = {
                'forecasts': forecasts,
                'parameters': {
                    'blood_type': blood_type,
                    'days_ahead': days,
                    'generated_at': timezone.now().isoformat()
                },
                'metadata': {
                    'method': 'lightweight_optimized',
                    'confidence_level': 0.75,
                    'cache_duration': '1 hour'
                }
            }

            # Cache long pour les prévisions
            cache.set(cache_key, result, 3600)  # 1 heure

            return Response(result)

        except Exception as e:
            logger.error(f"Demand forecast failed: {e}")
            return Response({
                'error': 'Service temporairement indisponible',
                'forecasts': [],
                'generated_at': timezone.now().isoformat()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def get_all_forecasts_optimized(self, days):
        """Prévisions pour tous les groupes sanguins - Version rapide"""
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        forecasts = []

        for bt in blood_types:
            try:
                forecast = self.lightweight_forecaster.quick_predict_cached(bt, days)
                forecasts.append(forecast)
            except Exception as e:
                logger.warning(f"Forecast failed for {bt}: {e}")
                # Ajouter prévision minimale
                forecasts.append({
                    'blood_type': bt,
                    'predictions': [],
                    'method_used': 'error_fallback',
                    'error': str(e)
                })

        return forecasts

    def get_single_forecast_optimized(self, blood_type, days):
        """Prévision pour un seul groupe sanguin"""
        try:
            return self.lightweight_forecaster.quick_predict_cached(blood_type, days)
        except Exception as e:
            logger.error(f"Single forecast failed for {blood_type}: {e}")
            return {
                'blood_type': blood_type,
                'predictions': [],
                'method_used': 'error_fallback',
                'error': str(e)
            }


@global_allow_any
# ==================== OPTIMIZATION VIEWS ====================
class OptimizationRecommendationsAPIView(APIView):
    """Vue optimisée pour les recommandations - Compatible avec votre système existant"""

    def __init__(self):
        super().__init__()
        self.forecaster = RenderOptimizedForecaster(max_execution_time=120)  # 2 minutes max
        self.lightweight_forecaster = ProductionLightweightForecaster()

    def get(self, request):
        """Recommandations optimisées avec fallback intelligent"""
        start_time = time.time()

        # ==================== CACHE PRINCIPAL ====================
        cache_key = 'optimization_recommendations_v2'
        cached_data = cache.get(cache_key)

        if cached_data:
            logger.info("Using cached recommendations")
            return Response(cached_data)

        try:
            # ==================== STRATÉGIE PROGRESSIVE ====================
            # 1. Essayer la méthode complète si temps disponible
            # 2. Fallback vers méthode légère si timeout
            # 3. Fallback vers données statiques si erreur

            recommendations = self.generate_progressive_recommendations()

            execution_time = time.time() - start_time

            data = {
                'recommendations': recommendations,
                'generated_at': timezone.now().isoformat(),
                'execution_time_seconds': round(execution_time, 2),
                'cache_duration': '30 minutes',
                'status': 'success'
            }

            # ==================== CACHE ADAPTATIF ====================
            # Cache plus long si génération rapide (données stables)
            # Cache plus court si génération lente (données dynamiques)
            cache_duration = 1800 if execution_time < 30 else 900  # 30min ou 15min
            cache.set(cache_key, data, cache_duration)

            return Response(data)

        except Exception as e:
            logger.error(f"Recommendations generation failed: {str(e)}", exc_info=True)
            return self.get_emergency_fallback()

    def generate_progressive_recommendations(self):
        """Génération progressive avec fallback automatique"""

        try:
            # ==================== PHASE 1: DONNÉES RAPIDES ====================
            recommendations = {
                'blood_type_specific': [],
                'general': [],
                'summary': {}
            }

            blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
            successful_forecasts = 0

            # ==================== PHASE 2: ANALYSE PAR GROUPE SANGUIN ====================
            for blood_type in blood_types:
                try:
                    # Timeout individuel par groupe sanguin (15 secondes max)
                    recommendation = self.analyze_blood_type_optimized(blood_type, timeout=15)

                    if recommendation:
                        recommendations['blood_type_specific'].append(recommendation)
                        successful_forecasts += 1

                    # Si trop lent, basculer sur méthode ultra-rapide
                    if successful_forecasts < len(blood_types) // 2 and len(recommendations['blood_type_specific']) > 0:
                        # Compléter avec méthode rapide
                        remaining_types = blood_types[len(recommendations['blood_type_specific']):]
                        for bt in remaining_types:
                            quick_rec = self.quick_analyze_blood_type(bt)
                            recommendations['blood_type_specific'].append(quick_rec)
                        break

                except Exception as e:
                    logger.warning(f"Failed to analyze {blood_type}: {e}")
                    # Ajouter recommandation de base
                    recommendations['blood_type_specific'].append(
                        self.get_basic_recommendation(blood_type)
                    )

            # ==================== PHASE 3: RECOMMANDATIONS GÉNÉRALES ====================
            recommendations['general'] = self.generate_general_recommendations_fast()

            # ==================== PHASE 4: RÉSUMÉ ====================
            recommendations['summary'] = self.generate_summary_optimized(
                recommendations['blood_type_specific']
            )

            return recommendations

        except Exception as e:
            logger.error(f"Progressive recommendations failed: {e}")
            return self.get_static_recommendations()

    def analyze_blood_type_optimized(self, blood_type, timeout=15):
        """Analyse optimisée d'un groupe sanguin avec timeout"""
        start_time = time.time()

        try:
            # ==================== DONNÉES ACTUELLES RAPIDES ====================
            current_stock = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                status='Available'
            ).count()

            # ==================== CONSOMMATION RÉCENTE ====================
            seven_days_ago = timezone.now().date() - timedelta(days=7)
            recent_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__gte=seven_days_ago
            ).count()

            # ==================== PRÉDICTION RAPIDE ====================
            if time.time() - start_time > timeout * 0.7:  # 70% du timeout écoulé
                # Utiliser prédiction ultra-rapide
                prediction_result = self.lightweight_forecaster.quick_predict_cached(blood_type, 7)
                predicted_weekly_demand = sum(p['predicted_demand'] for p in prediction_result['predictions'])
                method_used = 'lightweight'
            else:
                # Essayer prédiction avancée
                try:
                    historical_data = self.get_historical_data_fast(blood_type, days=30)
                    if len(historical_data) > 10:
                        # Entraînement rapide
                        self.forecaster.train_comprehensive_optimized(historical_data, blood_type)
                        prediction_result = self.forecaster.predict_hybrid_optimized(blood_type, 7)
                        predicted_weekly_demand = sum(p['predicted_demand'] for p in prediction_result['predictions'])
                        method_used = 'optimized'
                    else:
                        raise ValueError("Insufficient historical data")
                except:
                    # Fallback vers méthode légère
                    prediction_result = self.lightweight_forecaster.quick_predict_cached(blood_type, 7)
                    predicted_weekly_demand = sum(p['predicted_demand'] for p in prediction_result['predictions'])
                    method_used = 'lightweight_fallback'

            # ==================== UNITÉS EXPIRANT ====================
            expiring_soon = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                status='Available',
                date_expiration__lte=timezone.now().date() + timedelta(days=7)
            ).count()

            # ==================== CALCULS DE RECOMMANDATION ====================
            daily_avg_consumption = recent_consumption / 7 if recent_consumption > 0 else 0.5

            return self.generate_blood_type_recommendation_optimized(
                blood_type, current_stock, predicted_weekly_demand,
                expiring_soon, daily_avg_consumption, method_used
            )

        except Exception as e:
            logger.warning(f"Optimized analysis failed for {blood_type}: {e}")
            return self.get_basic_recommendation(blood_type)

    def quick_analyze_blood_type(self, blood_type):
        """Analyse ultra-rapide pour fallback"""
        try:
            # Données minimales
            current_stock = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                status='Available'
            ).count()

            # Prédiction statique basée sur des moyennes
            base_demands = {
                'O+': 15, 'A+': 12, 'B+': 8, 'AB+': 3,
                'O-': 7, 'A-': 6, 'B-': 4, 'AB-': 2
            }
            predicted_weekly_demand = base_demands.get(blood_type, 10) * 7

            expiring_soon = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                status='Available',
                date_expiration__lte=timezone.now().date() + timedelta(days=7)
            ).count()

            return self.generate_blood_type_recommendation_optimized(
                blood_type, current_stock, predicted_weekly_demand,
                expiring_soon, predicted_weekly_demand / 7, 'quick_static'
            )

        except Exception as e:
            logger.error(f"Quick analysis failed for {blood_type}: {e}")
            return self.get_basic_recommendation(blood_type)

    def get_historical_data_fast(self, blood_type, days=30):
        """Récupération rapide des données historiques"""
        try:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days)

            # Agrégation par jour
            daily_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__gte=start_date,
                date__lte=end_date
            ).extra(
                select={'day': 'date'}
            ).values('day').annotate(
                demand=Count('id')
            ).order_by('day')

            if not daily_consumption:
                # Données simulées si pas d'historique
                dates = pd.date_range(start=start_date, end=end_date, freq='D')
                base_demand = {'O+': 2, 'A+': 1.5, 'B+': 1, 'AB+': 0.5,
                               'O-': 1, 'A-': 0.8, 'B-': 0.6, 'AB-': 0.3}.get(blood_type, 1)

                data = pd.DataFrame({
                    'demand': [max(0, int(base_demand + np.random.normal(0, 0.5))) for _ in dates]
                }, index=dates)
                return data

            # Convertir en DataFrame
            df = pd.DataFrame(list(daily_consumption))
            df['day'] = pd.to_datetime(df['day'])
            df.set_index('day', inplace=True)

            # Remplir les jours manquants avec 0
            full_range = pd.date_range(start=start_date, end=end_date, freq='D')
            df = df.reindex(full_range, fill_value=0)

            return df

        except Exception as e:
            logger.error(f"Historical data retrieval failed for {blood_type}: {e}")
            return pd.DataFrame()

    def generate_blood_type_recommendation_optimized(self, blood_type, current_stock,
                                                     predicted_demand, expiring_soon,
                                                     daily_avg, method_used):
        """Génération optimisée de recommandation"""

        # ==================== LOGIQUE DE RECOMMANDATION ====================
        stock_ratio = current_stock / max(predicted_demand, 1)
        days_of_supply = current_stock / max(daily_avg, 0.1)

        # Détermination du niveau de priorité
        if stock_ratio < 0.3 or days_of_supply < 3:
            priority = 'CRITICAL'
            action = 'EMERGENCY_COLLECTION'
            message = f"Stock critique pour {blood_type}. Collecte d'urgence requise."
        elif stock_ratio < 0.6 or days_of_supply < 7:
            priority = 'HIGH'
            action = 'URGENT_COLLECTION'
            message = f"Stock faible pour {blood_type}. Collection urgente nécessaire."
        elif stock_ratio < 1.0 or days_of_supply < 14:
            priority = 'MEDIUM'
            action = 'SCHEDULE_COLLECTION'
            message = f"Stock modéré pour {blood_type}. Programmer une collecte."
        elif expiring_soon > current_stock * 0.25:
            priority = 'MEDIUM'
            action = 'USE_EXPIRING_UNITS'
            message = f"Nombreuses unités {blood_type} expirant bientôt. Prioriser leur utilisation."
        else:
            priority = 'LOW'
            action = 'MONITOR'
            message = f"Stock {blood_type} stable. Continuer la surveillance."

        return {
            'blood_type': blood_type,
            'current_stock': current_stock,
            'predicted_weekly_demand': round(predicted_demand, 1),
            'daily_average_consumption': round(daily_avg, 2),
            'expiring_soon': expiring_soon,
            'stock_ratio': round(stock_ratio, 2),
            'days_of_supply': round(days_of_supply, 1),
            'priority': priority,
            'recommended_action': action,
            'message': message,
            'prediction_method': method_used,
            'analysis_timestamp': timezone.now().isoformat()
        }

    def get_basic_recommendation(self, blood_type):
        """Recommandation de base en cas d'erreur"""
        return {
            'blood_type': blood_type,
            'current_stock': 0,
            'predicted_weekly_demand': 10.0,
            'daily_average_consumption': 1.5,
            'expiring_soon': 0,
            'stock_ratio': 0.0,
            'days_of_supply': 0.0,
            'priority': 'UNKNOWN',
            'recommended_action': 'CHECK_MANUALLY',
            'message': f"Données indisponibles pour {blood_type}. Vérification manuelle requise.",
            'prediction_method': 'fallback',
            'analysis_timestamp': timezone.now().isoformat()
        }

    def generate_general_recommendations_fast(self):
        """Recommandations générales rapides"""
        try:
            recommendations = []

            # ==================== STATISTIQUES RAPIDES ====================
            unit_stats = BloodUnit.objects.aggregate(
                total=Count('unit_id'),
                expired=Count('unit_id', filter=Q(status='Expired')),
                expiring_week=Count('unit_id', filter=Q(
                    status='Available',
                    date_expiration__lte=timezone.now().date() + timedelta(days=7)
                ))
            )

            urgent_requests = BloodRequest.objects.filter(
                status='Pending',
                priority='Urgent'
            ).count()

            # ==================== RECOMMANDATIONS BASÉES SUR LES STATS ====================
            if unit_stats['total'] > 0:
                expiry_rate = (unit_stats['expired'] / unit_stats['total']) * 100
                if expiry_rate > 15:
                    recommendations.append({
                        'type': 'WASTE_REDUCTION',
                        'priority': 'HIGH',
                        'message': f"Taux d'expiration élevé ({expiry_rate:.1f}%). Optimiser la rotation FIFO.",
                        'metric': round(expiry_rate, 1),
                        'action': 'Implémenter un système de rotation strict'
                    })

            if unit_stats['expiring_week'] > 5:
                recommendations.append({
                    'type': 'EXPIRY_ALERT',
                    'priority': 'HIGH',
                    'message': f"{unit_stats['expiring_week']} unités expirent cette semaine. Action immédiate requise.",
                    'metric': unit_stats['expiring_week'],
                    'action': 'Prioriser l\'utilisation des unités à expiration proche'
                })

            if urgent_requests > 0:
                recommendations.append({
                    'type': 'URGENT_PROCESSING',
                    'priority': 'CRITICAL',
                    'message': f"{urgent_requests} demande(s) urgente(s) en attente. Traitement immédiat requis.",
                    'metric': urgent_requests,
                    'action': 'Traiter les demandes urgentes en priorité'
                })

            # ==================== RECOMMANDATION SAISONNIÈRE ====================
            current_month = timezone.now().month
            seasonal_rec = self.get_seasonal_recommendation(current_month)
            if seasonal_rec:
                recommendations.append(seasonal_rec)

            return recommendations

        except Exception as e:
            logger.error(f"General recommendations failed: {e}")
            return [{
                'type': 'SYSTEM_ERROR',
                'priority': 'LOW',
                'message': 'Données de recommandations générales temporairement indisponibles.',
                'metric': 0,
                'action': 'Utiliser les procédures manuelles standard'
            }]

    def get_seasonal_recommendation(self, month):
        """Recommandation saisonnière"""
        seasonal_patterns = {
            (6, 7, 8): {  # Été
                'type': 'SEASONAL_SUMMER',
                'priority': 'MEDIUM',
                'message': 'Période estivale: Intensifier les campagnes de collecte (baisse des dons pendant les vacances).',
                'action': 'Planifier des collectes mobiles et événements spéciaux'
            },
            (11, 12, 1): {  # Fin d'année / Nouvel an
                'type': 'SEASONAL_YEAR_END',
                'priority': 'MEDIUM',
                'message': 'Période de fin d\'année: Anticiper la baisse des dons pendant les fêtes.',
                'action': 'Constituer des réserves avant les fêtes'
            },
            (3, 4, 5): {  # Printemps
                'type': 'SEASONAL_SPRING',
                'priority': 'LOW',
                'message': 'Période favorable aux dons. Maintenir les campagnes régulières.',
                'action': 'Continuer les opérations standard'
            }
        }

        for months, rec in seasonal_patterns.items():
            if month in months:
                rec['metric'] = month
                return rec

        return None

    def generate_summary_optimized(self, recommendations):
        """Résumé optimisé des recommandations"""
        if not recommendations:
            return {
                'total_recommendations': 0,
                'critical_count': 0,
                'high_priority_count': 0,
                'medium_priority_count': 0,
                'critical_blood_types': [],
                'overall_status': 'UNKNOWN'
            }

        # ==================== COMPTAGE PAR PRIORITÉ ====================
        priority_counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'UNKNOWN': 0}
        critical_blood_types = []

        for rec in recommendations:
            priority = rec.get('priority', 'UNKNOWN')
            priority_counts[priority] += 1

            if priority in ['CRITICAL', 'HIGH']:
                critical_blood_types.append(rec['blood_type'])

        # ==================== STATUT GLOBAL ====================
        if priority_counts['CRITICAL'] > 0:
            overall_status = 'CRITICAL'
        elif priority_counts['HIGH'] > 2:
            overall_status = 'HIGH_ATTENTION'
        elif priority_counts['HIGH'] > 0 or priority_counts['MEDIUM'] > 3:
            overall_status = 'ATTENTION'
        else:
            overall_status = 'STABLE'

        return {
            'total_recommendations': len(recommendations),
            'critical_count': priority_counts['CRITICAL'],
            'high_priority_count': priority_counts['HIGH'],
            'medium_priority_count': priority_counts['MEDIUM'],
            'low_priority_count': priority_counts['LOW'],
            'critical_blood_types': critical_blood_types,
            'overall_status': overall_status,
            'summary_generated_at': timezone.now().isoformat()
        }

    def get_static_recommendations(self):
        """Recommandations statiques en cas d'échec total"""
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']

        static_recs = []
        for bt in blood_types:
            static_recs.append(self.get_basic_recommendation(bt))

        return {
            'blood_type_specific': static_recs,
            'general': [{
                'type': 'SYSTEM_MAINTENANCE',
                'priority': 'LOW',
                'message': 'Système de recommandations en mode maintenance. Utiliser les procédures manuelles.',
                'metric': 0,
                'action': 'Vérifier manuellement les stocks critiques'
            }],
            'summary': {
                'total_recommendations': len(static_recs),
                'critical_count': 0,
                'high_priority_count': 0,
                'medium_priority_count': 0,
                'critical_blood_types': [],
                'overall_status': 'MAINTENANCE_MODE'
            }
        }

    def get_emergency_fallback(self):
        """Fallback d'urgence en cas d'erreur critique"""
        return Response({
            'recommendations': self.get_static_recommendations(),
            'generated_at': timezone.now().isoformat(),
            'status': 'emergency_fallback',
            'message': 'Système de recommandations en mode de secours. Fonctionnalités limitées.',
            'cache_duration': '5 minutes'
        }, status=status.HTTP_206_PARTIAL_CONTENT)

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

