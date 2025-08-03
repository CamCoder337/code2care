# blood_demand_forecasting.py - VERSION AVEC VRAIES DONNÉES DB
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime, timedelta
import warnings
import time
from django.core.cache import cache
from django.db.models import Q, Sum, Avg, Count
import logging

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)

# Imports conditionnels optimisés
try:
    import xgboost as xgb

    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.info("XGBoost not available, using fallback models")

try:
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.seasonal import STL
    from statsmodels.tsa.stattools import adfuller

    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    logger.info("Statsmodels not available, using ML models only")


class RealDataBloodDemandForecaster:
    """
    🏆 FORECASTER AVEC VRAIES DONNÉES DB
    Toutes les données synthétiques supprimées - utilise uniquement les données réelles
    """

    def __init__(self, max_execution_time=120):
        self.max_execution_time = max_execution_time
        self.start_time = None

        # Modèles ML optimisés
        self.models = {
            'random_forest': RandomForestRegressor(
                n_estimators=50,  # Augmenté pour plus de précision avec vraies données
                max_depth=8,
                random_state=42,
                n_jobs=1
            )
        }

        if XGBOOST_AVAILABLE:
            self.models['xgboost'] = xgb.XGBRegressor(
                n_estimators=50,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                n_jobs=1,
                verbosity=0
            )

        self.scaler = StandardScaler()
        self.trained_models = {}
        self.model_performance = {}
        self.arima_models = {}

        # Configuration des groupes sanguins (sans données factices)
        self.blood_type_config = {
            'O+': {'priority': 'critical', 'typical_weekend_factor': 0.7},
            'A+': {'priority': 'high', 'typical_weekend_factor': 0.75},
            'B+': {'priority': 'medium', 'typical_weekend_factor': 0.8},
            'AB+': {'priority': 'low', 'typical_weekend_factor': 0.85},
            'O-': {'priority': 'critical', 'typical_weekend_factor': 0.6},
            'A-': {'priority': 'high', 'typical_weekend_factor': 0.7},
            'B-': {'priority': 'medium', 'typical_weekend_factor': 0.75},
            'AB-': {'priority': 'critical', 'typical_weekend_factor': 0.8}
        }

    def check_timeout(self):
        """Vérifier si on approche du timeout"""
        if self.start_time and time.time() - self.start_time > self.max_execution_time:
            raise TimeoutException("Maximum execution time exceeded")

    def get_historical_data_from_db(self, blood_type, days_back=180):
        """
        🗄️ RÉCUPÉRATION DES VRAIES DONNÉES DEPUIS LA DB
        """
        from inventory.models import BloodInventory, Transaction

        try:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days_back)

            logger.info(f"📊 Récupération données DB pour {blood_type} ({start_date} à {end_date})")

            # Récupérer les transactions par jour (demande réelle)
            daily_demand = Transaction.objects.filter(
                blood_type=blood_type,
                transaction_type='OUT',  # Sorties = demande
                date__range=[start_date, end_date]
            ).extra(
                select={'day': 'DATE(date)'}
            ).values('day').annotate(
                total_demand=Sum('quantity')
            ).order_by('day')

            if not daily_demand.exists():
                logger.warning(f"❌ Aucune donnée trouvée pour {blood_type}")
                return None

            # Convertir en DataFrame pandas
            df_data = []
            for record in daily_demand:
                df_data.append({
                    'date': record['day'],
                    'demand': record['total_demand'] or 0
                })

            df = pd.DataFrame(df_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date')

            # Remplir les jours manquants avec 0
            idx = pd.date_range(start_date, end_date, freq='D')
            df = df.reindex(idx, fill_value=0)
            df.index.name = 'date'

            logger.info(f"✅ Données récupérées: {len(df)} jours, demande moyenne: {df['demand'].mean():.1f}")

            return df

        except Exception as e:
            logger.error(f"❌ Erreur récupération données DB: {e}")
            return None

    def get_contextual_data(self, blood_type):
        """
        📈 RÉCUPÉRATION DE DONNÉES CONTEXTUELLES
        Stock actuel, tendances récentes, etc.
        """
        from inventory.models import BloodInventory, Transaction

        try:
            # Stock actuel
            current_stock = BloodInventory.objects.filter(
                blood_type=blood_type
            ).aggregate(
                total_units=Sum('units_available'),
                avg_expiry_days=Avg('days_until_expiry')
            )

            # Tendance des 7 derniers jours
            recent_demand = Transaction.objects.filter(
                blood_type=blood_type,
                transaction_type='OUT',
                date__gte=datetime.now() - timedelta(days=7)
            ).aggregate(
                total_demand=Sum('quantity'),
                avg_daily=Avg('quantity'),
                transaction_count=Count('id')
            )

            # Tendance des 30 derniers jours
            monthly_trend = Transaction.objects.filter(
                blood_type=blood_type,
                transaction_type='OUT',
                date__gte=datetime.now() - timedelta(days=30)
            ).aggregate(
                total_demand=Sum('quantity'),
                avg_daily=Avg('quantity')
            )

            return {
                'current_stock': current_stock['total_units'] or 0,
                'avg_expiry_days': current_stock['avg_expiry_days'] or 30,
                'recent_weekly_demand': recent_demand['total_demand'] or 0,
                'recent_daily_avg': recent_demand['avg_daily'] or 0,
                'monthly_daily_avg': monthly_trend['avg_daily'] or 0,
                'recent_transactions': recent_demand['transaction_count'] or 0
            }

        except Exception as e:
            logger.error(f"❌ Erreur données contextuelles: {e}")
            return {}

    def prepare_ml_features_from_real_data(self, df, contextual_data=None):
        """
        🛠️ FEATURES ENGINEERING SUR VRAIES DONNÉES
        """
        if df is None or len(df) < 7:
            logger.warning("Données insuffisantes pour feature engineering")
            return None

        df = df.copy()

        # Features temporelles de base
        df['day_of_week'] = df.index.dayofweek
        df['month'] = df.index.month
        df['day_of_month'] = df.index.day
        df['quarter'] = df.index.quarter
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_monday'] = (df['day_of_week'] == 0).astype(int)
        df['is_friday'] = (df['day_of_week'] == 4).astype(int)

        # Moyennes mobiles sur vraies données
        for window in [3, 7, 14, 30]:
            if len(df) >= window:
                df[f'demand_ma_{window}'] = df['demand'].rolling(window=window, min_periods=1).mean()

        # Lags essentiels
        for lag in [1, 2, 7, 14]:
            if len(df) > lag:
                df[f'demand_lag_{lag}'] = df['demand'].shift(lag)

        # Tendances calculées sur vraies données
        if len(df) >= 14:
            df['demand_trend_7'] = df['demand'].rolling(7, min_periods=3).apply(
                lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) > 2 else 0
            )
            df['demand_trend_14'] = df['demand'].rolling(14, min_periods=7).apply(
                lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) > 2 else 0
            )

        # Volatilité récente
        if len(df) >= 7:
            df['demand_volatility_7'] = df['demand'].rolling(7, min_periods=3).std()

        # Features cycliques
        df['sin_day_of_week'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['cos_day_of_week'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['sin_month'] = np.sin(2 * np.pi * df['month'] / 12)
        df['cos_month'] = np.cos(2 * np.pi * df['month'] / 12)

        # Features contextuelles si disponibles
        if contextual_data:
            df['stock_ratio'] = contextual_data.get('current_stock', 0) / max(1, df['demand'].mean())
            df['recent_trend_factor'] = contextual_data.get('recent_daily_avg', 0) / max(1, df['demand'].mean())

        return df

    def train_model_with_real_data(self, blood_type, method='auto'):
        """
        🎯 ENTRAÎNEMENT AVEC VRAIES DONNÉES UNIQUEMENT
        """
        self.start_time = time.time()

        # Cache intelligent
        cache_key = f'real_model_{blood_type}_{method}'
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"✅ Modèle en cache pour {blood_type}")
            self.model_performance[blood_type] = cached_result['performance']
            self.trained_models.update(cached_result['models'])
            return cached_result['performance'], cached_result['best_method']

        # Récupérer les vraies données
        historical_data = self.get_historical_data_from_db(blood_type)
        if historical_data is None or len(historical_data) < 14:
            logger.error(f"❌ Données insuffisantes pour {blood_type}")
            return {}, 'insufficient_data'

        # Données contextuelles
        contextual_data = self.get_contextual_data(blood_type)

        logger.info(f"🔬 Entraînement modèle pour {blood_type} avec {len(historical_data)} jours de vraies données")

        results = {}

        try:
            # Auto-sélection de méthode basée sur les vraies données
            if method == 'auto':
                method = self.select_optimal_method_for_real_data(historical_data, blood_type)

            # Entraînement selon la méthode choisie
            if method == 'random_forest' or method == 'xgboost':
                results = self.train_ml_models_real_data(historical_data, blood_type, contextual_data, method)

            elif method == 'arima' and STATSMODELS_AVAILABLE:
                results['arima'] = self.train_arima_real_data(historical_data, blood_type)

            elif method == 'stl_arima' and STATSMODELS_AVAILABLE:
                results['stl_arima'] = self.train_stl_arima_real_data(historical_data, blood_type)

            # Sélection du meilleur modèle
            if results:
                best_method = min(results.items(), key=lambda x: x[1].get('mape', float('inf')))[0]

                # Cache des résultats
                cache_data = {
                    'performance': results,
                    'models': {k: v for k, v in self.trained_models.items() if blood_type in k},
                    'best_method': best_method,
                    'data_points': len(historical_data),
                    'contextual_data': contextual_data
                }
                cache.set(cache_key, cache_data, 3600)  # Cache 1 heure

                self.model_performance[blood_type] = results
                logger.info(f"✅ Modèle entraîné: {best_method} (MAPE: {results[best_method].get('mape', 0):.2f}%)")

                return results, best_method
            else:
                logger.warning(f"⚠️ Aucun modèle n'a pu être entraîné pour {blood_type}")
                return {}, 'training_failed'

        except Exception as e:
            logger.error(f"❌ Erreur entraînement pour {blood_type}: {e}")
            return {}, 'error'

    def select_optimal_method_for_real_data(self, data, blood_type):
        """
        🤖 SÉLECTION INTELLIGENTE basée sur les caractéristiques des vraies données
        """
        try:
            series = data['demand']

            # Analyser les caractéristiques des vraies données
            mean_demand = series.mean()
            volatility = series.std() / max(mean_demand, 1)
            trend_strength = abs(np.corrcoef(range(len(series)), series)[0, 1]) if len(series) > 10 else 0

            # Détection de saisonnalité réelle
            if len(series) >= 14:
                from scipy import stats
                weekly_pattern = [series[series.index.dayofweek == i].mean() for i in range(7)]
                seasonality_strength = np.std(weekly_pattern) / max(np.mean(weekly_pattern), 1)
            else:
                seasonality_strength = 0

            logger.info(f"📊 Analyse données {blood_type}: volatilité={volatility:.2f}, "
                        f"tendance={trend_strength:.2f}, saisonnalité={seasonality_strength:.2f}")

            # Logique de sélection basée sur les données réelles
            if seasonality_strength > 0.3 and len(series) >= 21 and STATSMODELS_AVAILABLE:
                return 'stl_arima'  # Forte saisonnalité détectée
            elif trend_strength > 0.5 and STATSMODELS_AVAILABLE:
                return 'arima'  # Forte tendance détectée
            elif volatility < 0.5 and XGBOOST_AVAILABLE:
                return 'xgboost'  # Données stables, ML performant
            else:
                return 'random_forest'  # Cas général robuste

        except Exception as e:
            logger.warning(f"⚠️ Erreur sélection méthode: {e}")
            return 'random_forest'  # Fallback sûr

    def train_ml_models_real_data(self, data, blood_type, contextual_data, method):
        """
        🤖 ENTRAÎNEMENT ML SUR VRAIES DONNÉES
        """
        try:
            # Features engineering sur vraies données
            df_features = self.prepare_ml_features_from_real_data(data, contextual_data)
            if df_features is None:
                return {}

            df_features = df_features.dropna()

            if len(df_features) < 10:
                logger.warning(f"⚠️ Pas assez de données après nettoyage: {len(df_features)}")
                return {}

            # Sélection des features
            feature_cols = [col for col in df_features.columns
                            if col not in ['demand'] and not col.startswith('demand_ratio')]

            X = df_features[feature_cols]
            y = df_features['demand']

            # Split temporel (important pour les séries temporelles)
            split_idx = max(7, int(len(df_features) * 0.8))
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]

            results = {}

            # Entraîner le modèle spécifié
            if method in ['random_forest', 'auto'] or (method == 'xgboost' and not XGBOOST_AVAILABLE):
                model = self.models['random_forest']
                model.fit(X_train, y_train)
                pred = model.predict(X_test)

                results['random_forest'] = {
                    'mae': float(mean_absolute_error(y_test, pred)),
                    'rmse': float(np.sqrt(mean_squared_error(y_test, pred))),
                    'mape': float(mean_absolute_percentage_error(y_test, pred) * 100),
                    'training_samples': len(X_train),
                    'test_samples': len(X_test)
                }

                self.trained_models[f'rf_{blood_type}'] = {
                    'model': model,
                    'features': feature_cols,
                    'scaler': None,
                    'trained_date': datetime.now()
                }

                logger.info(f"✅ Random Forest: MAPE {results['random_forest']['mape']:.2f}%")

            if method == 'xgboost' and XGBOOST_AVAILABLE:
                model = self.models['xgboost']
                model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
                pred = model.predict(X_test)

                results['xgboost'] = {
                    'mae': float(mean_absolute_error(y_test, pred)),
                    'rmse': float(np.sqrt(mean_squared_error(y_test, pred))),
                    'mape': float(mean_absolute_percentage_error(y_test, pred) * 100),
                    'training_samples': len(X_train),
                    'test_samples': len(X_test)
                }

                self.trained_models[f'xgb_{blood_type}'] = {
                    'model': model,
                    'features': feature_cols,
                    'scaler': None,
                    'trained_date': datetime.now()
                }

                logger.info(f"✅ XGBoost: MAPE {results['xgboost']['mape']:.2f}%")

            return results

        except Exception as e:
            logger.error(f"❌ Erreur entraînement ML: {e}")
            return {}

    def train_arima_real_data(self, data, blood_type):
        """
        📈 ARIMA SUR VRAIES DONNÉES
        """
        if not STATSMODELS_AVAILABLE:
            return {}

        try:
            series = data['demand']

            if len(series) < 20:
                logger.warning(f"⚠️ Pas assez de données pour ARIMA: {len(series)}")
                return {}

            # Auto-sélection de l'ordre ARIMA sur vraies données
            best_aic = float('inf')
            best_order = (1, 1, 1)

            for p in range(3):
                for d in range(2):
                    for q in range(3):
                        try:
                            model = ARIMA(series, order=(p, d, q))
                            fitted = model.fit()
                            if fitted.aic < best_aic:
                                best_aic = fitted.aic
                                best_order = (p, d, q)
                        except:
                            continue

            # Modèle final
            final_model = ARIMA(series, order=best_order)
            fitted_final = final_model.fit()

            # Évaluation
            fitted_values = fitted_final.fittedvalues
            residuals = series[len(series) - len(fitted_values):] - fitted_values

            mae = float(np.mean(np.abs(residuals)))
            rmse = float(np.sqrt(np.mean(residuals ** 2)))

            # MAPE sur vraies données
            actual = series[len(series) - len(fitted_values):]
            mape = float(np.mean(np.abs((actual - fitted_values) / np.maximum(actual, 1))) * 100)

            self.arima_models[blood_type] = fitted_final

            logger.info(f"✅ ARIMA {best_order}: MAPE {mape:.2f}%")

            return {
                'mae': mae,
                'rmse': rmse,
                'mape': mape,
                'order': best_order,
                'aic': float(fitted_final.aic),
                'training_samples': len(series)
            }

        except Exception as e:
            logger.error(f"❌ Erreur ARIMA: {e}")
            return {}

    def train_stl_arima_real_data(self, data, blood_type):
        """
        🔬 STL + ARIMA SUR VRAIES DONNÉES
        """
        if not STATSMODELS_AVAILABLE:
            return {}

        try:
            series = data['demand']

            if len(series) < 28:  # Au moins 4 semaines
                logger.warning(f"⚠️ Pas assez de données pour STL: {len(series)}")
                return {}

            # Décomposition STL sur vraies données
            stl = STL(series, seasonal=7, robust=True)  # Cycle hebdomadaire
            decomposition = stl.fit()

            # ARIMA sur résidus
            deseasonalized = series - decomposition.seasonal

            # Auto-sélection ordre ARIMA
            best_aic = float('inf')
            best_order = (1, 0, 1)

            for p in range(3):
                for d in range(2):
                    for q in range(3):
                        try:
                            model = ARIMA(deseasonalized, order=(p, d, q))
                            fitted = model.fit()
                            if fitted.aic < best_aic:
                                best_aic = fitted.aic
                                best_order = (p, d, q)
                        except:
                            continue

            # Modèle final
            arima_model = ARIMA(deseasonalized, order=best_order)
            fitted_arima = arima_model.fit()

            # Évaluation avec reconstruction
            arima_fitted = fitted_arima.fittedvalues
            reconstructed = arima_fitted + decomposition.seasonal[len(decomposition.seasonal) - len(arima_fitted):]

            actual_for_eval = series[len(series) - len(reconstructed):]
            residuals = actual_for_eval - reconstructed

            mae = float(np.mean(np.abs(residuals)))
            rmse = float(np.sqrt(np.mean(residuals ** 2)))
            mape = float(np.mean(np.abs((actual_for_eval - reconstructed) / np.maximum(actual_for_eval, 1))) * 100)

            # Sauvegarder les composantes
            self.trained_models[f'stl_{blood_type}'] = {
                'arima_model': fitted_arima,
                'seasonal_component': decomposition.seasonal,
                'trend_component': decomposition.trend,
                'order': best_order,
                'trained_date': datetime.now()
            }

            logger.info(f"✅ STL+ARIMA {best_order}: MAPE {mape:.2f}%")

            return {
                'mae': mae,
                'rmse': rmse,
                'mape': mape,
                'order': best_order,
                'aic': float(fitted_arima.aic),
                'seasonal_strength': float(np.std(decomposition.seasonal)),
                'training_samples': len(series)
            }

        except Exception as e:
            logger.error(f"❌ Erreur STL+ARIMA: {e}")
            return {}

    def predict_with_real_data(self, blood_type, days_ahead=7, method='auto'):
        """
        🔮 PRÉDICTION BASÉE SUR VRAIES DONNÉES UNIQUEMENT
        """
        cache_key = f'real_prediction_{blood_type}_{days_ahead}_{method}'
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"✅ Prédiction en cache pour {blood_type}")
            return cached

        self.start_time = time.time()

        try:
            # Entraîner le modèle avec vraies données
            performance, best_method = self.train_model_with_real_data(blood_type, method)

            if not performance:
                logger.error(f"❌ Impossible d'entraîner le modèle pour {blood_type}")
                return self.emergency_fallback_real_data(blood_type, days_ahead)

            # Utiliser la meilleure méthode trouvée
            final_method = best_method if method == 'auto' else method

            # Génération des prédictions
            predictions = self.generate_predictions_real_data(blood_type, days_ahead, final_method)

            if not predictions:
                return self.emergency_fallback_real_data(blood_type, days_ahead)

            # Données contextuelles pour enrichir le résultat
            contextual_data = self.get_contextual_data(blood_type)

            result = {
                'blood_type': blood_type,
                'predictions': predictions,
                'method_used': final_method,
                'model_performance': performance.get(final_method, {}),
                'confidence_intervals': self.calculate_confidence_intervals_real_data(predictions),
                'generated_at': datetime.now().isoformat(),
                'data_source': 'real_database',
                'contextual_insights': {
                    'current_stock': contextual_data.get('current_stock', 0),
                    'recent_trend': contextual_data.get('recent_daily_avg', 0),
                    'stock_days_remaining': self.calculate_stock_duration(contextual_data, predictions)
                },
                'quality_metrics': {
                    'training_accuracy': performance.get(final_method, {}).get('mape', 0),
                    'data_freshness': 'real_time',
                    'prediction_confidence': self.calculate_overall_confidence(predictions,
                                                                               performance.get(final_method, {}))
                }
            }

            # Cache adaptatif selon la performance
            cache_duration = 1800 if performance.get(final_method, {}).get('mape', 100) < 20 else 900
            cache.set(cache_key, result, cache_duration)

            logger.info(f"✅ Prédiction générée pour {blood_type} avec méthode {final_method}")
            return result

        except Exception as e:
            logger.error(f"❌ Erreur prédiction: {e}")
            return self.emergency_fallback_real_data(blood_type, days_ahead)

    def generate_predictions_real_data(self, blood_type, days_ahead, method):
        """
        🎯 GÉNÉRATION DES PRÉDICTIONS avec vraies données
        """
        try:
            if method == 'random_forest' or method == 'xgboost':
                return self.predict_ml_real_data(blood_type, days_ahead, method)
            elif method == 'arima':
                return self.predict_arima_real_data(blood_type, days_ahead)
            elif method == 'stl_arima':
                return self.predict_stl_arima_real_data(blood_type, days_ahead)
            else:
                logger.warning(f"⚠️ Méthode inconnue: {method}")
                return None

        except Exception as e:
            logger.error(f"❌ Erreur génération prédictions: {e}")
            return None

    def predict_ml_real_data(self, blood_type, days_ahead, method):
        """
        🤖 PRÉDICTION ML basée sur features des vraies données
        """
        model_key = f"{'rf' if method == 'random_forest' else 'xgb'}_{blood_type}"

        if model_key not in self.trained_models:
            logger.error(f"❌ Modèle {model_key} non trouvé")
            return None

        try:
            model_data = self.trained_models[model_key]
            model = model_data['model']
            feature_cols = model_data['features']

            # Récupérer les dernières données réelles pour construire les features futures
            recent_data = self.get_historical_data_from_db(blood_type, days_back=30)
            if recent_data is None:
                return None

            # Préparer les features sur les données récentes
            contextual_data = self.get_contextual_data(blood_type)
            df_with_features = self.prepare_ml_features_from_real_data(recent_data, contextual_data)

            if df_with_features is None:
                return None

            predictions = []
            last_known_values = df_with_features['demand'].tail(14).values  # Dernières 2 semaines

            for i in range(days_ahead):
                future_date = datetime.now() + timedelta(days=i + 1)

                # Construction des features futures basées sur les patterns réels
                future_features = self.build_future_features_from_real_patterns(
                    future_date, df_with_features, last_known_values, i, contextual_data
                )

                if len(future_features) != len(feature_cols):
                    logger.warning(f"⚠️ Mismatch features: {len(future_features)} vs {len(feature_cols)}")
                    continue

                # Prédiction
                pred = model.predict([future_features])[0]
                pred = max(0, int(pred))  # Pas de demande négative

                # Calcul de confiance basé sur la variance récente
                recent_variance = np.var(last_known_values[-7:]) if len(last_known_values) >= 7 else 1
                base_confidence = max(0.6, min(0.95, 1.0 - (recent_variance / max(np.mean(last_known_values), 1))))

                # Diminution de confiance avec la distance temporelle
                confidence = base_confidence * (0.98 ** i)

                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_demand': pred,
                    'confidence': round(confidence, 3),
                    'method_details': {
                        'features_used': len(feature_cols),
                        'base_confidence': round(base_confidence, 3),
                        'temporal_decay': round(0.98 ** i, 3)
                    }
                })

                # Mettre à jour les valeurs connues pour la prédiction suivante
                if len(last_known_values) >= 14:
                    last_known_values = np.append(last_known_values[1:], pred)
                else:
                    last_known_values = np.append(last_known_values, pred)

            return predictions

        except Exception as e:
            logger.error(f"❌ Erreur prédiction ML: {e}")
            return None

    def build_future_features_from_real_patterns(self, future_date, historical_df, last_values, day_offset,
                                                 contextual_data):
        """
        🏗️ CONSTRUCTION DE FEATURES FUTURES basées sur les patterns des vraies données
        """
        try:
            features = []

            # Features temporelles de base
            features.extend([
                future_date.weekday(),  # day_of_week
                future_date.month,  # month
                future_date.day,  # day_of_month
                future_date.quarter,  # quarter
                1 if future_date.weekday() in [5, 6] else 0,  # is_weekend
                1 if future_date.weekday() == 0 else 0,  # is_monday
                1 if future_date.weekday() == 4 else 0,  # is_friday
            ])

            # Moyennes mobiles basées sur les dernières valeurs réelles
            if len(last_values) >= 3:
                features.append(np.mean(last_values[-3:]))  # demand_ma_3
            else:
                features.append(historical_df['demand'].mean())

            if len(last_values) >= 7:
                features.append(np.mean(last_values[-7:]))  # demand_ma_7
            else:
                features.append(historical_df['demand'].mean())

            if len(last_values) >= 14:
                features.append(np.mean(last_values[-14:]))  # demand_ma_14
            else:
                features.append(historical_df['demand'].mean())

            # Moyenne sur 30 jours si disponible
            if 'demand_ma_30' in historical_df.columns:
                features.append(historical_df['demand_ma_30'].iloc[-1])
            else:
                features.append(historical_df['demand'].mean())

            # Lags basés sur les vraies données
            for lag in [1, 2, 7, 14]:
                if len(last_values) >= lag:
                    features.append(last_values[-lag])
                else:
                    features.append(historical_df['demand'].mean())

            # Tendances calculées sur les vraies données récentes
            if len(last_values) >= 7:
                trend_7 = np.polyfit(range(7), last_values[-7:], 1)[0]
                features.append(trend_7)
            else:
                features.append(0.0)

            if len(last_values) >= 14:
                trend_14 = np.polyfit(range(14), last_values[-14:], 1)[0]
                features.append(trend_14)
            else:
                features.append(0.0)

            # Volatilité récente
            if len(last_values) >= 7:
                volatility = np.std(last_values[-7:])
                features.append(volatility)
            else:
                features.append(historical_df['demand'].std())

            # Features cycliques
            features.extend([
                np.sin(2 * np.pi * future_date.weekday() / 7),
                np.cos(2 * np.pi * future_date.weekday() / 7),
                np.sin(2 * np.pi * future_date.month / 12),
                np.cos(2 * np.pi * future_date.month / 12),
            ])

            # Features contextuelles
            if contextual_data:
                avg_demand = np.mean(last_values) if len(last_values) > 0 else historical_df['demand'].mean()
                features.extend([
                    contextual_data.get('current_stock', 0) / max(1, avg_demand),  # stock_ratio
                    contextual_data.get('recent_daily_avg', 0) / max(1, avg_demand)  # recent_trend_factor
                ])
            else:
                features.extend([1.0, 1.0])  # Valeurs par défaut

            return features

        except Exception as e:
            logger.error(f"❌ Erreur construction features: {e}")
            return []

    def predict_arima_real_data(self, blood_type, days_ahead):
        """
        📈 PRÉDICTION ARIMA sur vraies données
        """
        if blood_type not in self.arima_models:
            logger.error(f"❌ Modèle ARIMA non trouvé pour {blood_type}")
            return None

        try:
            model = self.arima_models[blood_type]

            # Prédiction ARIMA
            forecast = model.forecast(steps=days_ahead)
            conf_int = model.get_forecast(steps=days_ahead).conf_int()

            predictions = []

            for i in range(days_ahead):
                future_date = datetime.now() + timedelta(days=i + 1)
                pred = max(0, int(forecast.iloc[i]))

                # Confiance basée sur l'intervalle de confiance
                lower_bound = max(0, conf_int.iloc[i, 0])
                upper_bound = conf_int.iloc[i, 1]
                confidence_width = upper_bound - lower_bound

                # Normaliser la confiance (plus l'intervalle est étroit, plus la confiance est élevée)
                base_confidence = max(0.5, min(0.95, 1.0 - (confidence_width / max(pred, 1))))
                confidence = base_confidence * (0.97 ** i)  # Décroissance temporelle

                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_demand': pred,
                    'confidence': round(confidence, 3),
                    'lower_bound': max(0, int(lower_bound)),
                    'upper_bound': max(pred, int(upper_bound)),
                    'method_details': {
                        'confidence_interval_width': round(confidence_width, 2),
                        'forecast_value': round(float(forecast.iloc[i]), 2)
                    }
                })

            return predictions

        except Exception as e:
            logger.error(f"❌ Erreur prédiction ARIMA: {e}")
            return None

    def predict_stl_arima_real_data(self, blood_type, days_ahead):
        """
        🔬 PRÉDICTION STL + ARIMA sur vraies données
        """
        model_key = f'stl_{blood_type}'

        if model_key not in self.trained_models:
            logger.error(f"❌ Modèle STL non trouvé pour {blood_type}")
            return None

        try:
            model_data = self.trained_models[model_key]
            arima_model = model_data['arima_model']
            seasonal_component = model_data['seasonal_component']

            # Prédiction de la composante de tendance
            trend_forecast = arima_model.forecast(steps=days_ahead)

            # Reconstruction avec saisonnalité
            seasonal_pattern = seasonal_component.tail(7).values  # Dernier pattern hebdomadaire

            predictions = []

            for i in range(days_ahead):
                future_date = datetime.now() + timedelta(days=i + 1)

                # Composante saisonnière cyclique
                seasonal_value = seasonal_pattern[i % 7]

                # Prédiction finale
                trend_value = trend_forecast.iloc[i]
                final_pred = max(0, int(trend_value + seasonal_value))

                # Confiance basée sur la stabilité de la décomposition
                seasonal_stability = 1.0 - (np.std(seasonal_pattern) / max(np.mean(seasonal_pattern), 1))
                base_confidence = max(0.6, min(0.9, seasonal_stability))
                confidence = base_confidence * (0.96 ** i)

                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_demand': final_pred,
                    'confidence': round(confidence, 3),
                    'seasonal_component': round(seasonal_value, 2),
                    'trend_component': round(float(trend_value), 2),
                    'method_details': {
                        'seasonal_pattern_day': i % 7,
                        'seasonal_stability': round(seasonal_stability, 3)
                    }
                })

            return predictions

        except Exception as e:
            logger.error(f"❌ Erreur prédiction STL: {e}")
            return None

    def calculate_confidence_intervals_real_data(self, predictions):
        """
        📊 CALCUL D'INTERVALLES DE CONFIANCE basés sur les vraies données
        """
        if not predictions:
            return {'lower': [], 'upper': [], 'margin': 0}

        try:
            demands = [p['predicted_demand'] for p in predictions]
            confidences = [p['confidence'] for p in predictions]

            lower_bounds = []
            upper_bounds = []

            for i, (demand, conf) in enumerate(zip(demands, confidences)):
                # Marge d'erreur adaptative
                base_margin = demand * (1.0 - conf)  # Plus la confiance est faible, plus la marge est large
                time_margin = demand * 0.05 * i  # Augmentation avec le temps

                total_margin = base_margin + time_margin

                lower_bounds.append(max(0, int(demand - total_margin)))
                upper_bounds.append(int(demand + total_margin))

            return {
                'lower': lower_bounds,
                'upper': upper_bounds,
                'margin': float(np.mean([u - d for u, d in zip(upper_bounds, demands)]))
            }

        except Exception as e:
            logger.error(f"❌ Erreur calcul intervalles: {e}")
            return {'lower': [], 'upper': [], 'margin': 0}

    def calculate_stock_duration(self, contextual_data, predictions):
        """
        📦 CALCUL DE LA DURÉE DE VIE DU STOCK basé sur les vraies prédictions
        """
        try:
            current_stock = contextual_data.get('current_stock', 0)
            if current_stock <= 0 or not predictions:
                return 0

            cumulative_demand = 0
            for i, pred in enumerate(predictions):
                cumulative_demand += pred['predicted_demand']
                if cumulative_demand >= current_stock:
                    return i + 1

            # Si le stock dure plus longtemps que nos prédictions
            return len(predictions) + 1

        except Exception as e:
            logger.error(f"❌ Erreur calcul durée stock: {e}")
            return 0

    def calculate_overall_confidence(self, predictions, performance):
        """
        🎯 CALCUL DE LA CONFIANCE GLOBALE
        """
        try:
            if not predictions or not performance:
                return 0.5

            # Confiance moyenne des prédictions
            pred_confidence = np.mean([p['confidence'] for p in predictions])

            # Confiance basée sur la performance du modèle
            model_mape = performance.get('mape', 50)
            model_confidence = max(0.1, min(0.9, 1.0 - (model_mape / 100)))

            # Confiance combinée
            overall = (pred_confidence * 0.6) + (model_confidence * 0.4)

            return round(overall, 3)

        except Exception as e:
            logger.error(f"❌ Erreur calcul confiance: {e}")
            return 0.5

    def emergency_fallback_real_data(self, blood_type, days_ahead):
        """
        🚨 FALLBACK D'URGENCE basé sur les moyennes récentes des vraies données
        """
        try:
            logger.warning(f"🚨 Utilisation du fallback d'urgence pour {blood_type}")

            # Récupérer les données récentes
            recent_data = self.get_historical_data_from_db(blood_type, days_back=30)
            contextual_data = self.get_contextual_data(blood_type)

            if recent_data is not None and len(recent_data) > 0:
                # Utiliser les moyennes réelles récentes
                recent_mean = recent_data['demand'].tail(14).mean()
                recent_std = recent_data['demand'].tail(14).std()

                # Pattern hebdomadaire basé sur les vraies données
                weekly_pattern = []
                for day in range(7):
                    day_data = recent_data[recent_data.index.dayofweek == day]['demand']
                    if len(day_data) > 0:
                        weekly_pattern.append(day_data.mean())
                    else:
                        weekly_pattern.append(recent_mean)

                weekly_avg = np.mean(weekly_pattern) if weekly_pattern else recent_mean

            else:
                # Utiliser les données contextuelles si disponibles
                recent_mean = max(1, contextual_data.get('recent_daily_avg', 5))
                recent_std = recent_mean * 0.3
                weekly_pattern = [recent_mean] * 7
                weekly_avg = recent_mean

            predictions = []

            for i in range(days_ahead):
                future_date = datetime.now() + timedelta(days=i + 1)
                day_of_week = future_date.weekday()

                # Utiliser le pattern hebdomadaire réel
                if len(weekly_pattern) > day_of_week:
                    base_demand = weekly_pattern[day_of_week]
                else:
                    base_demand = recent_mean

                # Normaliser par rapport à la moyenne hebdomadaire
                if weekly_avg > 0:
                    seasonal_factor = base_demand / weekly_avg
                else:
                    seasonal_factor = 1.0

                # Ajustement pour les weekends (basé sur les données réelles si disponibles)
                if day_of_week in [5, 6]:  # Weekend
                    config = self.blood_type_config.get(blood_type, {})
                    weekend_factor = config.get('typical_weekend_factor', 0.8)
                    seasonal_factor *= weekend_factor

                final_demand = max(1, int(recent_mean * seasonal_factor))

                # Confiance réduite pour le fallback mais pas nulle
                confidence = max(0.4, min(0.7, 0.6 - (i * 0.02)))

                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_demand': final_demand,
                    'confidence': round(confidence, 3)
                })

            return {
                'blood_type': blood_type,
                'predictions': predictions,
                'method_used': 'emergency_fallback_real_data',
                'confidence_intervals': self.calculate_confidence_intervals_real_data(predictions),
                'generated_at': datetime.now().isoformat(),
                'data_source': 'real_database_limited',
                'warning': 'Prédiction de secours basée sur les moyennes récentes réelles',
                'contextual_insights': {
                    'current_stock': contextual_data.get('current_stock', 0),
                    'recent_trend': contextual_data.get('recent_daily_avg', 0),
                    'data_availability': 'limited'
                }
            }

        except Exception as e:
            logger.error(f"❌ Erreur fallback d'urgence: {e}")

            # Fallback ultime avec valeurs minimales
            config = self.blood_type_config.get(blood_type, {})
            min_demand = 2 if config.get('priority') == 'critical' else 1

            predictions = []
            for i in range(days_ahead):
                future_date = datetime.now() + timedelta(days=i + 1)
                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_demand': min_demand,
                    'confidence': 0.3
                })

            return {
                'blood_type': blood_type,
                'predictions': predictions,
                'method_used': 'minimal_fallback',
                'generated_at': datetime.now().isoformat(),
                'warning': 'Prédiction minimale - données insuffisantes',
                'error': str(e)
            }

    def get_model_performance_summary(self, blood_type):
        """
        📊 RÉSUMÉ DES PERFORMANCES DU MODÈLE
        """
        try:
            if blood_type not in self.model_performance:
                return {}

            performance = self.model_performance[blood_type]

            summary = {
                'best_method': min(performance.items(), key=lambda x: x[1].get('mape', float('inf')))[0],
                'best_mape': min([p.get('mape', float('inf')) for p in performance.values()]),
                'methods_trained': list(performance.keys()),
                'training_data_points': performance.get(list(performance.keys())[0], {}).get('training_samples', 0),
                'last_training': datetime.now().isoformat()
            }

            return summary

        except Exception as e:
            logger.error(f"❌ Erreur résumé performance: {e}")
            return {}

    def clear_model_cache(self, blood_type=None):
        """
        🧹 NETTOYAGE DU CACHE DES MODÈLES
        """
        try:
            if blood_type:
                # Nettoyage spécifique
                cache_keys = [
                    f'real_model_{blood_type}_auto',
                    f'real_model_{blood_type}_random_forest',
                    f'real_model_{blood_type}_xgboost',
                    f'real_model_{blood_type}_arima',
                    f'real_model_{blood_type}_stl_arima',
                    f'real_prediction_{blood_type}_7_auto',
                    f'real_prediction_{blood_type}_14_auto',
                    f'real_prediction_{blood_type}_30_auto'
                ]
                cache.delete_many(cache_keys)

                # Nettoyage des modèles en mémoire
                keys_to_remove = [k for k in self.trained_models.keys() if blood_type in k]
                for key in keys_to_remove:
                    del self.trained_models[key]

                if blood_type in self.model_performance:
                    del self.model_performance[blood_type]

                if blood_type in self.arima_models:
                    del self.arima_models[blood_type]

                logger.info(f"✅ Cache nettoyé pour {blood_type}")

            else:
                # Nettoyage global
                cache.clear()
                self.trained_models.clear()
                self.model_performance.clear()
                self.arima_models.clear()

                logger.info("✅ Cache global nettoyé")

        except Exception as e:
            logger.error(f"❌ Erreur nettoyage cache: {e}")


class TimeoutException(Exception):
    """Exception levée en cas de timeout"""
    pass


# ==================== FONCTIONS D'API POUR L'INTERFACE ====================

def generate_forecast_api(blood_type, days_ahead=7, method='auto', force_retrain=False):
    """
    🎯 FONCTION PRINCIPALE D'API pour l'interface React

    Args:
        blood_type: Type de sang (O+, A+, etc.)
        days_ahead: Nombre de jours à prédire
        method: Méthode à utiliser ('auto', 'random_forest', 'xgboost', 'arima', 'stl_arima')
        force_retrain: Forcer le réentraînement du modèle

    Returns:
        dict: Résultat complet de la prédiction
    """
    forecaster = RealDataBloodDemandForecaster()

    try:
        # Forcer le nettoyage du cache si demandé
        if force_retrain:
            forecaster.clear_model_cache(blood_type)

        # Générer la prédiction
        result = forecaster.predict_with_real_data(blood_type, days_ahead, method)

        # Enrichir avec des métadonnées pour l'interface
        result['api_response'] = {
            'timestamp': datetime.now().isoformat(),
            'processing_time_ms': int((time.time() - time.time()) * 1000),  # À ajuster
            'version': '2.0-real-data',
            'data_source': 'production_database'
        }

        # Ajouter les recommandations automatiques
        result['optimization_recommendations'] = generate_recommendations(result)

        return result

    except Exception as e:
        logger.error(f"❌ Erreur API génération prévision: {e}")
        return {
            'error': True,
            'message': str(e),
            'blood_type': blood_type,
            'method_attempted': method,
            'timestamp': datetime.now().isoformat()
        }


def generate_recommendations(forecast_result):
    """
    💡 GÉNÉRATION DE RECOMMANDATIONS basées sur les vraies prédictions
    """
    try:
        if not forecast_result.get('predictions'):
            return []

        recommendations = []
        predictions = forecast_result['predictions']
        blood_type = forecast_result['blood_type']

        # Analyser les prédictions
        demands = [p['predicted_demand'] for p in predictions]
        max_demand = max(demands)
        avg_demand = np.mean(demands)

        # Stock actuel
        current_stock = forecast_result.get('contextual_insights', {}).get('current_stock', 0)

        # Recommandations basées sur les vraies prédictions
        if max_demand > avg_demand * 1.5:
            recommendations.append({
                'type': 'demand_spike',
                'priority': 'high',
                'message': f"Pic de demande prévu: {max_demand} unités. Prévoir un stock supplémentaire.",
                'action': 'increase_collection'
            })

        if current_stock > 0:
            stock_duration = forecast_result.get('contextual_insights', {}).get('stock_days_remaining', 0)
            if stock_duration < 3:
                recommendations.append({
                    'type': 'low_stock',
                    'priority': 'critical',
                    'message': f"Stock critique: {current_stock} unités pour {stock_duration} jours seulement.",
                    'action': 'urgent_collection'
                })
            elif stock_duration < 7:
                recommendations.append({
                    'type': 'moderate_stock',
                    'priority': 'medium',
                    'message': f"Stock modéré: planifier une collecte dans les prochains jours.",
                    'action': 'schedule_collection'
                })

        # Recommandations basées sur la confiance du modèle
        avg_confidence = np.mean([p['confidence'] for p in predictions])
        if avg_confidence < 0.7:
            recommendations.append({
                'type': 'low_confidence',
                'priority': 'medium',
                'message': f"Confiance du modèle modérée ({avg_confidence:.1%}). Surveiller de près les tendances réelles.",
                'action': 'monitor_closely'
            })

        return recommendations

    except Exception as e:
        logger.error(f"❌ Erreur génération recommandations: {e}")
        return []


def get_available_methods():
    """
    📋 LISTE DES MÉTHODES DISPONIBLES pour l'interface
    """
    methods = [
        {
            'value': 'auto',
            'label': '🤖 Auto-Sélection',
            'description': 'Sélection automatique de la meilleure méthode'
        },
        {
            'value': 'random_forest',
            'label': '🌲 Random Forest',
            'description': 'Apprentissage automatique robuste'
        }
    ]

    if XGBOOST_AVAILABLE:
        methods.append({
            'value': 'xgboost',
            'label': '⚡ XGBoost',
            'description': 'Gradient boosting haute performance'
        })

    if STATSMODELS_AVAILABLE:
        methods.extend([
            {
                'value': 'arima',
                'label': '📈 ARIMA',
                'description': 'Modèle statistique de séries temporelles'
            },
            {
                'value': 'stl_arima',
                'label': '🔬 STL + ARIMA',
                'description': 'Décomposition saisonnière + ARIMA'
            }
        ])

    return methods


def health_check():
    """
    🏥 VÉRIFICATION DE SANTÉ DU SYSTÈME
    """
    try:
        from django.db import connection

        # Test de connexion DB
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "connected"

        return {
            'status': 'healthy',
            'version': '2.0-real-data',
            'database': db_status,
            'xgboost_available': XGBOOST_AVAILABLE,
            'statsmodels_available': STATSMODELS_AVAILABLE,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


