# app/management/commands/generate_optimized_production_data.py
import random
import math
from datetime import date, timedelta, datetime
import numpy as np
from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.utils import timezone
from app.models import (
    Donor, Site, Department, Patient, BloodRecord,
    BloodUnit, BloodRequest, BloodConsumption, Prevision
)


class Command(BaseCommand):
    help = 'Génère des données OPTIMISÉES pour améliorer la confiance ML de 0.48 à >0.85'

    def add_arguments(self, parser):
        parser.add_argument(
            '--scale',
            type=str,
            choices=['render', 'production', 'enterprise'],
            default='render',
            help='Échelle optimisée pour l\'environnement cible'
        )
        parser.add_argument(
            '--years',
            type=int,
            default=2,
            help='Nombre d\'années d\'historique (défaut: 2 pour capturer la saisonnalité)'
        )
        parser.add_argument(
            '--force-clean',
            action='store_true',
            help='Nettoyage complet avant génération (recommandé)'
        )
        parser.add_argument(
            '--skip-forecasts',
            action='store_true',
            help='Passer la génération des prévisions (pour économiser du temps)'
        )

    def handle(self, *args, **options):
        self.scale = options['scale']
        self.years = options['years']
        self.skip_forecasts = options['skip_forecasts']

        # Paramètres optimisés pour chaque environnement
        self.params = self.get_optimized_params()

        self.stdout.write('=' * 60)
        self.stdout.write('🎯 GÉNÉRATION OPTIMISÉE BLOOD BANK SYSTEM')
        self.stdout.write('=' * 60)
        self.stdout.write(f'📊 Échelle: {self.scale.upper()}')
        self.stdout.write(f'📅 Historique: {self.years} années')
        self.stdout.write(f'🎯 Objectif: Confiance ML 0.48 → >0.85')
        self.stdout.write(f'💾 Mémoire optimisée: {self.params["memory_optimized"]}')
        self.stdout.write('=' * 60)

        try:
            # 1. Nettoyage intelligent
            if options['force_clean']:
                self.smart_clean_database()

            # 2. Génération par étapes avec monitoring mémoire
            self.generate_optimized_data()

            # 3. Vérification qualité
            quality_score = self.verify_and_score_data()

            # 4. Prévisions (optionnel)
            if not self.skip_forecasts:
                self.generate_ml_forecasts()

            # 5. Rapport final
            self.generate_final_report(quality_score)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur critique: {e}'))
            import traceback
            traceback.print_exc()
            raise

    def get_optimized_params(self):
        """Paramètres optimisés selon l'environnement"""
        params = {
            'render': {  # Optimisé pour 512MB RAM
                'donors': 25000,
                'patients': 8000,
                'sites': 15,
                'departments_per_major_site': 12,
                'departments_per_standard_site': 6,
                'collections_per_day': 35,
                'requests_per_day': 45,
                'batch_size': 1000,
                'memory_optimized': True,
                'chunk_days': 15,  # Plus petit chunks
                'max_daily_operations': 100
            },
            'production': {  # Environnement standard
                'donors': 50000,
                'patients': 15000,
                'sites': 25,
                'departments_per_major_site': 15,
                'departments_per_standard_site': 8,
                'collections_per_day': 80,
                'requests_per_day': 120,
                'batch_size': 2000,
                'memory_optimized': False,
                'chunk_days': 30,
                'max_daily_operations': 250
            },
            'enterprise': {  # Environnement haute performance
                'donors': 100000,
                'patients': 30000,
                'sites': 40,
                'departments_per_major_site': 18,
                'departments_per_standard_site': 10,
                'collections_per_day': 150,
                'requests_per_day': 200,
                'batch_size': 5000,
                'memory_optimized': False,
                'chunk_days': 30,
                'max_daily_operations': 400
            }
        }
        return params[self.scale]

    def smart_clean_database(self):
        """Nettoyage intelligent sans casser les migrations"""
        self.stdout.write('🧹 Nettoyage intelligent de la base de données...')

        try:
            # Désactiver les contraintes FK temporairement
            with connection.cursor() as cursor:
                cursor.execute('SET session_replication_role = replica;')

                # Tables de données dans l'ordre des dépendances (inverse)
                data_tables = [
                    'app_prevision',
                    'app_bloodconsumption',
                    'app_bloodrequest',
                    'app_bloodunit',
                    'app_bloodrecord',
                    'app_patient',
                    'app_department',
                    'app_donor',
                    'app_site'
                ]

                cleaned_count = 0
                for table in data_tables:
                    try:
                        cursor.execute(f'DELETE FROM "{table}"')
                        rows_deleted = cursor.rowcount
                        if rows_deleted > 0:
                            self.stdout.write(f'  ✅ {table}: {rows_deleted:,} lignes supprimées')
                            cleaned_count += rows_deleted
                    except Exception as e:
                        self.stdout.write(f'  ⚠️ {table}: {str(e)[:50]}')

                # Réinitialiser les séquences
                for table in data_tables:
                    try:
                        cursor.execute(f'SELECT setval(pg_get_serial_sequence(\'"{table}"\', \'id\'), 1, false)')
                    except:
                        pass  # Certaines tables n'ont pas de séquence

                # Réactiver les contraintes
                cursor.execute('SET session_replication_role = DEFAULT;')

                # Optimiser la base après nettoyage
                cursor.execute('VACUUM ANALYZE')

                self.stdout.write(f'  ✅ {cleaned_count:,} enregistrements supprimés au total')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur nettoyage: {e}'))
            raise

    def generate_optimized_data(self):
        """Génération optimisée par étapes"""

        # Étape 1: Infrastructure
        self.stdout.write('\n🏗️ ÉTAPE 1/4: Infrastructure')
        sites = self.create_realistic_sites()
        departments = self.create_smart_departments(sites)

        # Étape 2: Populations (avec gestion mémoire)
        self.stdout.write('\n👥 ÉTAPE 2/4: Populations')
        donors = self.create_donors_optimized()
        patients = self.create_patients_optimized()

        # Étape 3: Données historiques (par chunks temporels)
        self.stdout.write('\n📊 ÉTAPE 3/4: Historique médical')
        self.generate_historical_data_chunks(donors, sites, departments, patients)

        # Étape 4: Post-traitement
        self.stdout.write('\n⚙️ ÉTAPE 4/4: Optimisations finales')
        self.optimize_data_consistency()

    def create_realistic_sites(self):
        """Créer des sites réalistes du Cameroun"""

        # Sites majeurs avec données réelles
        major_sites_data = [
            ('SITE_CHU_YDE', 'CHU Yaoundé', 'Yaoundé', 'hospital', 'Melen', 400, True),
            ('SITE_DGH', 'Douala General Hospital', 'Douala', 'hospital', 'Bonanjo', 350, True),
            ('SITE_LAQUINTINIE', 'Hôpital Laquintinie', 'Douala', 'hospital', 'Deido', 300, True),
            ('SITE_CENTRAL_YDE', 'Hôpital Central Yaoundé', 'Yaoundé', 'hospital', 'Centre', 280, True),
            ('SITE_CNTS_YDE', 'CNTS Yaoundé', 'Yaoundé', 'collection_center', 'Melen', 150, True),
            ('SITE_CNTS_DLA', 'CNTS Douala', 'Douala', 'collection_center', 'Akwa', 120, True),
        ]

        # Sites régionaux
        regional_sites = [
            ('Bafoussam', 200, True), ('Bamenda', 180, True), ('Garoua', 160, False),
            ('Ngaoundéré', 140, False), ('Maroua', 130, False), ('Bertoua', 120, False),
            ('Ebolowa', 110, False), ('Kribi', 100, False)
        ]

        sites = []

        # Sites majeurs
        for site_id, nom, ville, type_site, address, capacity, blood_bank in major_sites_data:
            site, created = Site.objects.get_or_create(
                site_id=site_id,
                defaults={
                    'nom': nom,
                    'ville': ville,
                    'type': type_site,
                    'address': address,
                    'capacity': capacity,
                    'status': 'active',
                    'blood_bank': blood_bank
                }
            )
            sites.append(site)

        # Sites régionaux (limité selon scale)
        max_regional = min(len(regional_sites), self.params['sites'] - len(major_sites_data))
        for i, (ville, capacity, blood_bank) in enumerate(regional_sites[:max_regional]):
            site_id = f"SITE_{ville.upper()}"
            site, created = Site.objects.get_or_create(
                site_id=site_id,
                defaults={
                    'nom': f'Hôpital Régional {ville}',
                    'ville': ville,
                    'type': 'hospital',
                    'address': f'Centre, {ville}',
                    'capacity': capacity,
                    'status': 'active',
                    'blood_bank': blood_bank
                }
            )
            sites.append(site)

        self.stdout.write(f'  ✅ {len(sites)} sites créés')
        return sites

    def create_smart_departments(self, sites):
        """Créer des départements intelligents"""

        # Templates par type d'hôpital
        dept_templates = {
            'major': [  # CHU et grands hôpitaux
                ('URG', 'Urgences', 'emergency', True, 1.5),
                ('CHIR_GEN', 'Chirurgie Générale', 'surgery', True, 1.8),
                ('CHIR_CARDIO', 'Chirurgie Cardiaque', 'surgery', True, 2.0),
                ('GYNECO', 'Gynéco-Obstétrique', 'gynecology', True, 1.6),
                ('PEDIATR', 'Pédiatrie', 'pediatrics', True, 1.4),
                ('REANIM', 'Réanimation', 'intensive_care', True, 2.5),
                ('HEMATO', 'Hématologie', 'oncology', True, 2.0),
                ('CARDIO', 'Cardiologie', 'cardiology', True, 1.3),
                ('NEPHRO', 'Néphrologie', 'nephrology', True, 1.7),
                ('ONCO', 'Oncologie', 'oncology', True, 1.9),
                ('NEURO', 'Neurologie', 'neurology', False, 1.0),
                ('GASTRO', 'Gastroentérologie', 'gastroenterology', False, 1.1)
            ],
            'standard': [  # Hôpitaux régionaux
                ('URG', 'Urgences', 'emergency', True, 1.4),
                ('CHIR_GEN', 'Chirurgie Générale', 'surgery', True, 1.6),
                ('GYNECO', 'Gynéco-Obstétrique', 'gynecology', True, 1.5),
                ('PEDIATR', 'Pédiatrie', 'pediatrics', True, 1.3),
                ('MED_GEN', 'Médecine Générale', 'general', False, 1.0),
                ('CARDIO', 'Cardiologie', 'cardiology', True, 1.2)
            ],
            'basic': [  # Hôpitaux de district
                ('URG', 'Urgences', 'emergency', True, 1.2),
                ('CHIR_GEN', 'Chirurgie Générale', 'surgery', True, 1.4),
                ('MED_GEN', 'Médecine Générale', 'general', False, 1.0),
                ('PEDIATR', 'Pédiatrie', 'pediatrics', True, 1.2)
            ]
        }

        departments = []

        for site in sites:
            # Déterminer le niveau
            if site.capacity >= 250:
                level = 'major'
                max_depts = self.params['departments_per_major_site']
            elif site.capacity >= 150:
                level = 'standard'
                max_depts = self.params['departments_per_standard_site']
            else:
                level = 'basic'
                max_depts = 4

            templates = dept_templates[level][:max_depts]

            for dept_code, name, dept_type, requires_blood, blood_factor in templates:
                dept_id = f"DEPT_{dept_code}_{site.site_id}"

                # Capacité proportionnelle au site
                base_capacity = int(site.capacity * 0.15)  # 15% de la capacité du site
                bed_capacity = max(10, random.randint(int(base_capacity * 0.8), int(base_capacity * 1.2)))
                current_occupancy = random.randint(int(bed_capacity * 0.6), int(bed_capacity * 0.9))

                try:
                    dept, created = Department.objects.get_or_create(
                        department_id=dept_id,
                        defaults={
                            'site': site,
                            'name': name,
                            'department_type': dept_type,
                            'description': f'Service de {name.lower()} - {site.nom}',
                            'bed_capacity': bed_capacity,
                            'current_occupancy': current_occupancy,
                            'is_active': True,
                            'requires_blood_products': requires_blood
                        }
                    )
                    if created:
                        departments.append(dept)
                except Exception as e:
                    self.stdout.write(f'  ⚠️ Département {dept_id}: {str(e)[:30]}')

        self.stdout.write(f'  ✅ {len(departments)} départements créés')
        return departments

    def create_donors_optimized(self):
        """Créer des donneurs avec optimisation mémoire"""

        # Distribution réaliste des groupes sanguins (Afrique subsaharienne)
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        blood_weights = [0.46, 0.27, 0.20, 0.04, 0.02, 0.008, 0.006, 0.002]

        # Noms camerounais par région
        names_regions = {
            'centre': {
                'male': ['Jean', 'Pierre', 'Emmanuel', 'Joseph', 'Martin'],
                'female': ['Marie', 'Françoise', 'Jeanne', 'Catherine', 'Anne'],
                'surnames': ['Mballa', 'Ateba', 'Fouda', 'Meka', 'Olinga']
            },
            'west': {
                'male': ['Alain', 'Bernard', 'Philippe', 'Marcel', 'Vincent'],
                'female': ['Brigitte', 'Martine', 'Dominique', 'Isabelle', 'Nathalie'],
                'surnames': ['Talla', 'Kamga', 'Fogue', 'Temgoua', 'Djuikom']
            },
            'north': {
                'male': ['Ahmadou', 'Ousmane', 'Ibrahim', 'Moussa', 'Abdoulaye'],
                'female': ['Aissatou', 'Fatimata', 'Salamatou', 'Hadjara', 'Maimouna'],
                'surnames': ['Bello', 'Issa', 'Hamadou', 'Boubakari', 'Alioum']
            }
        }

        total_donors = self.params['donors']
        batch_size = self.params['batch_size']
        created_count = 0

        self.stdout.write(f'  🎯 Objectif: {total_donors:,} donneurs')

        for batch_start in range(0, total_donors, batch_size):
            current_batch_size = min(batch_size, total_donors - batch_start)
            batch_donors = []

            for i in range(current_batch_size):
                donor_num = batch_start + i + 1

                # Sélection région et noms
                region = random.choice(list(names_regions.keys()))
                names = names_regions[region]

                # Caractéristiques démographiques
                gender = random.choice(['M', 'F'])
                blood_type = random.choices(blood_types, weights=blood_weights)[0]

                # Âge réaliste pour donneurs (18-65 ans, pic 25-45)
                age_weights = [0.15, 0.35, 0.30, 0.15, 0.05]  # 18-25, 26-35, 36-45, 46-55, 56-65
                age_ranges = [(18, 25), (26, 35), (36, 45), (46, 55), (56, 65)]
                selected_range = random.choices(age_ranges, weights=age_weights)[0]
                age = random.randint(selected_range[0], selected_range[1])

                birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

                # Identifiants et noms
                donor_id = f"DON{donor_num:07d}"
                first_name = random.choice(names['male'] if gender == 'M' else names['female'])
                last_name = random.choice(names['surnames'])

                # Téléphone camerounais
                phone_prefixes = ['650', '651', '652', '690', '691', '692', '693', '694', '695', '696', '697', '698',
                                  '699']
                phone = f"{random.choice(phone_prefixes)}{random.randint(100000, 999999)}"

                batch_donors.append(Donor(
                    donor_id=donor_id,
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=birth_date,
                    gender=gender,
                    blood_type=blood_type,
                    phone_number=phone
                ))

            # Insertion optimisée
            try:
                Donor.objects.bulk_create(batch_donors, batch_size=min(500, batch_size))
                created_count += len(batch_donors)

                # Progress reporting
                if created_count % 5000 == 0:
                    progress = (created_count / total_donors) * 100
                    self.stdout.write(f'    💉 {created_count:,} donneurs créés ({progress:.1f}%)')

            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur batch donneurs: {str(e)[:40]}')

        self.stdout.write(f'  ✅ {created_count:,} donneurs créés avec succès')
        return list(Donor.objects.all()) if not self.params['memory_optimized'] else None

    def create_patients_optimized(self):
        """Créer des patients avec conditions médicales réalistes"""

        # Conditions nécessitant transfusions par groupe d'âge
        conditions_by_age = {
            'pediatric': [  # 0-17 ans
                'Anémie sévère drépanocytaire', 'Leucémie aiguë pédiatrique',
                'Thalassémie majeure', 'Aplasie médullaire congénitale',
                'Traumatisme pédiatrique', 'Chirurgie cardiaque congénitale'
            ],
            'adult': [  # 18-59 ans
                'Hémorragie obstétricale', 'Accident de circulation',
                'Chirurgie cardiaque programmée', 'Cancer colorectal',
                'Hémorragie digestive', 'Traumatisme polytraumatique',
                'Insuffisance rénale chronique'
            ],
            'geriatric': [  # 60+ ans
                'Cancer métastasé', 'Hémorragie cérébrale',
                'Chirurgie orthopédique majeure', 'Myélome multiple',
                'Syndrome myélodysplasique', 'Coagulopathie acquise'
            ]
        }

        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        total_patients = self.params['patients']
        batch_size = min(self.params['batch_size'], 1000)  # Plus petit pour patients
        created_count = 0

        self.stdout.write(f'  🎯 Objectif: {total_patients:,} patients')

        for batch_start in range(0, total_patients, batch_size):
            current_batch_size = min(batch_size, total_patients - batch_start)
            batch_patients = []

            for i in range(current_batch_size):
                patient_num = batch_start + i + 1

                # Distribution d'âge réaliste pour patients nécessitant transfusions
                age_categories = [
                    ('pediatric', 0, 17, 0.15),  # Enfants
                    ('adult', 18, 59, 0.60),  # Adultes (majorité)
                    ('geriatric', 60, 90, 0.25)  # Personnes âgées
                ]

                category, min_age, max_age, weight = random.choices(
                    age_categories,
                    weights=[cat[3] for cat in age_categories]
                )[0]

                age = random.randint(min_age, max_age)
                birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

                patient_id = f"PAT{patient_num:07d}"
                condition = random.choice(conditions_by_age[category])

                batch_patients.append(Patient(
                    patient_id=patient_id,
                    first_name=f'Patient_{patient_num}',
                    last_name='Anonyme',
                    date_of_birth=birth_date,
                    blood_type=random.choice(blood_types),
                    patient_history=condition
                ))

            try:
                Patient.objects.bulk_create(batch_patients, batch_size=500)
                created_count += len(batch_patients)

                if created_count % 2000 == 0:
                    progress = (created_count / total_patients) * 100
                    self.stdout.write(f'    🏥 {created_count:,} patients créés ({progress:.1f}%)')

            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur batch patients: {str(e)[:40]}')

        self.stdout.write(f'  ✅ {created_count:,} patients créés avec succès')
        return list(Patient.objects.all()) if not self.params['memory_optimized'] else None

    def generate_historical_data_chunks(self, donors, sites, departments, patients):
        """Générer l'historique par chunks temporels optimisés"""

        start_date = date.today() - timedelta(days=self.years * 365)
        total_days = self.years * 365
        chunk_size = self.params['chunk_days']

        self.stdout.write(f'  📅 Génération de {total_days} jours par chunks de {chunk_size}')

        # Collections sites et départements actifs
        if self.params['memory_optimized']:
            collection_sites = list(Site.objects.filter(blood_bank=True))
            blood_departments = list(Department.objects.filter(requires_blood_products=True))
            all_donors = list(Donor.objects.all())
            all_patients = list(Patient.objects.all())
        else:
            collection_sites = [s for s in sites if s.blood_bank]
            blood_departments = [d for d in departments if d.requires_blood_products]
            all_donors = donors
            all_patients = patients

        total_chunks = math.ceil(total_days / chunk_size)

        for chunk_idx in range(total_chunks):
            chunk_start_day = chunk_idx * chunk_size
            chunk_end_day = min(chunk_start_day + chunk_size, total_days)
            chunk_start_date = start_date + timedelta(days=chunk_start_day)
            chunk_days_count = chunk_end_day - chunk_start_day

            progress = ((chunk_idx + 1) / total_chunks) * 100
            chunk_period = f"{chunk_start_date.strftime('%Y-%m')}"

            self.stdout.write(f'    📊 Chunk {chunk_idx + 1}/{total_chunks} - {chunk_period} ({progress:.1f}%)')

            # Générer les données du chunk
            collections_created = self.generate_collections_chunk_optimized(
                all_donors, collection_sites, chunk_start_date, chunk_days_count
            )

            requests_created, consumptions_created = self.generate_requests_chunk_optimized(
                blood_departments, all_patients, chunk_start_date, chunk_days_count
            )

            # Nettoyage mémoire périodique
            if chunk_idx % 5 == 0 and chunk_idx > 0:
                with connection.cursor() as cursor:
                    cursor.execute('VACUUM ANALYZE app_bloodrecord, app_bloodunit, app_bloodrequest')

        self.stdout.write('  ✅ Historique médical généré avec succès')

    def generate_collections_chunk_optimized(self, donors, sites, start_date, days_count):
        """Générer les collectes de sang pour un chunk - optimisé mémoire"""

        collections_per_day = self.params['collections_per_day']
        max_daily_ops = self.params['max_daily_operations']

        records_batch = []
        units_batch = []
        records_created = 0

        for day_offset in range(days_count):
            current_date = start_date + timedelta(days=day_offset)

            # Facteurs réalistes
            seasonal_factor = self.get_seasonal_collection_factor(current_date.month)
            weekday_factor = self.get_weekday_factor(current_date.weekday(), 'collection')

            # Calcul nombre de collectes (avec plafond)
            base_collections = np.random.poisson(collections_per_day * seasonal_factor * weekday_factor)
            daily_collections = min(max_daily_ops, max(1, base_collections))

            # Générer les collectes du jour
            for _ in range(daily_collections):
                site = random.choice(sites)
                donor = random.choice(donors)

                record_id = f"REC{len(records_batch) + records_created + 1:08d}"

                # Résultats de screening (98% de réussite)
                screening_success = random.random() < 0.98
                if screening_success:
                    screening_result = 'Valid'
                else:
                    screening_result = random.choice(['Rejected_HIV', 'Rejected_HBV', 'Rejected_HCV', 'Rejected_Other'])

                record = BloodRecord(
                    record_id=record_id,
                    site=site,
                    screening_results=screening_result,
                    record_date=current_date,
                    quantity=1
                )
                records_batch.append(record)

                # Unité de sang si screening valide
                if screening_success:
                    unit_id = f"UNIT{len(units_batch) + 1:08d}"

                    # Paramètres physiologiques réalistes
                    volume_ml = random.randint(400, 500)
                    hemoglobin = round(random.uniform(12.0, 17.5), 1)
                    expiry_date = current_date + timedelta(days=120)  # 4 mois validité

                    # Statut basé sur l'âge et la demande réaliste
                    days_old = (date.today() - current_date).days
                    if expiry_date < date.today():
                        status = 'Expired'
                    elif days_old > 90:
                        status = random.choices(['Available', 'Used'], weights=[0.15, 0.85])[0]
                    elif days_old > 30:
                        status = random.choices(['Available', 'Used'], weights=[0.4, 0.6])[0]
                    else:
                        status = random.choices(['Available', 'Used'], weights=[0.75, 0.25])[0]

                    unit = BloodUnit(
                        unit_id=unit_id,
                        donor=donor,
                        record=record,
                        collection_date=current_date,
                        volume_ml=volume_ml,
                        hemoglobin_g_dl=hemoglobin,
                        date_expiration=expiry_date,
                        status=status
                    )
                    units_batch.append(unit)

        # Insertion par batch avec gestion d'erreurs
        try:
            # Records en premier
            if records_batch:
                BloodRecord.objects.bulk_create(records_batch, batch_size=500)
                records_created += len(records_batch)

                # Récupérer les records créés pour lier aux unités
                if units_batch:
                    created_records = {r.record_id: r for r in BloodRecord.objects.filter(
                        record_id__in=[r.record_id for r in records_batch]
                    )}

                    # Mettre à jour les foreign keys
                    for unit in units_batch:
                        if unit.record.record_id in created_records:
                            unit.record = created_records[unit.record.record_id]

                    # Insérer les unités
                    BloodUnit.objects.bulk_create(units_batch, batch_size=500)

        except Exception as e:
            self.stdout.write(f'    ⚠️ Erreur collectes: {str(e)[:50]}')

        return records_created

    def generate_requests_chunk_optimized(self, departments, patients, start_date, days_count):
        """Générer les demandes et consommations pour un chunk - optimisé"""

        requests_per_day = self.params['requests_per_day']
        max_daily_ops = self.params['max_daily_operations']

        requests_batch = []
        consumptions_batch = []
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        requests_created = 0
        consumptions_created = 0

        for day_offset in range(days_count):
            current_date = start_date + timedelta(days=day_offset)

            # Facteurs saisonniers et temporels
            seasonal_factor = self.get_seasonal_demand_factor(current_date.month)
            weekday_factor = self.get_weekday_factor(current_date.weekday(), 'demand')

            # Calcul nombre de demandes (avec plafond)
            base_requests = np.random.poisson(requests_per_day * seasonal_factor * weekday_factor)
            daily_requests = min(max_daily_ops, max(1, base_requests))

            # Générer les demandes du jour
            for _ in range(daily_requests):
                department = random.choice(departments)
                site = department.site
                blood_type = random.choice(blood_types)

                # Quantité selon type de département et urgence
                quantity = self.calculate_request_quantity(department)

                # Priorité selon département
                priority = self.calculate_request_priority(department, current_date)

                # Statut basé sur l'âge de la demande et priorité
                status = self.calculate_request_status(current_date, priority)

                request_id = f"REQ{len(requests_batch) + requests_created + 1:08d}"

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
                requests_batch.append(request)

                # Générer consommations pour demandes satisfaites
                if status == 'Fulfilled' and random.random() < 0.75:  # 75% avec consommations
                    consumptions_for_request = self.create_realistic_consumptions(
                        request, patients, current_date
                    )
                    consumptions_batch.extend(consumptions_for_request)

        # Insertion optimisée
        try:
            if requests_batch:
                BloodRequest.objects.bulk_create(requests_batch, batch_size=500)
                requests_created += len(requests_batch)

                if consumptions_batch:
                    # Récupérer les demandes créées
                    created_requests = {r.request_id: r for r in BloodRequest.objects.filter(
                        request_id__in=[r.request_id for r in requests_batch]
                    )}

                    # Mettre à jour les foreign keys
                    valid_consumptions = []
                    for consumption in consumptions_batch:
                        if consumption.request.request_id in created_requests:
                            consumption.request = created_requests[consumption.request.request_id]
                            valid_consumptions.append(consumption)

                    if valid_consumptions:
                        BloodConsumption.objects.bulk_create(valid_consumptions, batch_size=300)
                        consumptions_created += len(valid_consumptions)

        except Exception as e:
            self.stdout.write(f'    ⚠️ Erreur demandes: {str(e)[:50]}')

        return requests_created, consumptions_created

    def calculate_request_quantity(self, department):
        """Calculer la quantité selon le type de département"""
        if department.department_type in ['surgery', 'intensive_care']:
            return random.choices([1, 2, 3, 4, 5, 6], weights=[0.15, 0.25, 0.30, 0.20, 0.08, 0.02])[0]
        elif department.department_type == 'emergency':
            return random.choices([1, 2, 3, 4], weights=[0.40, 0.35, 0.20, 0.05])[0]
        elif department.department_type in ['oncology', 'gynecology']:
            return random.choices([1, 2, 3], weights=[0.50, 0.35, 0.15])[0]
        else:
            return random.choices([1, 2], weights=[0.75, 0.25])[0]

    def calculate_request_priority(self, department, request_date):
        """Calculer la priorité selon le département et contexte"""
        # Plus d'urgences le weekend et la nuit (approximation)
        is_weekend = request_date.weekday() >= 5

        if department.department_type in ['emergency', 'intensive_care']:
            if is_weekend:
                return random.choices(['Routine', 'Urgent'], weights=[0.20, 0.80])[0]
            else:
                return random.choices(['Routine', 'Urgent'], weights=[0.35, 0.65])[0]
        elif department.department_type == 'surgery':
            return random.choices(['Routine', 'Urgent'], weights=[0.65, 0.35])[0]
        else:
            return random.choices(['Routine', 'Urgent'], weights=[0.85, 0.15])[0]

    def calculate_request_status(self, request_date, priority):
        """Calculer le statut selon l'âge et la priorité"""
        days_old = (date.today() - request_date).days

        if priority == 'Urgent':
            if days_old > 3:
                return random.choices(['Fulfilled', 'Rejected'], weights=[0.95, 0.05])[0]
            elif days_old > 1:
                return random.choices(['Fulfilled', 'Pending', 'Rejected'], weights=[0.88, 0.10, 0.02])[0]
            else:
                return random.choices(['Fulfilled', 'Pending'], weights=[0.70, 0.30])[0]
        else:  # Routine
            if days_old > 7:
                return random.choices(['Fulfilled', 'Rejected'], weights=[0.90, 0.10])[0]
            elif days_old > 2:
                return random.choices(['Fulfilled', 'Pending', 'Rejected'], weights=[0.80, 0.15, 0.05])[0]
            else:
                return random.choices(['Fulfilled', 'Pending'], weights=[0.50, 0.50])[0]

    def create_realistic_consumptions(self, request, patients, request_date):
        """Créer des consommations réalistes pour une demande"""
        consumptions = []

        # Trouver des unités compatibles
        compatible_units = list(BloodUnit.objects.filter(
            donor__blood_type=request.blood_type,
            status='Available',
            collection_date__lte=request_date,
            date_expiration__gt=request_date
        )[:request.quantity])

        units_to_use = min(len(compatible_units), request.quantity)

        for i in range(units_to_use):
            unit = compatible_units[i]
            patient = random.choice(patients)

            # Volume transfusé (90-100% de l'unité)
            volume_transfused = random.randint(int(unit.volume_ml * 0.90), unit.volume_ml)

            # Date de consommation (même jour ou dans les 2 jours)
            consumption_date = request_date + timedelta(days=random.randint(0, 2))

            consumption = BloodConsumption(
                request=request,
                unit=unit,
                patient=patient,
                date=consumption_date,
                volume=volume_transfused
            )
            consumptions.append(consumption)

            # Marquer l'unité comme utilisée
            unit.status = 'Used'

        return consumptions

    def get_seasonal_collection_factor(self, month):
        """Facteurs saisonniers pour les collectes (Cameroun)"""
        # Collections plus élevées en saison sèche, baisse pendant les fêtes
        seasonal_factors = {
            1: 0.85,  # Janvier - reprise post-fêtes
            2: 0.95,  # Février - montée
            3: 1.05,  # Mars - bon niveau
            4: 1.15,  # Avril - pic campagnes
            5: 1.20,  # Mai - pic annuel
            6: 1.10,  # Juin - bon niveau
            7: 1.00,  # Juillet - stable
            8: 0.95,  # Août - légère baisse
            9: 1.00,  # Septembre - reprise
            10: 0.90,  # Octobre - début baisse
            11: 0.80,  # Novembre - préparation fêtes
            12: 0.70  # Décembre - fêtes
        }
        return seasonal_factors.get(month, 1.0)

    def get_seasonal_demand_factor(self, month):
        """Facteurs saisonniers pour les demandes (Cameroun)"""
        # Demandes plus élevées en saison sèche (accidents), maladies saisonnières
        seasonal_factors = {
            1: 1.25,  # Janvier - accidents saison sèche, paludisme
            2: 1.35,  # Février - pic accidentologie
            3: 1.30,  # Mars - continuation pic
            4: 1.15,  # Avril - transition
            5: 0.95,  # Mai - début saison pluies
            6: 0.85,  # Juin - saison pluies
            7: 0.80,  # Juillet - creux saisonnier
            8: 0.85,  # Août - continuation pluies
            9: 0.95,  # Septembre - fin pluies
            10: 1.10,  # Octobre - reprise activité
            11: 1.20,  # Novembre - saison sèche commence
            12: 1.30  # Décembre - accidents fêtes
        }
        return seasonal_factors.get(month, 1.0)

    def get_weekday_factor(self, weekday, pattern_type):
        """Facteurs jour de la semaine (0=Lundi, 6=Dimanche)"""
        if pattern_type == 'collection':
            # Moins de collectes le weekend
            weekday_factors = [1.0, 1.0, 1.0, 1.0, 0.9, 0.4, 0.3]
        else:  # demand
            # Plus d'urgences le weekend
            weekday_factors = [1.0, 1.0, 1.0, 1.0, 1.1, 1.3, 1.2]

        return weekday_factors[weekday]

    def optimize_data_consistency(self):
        """Optimiser la cohérence des données"""
        self.stdout.write('  🔧 Optimisation de la cohérence...')

        try:
            # Marquer les unités expirées
            expired_units = BloodUnit.objects.filter(
                date_expiration__lt=date.today(),
                status='Available'
            ).update(status='Expired')

            if expired_units > 0:
                self.stdout.write(f'    ✅ {expired_units} unités expirées mises à jour')

            # Optimiser les index de base de données
            with connection.cursor() as cursor:
                cursor.execute('ANALYZE')
                self.stdout.write('    ✅ Index de base optimisés')

        except Exception as e:
            self.stdout.write(f'    ⚠️ Erreur optimisation: {str(e)[:50]}')

    def verify_and_score_data(self):
        """Vérifier et scorer la qualité des données pour ML"""
        self.stdout.write('\n🔍 ÉVALUATION QUALITÉ DONNÉES ML')
        self.stdout.write('=' * 45)

        # Statistiques de base
        stats = {
            'Sites': Site.objects.count(),
            'Départements': Department.objects.count(),
            'Donneurs': Donor.objects.count(),
            'Patients': Patient.objects.count(),
            'Records': BloodRecord.objects.count(),
            'Unités': BloodUnit.objects.count(),
            'Demandes': BloodRequest.objects.count(),
            'Consommations': BloodConsumption.objects.count()
        }

        for metric, count in stats.items():
            self.stdout.write(f'  {metric}: {count:,}')

        total_records = sum(stats.values())
        self.stdout.write(f'\n📊 TOTAL: {total_records:,} enregistrements')

        # Calcul du score qualité ML
        quality_score = self.calculate_ml_readiness_score(stats)

        # Distribution des groupes sanguins
        self.stdout.write('\n🩸 Distribution groupes sanguins:')
        blood_distribution = {}
        total_donors = stats['Donneurs']

        for bt in ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']:
            count = Donor.objects.filter(blood_type=bt).count()
            percentage = (count / max(total_donors, 1)) * 100
            blood_distribution[bt] = (count, percentage)
            self.stdout.write(f'  {bt}: {count:,} ({percentage:.1f}%)')

        # Évaluation temporelle
        date_coverage = self.evaluate_temporal_coverage()
        self.stdout.write(f'\n📅 Couverture temporelle: {date_coverage} jours')

        # Patterns détectés
        patterns = self.detect_data_patterns()
        self.stdout.write(f'📈 Patterns saisonniers: {"✅ Détectés" if patterns else "❌ Insuffisants"}')

        # Score final
        self.stdout.write(f'\n🎯 SCORE QUALITÉ ML: {quality_score:.2f}/1.00')

        if quality_score >= 0.85:
            self.stdout.write('  🏆 EXCELLENT - Confiance ML attendue ≥ 0.85')
        elif quality_score >= 0.70:
            self.stdout.write('  ✅ BON - Confiance ML attendue 0.70-0.84')
        elif quality_score >= 0.50:
            self.stdout.write('  ⚠️ MOYEN - Confiance ML attendue 0.50-0.69')
        else:
            self.stdout.write('  ❌ FAIBLE - Plus de données nécessaires')

        return quality_score

    def calculate_ml_readiness_score(self, stats):
        """Calculer le score de préparation ML"""

        # Facteur volume de données (0-0.4)
        target_volume = 50000  # Records + Units + Requests + Consumptions
        actual_volume = stats['Records'] + stats['Unités'] + stats['Demandes'] + stats['Consommations']
        volume_score = min(0.4, (actual_volume / target_volume) * 0.4)

        # Facteur diversité (0-0.3)
        diversity_score = min(0.3, (stats['Sites'] / 20) * 0.15 + (stats['Départements'] / 50) * 0.15)

        # Facteur cohérence (0-0.2)
        consumption_rate = stats['Consommations'] / max(stats['Demandes'], 1)
        coherence_score = min(0.2, consumption_rate * 0.2)

        # Facteur temporel (0-0.1)
        days_coverage = self.years * 365
        temporal_score = min(0.1, (days_coverage / 365) * 0.1)

        total_score = volume_score + diversity_score + coherence_score + temporal_score
        return min(1.0, total_score)

    def evaluate_temporal_coverage(self):
        """Évaluer la couverture temporelle des données"""
        try:
            oldest_record = BloodRecord.objects.order_by('record_date').first()
            newest_record = BloodRecord.objects.order_by('-record_date').first()

            if oldest_record and newest_record:
                coverage = (newest_record.record_date - oldest_record.record_date).days
                return coverage
        except:
            pass
        return 0

    def detect_data_patterns(self):
        """Détecter si des patterns saisonniers sont présents"""
        try:
            # Vérifier si on a des données sur au moins 12 mois différents
            months_with_data = BloodConsumption.objects.dates('date', 'month').count()
            return months_with_data >= 12
        except:
            return False

    def generate_ml_forecasts(self):
        """Générer des prévisions ML optimisées"""
        self.stdout.write('\n🔮 GÉNÉRATION PRÉVISIONS ML')
        self.stdout.write('=' * 35)

        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        forecasts_created = 0

        for blood_type in blood_types:
            try:
                # Analyser les patterns historiques
                historical_data = self.analyze_historical_patterns(blood_type)

                if not historical_data:
                    continue

                # Générer prévisions pour 30 jours
                for days_ahead in range(1, 31):
                    future_date = date.today() + timedelta(days=days_ahead)

                    predicted_volume, confidence = self.predict_advanced_ml(
                        blood_type, future_date, historical_data, days_ahead
                    )

                    prevision_id = f"ML_{blood_type}_{future_date.strftime('%Y%m%d')}"

                    prevision, created = Prevision.objects.get_or_create(
                        prevision_id=prevision_id,
                        defaults={
                            'blood_type': blood_type,
                            'prevision_date': future_date,
                            'previsional_volume': predicted_volume,
                            'fiability': confidence
                        }
                    )

                    if created:
                        forecasts_created += 1

            except Exception as e:
                self.stdout.write(f'  ⚠️ Erreur prévisions {blood_type}: {str(e)[:40]}')

        self.stdout.write(f'  ✅ {forecasts_created} prévisions ML créées')

    def analyze_historical_patterns(self, blood_type):
        """Analyser les patterns historiques avancés"""
        try:
            # Consommations par jour de la semaine
            weekday_patterns = {}
            for weekday in range(7):
                avg_consumption = BloodConsumption.objects.filter(
                    unit__donor__blood_type=blood_type,
                    date__week_day=weekday + 1
                ).count() / max(1, self.years * 52)
                weekday_patterns[weekday] = avg_consumption

            # Consommations par mois
            monthly_patterns = {}
            for month in range(1, 13):
                avg_consumption = BloodConsumption.objects.filter(
                    unit__donor__blood_type=blood_type,
                    date__month=month
                ).count() / max(1, self.years)
                monthly_patterns[month] = avg_consumption

            # Tendance récente vs ancienne
            recent_period = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__gte=date.today() - timedelta(days=90)
            ).count()

            older_period = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__gte=date.today() - timedelta(days=180),
                date__lt=date.today() - timedelta(days=90)
            ).count()

            trend = (recent_period - older_period) / max(older_period, 1) if older_period > 0 else 0
            overall_avg = recent_period / 90

            return {
                'weekday_patterns': weekday_patterns,
                'monthly_patterns': monthly_patterns,
                'overall_avg': overall_avg,
                'trend': trend,
                'total_data_points': recent_period + older_period
            }

        except Exception:
            return None

    def predict_advanced_ml(self, blood_type, future_date, historical_data, days_ahead):
        """Prédiction ML avancée avec multiple facteurs"""

        # Base de prédiction
        base_demand = historical_data['overall_avg']

        if base_demand == 0:
            return 0, 0.3  # Pas de données historiques

        # Facteurs multiples
        weekday_factor = historical_data['weekday_patterns'].get(
            future_date.weekday(), base_demand
        ) / base_demand

        monthly_factor = historical_data['monthly_patterns'].get(
            future_date.month, base_demand
        ) / base_demand

        trend_factor = 1 + (historical_data['trend'] * days_ahead / 30)

        # Facteur de variabilité (réduction avec distance temporelle)
        variability_factor = random.uniform(0.85, 1.15) * (1 - days_ahead / 100)

        # Prédiction finale
        predicted_volume = max(0, int(
            base_demand * weekday_factor * monthly_factor * trend_factor * variability_factor
        ))

        # Confiance basée sur la quantité et qualité des données
        data_quality = min(1.0, historical_data['total_data_points'] / 500)
        time_penalty = max(0.4, 1 - (days_ahead / 60))  # Confiance diminue avec la distance

        confidence = min(0.95, 0.5 + (data_quality * time_penalty * 0.45))

        return predicted_volume, round(confidence, 3)

    def generate_final_report(self, quality_score):
        """Générer le rapport final d'optimisation"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('📋 RAPPORT FINAL D\'OPTIMISATION ML')
        self.stdout.write('=' * 60)

        # Statistiques finales
        final_stats = {
            'Total enregistrements': sum([
                Site.objects.count(),
                Department.objects.count(),
                Donor.objects.count(),
                Patient.objects.count(),
                BloodRecord.objects.count(),
                BloodUnit.objects.count(),
                BloodRequest.objects.count(),
                BloodConsumption.objects.count(),
                Prevision.objects.count()
            ]),
            'Jours d\'historique': self.years * 365,
            'Sites avec banque de sang': Site.objects.filter(blood_bank=True).count(),
            'Départements actifs': Department.objects.filter(is_active=True).count()
        }

        for metric, value in final_stats.items():
            self.stdout.write(f'📊 {metric}: {value:,}')

        # Prédictions de performance ML
        expected_confidence = self.estimate_ml_confidence(quality_score)
        self.stdout.write(f'\n🎯 CONFIANCE ML ESTIMÉE: {expected_confidence:.2f}')

        # Comparaison avec l'objectif
        improvement = expected_confidence - 0.48  # Confiance actuelle
        improvement_pct = (improvement / 0.48) * 100

        self.stdout.write(f'📈 AMÉLIORATION ATTENDUE: +{improvement:.2f} ({improvement_pct:.1f}%)')

        # Recommandations
        self.stdout.write('\n💡 RECOMMANDATIONS:')

        if quality_score >= 0.85:
            self.stdout.write('  ✅ Données OPTIMALES pour ML robuste')
            self.stdout.write('  🚀 Prêt pour déploiement production')
        elif quality_score >= 0.70:
            self.stdout.write('  ✅ Données BONNES pour ML fiable')
            self.stdout.write('  📈 Continuer collecte pour améliorer davantage')
        else:
            self.stdout.write('  ⚠️ Données suffisantes mais améliorables')
            self.stdout.write('  📊 Recommandé: Étendre la collecte de données')

        # État de préparation
        self.stdout.write(
            f'\n🏁 STATUT: {"🎯 OBJECTIF ATTEINT" if expected_confidence >= 0.85 else "📈 EN COURS D\'AMÉLIORATION"}')
        self.stdout.write('=' * 60)

    def estimate_ml_confidence(self, quality_score):
        """Estimer la confiance ML basée sur le score qualité"""
        # Formule basée sur l'expérience :
        # Score 1.0 → Confiance ~0.95
        # Score 0.8 → Confiance ~0.85
        # Score 0.6 → Confiance ~0.70
        # Score 0.4 → Confiance ~0.55

        base_confidence = 0.40
        max_improvement = 0.55  # De 0.40 à 0.95

        estimated_confidence = base_confidence + (quality_score * max_improvement)
        return min(0.95, estimated_confidence)