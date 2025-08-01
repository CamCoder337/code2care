# test_forecasting.py
"""
Script de test pour le système de prévision hybride
À exécuter avec: python manage.py shell < test_forecasting.py
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def test_forecasting_system():
    """Test complet du système de forecasting"""

    print("=== TEST DU SYSTÈME DE PRÉVISION HYBRIDE ===")

    # 1. Test des imports
    try:
        from app.forecasting.blood_demand_forecasting import EnhancedBloodDemandForecaster, LightweightForecaster
        print("✓ Imports du forecaster réussis")
    except ImportError as e:
        print(f"✗ Erreur d'import: {e}")
        return False

    # 2. Test de création du forecaster
    try:
        forecaster = EnhancedBloodDemandForecaster()
        lightweight = LightweightForecaster()
        print("✓ Création des forecasters réussie")
    except Exception as e:
        print(f"✗ Erreur de création: {e}")
        return False

    # 3. Test avec données synthétiques
    try:
        # Créer des données de test
        dates = pd.date_range(start='2024-01-01', end='2024-12-31', freq='D')

        # Simulation de demande avec tendance et saisonnalité
        trend = np.linspace(10, 15, len(dates))
        seasonal = 3 * np.sin(2 * np.pi * np.arange(len(dates)) / 7)  # Cycle hebdomadaire
        noise = np.random.normal(0, 1, len(dates))
        demand = trend + seasonal + noise
        demand = np.maximum(demand, 1)  # Pas de demande négative

        df = pd.DataFrame({
            'demand': demand
        }, index=dates)

        print(f"✓ Données de test créées: {len(df)} points")

    except Exception as e:
        print(f"✗ Erreur de création des données: {e}")
        return False

    # 4. Test d'entraînement
    try:
        print("\n--- Test d'entraînement ---")
        results, best_method = forecaster.train_comprehensive(df, 'O+')
        print(f"✓ Entraînement réussi. Meilleure méthode: {best_method}")
        print("Résultats par méthode:")
        for method, metrics in results.items():
            mape = metrics.get('mape', 'N/A')
            print(f"  - {method}: MAPE = {mape}")

    except Exception as e:
        print(f"✗ Erreur d'entraînement: {e}")
        return False

    # 5. Test de prédiction
    try:
        print("\n--- Test de prédiction ---")

        # Test avec différentes méthodes
        methods_to_test = ['auto', 'arima', 'stl_arima', 'random_forest']
        if 'xgboost' in forecaster.models:
            methods_to_test.append('xgboost')

        for method in methods_to_test:
            try:
                forecast_result = forecaster.predict_hybrid('O+', days_ahead=7, method=method)
                print(f"✓ Prédiction {method} réussie: {len(forecast_result['predictions'])} prédictions")

                # Afficher les premières prédictions
                for i, pred in enumerate(forecast_result['predictions'][:3]):
                    if isinstance(pred, dict):
                        print(f"    {pred['date']}: {pred['predicted_demand']:.1f}")

            except Exception as e:
                print(f"✗ Prédiction {method} échouée: {e}")

    except Exception as e:
        print(f"✗ Erreur de prédiction: {e}")
        return False

    # 6. Test du forecaster léger
    try:
        print("\n--- Test forecaster léger ---")
        lightweight_result = lightweight.quick_train(df, 'O+')
        print(f"✓ Entraînement léger: {lightweight_result}")

        light_predictions = lightweight.fast_predict('O+', days=7)
        print(f"✓ Prédiction légère: {len(light_predictions)} valeurs")
        print(f"    Exemple: {light_predictions[:3]}")

    except Exception as e:
        print(f"✗ Erreur forecaster léger: {e}")
        return False

    # 7. Test de sauvegarde/chargement
    try:
        print("\n--- Test sauvegarde/chargement ---")
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pkl') as tmp:
            tmp_path = tmp.name

        forecaster.save_models(tmp_path)
        print("✓ Sauvegarde réussie")

        new_forecaster = EnhancedBloodDemandForecaster()
        success = new_forecaster.load_models(tmp_path)

        if success:
            print("✓ Chargement réussi")
        else:
            print("✗ Chargement échoué")

        # Nettoyage
        os.unlink(tmp_path)

    except Exception as e:
        print(f"✗ Erreur sauvegarde/chargement: {e}")
        return False

    print("\n=== TEST COMPLET RÉUSSI ===")
    return True


def test_api_integration():
    """Test d'intégration avec l'API Django"""

    print("\n=== TEST D'INTÉGRATION API ===")

    try:
        from app.views import DemandForecastAPIView
        print("✓ Import de l'API view réussi")

        # Créer une instance de la vue
        view = DemandForecastAPIView()
        print("✓ Création de la vue réussie")

        # Test des données historiques factices
        test_data = [
                        {'day': '2024-07-01', 'volume': 10, 'count': 1},
                        {'day': '2024-07-02', 'volume': 12, 'count': 1},
                        {'day': '2024-07-03', 'volume': 8, 'count': 1},
                        {'day': '2024-07-04', 'volume': 15, 'count': 1},
                        {'day': '2024-07-05', 'volume': 11, 'count': 1},
                    ] * 10  # Répéter pour avoir assez de données

        # Test de préparation DataFrame
        df = view.prepare_dataframe_for_forecasting(test_data)
        print(f"✓ Préparation DataFrame: {len(df)} lignes")

        # Test de prévision simple
        simple_forecast = view.generate_simple_forecast(test_data, 7, 'O+')
        print(f"✓ Prévision simple: {len(simple_forecast['predictions'])} prédictions")

        print("=== INTÉGRATION API RÉUSSIE ===")
        return True

    except Exception as e:
        print(f"✗ Erreur d'intégration API: {e}")
        return False


def check_dependencies():
    """Vérifier les dépendances installées"""

    print("\n=== VÉRIFICATION DES DÉPENDANCES ===")

    dependencies = {
        'numpy': 'numpy',
        'pandas': 'pandas',
        'sklearn': 'scikit-learn',
        'statsmodels': 'statsmodels (pour ARIMA)',
        'xgboost': 'xgboost (optionnel)'
    }

    for module, description in dependencies.items():
        try:
            __import__(module)
            print(f"✓ {description}")
        except ImportError:
            print(f"✗ {description} - non installé")

    print("=== VÉRIFICATION TERMINÉE ===")


if __name__ == "__main__":
    # Exécuter tous les tests
    check_dependencies()
    test_forecasting_system()
    test_api_integration()

    print("\n=== RÉSUMÉ ===")
    print("Pour installer les dépendances manquantes:")
    print("pip install statsmodels xgboost")
    print("\nPour tester l'API:")
    print("curl 'http://localhost:8000/api/forecast/demand/?blood_type=O+&days=7&method=auto'")