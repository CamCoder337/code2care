# app/management/commands/generate_sample_data.py
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
    help = 'Génère des données d\'exemple pour tester le système'

    def add_arguments(self, parser):
        parser.add_argument(
            '--donors',
            type=int,
            default=100,
            help='Nombre de donneurs à créer'
        )
        parser.add_argument(
            '--units',
            type=int,
            default=200,
            help='Nombre d\'unités de sang à créer'
        )
        parser.add_argument(
            '--days-history',
            type=int,
            default=90,
            help='Nombre de jours d\'historique à générer'
        )
        parser.add_argument(
            '--clear-data',
            action='store_true',
            help='Effacer toutes les données existantes avant génération'
        )

    def handle(self, *args, **options):
        self.stdout.write('Génération des données d\'exemple...')

        with transaction.atomic():
            # Option pour nettoyer les données existantes
            if options['clear_data']:
                self.clear_existing_data()

            # Initialiser les compteurs uniques
            self.init_counters()

            # Créer les sites
            sites = self.create_sites()

            # Créer les départements
            departments = self.create_departments()

            # Créer les donneurs
            donors = self.create_donors(options['donors'])

            # Créer les patients
            patients = self.create_patients(50)

            # Créer les enregistrements de don et unités
            blood_units = self.create_blood_records_and_units(
                donors, sites, options['units'], options['days_history']
            )

            # Créer les demandes et consommations historiques
            self.create_blood_requests_and_consumption(
                departments, sites, blood_units, patients, options['days_history']
            )

            # Générer des prévisions initiales
            self.create_initial_forecasts()

        self.stdout.write(
            self.style.SUCCESS(
                f'Données générées avec succès:\n'
                f'- {len(sites)} sites\n'
                f'- {len(departments)} départements\n'
                f'- {options["donors"]} donneurs\n'
                f'- {len(patients)} patients\n'
                f'- {options["units"]} unités de sang\n'
                f'- Historique de {options["days_history"]} jours\n'
                f'- Demandes et consommations simulées\n'
                f'- Prévisions initiales générées'
            )
        )

    def clear_existing_data(self):
        """Effacer toutes les données existantes"""
        self.stdout.write('Nettoyage des données existantes...')

        # Ordre important pour respecter les contraintes de clés étrangères
        BloodConsumption.objects.all().delete()
        BloodRequest.objects.all().delete()
        Prevision.objects.all().delete()
        BloodUnit.objects.all().delete()
        BloodRecord.objects.all().delete()
        Patient.objects.all().delete()
        Donor.objects.all().delete()
        Department.objects.all().delete()
        Site.objects.all().delete()

        self.stdout.write('  Données existantes supprimées')

    def init_counters(self):
        """Initialiser les compteurs pour générer des IDs uniques"""
        # Obtenir les derniers IDs existants
        self.donor_counter = self.get_last_counter(Donor, 'donor_id', 'DON', 6) + 1
        self.patient_counter = self.get_last_counter(Patient, 'patient_id', 'PAT', 6) + 1
        self.record_counter = self.get_last_counter(BloodRecord, 'record_id', 'REC', 8) + 1
        self.unit_counter = self.get_last_counter(BloodUnit, 'unit_id', 'UNIT', 8) + 1
        self.request_counter = self.get_last_counter(BloodRequest, 'request_id', 'REQ', 8) + 1

    def get_last_counter(self, model, field_name, prefix, digits):
        """Obtenir le dernier compteur utilisé pour un modèle donné"""
        try:
            last_obj = model.objects.filter(
                **{f"{field_name}__startswith": prefix}
            ).order_by(f"-{field_name}").first()

            if last_obj:
                last_id = getattr(last_obj, field_name)
                # Extraire le numéro après le préfixe
                number_part = last_id.replace(prefix, '')
                return int(number_part)
            return 0
        except (ValueError, AttributeError):
            return 0

    def get_unique_id(self, prefix, counter_attr, digits):
        """Générer un ID unique en incrémentant le compteur"""
        counter = getattr(self, counter_attr)
        unique_id = f"{prefix}{str(counter).zfill(digits)}"
        setattr(self, counter_attr, counter + 1)
        return unique_id

    def create_sites(self):
        """Créer les sites de collecte"""
        sites_data = [
            ('SITE_DGH', 'Douala General Hospital', 'Douala'),
            ('SITE_LAQ', 'Hôpital Laquintinie', 'Douala'),
            ('SITE_DIST', 'District Hospital', 'Douala'),
            ('SITE_PRIV', 'Clinique Privée', 'Douala'),
            ('SITE_CNTS', 'Centre National de Transfusion Sanguine', 'Douala'),
        ]

        sites = []
        for site_id, nom, ville in sites_data:
            site, created = Site.objects.get_or_create(
                site_id=site_id,
                defaults={'nom': nom, 'ville': ville}
            )
            sites.append(site)
            if created:
                self.stdout.write(f'  Créé site: {nom}')

        return sites

    def create_departments(self):
        """Créer les départements hospitaliers"""
        departments_data = [
            ('DEPT_URG', 'Urgences', 'Service des urgences médicales'),
            ('DEPT_CHIR', 'Chirurgie', 'Service de chirurgie générale'),
            ('DEPT_CARDIO', 'Cardiologie', 'Service de cardiologie'),
            ('DEPT_PEDIATR', 'Pédiatrie', 'Service de pédiatrie'),
            ('DEPT_GYNECO', 'Gynécologie', 'Service de gynécologie-obstétrique'),
            ('DEPT_ORTHO', 'Orthopédie', 'Service d\'orthopédie'),
            ('DEPT_HEMATO', 'Hématologie', 'Service d\'hématologie'),
            ('DEPT_ONCO', 'Oncologie', 'Service d\'oncologie'),
            ('DEPT_REANIM', 'Réanimation', 'Unité de soins intensifs'),
            ('DEPT_NEPHRO', 'Néphrologie', 'Service de néphrologie'),
        ]

        departments = []
        for dept_id, name, description in departments_data:
            dept, created = Department.objects.get_or_create(
                department_id=dept_id,
                defaults={'name': name, 'description': description}
            )
            departments.append(dept)
            if created:
                self.stdout.write(f'  Créé département: {name}')

        return departments

    def create_donors(self, count):
        """Créer des donneurs avec profils réalistes"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        blood_type_weights = [0.35, 0.06, 0.12, 0.02, 0.04, 0.01, 0.38, 0.02]

        first_names_m = [
            'Jean', 'Pierre', 'Paul', 'André', 'Michel', 'François', 'Emmanuel',
            'Joseph', 'Martin', 'Alain', 'Bernard', 'Philippe', 'Daniel', 'Marcel'
        ]
        first_names_f = [
            'Marie', 'Françoise', 'Jeanne', 'Catherine', 'Anne', 'Christine',
            'Sylvie', 'Monique', 'Nicole', 'Brigitte', 'Martine', 'Dominique'
        ]
        last_names = [
            'Mballa', 'Ngoua', 'Bekono', 'Ateba', 'Fouda', 'Meka', 'Olinga',
            'Ayissi', 'Atemengue', 'Manga', 'Owona', 'Essomba', 'Mvondo',
            'Ngono', 'Abessolo', 'Biyaga', 'Etoundi', 'Mendomo', 'Zoa'
        ]

        donors = []
        for _ in range(count):
            gender = random.choice(['M', 'F'])
            blood_type = random.choices(blood_types, weights=blood_type_weights)[0]

            # Âge réaliste pour don de sang (18-65 ans)
            age = random.randint(18, 65)
            birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

            donor_id = self.get_unique_id('DON', 'donor_counter', 6)
            first_name = random.choice(first_names_m if gender == 'M' else first_names_f)
            last_name = random.choice(last_names)

            # Numéro de téléphone camerounais
            phone = self.generate_realistic_phone()

            donor = Donor.objects.create(
                donor_id=donor_id,
                first_name=first_name,
                last_name=last_name,
                date_of_birth=birth_date,
                gender=gender,
                blood_type=blood_type,
                phone_number=phone
            )
            donors.append(donor)

        self.stdout.write(f'  Créé {len(donors)} donneurs')
        return donors

    def create_patients(self, count):
        """Créer des patients"""
        patients = []
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

        for _ in range(count):
            age = random.randint(0, 85)
            birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

            patient_id = self.get_unique_id('PAT', 'patient_counter', 6)

            # Historique médical simulé
            conditions = [
                'Anémie sévère', 'Chirurgie programmée', 'Accident de la route',
                'Complications obstétricales', 'Cancer', 'Insuffisance rénale',
                'Troubles de la coagulation', 'Transfusion préventive'
            ]

            patient = Patient.objects.create(
                patient_id=patient_id,
                first_name=f'Patient_{patient_id}',
                last_name='Anonyme',
                date_of_birth=birth_date,
                blood_type=random.choice(blood_types),
                patient_history=random.choice(conditions)
            )
            patients.append(patient)

        self.stdout.write(f'  Créé {len(patients)} patients')
        return patients

    def create_blood_records_and_units(self, donors, sites, unit_count, days_history):
        """Créer les enregistrements de don et unités avec historique réaliste"""
        blood_units = []
        start_date = date.today() - timedelta(days=days_history)

        # S'assurer qu'il y a suffisamment d'unités pour chaque groupe sanguin
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        min_units_per_type = max(10, unit_count // 20)  # Au moins 10 unités par type

        # Créer des unités garanties pour chaque type
        guaranteed_units = 0
        for blood_type in blood_types:
            type_donors = [d for d in donors if d.blood_type == blood_type]
            if not type_donors:
                continue

            for _ in range(min_units_per_type):
                days_ago = int(np.random.exponential(20))
                days_ago = min(days_ago, days_history)

                collection_date = start_date + timedelta(days=random.randint(0, days_history - days_ago))
                donor = random.choice(type_donors)
                site = random.choice(sites)

                unit = self._create_blood_unit(donor, site, collection_date, guaranteed_units)
                if unit:
                    blood_units.append(unit)
                    guaranteed_units += 1

        # Créer le reste des unités aléatoirement
        remaining_units = unit_count - guaranteed_units
        for _ in range(remaining_units):
            # Distribution temporelle réaliste (plus de dons récents)
            days_ago = int(np.random.exponential(30))
            days_ago = min(days_ago, days_history)

            collection_date = start_date + timedelta(days=random.randint(0, days_history - days_ago))

            donor = random.choice(donors)
            site = random.choice(sites)

            unit = self._create_blood_unit(donor, site, collection_date, guaranteed_units + _)
            if unit:
                blood_units.append(unit)

        self.stdout.write(f'  Créé {len(blood_units)} unités de sang valides')
        return blood_units

    def _create_blood_unit(self, donor, site, collection_date, index):
        """Créer une unité de sang individuelle"""

    def _create_blood_unit(self, donor, site, collection_date, index):
        """Créer une unité de sang individuelle"""
        # Créer l'enregistrement de don
        record_id = self.get_unique_id('REC', 'record_counter', 8)

        # Résultats de dépistage (98% valides)
        screening_result = 'Valid' if random.random() < 0.98 else 'Invalid'

        blood_record = BloodRecord.objects.create(
            record_id=record_id,
            site=site,
            screening_results=screening_result,
            record_date=collection_date,
            quantity=1
        )

        if screening_result == 'Valid':
            # Créer l'unité de sang
            unit_id = self.get_unique_id('UNIT', 'unit_counter', 8)

            # Volume réaliste (400-500ml)
            volume_ml = random.randint(400, 500)

            # Taux d'hémoglobine réaliste (12-18 g/dl)
            hemoglobin = round(random.uniform(12.0, 18.0), 1)

            # Date d'expiration (120 jours après collecte)
            expiry_date = collection_date + timedelta(days=120)

            # Déterminer le statut basé sur les dates
            today = date.today()
            if expiry_date < today:
                status = 'Expired'
            elif collection_date < today - timedelta(days=90):
                # Probabilité d'utilisation plus élevée pour unités anciennes
                status = random.choices(
                    ['Available', 'Used'],
                    weights=[0.3, 0.7]
                )[0]
            else:
                # Unités récentes plus probablement disponibles
                status = random.choices(
                    ['Available', 'Used'],
                    weights=[0.8, 0.2]
                )[0]

            blood_unit = BloodUnit.objects.create(
                unit_id=unit_id,
                donor=donor,
                record=blood_record,
                collection_date=collection_date,
                volume_ml=volume_ml,
                hemoglobin_g_dl=hemoglobin,
                date_expiration=expiry_date,
                status=status
            )

            return blood_unit

        return None

    def create_blood_requests_and_consumption(self, departments, sites, blood_units, patients, days_history):
        """Créer demandes et consommations avec patterns réalistes et données équilibrées"""
        start_date = date.today() - timedelta(days=days_history)

        # Patterns de demande par jour de la semaine
        weekly_patterns = {
            0: 1.2,  # Lundi - pic après weekend
            1: 1.0,  # Mardi
            2: 1.1,  # Mercredi
            3: 1.0,  # Jeudi
            4: 0.9,  # Vendredi
            5: 0.7,  # Samedi
            6: 0.6  # Dimanche
        }

        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        requests_created = 0
        consumptions_created = 0

        # S'assurer qu'il y a des demandes pour chaque groupe sanguin
        # Générer des demandes garanties pour chaque type (au moins une par semaine)
        for blood_type in blood_types:
            weekly_demands = max(1, int(days_history / 7))  # Au moins 1 par semaine

            for week in range(weekly_demands):
                # Choisir un jour aléatoire dans la semaine
                day_in_week = random.randint(0, 6)
                week_start = start_date + timedelta(days=week * 7)
                request_date = week_start + timedelta(days=day_in_week)

                # S'assurer que la date est dans la plage valide
                if request_date > date.today():
                    continue

                department = random.choice(departments)
                site = random.choice(sites)

                # Quantité plus élevée pour les types rares pour compenser
                if blood_type in ['A-', 'B-', 'AB+', 'AB-', 'O-']:
                    quantity = random.choices([2, 3, 4, 5], weights=[0.3, 0.4, 0.2, 0.1])[0]
                else:
                    quantity = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]

                # Priorité basée sur le département
                urgent_depts = ['DEPT_URG', 'DEPT_REANIM', 'DEPT_CHIR']
                if department.department_id in urgent_depts:
                    priority = random.choices(['Normal', 'Urgent'], weights=[0.3, 0.7])[0]
                else:
                    priority = random.choices(['Normal', 'Urgent'], weights=[0.8, 0.2])[0]

                # Statut - garantir plus de demandes satisfaites pour les types rares
                if request_date < date.today() - timedelta(days=7):
                    if blood_type in ['A-', 'B-', 'AB+', 'AB-', 'O-']:
                        status = random.choices(['Fulfilled', 'Cancelled'], weights=[0.95, 0.05])[0]
                    else:
                        status = random.choices(['Fulfilled', 'Cancelled'], weights=[0.90, 0.10])[0]
                else:
                    status = random.choices(['Fulfilled', 'Pending', 'Cancelled'], weights=[0.8, 0.15, 0.05])[0]

                request_id = self.get_unique_id('REQ', 'request_counter', 8)

                blood_request = BloodRequest.objects.create(
                    request_id=request_id,
                    department=department,
                    site=site,
                    blood_type=blood_type,
                    quantity=quantity,
                    priority=priority,
                    status=status,
                    request_date=request_date
                )

                requests_created += 1

                # Si la demande est satisfaite, créer les consommations
                if status == 'Fulfilled':
                    self._create_consumptions_for_request(blood_request, patients, consumptions_created)
                    consumptions_created += quantity  # Approximation

        # Générer des demandes supplémentaires aléatoirement
        for day_offset in range(days_history):
            current_date = start_date + timedelta(days=day_offset)

            # Facteur jour de la semaine
            day_factor = weekly_patterns[current_date.weekday()]

            # Nombre de demandes supplémentaires pour ce jour
            base_demands = 2  # Réduit car on a déjà les demandes garanties
            daily_demands = max(0, int(np.random.poisson(base_demands * day_factor)))

            for _ in range(daily_demands):
                department = random.choice(departments)
                site = random.choice(sites)

                # Distribution standard pour les demandes supplémentaires
                demand_weights = [0.30, 0.08, 0.15, 0.03, 0.05, 0.02, 0.35, 0.02]
                blood_type = random.choices(blood_types, weights=demand_weights)[0]

                quantity = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]

                urgent_depts = ['DEPT_URG', 'DEPT_REANIM', 'DEPT_CHIR']
                if department.department_id in urgent_depts:
                    priority = random.choices(['Normal', 'Urgent'], weights=[0.3, 0.7])[0]
                else:
                    priority = random.choices(['Normal', 'Urgent'], weights=[0.8, 0.2])[0]

                if current_date < date.today() - timedelta(days=7):
                    status = random.choices(['Fulfilled', 'Cancelled'], weights=[0.9, 0.1])[0]
                else:
                    status = random.choices(['Fulfilled', 'Pending', 'Cancelled'], weights=[0.7, 0.25, 0.05])[0]

                request_id = self.get_unique_id('REQ', 'request_counter', 8)

                blood_request = BloodRequest.objects.create(
                    request_id=request_id,
                    department=department,
                    site=site,
                    blood_type=blood_type,
                    quantity=quantity,
                    priority=priority,
                    status=status,
                    request_date=current_date
                )

                requests_created += 1

                if status == 'Fulfilled':
                    self._create_consumptions_for_request(blood_request, patients, consumptions_created)
                    consumptions_created += quantity

        self.stdout.write(f'  Créé {requests_created} demandes de sang')
        self.stdout.write(f'  Créé environ {consumptions_created} consommations')

    def _create_consumptions_for_request(self, blood_request, patients, consumptions_created):
        """Créer les consommations pour une demande donnée"""
        available_units = BloodUnit.objects.filter(
            donor__blood_type=blood_request.blood_type,
            status='Available',
            collection_date__lte=blood_request.request_date,
            date_expiration__gt=blood_request.request_date
        )[:blood_request.quantity]

        fulfilled_quantity = min(len(available_units), blood_request.quantity)

        for j in range(fulfilled_quantity):
            if j < len(available_units):
                patient = random.choice(patients)
                unit = available_units[j]

                # Volume transfusé
                volume_transfused = random.randint(
                    int(unit.volume_ml * 0.8),
                    unit.volume_ml
                )

                # Date de consommation
                consumption_date = blood_request.request_date
                if random.random() < 0.3:
                    consumption_date += timedelta(days=1)

                BloodConsumption.objects.create(
                    request=blood_request,
                    unit=unit,
                    patient=patient,
                    date=consumption_date,
                    volume=volume_transfused
                )

                # Marquer l'unité comme utilisée
                unit.status = 'Used'
                unit.save()

    def create_initial_forecasts(self):
        """Créer des prévisions initiales pour chaque groupe sanguin"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

        forecasts_created = 0

        for blood_type in blood_types:
            # Calculer la consommation moyenne des 30 derniers jours
            thirty_days_ago = date.today() - timedelta(days=30)

            recent_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__gte=thirty_days_ago
            ).count()

            avg_daily_consumption = recent_consumption / 30 if recent_consumption > 0 else 1

            # Générer des prévisions pour les 14 prochains jours
            for days_ahead in range(1, 15):
                future_date = date.today() + timedelta(days=days_ahead)

                # Prévision basée sur la moyenne avec variation
                base_prediction = avg_daily_consumption

                # Facteur jour de la semaine
                day_factor = {
                    0: 1.2, 1: 1.0, 2: 1.1, 3: 1.0,
                    4: 0.9, 5: 0.7, 6: 0.6
                }[future_date.weekday()]

                # Variation aléatoire ±20%
                random_factor = random.uniform(0.8, 1.2)

                predicted_volume = max(0, int(base_prediction * day_factor * random_factor))

                # Fiabilité (décroît avec la distance temporelle)
                reliability = max(0.5, 0.9 - (days_ahead * 0.02))

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

        self.stdout.write(f'  Créé {forecasts_created} prévisions initiales')

    def generate_realistic_phone(self):
        """Générer un numéro de téléphone camerounais réaliste"""
        prefixes = ['69', '68', '67', '65', '59', '58', '57', '55']
        prefix = random.choice(prefixes)
        number = ''.join([str(random.randint(0, 9)) for _ in range(7)])
        return f"{prefix}{number}"