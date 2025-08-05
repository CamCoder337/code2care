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

        # Définir les paramètres selon l'échelle - RÉDUITS pour Render
        scales = {
            'small': {
                'donors': 200,
                'patients': 100,
                'units': 500,
                'days_history': 60,
                'requests_per_day': 8
            },
            'medium': {
                'donors': 500,
                'patients': 200,
                'units': 1000,
                'days_history': 90,
                'requests_per_day': 15
            },
            'large': {
                'donors': 1000,  # Réduit de 10000 à 1000
                'patients': 500,  # Réduit de 3000 à 500
                'units': 2000,  # Réduit de 20000 à 2000
                'days_history': 120,  # Réduit de 365 à 120
                'requests_per_day': 25  # Réduit de 60 à 25
            },
            'massive': {
                'donors': 2000,  # Réduit drastiquement
                'patients': 800,
                'units': 4000,
                'days_history': 180,
                'requests_per_day': 35
            }
        }

        params = scales[scale]

        self.stdout.write(f'🚀 Génération de données à l\'échelle: {scale.upper()}')
        self.stdout.write(f'📊 Paramètres optimisés pour Render: {params}')

        # Vérifier les données existantes
        existing_data = {
            'sites': Site.objects.count(),
            'departments': Department.objects.count(),
            'donors': Donor.objects.count(),
            'patients': Patient.objects.count(),
            'units': BloodUnit.objects.count(),
            'requests': BloodRequest.objects.count()
        }

        self.stdout.write(f'📊 Données existantes: {existing_data}')

        if sum(existing_data.values()) > 50 and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    f'Des données importantes existent déjà: {existing_data}\n'
                    'Utilisez --force pour continuer quand même.'
                )
            )
            return

        try:
            self.generate_comprehensive_data(params)

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erreur durant la génération: {e}')
            )
            import traceback
            traceback.print_exc()
            raise

    def generate_comprehensive_data(self, params):
        """Générer toutes les données de manière optimisée"""

        # 1. Infrastructures de base
        self.stdout.write('🏥 Création des sites et départements...')
        sites = self.create_comprehensive_sites()
        departments = self.create_comprehensive_departments(sites)

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
            # Douala - CORRIGÉ: ajout des champs manquants
            {
                'site_id': 'SITE_DGH',
                'nom': 'Douala General Hospital',
                'ville': 'Douala',
                'type': 'hospital',
                'address': 'Bonanjo, Douala',
                'capacity': 200,
                'status': 'active',
                'blood_bank': True
            },
            {
                'site_id': 'SITE_LAQ',
                'nom': 'Hôpital Laquintinie',
                'ville': 'Douala',
                'type': 'hospital',
                'address': 'Deido, Douala',
                'capacity': 150,
                'status': 'active',
                'blood_bank': True
            },
            {
                'site_id': 'SITE_DISTRICT_DOUALA',
                'nom': 'District Hospital Douala',
                'ville': 'Douala',
                'type': 'hospital',
                'address': 'Akwa, Douala',
                'capacity': 100,
                'status': 'active',
                'blood_bank': False
            },
            {
                'site_id': 'SITE_CNTS_DOUALA',
                'nom': 'CNTS Douala',
                'ville': 'Douala',
                'type': 'collection_center',
                'address': 'Bonanjo, Douala',
                'capacity': 50,
                'status': 'active',
                'blood_bank': True
            },
            # Yaoundé
            {
                'site_id': 'SITE_CHU_YAOUNDE',
                'nom': 'CHU Yaoundé',
                'ville': 'Yaoundé',
                'type': 'hospital',
                'address': 'Centre-ville, Yaoundé',
                'capacity': 300,
                'status': 'active',
                'blood_bank': True
            },
            {
                'site_id': 'SITE_HOPITAL_CENTRAL',
                'nom': 'Hôpital Central',
                'ville': 'Yaoundé',
                'type': 'hospital',
                'address': 'Centre-ville, Yaoundé',
                'capacity': 250,
                'status': 'active',
                'blood_bank': True
            },
            # Autres villes
            {
                'site_id': 'SITE_BAFOUSSAM',
                'nom': 'Hôpital Régional Bafoussam',
                'ville': 'Bafoussam',
                'type': 'hospital',
                'address': 'Centre, Bafoussam',
                'capacity': 120,
                'status': 'active',
                'blood_bank': False
            },
            {
                'site_id': 'SITE_BAMENDA',
                'nom': 'Bamenda Regional Hospital',
                'ville': 'Bamenda',
                'type': 'hospital',
                'address': 'Centre, Bamenda',
                'capacity': 100,
                'status': 'active',
                'blood_bank': False
            }
        ]

        sites = []
        for site_data in sites_data:
            try:
                site, created = Site.objects.get_or_create(
                    site_id=site_data['site_id'],
                    defaults=site_data
                )
                sites.append(site)
                if created:
                    self.stdout.write(f'  ✅ Site créé: {site.nom}')
                else:
                    self.stdout.write(f'  ⚪ Site existe: {site.nom}')
            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur site {site_data["site_id"]}: {str(e)}')

        self.stdout.write(f'  ✅ {len(sites)} sites au total')
        return sites

    def create_comprehensive_departments(self, sites):
        """Créer des départements hospitaliers complets - CORRIGÉ"""
        departments_data = [
            ('DEPT_URG', 'Urgences', 'emergency', 'Service des urgences médicales'),
            ('DEPT_CHIR_GEN', 'Chirurgie Générale', 'surgery', 'Service de chirurgie générale'),
            ('DEPT_CHIR_CARDIO', 'Chirurgie Cardiaque', 'surgery', 'Service de chirurgie cardiaque'),
            ('DEPT_CARDIO', 'Cardiologie', 'cardiology', 'Service de cardiologie'),
            ('DEPT_PEDIATR', 'Pédiatrie', 'pediatrics', 'Service de pédiatrie'),
            ('DEPT_GYNECO', 'Gynécologie-Obstétrique', 'gynecology', 'Service de gynécologie-obstétrique'),
            ('DEPT_HEMATO', 'Hématologie', 'oncology', 'Service d\'hématologie'),
            ('DEPT_ONCO', 'Oncologie', 'oncology', 'Service d\'oncologie'),
            ('DEPT_REANIM', 'Réanimation', 'intensive_care', 'Unité de soins intensifs'),
            ('DEPT_GENERAL', 'Médecine Générale', 'general', 'Service de médecine générale'),
        ]

        departments = []

        for site in sites:
            # Chaque site a quelques départements de base
            site_departments = random.sample(departments_data, min(5, len(departments_data)))

            for i, (base_dept_id, name, dept_type, description) in enumerate(site_departments):
                # ID unique par site
                dept_id = f"{base_dept_id}_{site.site_id}"

                try:
                    dept, created = Department.objects.get_or_create(
                        department_id=dept_id,
                        defaults={
                            'site': site,  # CORRIGÉ: utiliser l'objet site, pas site_id
                            'name': name,
                            'department_type': dept_type,
                            'description': description,
                            'bed_capacity': random.randint(10, 50),
                            'current_occupancy': random.randint(5, 30),
                            'is_active': True,
                            'requires_blood_products': True if dept_type in ['surgery', 'emergency', 'intensive_care',
                                                                             'oncology'] else random.choice(
                                [True, False])
                        }
                    )
                    departments.append(dept)
                    if created:
                        self.stdout.write(f'  ✅ Département créé: {dept.name} - {site.nom}')
                except Exception as e:
                    self.stdout.write(f'  ⚠️ Erreur département {dept_id}: {str(e)}')

        self.stdout.write(f'  ✅ {len(departments)} départements créés au total')
        return departments

    def create_donors_batch(self, count):
        """Créer des donneurs par lots pour optimisation - CORRIGÉ"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        blood_type_weights = [0.35, 0.06, 0.12, 0.02, 0.04, 0.01, 0.38, 0.02]

        # Noms camerounais réalistes
        first_names_m = [
            'Jean', 'Pierre', 'Paul', 'André', 'Michel', 'François', 'Emmanuel',
            'Joseph', 'Martin', 'Alain', 'Bernard', 'Philippe', 'Daniel', 'Marcel',
            'Christophe', 'Vincent', 'Patrick', 'Eric', 'Pascal', 'Olivier'
        ]

        first_names_f = [
            'Marie', 'Françoise', 'Jeanne', 'Catherine', 'Anne', 'Christine',
            'Sylvie', 'Monique', 'Nicole', 'Brigitte', 'Martine', 'Dominique',
            'Isabelle', 'Nathalie', 'Sandrine', 'Véronique', 'Cécile', 'Corinne'
        ]

        last_names = [
            'Mballa', 'Ngoua', 'Bekono', 'Ateba', 'Fouda', 'Meka', 'Olinga',
            'Ayissi', 'Atemengue', 'Manga', 'Owona', 'Essomba', 'Mvondo',
            'Ngono', 'Abessolo', 'Biyaga', 'Etoundi', 'Mendomo', 'Zoa'
        ]

        batch_size = 500  # Plus petit pour Render

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
                    date_of_birth=birth_date,  # CORRIGÉ: date_of_birth au lieu de birth_date
                    gender=gender,
                    blood_type=blood_type,
                    phone_number=phone
                ))

            # Insertion par lot
            try:
                Donor.objects.bulk_create(batch_donors, batch_size=500)
                if (i + batch_size) % 1000 == 0:
                    self.stdout.write(f'  💉 {i + batch_size:,} donneurs créés...')
            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur batch donneurs: {str(e)}')

        # Return all donors from database (with IDs)
        all_donors = list(Donor.objects.all())
        self.stdout.write(f'  ✅ {len(all_donors):,} donneurs créés au total')
        return all_donors

    def create_patients_batch(self, count):
        """Créer des patients par lots - CORRIGÉ"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        conditions = [
            'Anémie sévère', 'Chirurgie programmée', 'Accident de la route',
            'Complications obstétricales', 'Cancer', 'Insuffisance rénale',
            'Troubles de la coagulation', 'Transfusion préventive',
            'Leucémie', 'Thalassémie', 'Hémorragie digestive', 'Traumatisme'
        ]

        batch_size = 500

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
                    first_name=f'Patient_{patient_num}',
                    last_name='Anonyme',
                    date_of_birth=birth_date,  # CORRIGÉ: date_of_birth au lieu de birth_date
                    blood_type=random.choice(blood_types),
                    patient_history=random.choice(conditions)
                ))

            try:
                Patient.objects.bulk_create(batch_patients, batch_size=500)
            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur batch patients: {str(e)}')

        # Return all patients from database
        all_patients = list(Patient.objects.all())
        self.stdout.write(f'  ✅ {len(all_patients):,} patients créés')
        return all_patients

    def create_blood_units_optimized(self, donors, sites, unit_count, days_history):
        """Créer les unités de sang de manière optimisée - CORRIGÉ"""
        start_date = date.today() - timedelta(days=days_history)

        batch_size = 250  # Plus petit pour Render
        all_sites = list(sites)

        records_created = 0
        units_created = 0

        for i in range(0, unit_count, batch_size):
            batch_records = []
            current_batch_size = min(batch_size, unit_count - i)

            for j in range(current_batch_size):
                # Date de collecte avec distribution réaliste
                days_ago = min(int(np.random.exponential(20)), days_history - 1)
                collection_date = start_date + timedelta(days=random.randint(0, days_history - days_ago))

                site = random.choice(all_sites)

                # Créer le record
                record_id = f"REC{str(records_created + j + 1).zfill(8)}"
                screening_result = 'Valid' if random.random() < 0.98 else 'Rejected'

                record = BloodRecord(
                    record_id=record_id,
                    site=site,
                    screening_results=screening_result,
                    record_date=collection_date,
                    quantity=1
                )
                batch_records.append(record)

            # Insertion par lots des records
            try:
                BloodRecord.objects.bulk_create(batch_records, batch_size=250)
                records_created += len(batch_records)
            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur batch records: {str(e)}')
                continue

            # Récupérer les records valides créés pour lier aux unités
            valid_record_ids = [r.record_id for r in batch_records if r.screening_results == 'Valid']
            created_records = list(BloodRecord.objects.filter(record_id__in=valid_record_ids))

            # Créer les unités correspondantes
            batch_units = []
            for record in created_records:
                # Prendre un donneur aléatoire
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

            try:
                BloodUnit.objects.bulk_create(batch_units, batch_size=250)
                units_created += len(batch_units)
            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur batch units: {str(e)}')

            if (i + batch_size) % 1000 == 0:
                self.stdout.write(f'  🩸 {units_created:,} unités créées...')

        self.stdout.write(f'  ✅ {records_created:,} records et {units_created:,} unités créés')
        return list(BloodUnit.objects.all())

    def create_historical_requests_optimized(self, departments, sites, blood_units, patients, days_history,
                                             requests_per_day):
        """Créer l'historique des demandes de manière optimisée - CORRIGÉ"""
        start_date = date.today() - timedelta(days=days_history)
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

        all_departments = list(departments)
        all_sites = list(sites)
        all_patients = list(patients)

        if not all_departments:
            self.stdout.write('  ⚠️ Aucun département disponible, skip des demandes')
            return

        requests_created = 0
        consumptions_created = 0

        # Créer des demandes par chunks de jours pour éviter la surcharge mémoire
        chunk_size = 10  # Traiter 10 jours à la fois

        for day_chunk_start in range(0, days_history, chunk_size):
            day_chunk_end = min(day_chunk_start + chunk_size, days_history)

            batch_requests = []

            for day_offset in range(day_chunk_start, day_chunk_end):
                current_date = start_date + timedelta(days=day_offset)

                # Variation selon le jour de la semaine
                day_factor = {0: 1.2, 1: 1.0, 2: 1.1, 3: 1.0, 4: 0.9, 5: 0.7, 6: 0.6}[current_date.weekday()]
                daily_requests = max(1, int(np.random.poisson(requests_per_day * day_factor)))

                for _ in range(daily_requests):
                    department = random.choice(all_departments)
                    site = random.choice(all_sites)
                    blood_type = random.choice(blood_types)
                    quantity = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]

                    # Priorité selon le département
                    urgent_depts = ['emergency', 'intensive_care', 'surgery']
                    if department.department_type in urgent_depts:
                        priority = random.choices(['Routine', 'Urgent'], weights=[0.3, 0.7])[0]
                    else:
                        priority = random.choices(['Routine', 'Urgent'], weights=[0.8, 0.2])[0]

                    # Statut basé sur l'âge de la demande
                    if current_date < date.today() - timedelta(days=7):
                        status = random.choices(['Fulfilled', 'Rejected'], weights=[0.9, 0.1])[
                            0]  # CORRIGÉ: Cancelled -> Rejected
                    else:
                        status = random.choices(['Fulfilled', 'Pending', 'Rejected'], weights=[0.7, 0.25, 0.05])[0]

                    request_id = f"REQ{str(requests_created + len(batch_requests) + 1).zfill(8)}"

                    batch_requests.append(BloodRequest(
                        request_id=request_id,
                        department=department,
                        site=site,
                        blood_type=blood_type,
                        quantity=quantity,
                        priority=priority,
                        status=status,
                        request_date=current_date
                    ))

            # Insertion des demandes par chunk
            try:
                BloodRequest.objects.bulk_create(batch_requests, batch_size=250)
                requests_created += len(batch_requests)
            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur batch requests: {str(e)}')
                continue

            # Créer quelques consommations pour les demandes satisfaites (pas toutes pour économiser la mémoire)
            try:
                fulfilled_requests = list(BloodRequest.objects.filter(
                    request_id__in=[r.request_id for r in batch_requests if r.status == 'Fulfilled']
                ).select_related('department', 'site'))

                batch_consumptions = []
                for request in fulfilled_requests[:50]:  # Limiter à 50 pour économiser la mémoire
                    # Trouver des unités disponibles du bon type
                    compatible_units = list(BloodUnit.objects.filter(
                        donor__blood_type=request.blood_type,
                        status='Available',
                        collection_date__lte=request.request_date,
                        date_expiration__gt=request.request_date
                    )[:request.quantity])

                    for unit in compatible_units:
                        patient = random.choice(all_patients)
                        volume_transfused = random.randint(int(unit.volume_ml * 0.8), unit.volume_ml)

                        consumption_date = request.request_date
                        if random.random() < 0.3:
                            consumption_date += timedelta(days=1)

                        batch_consumptions.append(BloodConsumption(
                            request=request,
                            unit=unit,
                            patient=patient,
                            date=consumption_date,
                            volume=volume_transfused
                        ))

                        # Marquer l'unité comme utilisée (sans déclencher de signal)
                        BloodUnit.objects.filter(unit_id=unit.unit_id).update(status='Used')

                # Insertion des consommations
                if batch_consumptions:
                    BloodConsumption.objects.bulk_create(batch_consumptions, batch_size=100)
                    consumptions_created += len(batch_consumptions)

            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur consommations: {str(e)}')

            if day_chunk_end % 30 == 0:
                self.stdout.write(f'  📅 Jour {day_chunk_end}/{days_history} - {requests_created:,} demandes créées')

        self.stdout.write(f'  ✅ {requests_created:,} demandes et {consumptions_created:,} consommations créées')

    def create_advanced_forecasts(self):
        """Créer des prévisions avancées - SIMPLIFIÉ pour Render"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        forecasts_created = 0

        try:
            for blood_type in blood_types:
                # Calculs basés sur des moyennes simples pour économiser les ressources
                avg_daily_consumption = random.randint(2, 15)  # Valeur simulée

                # Prévisions pour seulement 14 jours (au lieu de 30)
                for days_ahead in range(1, 15):
                    future_date = date.today() + timedelta(days=days_ahead)

                    # Modèle de prévision simplifié
                    base_prediction = avg_daily_consumption
                    day_factor = {0: 1.2, 1: 1.0, 2: 1.1, 3: 1.0, 4: 0.9, 5: 0.7, 6: 0.6}[future_date.weekday()]
                    random_factor = random.uniform(0.85, 1.15)

                    predicted_volume = max(0, int(base_prediction * day_factor * random_factor))

                    # Fiabilité basée sur la distance temporelle
                    reliability = max(0.5, 0.95 - (days_ahead * 0.02))

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

        except Exception as e:
            self.stdout.write(f'  ⚠️ Erreur prévisions: {str(e)}')

        self.stdout.write(f'  ✅ {forecasts_created} prévisions créées')

    def show_final_statistics(self):
        """Afficher les statistiques finales"""
        try:
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
                try:
                    available = BloodUnit.objects.filter(
                        donor__blood_type=blood_type,
                        status='Available'
                    ).count()
                    total = BloodUnit.objects.filter(donor__blood_type=blood_type).count()
                    blood_type_stats[blood_type] = f"{available}/{total}"
                except Exception as e:
                    blood_type_stats[blood_type] = f"0/0 (erreur: {str(e)[:20]})"

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
            try:
                recent_requests = BloodRequest.objects.filter(
                    request_date__gte=date.today() - timedelta(days=7)
                ).count()

                pending_requests = BloodRequest.objects.filter(status='Pending').count()

                self.stdout.write('\n⏰ ACTIVITÉ RÉCENTE:')
                self.stdout.write(f'  Demandes (7 derniers jours): {recent_requests:,}')
                self.stdout.write(f'  Demandes en attente: {pending_requests:,}')
            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur statistiques temporelles: {str(e)}')

            self.stdout.write('\n🚀 DONNÉES PRÊTES POUR PRODUCTION!')
            self.stdout.write('=' * 60 + '\n')

        except Exception as e:
            self.stdout.write(f'⚠️ Erreur affichage statistiques: {str(e)}')

    def generate_realistic_phone(self):
        """Générer un numéro de téléphone camerounais réaliste"""
        prefixes = ['69', '68', '67', '65', '59', '58', '57', '55']
        prefix = random.choice(prefixes)
        number = ''.join([str(random.randint(0, 9)) for _ in range(7)])
        return f"{prefix}{number}"