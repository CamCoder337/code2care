# app/forecasting/blood_demand_forecasting.py - VERSION OPTIMISÉE POUR RENDER
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
import logging

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)

# ==================== IMPORTS CONDITIONNELS OPTIMISÉS ====================
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


class TimeoutException(Exception):
    """Exception levée en cas de timeout"""
    pass


class RenderOptimizedForecaster:
    """
    Forecaster optimisé pour Render (512MB RAM, 0.1 CPU) - Version hybride
    Combine votre approche existante avec des optimisations pour éviter les timeouts
    """

    def __init__(self, max_execution_time=120):  # 2 minutes max
        self.max_execution_time = max_execution_time
        self.start_time = None

        # ==================== MODÈLES LÉGERS ====================
        # Modèles réduits pour économiser la mémoire
        self.models = {
            'random_forest': RandomForestRegressor(
                n_estimators=30,  # Réduit de 100 à 30
                max_depth=6,  # Réduit de 10 à 6
                random_state=42,
                n_jobs=1  # Un seul job pour éviter la surcharge mémoire
            )
        }

        # XGBoost léger si disponible
        if XGBOOST_AVAILABLE:
            self.models['xgboost'] = xgb.XGBRegressor(
                n_estimators=30,  # Réduit
                max_depth=4,  # Réduit
                learning_rate=0.1,
                random_state=42,
                n_jobs=1
            )

        self.scaler = StandardScaler()
        self.trained_models = {}
        self.model_performance = {}
        self.arima_models = {}
        self.stl_models = {}

    def check_timeout(self):
        """Vérifier si on approche du timeout"""
        if self.start_time and time.time() - self.start_time > self.max_execution_time:
            raise TimeoutException("Maximum execution time exceeded")

    def fit_arima_optimized(self, series, blood_type):
        """ARIMA optimisé avec timeout et paramètres réduits"""
        if not STATSMODELS_AVAILABLE:
            return None

        try:
            self.check_timeout()

            series = series.dropna()
            if len(series) < 15:  # Réduit le minimum de 30 à 15
                logger.info(f"Insufficient data for ARIMA {blood_type}: {len(series)} points")
                return None

            # Vérification rapide de stationnarité
            stationary_series, d = self.make_stationary_fast(series)

            # ARIMA simplifié avec moins de paramètres testés
            best_model = None

            # Test seulement quelques combinaisons communes
            common_orders = [(1, d, 1), (2, d, 1), (1, d, 2), (0, d, 1), (1, d, 0)]

            for order in common_orders:
                try:
                    self.check_timeout()
                    model = ARIMA(series, order=order)
                    fitted = model.fit(maxiter=20)  # Limiter les iterations

                    if best_model is None:
                        best_model = fitted
                        break  # Prendre le premier qui marche pour gagner du temps

                except Exception:
                    continue

            if best_model:
                self.arima_models[blood_type] = best_model
                logger.info(f"ARIMA {order} fitted for {blood_type}")
                return best_model

            return None

        except TimeoutException:
            logger.warning(f"ARIMA timeout for {blood_type}")
            return None
        except Exception as e:
            logger.error(f"ARIMA failed for {blood_type}: {e}")
            return None

    def make_stationary_fast(self, series):
        """Version rapide de make_stationary"""
        # Test simple sans statistiques complexes
        if len(series) < 10:
            return series, 0

        # Différence d'ordre 1 par défaut pour la plupart des séries temporelles
        diff_series = series.diff().dropna()
        return diff_series, 1

    def prepare_ml_features_lite(self, df):
        """Features engineering allégé pour économiser le temps et la mémoire"""
        df = df.copy()

        if not isinstance(df.index, pd.DatetimeIndex):
            df.index = pd.to_datetime(df.index)

        # ==================== FEATURES ESSENTIELLES SEULEMENT ====================
        df['day_of_week'] = df.index.dayofweek
        df['month'] = df.index.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_monday'] = (df['day_of_week'] == 0).astype(int)

        # Moyennes mobiles réduites (seulement les plus importantes)
        for window in [7, 14]:  # Seulement 7 et 14 jours
            df[f'demand_ma_{window}'] = df['demand'].rolling(window=window, min_periods=1).mean()

        # Lags essentiels seulement
        for lag in [1, 7]:  # Seulement lag 1 et 7
            df[f'demand_lag_{lag}'] = df['demand'].shift(lag)

        # Features cycliques simples
        df['sin_day_of_week'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['cos_day_of_week'] = np.cos(2 * np.pi * df['day_of_week'] / 7)

        return df

    def train_comprehensive_optimized(self, historical_data, blood_type):
        """Entraînement optimisé avec timeout et cache"""
        self.start_time = time.time()

        # ==================== VÉRIFIER LE CACHE ====================
        cache_key = f'model_training_{blood_type}'
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Using cached model for {blood_type}")
            self.model_performance[blood_type] = cached_result['performance']
            self.trained_models.update(cached_result['models'])
            return cached_result['performance'], cached_result['best_method']

        logger.info(f"Training optimized models for {blood_type}...")

        # Préparer les données
        df = historical_data.copy()
        if not isinstance(df.index, pd.DatetimeIndex):
            df.index = pd.to_datetime(df.index)
        df = df.sort_index()

        results = {}

        try:
            # ==================== 1. MODÈLES ML PRIORITAIRES ====================
            # ML en premier car plus rapide et plus prévisible
            logger.info("- Training ML models...")
            ml_results = self.train_ml_models_optimized(df, blood_type)
            results.update(ml_results)

            # ==================== 2. ARIMA SI TEMPS DISPONIBLE ====================
            if STATSMODELS_AVAILABLE and time.time() - self.start_time < 60:  # Si moins de 1 minute écoulée
                logger.info("- Training ARIMA (if time permits)...")
                try:
                    arima_model = self.fit_arima_optimized(df['demand'], blood_type)
                    if arima_model:
                        results['arima'] = self.evaluate_arima_model_fast(arima_model, df['demand'])
                except TimeoutException:
                    logger.warning("ARIMA training skipped due to timeout")

            # ==================== 3. SÉLECTION DU MEILLEUR MODÈLE ====================
            if results:
                best_method = self.select_best_method(results)
                logger.info(f"Best method for {blood_type}: {best_method}")

                # ==================== CACHE DES RÉSULTATS ====================
                cache_data = {
                    'performance': results,
                    'models': {k: v for k, v in self.trained_models.items() if blood_type in k},
                    'best_method': best_method
                }
                cache.set(cache_key, cache_data, 3600)  # Cache 1 heure

                self.model_performance[blood_type] = results
                return results, best_method
            else:
                logger.warning(f"No models successfully trained for {blood_type}")
                return {}, 'fallback'

        except TimeoutException:
            logger.error(f"Training timeout for {blood_type}")
            return {}, 'fallback'
        except Exception as e:
            logger.error(f"Training error for {blood_type}: {e}")
            return {}, 'fallback'

    def select_best_method(self, results):
        """Sélection intelligente du meilleur modèle"""
        if not results:
            return 'fallback'

        # Priorité: 1. ML models (plus stables), 2. ARIMA si très bon
        ml_methods = ['random_forest', 'xgboost']
        ml_results = {k: v for k, v in results.items() if k in ml_methods}

        if ml_results:
            # Choisir le meilleur ML
            best_ml = min(ml_results.items(), key=lambda x: x[1].get('mape', float('inf')))

            # Comparer avec ARIMA si disponible
            if 'arima' in results:
                arima_mape = results['arima'].get('mape', float('inf'))
                if arima_mape < best_ml[1].get('mape', float('inf')) * 0.8:  # ARIMA doit être 20% meilleur
                    return 'arima'

            return best_ml[0]

        # Fallback vers ARIMA si pas de ML
        if 'arima' in results:
            return 'arima'

        return 'fallback'

    def train_ml_models_optimized(self, df, blood_type):
        """Entraînement ML optimisé"""
        try:
            self.check_timeout()

            # Préparation features légère
            df_features = self.prepare_ml_features_lite(df)
            df_features = df_features.dropna()

            if len(df_features) < 8:  # Réduit le minimum
                logger.info(f"Insufficient data after feature engineering for {blood_type}")
                return {}

            # Features pour ML
            feature_cols = [col for col in df_features.columns
                            if col not in ['demand'] and not col.startswith('demand_ratio')]

            X = df_features[feature_cols]
            y = df_features['demand']

            # Split temporel
            split_idx = max(6, int(len(df_features) * 0.8))
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]

            results = {}

            # ==================== RANDOM FOREST (PRIORITAIRE) ====================
            try:
                self.check_timeout()
                rf_model = self.models['random_forest']
                rf_model.fit(X_train, y_train)
                rf_pred = rf_model.predict(X_test)

                results['random_forest'] = {
                    'mae': mean_absolute_error(y_test, rf_pred),
                    'rmse': np.sqrt(mean_squared_error(y_test, rf_pred)),
                    'mape': mean_absolute_percentage_error(y_test, rf_pred) * 100
                }

                self.trained_models[f'rf_{blood_type}'] = rf_model
                logger.info(f"  - Random Forest trained (MAPE: {results['random_forest']['mape']:.2f}%)")

            except TimeoutException:
                raise
            except Exception as e:
                logger.error(f"  - Random Forest failed: {e}")

            # ==================== XGBOOST SI TEMPS DISPONIBLE ====================
            if XGBOOST_AVAILABLE and time.time() - self.start_time < 90:  # Si moins de 1.5 minutes
                try:
                    self.check_timeout()
                    xgb_model = self.models['xgboost']
                    xgb_model.fit(X_train, y_train)
                    xgb_pred = xgb_model.predict(X_test)

                    results['xgboost'] = {
                        'mae': mean_absolute_error(y_test, xgb_pred),
                        'rmse': np.sqrt(mean_squared_error(y_test, xgb_pred)),
                        'mape': mean_absolute_percentage_error(y_test, xgb_pred) * 100
                    }

                    self.trained_models[f'xgb_{blood_type}'] = xgb_model
                    logger.info(f"  - XGBoost trained (MAPE: {results['xgboost']['mape']:.2f}%)")

                except TimeoutException:
                    logger.warning("XGBoost training skipped due to timeout")
                except Exception as e:
                    logger.error(f"  - XGBoost failed: {e}")

            return results

        except TimeoutException:
            raise
        except Exception as e:
            logger.error(f"ML training failed for {blood_type}: {e}")
            return {}

    def predict_hybrid_optimized(self, blood_type, days_ahead=30, method='auto'):
        """Prédiction optimisée avec cache et timeout"""

        # ==================== VÉRIFIER LE CACHE ====================
        cache_key = f'prediction_{blood_type}_{days_ahead}_{method}'
        cached_prediction = cache.get(cache_key)
        if cached_prediction:
            logger.info(f"Using cached prediction for {blood_type}")
            return cached_prediction

        self.start_time = time.time()

        try:
            # ==================== SÉLECTION DE MÉTHODE ====================
            if method == 'auto':
                method = self.select_prediction_method(blood_type, days_ahead)

            logger.info(f"Using method: {method} for {blood_type}")

            # ==================== PRÉDICTION ====================
            predictions = self.predict_single_method_optimized(blood_type, days_ahead, method)

            # Générer les dates futures
            future_dates = [
                (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
                for i in range(1, days_ahead + 1)
            ]

            # Intervalles de confiance simplifiés
            confidence_intervals = self.calculate_confidence_intervals_fast(predictions)

            result = {
                'blood_type': blood_type,
                'predictions': [
                    {
                        'date': date,
                        'predicted_demand': max(0, int(pred)),
                        'confidence': 0.80  # Réduit légèrement car modèles optimisés
                    }
                    for date, pred in zip(future_dates, predictions)
                ],
                'method_used': method,
                'confidence_intervals': confidence_intervals,
                'model_performance': self.model_performance.get(blood_type, {}),
                'generated_at': datetime.now().isoformat()
            }

            # ==================== CACHE DU RÉSULTAT ====================
            cache.set(cache_key, result, 1800)  # Cache 30 minutes

            return result

        except TimeoutException:
            logger.error(f"Prediction timeout for {blood_type}")
            return self.fallback_prediction_optimized(blood_type, days_ahead)
        except Exception as e:
            logger.error(f"Prediction failed for {blood_type}: {e}")
            return self.fallback_prediction_optimized(blood_type, days_ahead)

    def select_prediction_method(self, blood_type, days_ahead):
        """Sélection optimisée de la méthode de prédiction"""
        if blood_type in self.model_performance:
            return self.select_best_method(self.model_performance[blood_type])

        # Logique par défaut
        if days_ahead <= 7:
            return 'random_forest'  # Plus stable pour court terme
        elif XGBOOST_AVAILABLE:
            return 'xgboost'  # Meilleur pour moyen terme
        else:
            return 'random_forest'

    def predict_single_method_optimized(self, blood_type, days_ahead, method):
        """Prédiction avec méthode unique optimisée"""
        self.check_timeout()

        if method == 'arima' and blood_type in self.arima_models:
            model = self.arima_models[blood_type]
            forecast = model.forecast(steps=days_ahead)
            return np.maximum(forecast, 0)

        elif method in ['random_forest', 'xgboost']:
            return self.predict_ml_method_optimized(blood_type, days_ahead, method)

        else:
            logger.info(f"Method {method} not available, using fallback")
            return self.fallback_prediction_simple_optimized(blood_type, days_ahead)

    def predict_ml_method_optimized(self, blood_type, days_ahead, method):
        """Prédiction ML optimisée"""
        model_key = f"{'rf' if method == 'random_forest' else 'xgb'}_{blood_type}"

        if model_key not in self.trained_models:
            return self.fallback_prediction_simple_optimized(blood_type, days_ahead)

        try:
            self.check_timeout()
            model = self.trained_models[model_key]

            # Features futures simplifiées
            future_features = self.generate_future_features_optimized(days_ahead)
            predictions = model.predict(future_features)

            return np.maximum(predictions, 0)

        except Exception as e:
            logger.error(f"ML prediction failed for {blood_type}: {e}")
            return self.fallback_prediction_simple_optimized(blood_type, days_ahead)

    def generate_future_features_optimized(self, days_ahead):
        """Génération optimisée de features futures"""
        # Version simplifiée et rapide
        future_dates = pd.date_range(
            start=datetime.now(),
            periods=days_ahead,
            freq='D'
        )

        features = []
        for i, date in enumerate(future_dates):
            row = [
                date.dayofweek,  # day_of_week
                date.month,  # month
                1 if date.dayofweek in [5, 6] else 0,  # is_weekend
                1 if date.dayofweek == 0 else 0,  # is_monday
                10,  # demand_ma_7 (valeur par défaut)
                10,  # demand_ma_14 (valeur par défaut)
                10,  # demand_lag_1 (valeur par défaut)
                10,  # demand_lag_7 (valeur par défaut)
                np.sin(2 * np.pi * date.dayofweek / 7),  # sin_day_of_week
                np.cos(2 * np.pi * date.dayofweek / 7),  # cos_day_of_week
            ]
            features.append(row)

        return np.array(features)

    def calculate_confidence_intervals_fast(self, predictions):
        """Intervalles de confiance rapides"""
        if len(predictions) == 0:
            return {'lower': [], 'upper': [], 'margin': 0}

        std_dev = np.std(predictions) if len(predictions) > 1 else np.mean(predictions) * 0.2
        margin = 1.96 * std_dev  # 95% de confiance

        lower_bound = np.maximum(predictions - margin, 0)
        upper_bound = predictions + margin

        return {
            'lower': lower_bound.tolist(),
            'upper': upper_bound.tolist(),
            'margin': float(margin)
        }

    def fallback_prediction_optimized(self, blood_type, days_ahead):
        """Prédiction de secours optimisée"""
        logger.info(f"Using fallback prediction for {blood_type}")

        # Base sur des moyennes typiques par groupe sanguin
        base_demands = {
            'O+': 15, 'A+': 12, 'B+': 8, 'AB+': 3,
            'O-': 7, 'A-': 6, 'B-': 4, 'AB-': 2
        }

        base_demand = base_demands.get(blood_type, 10)
        predictions = []

        for i in range(days_ahead):
            # Variation saisonnière simple
            day_of_week = (datetime.now() + timedelta(days=i + 1)).weekday()

            # Pic en début de semaine (lundi-mardi)
            if day_of_week in [0, 1]:
                seasonal_factor = 1.2
            elif day_of_week in [5, 6]:  # Weekend plus bas
                seasonal_factor = 0.8
            else:
                seasonal_factor = 1.0

            daily_pred = base_demand * seasonal_factor

            predictions.append({
                'date': (datetime.now() + timedelta(days=i + 1)).strftime('%Y-%m-%d'),
                'predicted_demand': max(1, int(daily_pred)),
                'confidence': 0.6
            })

        return {
            'blood_type': blood_type,
            'predictions': predictions,
            'method_used': 'fallback_optimized',
            'confidence_intervals': {
                'lower': [max(1, int(p['predicted_demand'] * 0.7)) for p in predictions],
                'upper': [int(p['predicted_demand'] * 1.3) for p in predictions]
            },
            'warning': 'Using optimized fallback prediction method',
            'generated_at': datetime.now().isoformat()
        }

    def fallback_prediction_simple_optimized(self, blood_type, days_ahead):
        """Prédiction de secours simple optimisée"""
        base_demands = {
            'O+': 15, 'A+': 12, 'B+': 8, 'AB+': 3,
            'O-': 7, 'A-': 6, 'B-': 4, 'AB-': 2
        }

        base_demand = base_demands.get(blood_type, 10)
        predictions = []

        for i in range(days_ahead):
            day_of_week = i % 7
            seasonal_factor = 1.2 if day_of_week in [0, 1] else (0.8 if day_of_week in [5, 6] else 1.0)
            daily_pred = base_demand * seasonal_factor
            predictions.append(max(1, daily_pred))

        return np.array(predictions)

    def evaluate_arima_model_fast(self, model, series):
        """Évaluation ARIMA rapide"""
        try:
            fitted_values = model.fittedvalues
            if len(fitted_values) == 0:
                return {'mae': float('inf'), 'rmse': float('inf'), 'mape': float('inf')}

            residuals = series[-len(fitted_values):] - fitted_values

            mae = np.mean(np.abs(residuals))
            rmse = np.sqrt(np.mean(residuals ** 2))

            # MAPE simplifié
            non_zero_actual = series[-len(fitted_values):][series[-len(fitted_values):] != 0]
            non_zero_fitted = fitted_values[series[-len(fitted_values):] != 0]

            if len(non_zero_actual) > 0:
                mape = np.mean(np.abs((non_zero_actual - non_zero_fitted) / non_zero_actual)) * 100
            else:
                mape = 100.0

            return {
                'mae': float(mae),
                'rmse': float(rmse),
                'mape': float(mape)
            }
        except Exception as e:
            logger.error(f"ARIMA evaluation failed: {e}")
            return {'mae': float('inf'), 'rmse': float('inf'), 'mape': float('inf')}

    def clear_cache(self, blood_type=None):
        """Nettoyer le cache"""
        if blood_type:
            cache.delete_many([
                f'model_training_{blood_type}',
                f'prediction_{blood_type}_7_auto',
                f'prediction_{blood_type}_30_auto'
            ])
        else:
            # Nettoyage global (à utiliser avec parcimonie)
            cache.clear()
        logger.info(f"Cache cleared for {blood_type or 'all'}")


# ==================== VERSION LIGHTWEIGHT POUR PRODUCTION ====================
class ProductionLightweightForecaster:
    """Version ultra-légère pour production avec cache agressif"""

    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=20,  # Très réduit
            max_depth=5,
            random_state=42,
            n_jobs=1
        )
        self.is_trained = {}

    def quick_predict_cached(self, blood_type, days=7):
        """Prédiction ultra-rapide avec cache"""
        cache_key = f'quick_pred_{blood_type}_{days}'
        result = cache.get(cache_key)

        if result:
            return result

        # Génération rapide
        base_demands = {
            'O+': 15, 'A+': 12, 'B+': 8, 'AB+': 3,
            'O-': 7, 'A-': 6, 'B-': 4, 'AB-': 2
        }

        base = base_demands.get(blood_type, 10)
        predictions = []

        for i in range(days):
            day_factor = 1.2 if i % 7 in [0, 1] else (0.8 if i % 7 in [5, 6] else 1.0)
            pred = max(1, int(base * day_factor))
            predictions.append({
                'date': (datetime.now() + timedelta(days=i + 1)).strftime('%Y-%m-%d'),
                'predicted_demand': pred,
                'confidence': 0.75
            })

        result = {
            'blood_type': blood_type,
            'predictions': predictions,
            'method_used': 'production_lightweight',
            'generated_at': datetime.now().isoformat()
        }

        # Cache agressif pour production
        cache.set(cache_key, result, 3600)  # 1 heure
        return result