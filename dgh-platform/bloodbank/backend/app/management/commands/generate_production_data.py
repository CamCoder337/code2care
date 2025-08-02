# app/management/commands/generate_production_data.py
import random
from datetime import date, timedelta
import numpy as np
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from app.models import (
    Donor, Site, Department, Patient, BloodRecord,
    BloodUnit, BloodRequest, BloodConsumption, Prevision
)


class Command(BaseCommand):
    help = 'Génère un maximum de données pour la production PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--scale',
            type=str,
            choices=['small', 'medium', 'large', 'massive'],
            default='medium',
            help='Échelle de génération des données'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forcer la génération même si des données existent'
        )

    def handle(self, *args, **options):
        scale = options['scale']

        # Définir les paramètres selon l'échelle
        scales = {
            'small': {
                'donors': 500,
                'patients': 200,
                'units': 1000,
                'days_history': 90,
                'requests_per_day': 15
            },
            'medium': {
                'donors': 2000,
                'patients': 800,
                'units': 5000,
                'days_history': 180,
                'requests_per_day': 30
            },
            'large': {
                'donors': 10000,
                'patients': 3000,
                'units': 20000,
                'days_history': 365,
                'requests_per_day': 60
            },
            'massive': {
                'donors': 50000,
                'patients': 15000,
                'units': 100000,
                'days_history': 730,  # 2 ans
                'requests_per_day': 150
            }
        }

        params = scales[scale]

        self.stdout.write(f'🚀 Génération de données à l\'échelle: {scale.upper()}')
        self.stdout.write(f'📊 Paramètres: {params}')

        # Vérifier les données existantes
        existing_data = {
            'donors': Donor.objects.count(),
            'patients': Patient.objects.count(),
            'units': BloodUnit.objects.count(),
            'requests': BloodRequest.objects.count()
        }

        if any(existing_data.values()) and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    f'Des données existent déjà: {existing_data}\n'
                    'Utilisez --force pour continuer quand même.'
                )
            )
            return

        try:
            with transaction.atomic():
                self.generate_comprehensive_data(params)

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erreur durant la génération: {e}')
            )
            raise

    def generate_comprehensive_data(self, params):
        """Générer toutes les données de manière optimisée"""

        # 1. Infrastructures de base
        self.stdout.write('🏥 Création des sites et départements...')
        sites = self.create_comprehensive_sites()
        departments = self.create_comprehensive_departments()

        # 2. Personnes (en lots pour optimisation)
        self.stdout.write(f'👥 Création de {params["donors"]:,} donneurs...')
        donors = self.create_donors_batch(params['donors'])

        self.stdout.write(f'🏥 Création de {params["patients"]:,} patients...')
        patients = self.create_patients_batch(params['patients'])

        # 3. Données sanguines (avec progression)
        self.stdout.write(f'🩸 Création de {params["units"]:,} unités de sang...')
        blood_units = self.create_blood_units_optimized(
            donors, sites, params['units'], params['days_history']
        )

        # 4. Demandes et consommations historiques
        self.stdout.write(f'📋 Génération de l\'historique sur {params["days_history"]} jours...')
        self.create_historical_requests_optimized(
            departments, sites, blood_units, patients,
            params['days_history'], params['requests_per_day']
        )

        # 5. Prévisions et analytics
        self.stdout.write('📈 Génération des prévisions...')
        self.create_advanced_forecasts()

        # 6. Statistiques finales
        self.show_final_statistics()

    def create_comprehensive_sites(self):
        """Créer des sites de collecte réalistes pour le Cameroun"""
        sites_data = [
            # Douala
            ('SITE_DGH', 'Douala General Hospital', 'Douala', 'Bonanjo'),
            ('SITE_LAQ', 'Hôpital Laquintinie', 'Douala', 'Deido'),
            ('SITE_DISTRICT_DOUALA', 'District Hospital Douala', 'Douala', 'Akwa'),
            ('SITE_CNTS_DOUALA', 'CNTS Douala', 'Douala', 'Bonanjo'),

            # Yaoundé
            ('SITE_CHU_YAOUNDE', 'CHU Yaoundé', 'Yaoundé', 'Centre-ville'),
            ('SITE_HOPITAL_CENTRAL', 'Hôpital Central', 'Yaoundé', 'Centre-ville'),
            ('SITE_CNTS_YAOUNDE', 'CNTS Yaoundé', 'Yaoundé', 'Bastos'),

            # Autres villes
            ('SITE_BAFOUSSAM', 'Hôpital Régional Bafoussam', 'Bafoussam', 'Centre'),
            ('SITE_BAMENDA', 'Bamenda Regional Hospital', 'Bamenda', 'Centre'),
            ('SITE_GAROUA', 'Hôpital Régional Garoua', 'Garoua', 'Centre'),
            ('SITE_MAROUA', 'Hôpital Régional Maroua', 'Maroua', 'Centre'),
            ('SITE_NGAOUNDERE', 'Hôpital Régional Ngaoundéré', 'Ngaoundéré', 'Centre'),
        ]

        sites = []
        for site_id, nom, ville, quartier in sites_data:
            site, created = Site.objects.get_or_create(
                site_id=site_id,
                defaults={'nom': nom, 'ville': ville}
            )
            sites.append(site)

        self.stdout.write(f'  ✅ {len(sites)} sites créés')
        return sites

    def create_comprehensive_departments(self):
        """Créer des départements hospitaliers complets"""
        departments_data = [
            ('DEPT_URG', 'Urgences', 'Service des urgences médicales'),
            ('DEPT_CHIR_GEN', 'Chirurgie Générale', 'Service de chirurgie générale'),
            ('DEPT_CHIR_CARDIO', 'Chirurgie Cardiaque', 'Service de chirurgie cardiaque'),
            ('DEPT_CHIR_ORTHO', 'Chirurgie Orthopédique', 'Service de chirurgie orthopédique'),
            ('DEPT_CARDIO', 'Cardiologie', 'Service de cardiologie'),
            ('DEPT_PEDIATR', 'Pédiatrie', 'Service de pédiatrie'),
            ('DEPT_GYNECO', 'Gynécologie-Obstétrique', 'Service de gynécologie-obstétrique'),
            ('DEPT_HEMATO', 'Hématologie', 'Service d\'hématologie'),
            ('DEPT_ONCO', 'Oncologie', 'Service d\'oncologie'),
            ('DEPT_REANIM', 'Réanimation', 'Unité de soins intensifs'),
            ('DEPT_NEPHRO', 'Néphrologie', 'Service de néphrologie'),
            ('DEPT_GASTRO', 'Gastroentérologie', 'Service de gastroentérologie'),
            ('DEPT_NEURO', 'Neurologie', 'Service de neurologie'),
            ('DEPT_PNEUMO', 'Pneumologie', 'Service de pneumologie'),
            ('DEPT_TRAUMA', 'Traumatologie', 'Centre de traumatologie'),
        ]

        departments = []
        for dept_id, name, description in departments_data:
            dept, created = Department.objects.get_or_create(
                department_id=dept_id,
                defaults={'name': name, 'description': description}
            )
            departments.append(dept)

        self.stdout.write(f'  ✅ {len(departments)} départements créés')
        return departments

    def create_donors_batch(self, count):
        """Créer des donneurs par lots pour optimisation"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        blood_type_weights = [0.35, 0.06, 0.12, 0.02, 0.04, 0.01, 0.38, 0.02]

        # Noms camerounais réalistes
        first_names_m = [
            'Jean', 'Pierre', 'Paul', 'André', 'Michel', 'François', 'Emmanuel',
            'Joseph', 'Martin', 'Alain', 'Bernard', 'Philippe', 'Daniel', 'Marcel',
            'Christophe', 'Vincent', 'Patrick', 'Eric', 'Pascal', 'Olivier',
            'Roger', 'Christian', 'Gérard', 'Denis', 'Claude', 'Hervé'
        ]

        first_names_f = [
            'Marie', 'Françoise', 'Jeanne', 'Catherine', 'Anne', 'Christine',
            'Sylvie', 'Monique', 'Nicole', 'Brigitte', 'Martine', 'Dominique',
            'Isabelle', 'Nathalie', 'Sandrine', 'Véronique', 'Cécile', 'Corinne',
            'Valérie', 'Patricia', 'Christelle', 'Stéphanie', 'Caroline', 'Laurence'
        ]

        last_names = [
            'Mballa', 'Ngoua', 'Bekono', 'Ateba', 'Fouda', 'Meka', 'Olinga',
            'Ayissi', 'Atemengue', 'Manga', 'Owona', 'Essomba', 'Mvondo',
            'Ngono', 'Abessolo', 'Biyaga', 'Etoundi', 'Mendomo', 'Zoa',
            'Bella', 'Ewodo', 'Nana', 'Kono', 'Tagne', 'Kamga', 'Foko'
        ]

        batch_size = 1000

        for i in range(0, count, batch_size):
            batch_donors = []
            current_batch_size = min(batch_size, count - i)

            for j in range(current_batch_size):
                donor_num = i + j + 1

                gender = random.choice(['M', 'F'])
                blood_type = random.choices(blood_types, weights=blood_type_weights)[0]

                age = random.randint(18, 65)
                birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

                donor_id = f"DON{str(donor_num).zfill(6)}"
                first_name = random.choice(first_names_m if gender == 'M' else first_names_f)
                last_name = random.choice(last_names)

                phone = self.generate_realistic_phone()

                batch_donors.append(Donor(
                    donor_id=donor_id,
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=birth_date,
                    gender=gender,
                    blood_type=blood_type,
                    phone_number=phone
                ))

            # Insertion par lot
            Donor.objects.bulk_create(batch_donors, batch_size=1000)

            if (i + batch_size) % 5000 == 0:
                self.stdout.write(f'  💉 {i + batch_size:,} donneurs créés...')

        # Return all donors from database (with IDs)
        all_donors = list(Donor.objects.all())
        self.stdout.write(f'  ✅ {len(all_donors):,} donneurs créés au total')
        return all_donors

    def create_patients_batch(self, count):
        """Créer des patients par lots"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        conditions = [
            'Anémie sévère', 'Chirurgie programmée', 'Accident de la route',
            'Complications obstétricales', 'Cancer', 'Insuffisance rénale',
            'Troubles de la coagulation', 'Transfusion préventive',
            'Leucémie', 'Thalassémie', 'Hémorragie digestive', 'Traumatisme'
        ]

        batch_size = 1000

        for i in range(0, count, batch_size):
            batch_patients = []
            current_batch_size = min(batch_size, count - i)

            for j in range(current_batch_size):
                patient_num = i + j + 1

                age = random.randint(0, 85)
                birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

                patient_id = f"PAT{str(patient_num).zfill(6)}"

                batch_patients.append(Patient(
                    patient_id=patient_id,
                    first_name=f'Patient_{patient_id}',
                    last_name='Anonyme',
                    date_of_birth=birth_date,
                    blood_type=random.choice(blood_types),
                    patient_history=random.choice(conditions)
                ))

            Patient.objects.bulk_create(batch_patients, batch_size=1000)

        # Return all patients from database
        all_patients = list(Patient.objects.all())
        self.stdout.write(f'  ✅ {len(all_patients):,} patients créés')
        return all_patients

    def create_blood_units_optimized(self, donors, sites, unit_count, days_history):
        """Créer les unités de sang de manière optimisée"""
        start_date = date.today() - timedelta(days=days_history)

        batch_size = 500
        all_sites = list(sites)

        records_created = 0
        units_created = 0

        for i in range(0, unit_count, batch_size):
            batch_records = []
            current_batch_size = min(batch_size, unit_count - i)

            for j in range(current_batch_size):
                # Date de collecte avec distribution réaliste
                days_ago = int(np.random.exponential(30))
                days_ago = min(days_ago, days_history)
                collection_date = start_date + timedelta(days=random.randint(0, days_history - days_ago))

                donor = random.choice(donors)
                site = random.choice(all_sites)

                # Créer le record
                record_id = f"REC{str(records_created + j + 1).zfill(8)}"
                screening_result = 'Valid' if random.random() < 0.98 else 'Invalid'

                record = BloodRecord(
                    record_id=record_id,
                    site=site,
                    screening_results=screening_result,
                    record_date=collection_date,
                    quantity=1
                )
                batch_records.append(record)

            # Insertion par lots des records
            BloodRecord.objects.bulk_create(batch_records, batch_size=500)
            records_created += len(batch_records)

            # Récupérer les records créés pour lier aux unités
            created_records = list(BloodRecord.objects.filter(
                record_id__in=[r.record_id for r in batch_records if r.screening_results == 'Valid']
            ))

            # Créer les unités correspondantes
            batch_units = []
            for record in created_records:
                # Trouver le donneur correspondant
                donor = random.choice(donors)

                unit_id = f"UNIT{str(units_created + len(batch_units) + 1).zfill(8)}"
                volume_ml = random.randint(400, 500)
                hemoglobin = round(random.uniform(12.0, 18.0), 1)
                expiry_date = record.record_date + timedelta(days=120)

                # Statut basé sur l'âge
                today = date.today()
                if expiry_date < today:
                    status = 'Expired'
                elif record.record_date < today - timedelta(days=90):
                    status = random.choices(['Available', 'Used'], weights=[0.3, 0.7])[0]
                else:
                    status = random.choices(['Available', 'Used'], weights=[0.8, 0.2])[0]

                batch_units.append(BloodUnit(
                    unit_id=unit_id,
                    donor=donor,
                    record=record,
                    collection_date=record.record_date,
                    volume_ml=volume_ml,
                    hemoglobin_g_dl=hemoglobin,
                    date_expiration=expiry_date,
                    status=status
                ))

            BloodUnit.objects.bulk_create(batch_units, batch_size=500)
            units_created += len(batch_units)

            if (i + batch_size) % 2500 == 0:
                self.stdout.write(f'  🩸 {units_created:,} unités créées...')

        self.stdout.write(f'  ✅ {records_created:,} records et {units_created:,} unités créés')
        return list(BloodUnit.objects.all())

    def create_historical_requests_optimized(self, departments, sites, blood_units, patients, days_history,
                                             requests_per_day):
        """Créer l'historique des demandes de manière optimisée"""
        start_date = date.today() - timedelta(days=days_history)
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

        all_departments = list(departments)
        all_sites = list(sites)
        all_patients = list(patients)

        requests_created = 0
        consumptions_created = 0

        # Créer des demandes jour par jour
        for day_offset in range(days_history):
            current_date = start_date + timedelta(days=day_offset)

            # Variation selon le jour de la semaine
            day_factor = {0: 1.2, 1: 1.0, 2: 1.1, 3: 1.0, 4: 0.9, 5: 0.7, 6: 0.6}[current_date.weekday()]
            daily_requests = max(1, int(np.random.poisson(requests_per_day * day_factor)))

            batch_requests = []

            for _ in range(daily_requests):
                department = random.choice(all_departments)
                site = random.choice(all_sites)
                blood_type = random.choice(blood_types)
                quantity = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]

                # Priorité selon le département
                urgent_depts = ['DEPT_URG', 'DEPT_REANIM', 'DEPT_CHIR_GEN', 'DEPT_TRAUMA']
                if department.department_id in urgent_depts:
                    priority = random.choices(['Normal', 'Urgent'], weights=[0.3, 0.7])[0]
                else:
                    priority = random.choices(['Normal', 'Urgent'], weights=[0.8, 0.2])[0]

                # Statut basé sur l'âge de la demande
                if current_date < date.today() - timedelta(days=7):
                    status = random.choices(['Fulfilled', 'Cancelled'], weights=[0.9, 0.1])[0]
                else:
                    status = random.choices(['Fulfilled', 'Pending', 'Cancelled'], weights=[0.7, 0.25, 0.05])[0]

                request_id = f"REQ{str(requests_created + len(batch_requests) + 1).zfill(8)}"

                request = BloodRequest(
                    request_id=request_id,
                    department=department,
                    site=site,
                    blood_type=blood_type,
                    quantity=quantity,
                    priority=priority,
                    status=status,
                    request_date=current_date
                )
                batch_requests.append(request)

            # Insertion des demandes
            BloodRequest.objects.bulk_create(batch_requests, batch_size=500)
            requests_created += len(batch_requests)

            # Créer les consommations pour les demandes satisfaites
            batch_consumptions = []
            created_requests = list(BloodRequest.objects.filter(
                request_id__in=[r.request_id for r in batch_requests if r.status == 'Fulfilled']
            ))

            for request in created_requests:
                # Trouver des unités disponibles
                available_units = list(BloodUnit.objects.filter(
                    donor__blood_type=request.blood_type,
                    status='Available',
                    collection_date__lte=current_date,
                    date_expiration__gt=current_date
                )[:request.quantity])

                for unit in available_units:
                    patient = random.choice(all_patients)
                    volume_transfused = random.randint(int(unit.volume_ml * 0.8), unit.volume_ml)

                    consumption_date = current_date
                    if random.random() < 0.3:
                        consumption_date += timedelta(days=1)

                    batch_consumptions.append(BloodConsumption(
                        request=request,
                        unit=unit,
                        patient=patient,
                        date=consumption_date,
                        volume=volume_transfused
                    ))

                    # Marquer l'unité comme utilisée
                    unit.status = 'Used'
                    unit.save()

            # Insertion des consommations
            if batch_consumptions:
                BloodConsumption.objects.bulk_create(batch_consumptions, batch_size=500)
                consumptions_created += len(batch_consumptions)

            if day_offset % 30 == 0:
                self.stdout.write(f'  📅 Jour {day_offset}/{days_history} - {requests_created:,} demandes créées')

        self.stdout.write(f'  ✅ {requests_created:,} demandes et {consumptions_created:,} consommations créées')

    def create_advanced_forecasts(self):
        """Créer des prévisions avancées"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        forecasts_created = 0

        for blood_type in blood_types:
            # Calculs basés sur l'historique réel
            thirty_days_ago = date.today() - timedelta(days=30)
            recent_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__gte=thirty_days_ago
            ).count()

            avg_daily_consumption = max(1, recent_consumption / 30)

            # Prévisions pour 30 jours
            for days_ahead in range(1, 31):
                future_date = date.today() + timedelta(days=days_ahead)

                # Modèle de prévision sophistiqué
                base_prediction = avg_daily_consumption
                seasonal_factor = 1 + 0.1 * np.sin(2 * np.pi * days_ahead / 365)  # Variation saisonnière
                day_factor = {0: 1.2, 1: 1.0, 2: 1.1, 3: 1.0, 4: 0.9, 5: 0.7, 6: 0.6}[future_date.weekday()]
                trend_factor = 1 + (days_ahead * 0.001)  # Légère tendance croissante
                random_factor = random.uniform(0.85, 1.15)

                predicted_volume = max(0, int(
                    base_prediction * seasonal_factor * day_factor * trend_factor * random_factor
                ))

                # Fiabilité basée sur la distance temporelle et la variabilité historique
                reliability = max(0.4, 0.95 - (days_ahead * 0.015))

                prevision_id = f"PRED_{blood_type}_{future_date.strftime('%Y%m%d')}"

                Prevision.objects.get_or_create(
                    prevision_id=prevision_id,
                    defaults={
                        'blood_type': blood_type,
                        'prevision_date': future_date,
                        'previsional_volume': predicted_volume,
                        'fiability': reliability
                    }
                )
                forecasts_created += 1

        self.stdout.write(f'  ✅ {forecasts_created} prévisions créées')

    def show_final_statistics(self):
        """Afficher les statistiques finales"""
        stats = {
            'Sites': Site.objects.count(),
            'Départements': Department.objects.count(),
            'Donneurs': Donor.objects.count(),
            'Patients': Patient.objects.count(),
            'Records de don': BloodRecord.objects.count(),
            'Unités de sang': BloodUnit.objects.count(),
            'Demandes': BloodRequest.objects.count(),
            'Consommations': BloodConsumption.objects.count(),
            'Prévisions': Prevision.objects.count(),
        }

        # Statistiques par groupe sanguin
        blood_type_stats = {}
        for blood_type in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            available = BloodUnit.objects.filter(
                donor__blood_type=blood_type,
                status='Available'
            ).count()
            total = BloodUnit.objects.filter(donor__blood_type=blood_type).count()
            blood_type_stats[blood_type] = f"{available}/{total}"

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('🎉 GÉNÉRATION TERMINÉE AVEC SUCCÈS!'))
        self.stdout.write('=' * 60)

        self.stdout.write('\n📊 STATISTIQUES GÉNÉRALES:')
        for category, count in stats.items():
            self.stdout.write(f'  {category}: {count:,}')

        self.stdout.write('\n🩸 STOCK PAR GROUPE SANGUIN (Disponible/Total):')
        for blood_type, stat in blood_type_stats.items():
            self.stdout.write(f'  {blood_type}: {stat}')

        # Statistiques temporelles
        recent_requests = BloodRequest.objects.filter(
            request_date__gte=date.today() - timedelta(days=7)
        ).count()

        pending_requests = BloodRequest.objects.filter(status='Pending').count()

        self.stdout.write('\n⏰ ACTIVITÉ RÉCENTE:')
        self.stdout.write(f'  Demandes (7 derniers jours): {recent_requests:,}')
        self.stdout.write(f'  Demandes en attente: {pending_requests:,}')

        self.stdout.write('\n🔗 URL ADMIN: https://votre-app.onrender.com/admin/')
        self.stdout.write('=' * 60 + '\n')

    def generate_realistic_phone(self):
        """Générer un numéro de téléphone camerounais réaliste"""
        prefixes = ['69', '68', '67', '65', '59', '58', '57', '55']
        prefix = random.choice(prefixes)
        number = ''.join([str(random.randint(0, 9)) for _ in range(7)])
        return f"{prefix}{number}"