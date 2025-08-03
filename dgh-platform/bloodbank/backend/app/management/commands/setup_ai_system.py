# management/commands/setup_ai_system.py
from django.core.management.base import BaseCommand
from app.forecasting.blood_demand_forcasting import RealDataBloodDemandForecaster


class Command(BaseCommand):
    help = 'Initialise le système IA avec les données existantes'

    def handle(self, *args, **options):
        forecaster = RealDataBloodDemandForecaster()

        # Test pour tous les groupes sanguins
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']

        for bt in blood_types:
            try:
                performance, method = forecaster.train_model_with_real_data(bt)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ {bt}: {method} (MAPE: {performance.get(method, {}).get("mape", "N/A")}%)')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ {bt}: {str(e)}')
                )