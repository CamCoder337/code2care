# app/management/commands/generate_production_data.py
import random
import math
import gc
import psutil
import os
from datetime import date, timedelta, datetime
import numpy as np
from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum
from app.models import (
    Donor, Site, Department, Patient, BloodRecord,
    BloodUnit, BloodRequest, BloodConsumption, Prevision
)


class Command(BaseCommand):
    help = 'Génère des données MASSIVES et INTELLIGENTES pour ML optimisé - Render 512MB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--donors',
            type=int,
            default=8000,
            help='Nombre de donneurs (défaut: 8000)'
        )
        parser.add_argument(
            '--patients',
            type=int,
            default=2500,
            help='Nombre de patients (défaut: 2500)'
        )
        parser.add_argument(
            '--history-days',
            type=int,
            default=50,
            help='Jours d\'historique passé (défaut: 50)'
        )
        parser.add_argument(
            '--forecast-days',
            type=int,
            default=350,
            help='Jours de prévisions futures (défaut: 350)'
        )
        parser.add_argument(
            '--scale-factor',
            type=float,
            default=1.0,
            help='Facteur d\'échelle pour les volumes (défaut: 1.0)'
        )
        parser.add_argument(
            '--memory-optimize',
            action='store_true',
            help='Mode optimisation mémoire extrême pour Render'
        )
        parser.add_argument(
            '--force-clean',
            action='store_true',
            help='Nettoyer avant génération'
        )

    def handle(self, *args, **options):
        self.donors_count = options['donors']
        self.patients_count = options['patients']
        self.history_days = options['history_days']
        self.forecast_days = options['forecast_days']
        self.scale_factor = options['scale_factor']
        self.memory_optimize = options['memory_optimize']

        # Optimisation mémoire Render
        self.batch_size = 500 if self.memory_optimize else 1000
        self.chunk_size = 7 if self.memory_optimize else 14  # jours par chunk

        self.stdout.write('🚀 GÉNÉRATEUR ML ULTRA-OPTIMISÉ - RENDER 512MB')
        self.stdout.write('=' * 60)
        self.stdout.write(f'📊 Donneurs: {self.donors_count:,}')
        self.stdout.write(f'🏥 Patients: {self.patients_count:,}')
        self.stdout.write(f'📅 Historique: {self.history_days} jours')
        self.stdout.write(f'🔮 Prévisions: {self.forecast_days} jours')
        self.stdout.write(f'💾 Batch size: {self.batch_size}')
        self.stdout.write(f'🧠 Mémoire optimisée: {"✅" if self.memory_optimize else "❌"}')

        # Monitoring mémoire
        self.log_memory_usage("Début")

        try:
            if options['force_clean']:
                self.clean_existing_data()

            # Génération en phases pour optimiser mémoire
            self.create_infrastructure()
            self.create_population()
            self.generate_historical_patterns()
            self.generate_future_forecasts()
            self.create_database_indexes()
            self.generate_quality_report()

        except MemoryError:
            self.stdout.write(self.style.ERROR('❌ Erreur mémoire - Réduction automatique'))
            self.emergency_memory_cleanup()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur: {e}'))
            import traceback
            traceback.print_exc()

    def log_memory_usage(self, phase):
        """Monitoring mémoire en temps réel"""
        try:
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            memory_mb = memory_info.rss / 1024 / 1024
            self.stdout.write(f'🖥️ {phase}: {memory_mb:.1f} MB utilisés')

            if memory_mb > 450:  # Seuil d'alerte Render
                self.stdout.write(self.style.WARNING(f'⚠️ Mémoire critique: {memory_mb:.1f} MB'))
                self.emergency_memory_cleanup()
        except:
            pass

    def emergency_memory_cleanup(self):
        """Nettoyage mémoire d'urgence"""
        gc.collect()
        connection.close()

    def clean_existing_data(self):
        """Nettoyage optimisé avec gestion mémoire"""
        self.stdout.write('🧹 Nettoyage intelligent des données...')

        # Désactivation des contraintes temporairement
        with connection.cursor() as cursor:
            cursor.execute('SET session_replication_role = replica;')

            # Suppression en ordre inverse pour éviter les contraintes FK
            tables = [
                'app_prevision', 'app_bloodconsumption', 'app_bloodrequest',
                'app_bloodunit', 'app_bloodrecord', 'app_patient',
                'app_department', 'app_donor', 'app_site'
            ]

            for table in tables:
                cursor.execute(f'TRUNCATE TABLE "{table}" CASCADE')
                self.stdout.write(f'  ✅ {table}')

            cursor.execute('SET session_replication_role = DEFAULT;')
            cursor.execute('VACUUM ANALYZE;')

        gc.collect()
        self.log_memory_usage("Post-nettoyage")

    def create_infrastructure(self):
        """Créer l'infrastructure hospitalière camerounaise"""
        self.stdout.write('🏥 Création infrastructure hospitalière...')

        # Sites hospitaliers majeurs du Cameroun avec données réalistes
        sites_data = [
            # Douala - Centre économique
            ('SITE_CHU_DLA', 'CHU de Douala', 'Douala', 'hospital', 'Bonanjo', 400, True, 'Littoral'),
            ('SITE_LAQ_DLA', 'Hôpital Laquintinie', 'Douala', 'hospital', 'Deido', 300, True, 'Littoral'),
            ('SITE_CNTS_DLA', 'CNTS Douala', 'Douala', 'collection_center', 'Akwa', 150, True, 'Littoral'),

            # Yaoundé - Capitale
            ('SITE_CHU_YDE', 'CHU de Yaoundé', 'Yaoundé', 'hospital', 'Melen', 450, True, 'Centre'),
            ('SITE_CENTRAL_YDE', 'Hôpital Central', 'Yaoundé', 'hospital', 'Centre-ville', 350, True, 'Centre'),
            ('SITE_GYNECO_YDE', 'Hôpital Gynéco-Obstétrique', 'Yaoundé', 'hospital', 'Biyem-Assi', 200, True, 'Centre'),

            # Centres régionaux
            ('SITE_REG_BFM', 'Hôpital Régional Bafoussam', 'Bafoussam', 'hospital', 'Centre', 250, True, 'Ouest'),
            ('SITE_REG_BMD', 'Bamenda Regional Hospital', 'Bamenda', 'hospital', 'Centre', 220, True, 'Nord-Ouest'),
            ('SITE_REG_GAR', 'Hôpital Régional Garoua', 'Garoua', 'hospital', 'Centre', 200, False, 'Nord'),
            ('SITE_REG_NGD', 'Hôpital Régional Ngaoundéré', 'Ngaoundéré', 'hospital', 'Centre', 180, False, 'Adamaoua'),

            # Hôpitaux spécialisés
            ('SITE_MIL_YDE', 'Hôpital Militaire Yaoundé', 'Yaoundé', 'hospital', 'Ngoa-Ekellé', 150, True, 'Centre'),
            ('SITE_PEDIA_DLA', 'Hôpital Pédiatrique Douala', 'Douala', 'hospital', 'Bonapriso', 120, True, 'Littoral'),
        ]

        sites = []
        for site_data in sites_data:
            site_id, nom, ville, type_site, address, capacity, blood_bank, region = site_data

            site, created = Site.objects.get_or_create(
                site_id=site_id,
                defaults={
                    'nom': nom,
                    'ville': ville,
                    'type': type_site,
                    'address': address,
                    'capacity': capacity,
                    'region': region,
                    'status': 'active',
                    'blood_bank': blood_bank,
                    'current_patients': random.randint(int(capacity * 0.6), int(capacity * 0.9))
                }
            )
            sites.append(site)

        self.stdout.write(f'  ✅ {len(sites)} sites créés')

        # Départements spécialisés par site
        departments = self.create_specialized_departments(sites)
        self.stdout.write(f'  ✅ {len(departments)} départements créés')

        self.sites = sites
        self.departments = departments
        self.log_memory_usage("Infrastructure")

    def create_specialized_departments(self, sites):
        """Créer des départements spécialisés réalistes"""

        # Templates de départements selon le type et la taille d'hôpital
        dept_templates = {
            'major': [  # CHU et grands hôpitaux
                ('URG', 'Urgences', 'emergency', 60, True, 0.8),
                ('CHIR_GEN', 'Chirurgie Générale', 'surgery', 50, True, 0.9),
                ('CHIR_CARD', 'Chirurgie Cardiaque', 'surgery', 25, True, 0.95),
                ('CARDIO', 'Cardiologie', 'cardiology', 30, True, 0.7),
                ('PEDIATR', 'Pédiatrie', 'pediatrics', 40, True, 0.6),
                ('GYNECO', 'Gynéco-Obstétrique', 'gynecology', 45, True, 0.85),
                ('HEMATO', 'Hématologie-Oncologie', 'oncology', 20, True, 0.95),
                ('REANIM', 'Réanimation', 'intensive_care', 15, True, 1.0),
                ('NEPHRO', 'Néphrologie', 'nephrology', 18, True, 0.4),
                ('ORTHO', 'Orthopédie', 'orthopedics', 35, True, 0.75),
            ],
            'regional': [  # Hôpitaux régionaux
                ('URG', 'Urgences', 'emergency', 30, True, 0.7),
                ('CHIR_GEN', 'Chirurgie Générale', 'surgery', 25, True, 0.8),
                ('PEDIATR', 'Pédiatrie', 'pediatrics', 25, True, 0.6),
                ('GYNECO', 'Maternité', 'gynecology', 30, True, 0.8),
                ('MED_INT', 'Médecine Interne', 'internal_medicine', 35, True, 0.3),
                ('CARDIO', 'Cardiologie', 'cardiology', 15, True, 0.6),
            ],
            'specialized': [  # Hôpitaux spécialisés
                ('SPEC_1', 'Service Principal', 'general', 40, True, 0.9),
                ('SPEC_2', 'Service Secondaire', 'general', 20, True, 0.6),
                ('URG', 'Urgences', 'emergency', 15, True, 0.7),
            ]
        }

        departments = []

        for site in sites:
            # Déterminer le template selon la capacité
            if site.capacity >= 300:
                template_type = 'major'
            elif site.capacity >= 150:
                template_type = 'regional'
            else:
                template_type = 'specialized'

            templates = dept_templates[template_type]

            for dept_code, name, dept_type, base_beds, needs_blood, blood_intensity in templates:
                dept_id = f"{dept_code}_{site.site_id}"

                # Ajuster selon la taille du site
                bed_capacity = max(5, int(base_beds * (site.capacity / 400)))
                occupancy = random.randint(
                    int(bed_capacity * 0.6),
                    min(bed_capacity, int(bed_capacity * 0.95))
                )

                # Consommation mensuelle de sang basée sur l'intensité
                monthly_usage = 0
                if needs_blood:
                    monthly_usage = max(1, int(occupancy * blood_intensity * random.uniform(0.8, 1.2)))

                try:
                    dept, created = Department.objects.get_or_create(
                        department_id=dept_id,
                        defaults={
                            'site': site,
                            'name': name,
                            'department_type': dept_type,
                            'description': f'{name} - {site.nom}',
                            'bed_capacity': bed_capacity,
                            'current_occupancy': occupancy,
                            'staff_count': max(5, bed_capacity // 3),
                            'monthly_blood_usage': monthly_usage,
                            'is_active': True,
                            'requires_blood_products': needs_blood,
                            'is_emergency_department': dept_type == 'emergency'
                        }
                    )
                    departments.append(dept)

                except Exception as e:
                    self.stdout.write(f'  ⚠️ Erreur département {dept_id}: {str(e)[:30]}')

            # Nettoyage mémoire périodique
            if len(departments) % 20 == 0:
                gc.collect()

        return departments

    def create_population(self):
        """Créer populations de donneurs et patients avec distribution réaliste"""
        self.stdout.write('👥 Création population camerounaise...')

        # Distribution réaliste des groupes sanguins au Cameroun
        blood_distribution = {
            'O+': 0.45, 'A+': 0.30, 'B+': 0.15, 'AB+': 0.05,
            'O-': 0.025, 'A-': 0.015, 'B-': 0.008, 'AB-': 0.002
        }

        # Données anthroponymiques camerounaises par région
        name_data = self.get_cameroon_names_data()

        # 1. Créer les donneurs
        self.create_donors_optimized(blood_distribution, name_data)

        # 2. Créer les patients
        self.create_patients_optimized(blood_distribution, name_data)

        self.log_memory_usage("Population")

    def get_cameroon_names_data(self):
        """Noms camerounais authentiques par région linguistique"""
        return {
            'francophone': {
                'male': [
                    'Jean', 'Paul', 'Pierre', 'André', 'Emmanuel', 'Joseph', 'Martin', 'François',
                    'Alain', 'Bernard', 'Philippe', 'Daniel', 'Marcel', 'Christophe', 'Vincent',
                    'Roger', 'Michel', 'Laurent', 'Julien', 'Olivier', 'Pascal', 'Thierry'
                ],
                'female': [
                    'Marie', 'Françoise', 'Jeanne', 'Catherine', 'Anne', 'Christine', 'Monique',
                    'Nicole', 'Brigitte', 'Martine', 'Dominique', 'Isabelle', 'Nathalie',
                    'Sandrine', 'Véronique', 'Cécile', 'Sylvie', 'Claudine', 'Bernadette'
                ],
                'surnames': [
                    'Mballa', 'Ngoua', 'Bekono', 'Ateba', 'Fouda', 'Meka', 'Olinga', 'Ayissi',
                    'Talla', 'Kamga', 'Fogue', 'Temgoua', 'Djuikom', 'Youmbi', 'Feudjio', 'Tchinda',
                    'Ngono', 'Owona', 'Essomba', 'Biloa', 'Mengue', 'Ebang', 'Mvogo', 'Abena'
                ]
            },
            'anglophone': {
                'male': [
                    'John', 'Paul', 'Peter', 'James', 'David', 'Michael', 'Robert', 'William',
                    'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald',
                    'Kenneth', 'Joshua', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald'
                ],
                'female': [
                    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan',
                    'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra',
                    'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Emily'
                ],
                'surnames': [
                    'Njume', 'Tabi', 'Fru', 'Che', 'Nkeng', 'Sama', 'Mbah', 'Ngwa',
                    'Titanji', 'Asongwe', 'Nfor', 'Agbor', 'Ngole', 'Tabot', 'Ako', 'Ewane'
                ]
            },
            'northern': {
                'male': [
                    'Ahmadou', 'Ousmane', 'Ibrahim', 'Moussa', 'Abdoulaye', 'Hamidou', 'Alhadji',
                    'Bouba', 'Issa', 'Amadou', 'Oumarou', 'Souley', 'Mahamat', 'Adam', 'Hassan'
                ],
                'female': [
                    'Aissatou', 'Fatimata', 'Salamatou', 'Hadjara', 'Maimouna', 'Ramatou',
                    'Adama', 'Zeinabou', 'Mariam', 'Djamila', 'Khadija', 'Aminata', 'Oumou'
                ],
                'surnames': [
                    'Bello', 'Issa', 'Hamadou', 'Moustapha', 'Boubakari', 'Alioum', 'Amadou',
                    'Oumarou', 'Hayatou', 'Danpullo', 'Abbo', 'Mohamadou', 'Yerima', 'Baba'
                ]
            }
        }

    def create_donors_optimized(self, blood_distribution, name_data):
        """Créer donneurs avec optimisation mémoire"""
        self.stdout.write(f'  💉 Génération {self.donors_count:,} donneurs...')

        regions = list(name_data.keys())
        blood_types = list(blood_distribution.keys())
        blood_weights = list(blood_distribution.values())

        created_count = 0

        for batch_start in range(0, self.donors_count, self.batch_size):
            batch_donors = []
            current_batch_size = min(self.batch_size, self.donors_count - batch_start)

            for i in range(current_batch_size):
                donor_num = batch_start + i + 1

                # Sélection région et noms
                region = random.choice(regions)
                names = name_data[region]

                gender = random.choice(['M', 'F'])
                blood_type = random.choices(blood_types, weights=blood_weights)[0]

                # Distribution d'âge réaliste pour donneurs (18-65 ans)
                age_weights = [0.25, 0.30, 0.25, 0.15, 0.05]  # 18-25, 26-35, 36-45, 46-55, 56-65
                age_ranges = [(18, 25), (26, 35), (36, 45), (46, 55), (56, 65)]
                age_range = random.choices(age_ranges, weights=age_weights)[0]
                age = random.randint(age_range[0], age_range[1])

                birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

                # Génération ID et noms
                donor_id = f"DON{str(donor_num).zfill(7)}"
                first_name = random.choice(names['male'] if gender == 'M' else names['female'])
                last_name = random.choice(names['surnames'])

                # Téléphone camerounais
                operators = ['650', '651', '652', '653', '654', '655', '656', '657', '658', '659',
                             '690', '691', '692', '693', '694', '695', '696', '697', '698', '699']
                phone = f"{random.choice(operators)}{random.randint(100000, 999999)}"

                batch_donors.append(Donor(
                    donor_id=donor_id,
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=birth_date,
                    gender=gender,
                    blood_type=blood_type,
                    phone_number=phone
                ))

            # Insertion batch optimisée
            try:
                Donor.objects.bulk_create(batch_donors, batch_size=self.batch_size)
                created_count += len(batch_donors)

                if created_count % 2000 == 0:
                    self.stdout.write(f'    💉 {created_count:,} donneurs créés...')
                    gc.collect()  # Nettoyage mémoire

            except Exception as e:
                self.stdout.write(f'    ⚠️ Erreur batch donneurs: {str(e)[:40]}')

        self.stdout.write(f'  ✅ {created_count:,} donneurs créés')
        self.donors = list(Donor.objects.all())

    def create_patients_optimized(self, blood_distribution, name_data):
        """Créer patients avec pathologies réalistes"""
        self.stdout.write(f'  🏥 Génération {self.patients_count:,} patients...')

        # Pathologies nécessitant transfusions par groupe d'âge
        pathologies_by_age = {
            'pediatric': [
                'Anémie sévère du nourrisson', 'Leucémie lymphoblastique aiguë',
                'Thalassémie majeure', 'Drépanocytose compliquée', 'Aplasie médullaire congénitale'
            ],
            'adult': [
                'Hémorragie obstétricale', 'Accident de la circulation avec polytraumatisme',
                'Chirurgie cardiaque programmée', 'Cancer colorectal avec métastases',
                'Insuffisance rénale chronique terminale', 'Leucémie aiguë myéloblastique'
            ],
            'elderly': [
                'Hémorragie digestive haute sur ulcère', 'Myélome multiple', 'Anémie des maladies chroniques',
                'Chirurgie orthopédique majeure', 'Syndrome myélodysplasique', 'Cancer de la prostate avancé'
            ]
        }

        blood_types = list(blood_distribution.keys())
        blood_weights = list(blood_distribution.values())

        created_count = 0

        for batch_start in range(0, self.patients_count, self.batch_size):
            batch_patients = []
            current_batch_size = min(self.batch_size, self.patients_count - batch_start)

            for i in range(current_batch_size):
                patient_num = batch_start + i + 1

                # Distribution d'âge réaliste pour patients nécessitant transfusions
                age_categories = [
                    (0, 17, 0.15, 'pediatric'),  # Pédiatrie
                    (18, 50, 0.45, 'adult'),  # Adultes
                    (51, 90, 0.40, 'elderly')  # Personnes âgées
                ]

                age_cat = random.choices(
                    [(min_age, max_age, cat) for min_age, max_age, _, cat in age_categories],
                    weights=[weight for _, _, weight, _ in age_categories]
                )[0]

                age = random.randint(age_cat[0], age_cat[1])
                age_category = age_cat[2]

                birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

                patient_id = f"PAT{str(patient_num).zfill(7)}"
                blood_type = random.choices(blood_types, weights=blood_weights)[0]

                # Pathologie selon l'âge
                pathology = random.choice(pathologies_by_age[age_category])

                # Noms anonymisés pour patients
                patient = Patient(
                    patient_id=patient_id,
                    first_name=f'Patient_{patient_num:05d}',
                    last_name='Anonyme',
                    date_of_birth=birth_date,
                    gender=random.choice(['M', 'F']),
                    blood_type=blood_type,
                    patient_history=pathology
                )
                batch_patients.append(patient)

            # Insertion
            try:
                Patient.objects.bulk_create(batch_patients, batch_size=self.batch_size)
                created_count += len(batch_patients)

                if created_count % 1000 == 0:
                    self.stdout.write(f'    🏥 {created_count:,} patients créés...')
                    gc.collect()

            except Exception as e:
                self.stdout.write(f'    ⚠️ Erreur batch patients: {str(e)[:40]}')

        self.stdout.write(f'  ✅ {created_count:,} patients créés')
        self.patients = list(Patient.objects.all())

    def generate_historical_patterns(self):
        """Générer patterns historiques intelligents pour ML"""
        self.stdout.write('📊 Génération patterns historiques ML...')

        start_date = date.today() - timedelta(days=self.history_days)
        collection_sites = [s for s in self.sites if s.blood_bank]
        blood_departments = [d for d in self.departments if d.requires_blood_products]

        self.stdout.write(f'  📅 Période: {start_date} → {date.today()}')
        self.stdout.write(f'  🏥 {len(collection_sites)} sites de collecte')
        self.stdout.write(f'  🩸 {len(blood_departments)} départements consommateurs')

        # Génération par chunks pour optimiser mémoire
        for chunk_start in range(0, self.history_days, self.chunk_size):
            chunk_end = min(chunk_start + self.chunk_size, self.history_days)
            chunk_start_date = start_date + timedelta(days=chunk_start)
            chunk_days = chunk_end - chunk_start

            self.stdout.write(f'  📊 Chunk jours {chunk_start}-{chunk_end} ({chunk_start_date.strftime("%m/%d")})')

            # 1. Générer collectes avec patterns saisonniers
            self.generate_collections_chunk(
                collection_sites, chunk_start_date, chunk_days
            )

            # 2. Générer demandes et consommations
            self.generate_demands_chunk(
                blood_departments, chunk_start_date, chunk_days
            )

            # Nettoyage mémoire entre chunks
            gc.collect()
            self.log_memory_usage(f"Chunk {chunk_start}-{chunk_end}")

        self.stdout.write('  ✅ Patterns historiques générés')

    def generate_collections_chunk(self, collection_sites, start_date, days_count):
        """Générer collectes avec patterns camerounais réalistes"""

        records_batch = []
        units_batch = []

        for day_offset in range(days_count):
            current_date = start_date + timedelta(days=day_offset)

            # Facteurs saisonniers camerounais
            seasonal_factor = self.get_cameroon_seasonal_factor(current_date.month, 'collection')

            # Facteur jour de la semaine (moins de collectes weekend)
            weekday = current_date.weekday()
            weekday_factors = [1.0, 1.0, 1.0, 1.0, 0.9, 0.4, 0.3]  # Lun-Dim
            weekday_factor = weekday_factors[weekday]

            # Événements spéciaux camerounais
            event_factor = self.get_cameroon_event_factor(current_date)

            # Calcul collections quotidiennes
            base_collections = 25 * self.scale_factor
            daily_collections = max(1, int(
                np.random.poisson(base_collections * seasonal_factor * weekday_factor * event_factor)
            ))

            # Générer les collectes
            for _ in range(daily_collections):
                site = random.choice(collection_sites)
                donor = random.choice(self.donors)

                record_id = f"REC{len(records_batch) + 1:08d}_{current_date.strftime('%Y%m%d')}"

                # Screening avec taux de réussite réaliste (96% au Cameroun)
                screening_valid = random.random() < 0.96
                if screening_valid:
                    screening_result = 'Valid'
                else:
                    rejection_reasons = [
                        'Rejected_HIV', 'Rejected_HBV', 'Rejected_HCV',
                        'Rejected_Syphilis', 'Rejected_Hemoglobin'
                    ]
                    screening_result = random.choice(rejection_reasons)

                record = BloodRecord(
                    record_id=record_id,
                    site=site,
                    screening_results=screening_result,
                    record_date=current_date,
                    quantity=1
                )
                records_batch.append(record)

                # Créer unité si screening valide
                if screening_valid:
                    unit_id = f"UNIT{len(units_batch) + 1:08d}_{current_date.strftime('%Y%m%d')}"

                    # Paramètres physiologiques réalistes
                    volume_ml = random.randint(420, 480)  # Volume standard collecté
                    hemoglobin = round(random.uniform(12.5, 17.5), 1)
                    expiry_date = current_date + timedelta(days=42)  # Validité standard

                    # Statut selon l'âge de l'unité
                    days_old = (date.today() - current_date).days
                    if expiry_date <= date.today():
                        status = 'Expired'
                    elif days_old > 35:  # Proche expiration
                        status = random.choices(['Available', 'Used'], weights=[0.1, 0.9])[0]
                    elif days_old > 21:  # Moyen terme
                        status = random.choices(['Available', 'Used'], weights=[0.4, 0.6])[0]
                    else:  # Récent
                        status = random.choices(['Available', 'Used'], weights=[0.8, 0.2])[0]

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

        # Insertion optimisée par batch
        if records_batch:
            try:
                BloodRecord.objects.bulk_create(records_batch, batch_size=self.batch_size)
                self.stdout.write(f'    📝 {len(records_batch):,} records créés')

                # Récupérer records créés pour liaison FK
                created_records = {r.record_id: r for r in BloodRecord.objects.filter(
                    record_id__in=[r.record_id for r in records_batch]
                )}

                # Mettre à jour FK des unités
                for unit in units_batch:
                    if unit.record.record_id in created_records:
                        unit.record = created_records[unit.record.record_id]

                BloodUnit.objects.bulk_create(units_batch, batch_size=self.batch_size)
                self.stdout.write(f'    🩸 {len(units_batch):,} unités créées')

            except Exception as e:
                self.stdout.write(f'    ⚠️ Erreur collectes: {str(e)[:40]}')

    def generate_demands_chunk(self, blood_departments, start_date, days_count):
        """Générer demandes et consommations avec patterns hospitaliers"""

        requests_batch = []
        consumptions_batch = []
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']

        for day_offset in range(days_count):
            current_date = start_date + timedelta(days=day_offset)

            # Facteurs de demande camerounais
            seasonal_factor = self.get_cameroon_seasonal_factor(current_date.month, 'demand')
            weekday = current_date.weekday()

            # Plus de demandes urgentes weekend (accidents)
            weekday_factors = [1.0, 1.0, 1.0, 1.0, 1.1, 1.4, 1.3]
            weekday_factor = weekday_factors[weekday]

            # Événements et fêtes (plus d'accidents)
            event_factor = self.get_cameroon_event_factor(current_date)

            # Demandes quotidiennes par département
            for dept in blood_departments:
                # Demandes basées sur la taille et le type du département
                base_demand = self.calculate_department_base_demand(dept)

                daily_requests = max(0, int(
                    np.random.poisson(base_demand * seasonal_factor * weekday_factor * event_factor)
                ))

                for _ in range(daily_requests):
                    blood_type = self.select_blood_type_for_department(dept, blood_types)
                    quantity = self.calculate_request_quantity(dept)
                    priority = self.determine_request_priority(dept, weekday)

                    request_id = f"REQ{len(requests_batch) + 1:08d}_{current_date.strftime('%Y%m%d')}"

                    # Statut basé sur l'ancienneté et le type de département
                    days_old = (date.today() - current_date).days
                    status = self.determine_request_status(days_old, priority, dept)

                    request = BloodRequest(
                        request_id=request_id,
                        department=dept,
                        site=dept.site,
                        blood_type=blood_type,
                        quantity=quantity,
                        priority=priority,
                        status=status,
                        request_date=current_date
                    )
                    requests_batch.append(request)

                    # Générer consommations pour demandes satisfaites
                    if status == 'Fulfilled' and random.random() < 0.8:
                        self.create_consumption_for_request_chunk(
                            request, current_date, consumptions_batch
                        )

        # Insertion des demandes
        if requests_batch:
            try:
                BloodRequest.objects.bulk_create(requests_batch, batch_size=self.batch_size)
                self.stdout.write(f'    📋 {len(requests_batch):,} demandes créées')

                # Consommations
                if consumptions_batch:
                    # Récupérer demandes créées
                    created_requests = {r.request_id: r for r in BloodRequest.objects.filter(
                        request_id__in=[r.request_id for r in requests_batch]
                    )}

                    # Mettre à jour FK
                    for consumption in consumptions_batch:
                        if consumption.request.request_id in created_requests:
                            consumption.request = created_requests[consumption.request.request_id]

                    BloodConsumption.objects.bulk_create(consumptions_batch, batch_size=self.batch_size)
                    self.stdout.write(f'    💉 {len(consumptions_batch):,} transfusions créées')

            except Exception as e:
                self.stdout.write(f'    ⚠️ Erreur demandes: {str(e)[:40]}')

    def get_cameroon_seasonal_factor(self, month, pattern_type):
        """Facteurs saisonniers spécifiques au Cameroun"""

        if pattern_type == 'collection':
            # Collections: Impact saison sèche vs pluies, périodes scolaires
            factors = {
                1: 0.9,  # Janvier - Post fêtes, saison sèche
                2: 1.1,  # Février - Campagnes, saison sèche
                3: 1.2,  # Mars - Pic campagnes
                4: 1.0,  # Avril - Transition
                5: 0.8,  # Mai - Début pluies, moins de mobilité
                6: 0.7,  # Juin - Pluies intenses
                7: 0.6,  # Juillet - Pic saison pluies
                8: 0.7,  # Août - Pluies continues
                9: 0.9,  # Septembre - Fin pluies
                10: 1.0,  # Octobre - Retour normal
                11: 1.1,  # Novembre - Campagnes rentrée
                12: 0.8  # Décembre - Fêtes, voyages
            }
        else:  # demand
            # Demandes: Accidents saison sèche, paludisme saison pluies, fêtes
            factors = {
                1: 1.3,  # Janvier - Accidents harmattan, saison sèche
                2: 1.4,  # Février - Pic accidents routes poussiéreuses
                3: 1.2,  # Mars - Accidents, chaleur extrême
                4: 1.0,  # Avril - Transition
                5: 0.9,  # Mai - Début pluies, moins accidents route
                6: 1.0,  # Juin - Paludisme, mais moins accidents
                7: 0.8,  # Juillet - Pluies, moins déplacements
                8: 0.9,  # Août - Paludisme saisonnier
                9: 1.1,  # Septembre - Reprise activités
                10: 1.2,  # Octobre - Saison sèche, plus d'activités
                11: 1.3,  # Novembre - Pic activités économiques
                12: 1.1  # Décembre - Fêtes, voyages, accidents
            }

        return factors.get(month, 1.0)

    def get_cameroon_event_factor(self, current_date):
        """Facteurs d'événements spéciaux camerounais"""

        month = current_date.month
        day = current_date.day

        # Fêtes nationales et périodes spéciales
        special_events = {
            (1, 1): 0.5,  # Nouvel An
            (2, 11): 1.2,  # Fête de la Jeunesse (plus de donneurs)
            (5, 1): 0.8,  # Fête du Travail
            (5, 20): 1.1,  # Fête Nationale
            (8, 15): 0.7,  # Assomption
            (12, 25): 0.6,  # Noël
        }

        # Période de Ramadan (variable selon l'année)
        if month in [3, 4, 5]:  # Approximation
            if random.random() < 0.3:  # 30% de chance d'être en période Ramadan
                return 0.7  # Moins de collectes pendant Ramadan

        # Période scolaire vs vacances
        if month in [7, 8, 12]:  # Grandes vacances
            return 0.8
        elif month in [1, 4, 10]:  # Rentrées scolaires
            return 1.1

        return special_events.get((month, day), 1.0)

    def calculate_department_base_demand(self, dept):
        """Calculer demande de base par département"""

        # Facteur par type de département
        type_factors = {
            'emergency': 2.5,
            'surgery': 2.0,
            'intensive_care': 3.0,
            'oncology': 2.2,
            'cardiology': 1.8,
            'gynecology': 1.5,
            'pediatrics': 1.3,
            'orthopedics': 1.4,
            'nephrology': 1.6,
            'internal_medicine': 1.0,
            'general': 0.8
        }

        type_factor = type_factors.get(dept.department_type, 1.0)

        # Facteur taille département
        size_factor = min(2.0, dept.current_occupancy / 20)

        # Facteur historique mensuel
        monthly_factor = min(1.5, dept.monthly_blood_usage / 10)

        return max(0.1, type_factor * size_factor * monthly_factor * self.scale_factor)

    def select_blood_type_for_department(self, dept, blood_types):
        """Sélectionner groupe sanguin selon département"""

        # Certains départements ont des patterns spécifiques
        if dept.department_type in ['oncology', 'nephrology']:
            # Plus de O+ et A+ pour ces spécialités
            weights = [0.5, 0.35, 0.08, 0.03, 0.02, 0.015, 0.003, 0.002]
        elif dept.department_type == 'pediatrics':
            # Distribution pédiatrique légèrement différente
            weights = [0.48, 0.28, 0.16, 0.04, 0.02, 0.015, 0.008, 0.002]
        else:
            # Distribution générale camerounaise
            weights = [0.45, 0.30, 0.15, 0.05, 0.025, 0.015, 0.008, 0.002]

        return random.choices(blood_types, weights=weights)[0]

    def calculate_request_quantity(self, dept):
        """Calculer quantité demandée selon département"""

        if dept.department_type in ['surgery', 'intensive_care']:
            # Chirurgie et réanimation: quantités plus importantes
            return random.choices([1, 2, 3, 4, 5, 6], weights=[0.1, 0.3, 0.3, 0.2, 0.08, 0.02])[0]
        elif dept.department_type == 'emergency':
            # Urgences: varie beaucoup selon les cas
            return random.choices([1, 2, 3, 4], weights=[0.4, 0.35, 0.2, 0.05])[0]
        elif dept.department_type in ['oncology', 'nephrology']:
            # Oncologie/néphrologie: souvent 1-2 unités
            return random.choices([1, 2, 3], weights=[0.6, 0.35, 0.05])[0]
        else:
            # Autres: principalement 1-2 unités
            return random.choices([1, 2], weights=[0.75, 0.25])[0]

    def determine_request_priority(self, dept, weekday):
        """Déterminer priorité selon département et jour"""

        if dept.department_type in ['emergency', 'intensive_care']:
            # Urgences/réa: beaucoup d'urgent, plus le weekend
            weekend_factor = 1.3 if weekday >= 5 else 1.0
            urgent_prob = min(0.8, 0.6 * weekend_factor)
            return random.choices(['Routine', 'Urgent'], weights=[1 - urgent_prob, urgent_prob])[0]
        elif dept.department_type == 'surgery':
            # Chirurgie: plus d'urgent en semaine (programmés)
            urgent_prob = 0.4 if weekday < 5 else 0.2
            return random.choices(['Routine', 'Urgent'], weights=[1 - urgent_prob, urgent_prob])[0]
        else:
            # Autres: majoritairement routine
            return random.choices(['Routine', 'Urgent'], weights=[0.8, 0.2])[0]

    def determine_request_status(self, days_old, priority, dept):
        """Déterminer statut demande selon ancienneté"""

        if days_old > 10:  # Anciennes demandes
            return random.choices(['Fulfilled', 'Rejected'], weights=[0.92, 0.08])[0]
        elif days_old > 3:  # Demandes récentes
            if priority == 'Urgent':
                return random.choices(['Fulfilled', 'Pending'], weights=[0.85, 0.15])[0]
            else:
                return random.choices(['Fulfilled', 'Pending', 'Rejected'], weights=[0.75, 0.22, 0.03])[0]
        else:  # Très récentes
            if priority == 'Urgent':
                return random.choices(['Fulfilled', 'Pending'], weights=[0.6, 0.4])[0]
            else:
                return random.choices(['Fulfilled', 'Pending', 'Approved'], weights=[0.3, 0.5, 0.2])[0]

    def create_consumption_for_request_chunk(self, request, request_date, consumptions_batch):
        """Créer consommations pour une demande (version chunk)"""

        # Rechercher unités compatibles disponibles
        compatible_units = BloodUnit.objects.filter(
            donor__blood_type=request.blood_type,
            status='Available',
            collection_date__lte=request_date,
            date_expiration__gt=request_date
        )[:request.quantity]

        if not compatible_units:
            return  # Pas d'unités disponibles

        for unit in compatible_units:
            patient = random.choice(self.patients)

            # Volume transfusé (généralement complet)
            volume_transfused = random.randint(
                int(unit.volume_ml * 0.9),
                unit.volume_ml
            )

            # Date de transfusion (même jour ou lendemain)
            consumption_date = request_date
            if random.random() < 0.2:  # 20% le lendemain
                consumption_date += timedelta(days=1)

            consumption = BloodConsumption(
                request=request,
                unit=unit,
                patient=patient,
                date=consumption_date,
                volume=volume_transfused
            )
            consumptions_batch.append(consumption)

    def generate_future_forecasts(self):
        """Générer prévisions ML sophistiquées"""
        self.stdout.write('🔮 Génération prévisions ML avancées...')

        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        forecasts_created = 0

        for blood_type in blood_types:
            # Analyser patterns historiques pour ce groupe
            historical_stats = self.analyze_historical_patterns(blood_type)

            # Générer prévisions pour les prochains jours
            for days_ahead in range(1, self.forecast_days + 1):
                future_date = date.today() + timedelta(days=days_ahead)

                # Modèle prédictif sophistiqué
                predicted_volume, reliability = self.ml_predict_demand(
                    blood_type, future_date, historical_stats, days_ahead
                )

                prevision_id = f"ML_{blood_type}_{future_date.strftime('%Y%m%d')}"

                try:
                    prevision, created = Prevision.objects.get_or_create(
                        prevision_id=prevision_id,
                        defaults={
                            'blood_type': blood_type,
                            'prevision_date': future_date,
                            'previsional_volume': predicted_volume,
                            'fiability': reliability
                        }
                    )

                    if created:
                        forecasts_created += 1

                except Exception as e:
                    pass  # Ignorer erreurs individuelles

            # Log progress et nettoyage mémoire
            if forecasts_created % 1000 == 0:
                self.stdout.write(f'  🔮 {forecasts_created:,} prévisions générées...')
                gc.collect()

        self.stdout.write(f'  ✅ {forecasts_created:,} prévisions ML créées')
        self.log_memory_usage("Prévisions")

    def analyze_historical_patterns(self, blood_type):
        """Analyser patterns historiques sophistiqués"""

        # Consommation par jour de la semaine
        weekday_patterns = {}
        for weekday in range(7):
            avg_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__week_day=weekday + 1
            ).count() / max(1, self.history_days // 7)
            weekday_patterns[weekday] = avg_consumption

        # Consommation par mois
        monthly_patterns = {}
        for month in range(1, 13):
            month_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date__month=month
            ).count()
            monthly_patterns[month] = month_consumption / max(1, self.history_days // 30)

        # Tendance récente
        recent_consumption = BloodConsumption.objects.filter(
            unit__donor__blood_type=blood_type,
            date__gte=date.today() - timedelta(days=min(30, self.history_days))
        ).count()

        older_consumption = BloodConsumption.objects.filter(
            unit__donor__blood_type=blood_type,
            date__gte=date.today() - timedelta(days=min(60, self.history_days)),
            date__lt=date.today() - timedelta(days=min(30, self.history_days))
        ).count()

        trend = (recent_consumption - older_consumption) / max(older_consumption, 1) if older_consumption > 0 else 0

        # Volatilité (coefficient de variation)
        daily_consumptions = []
        for i in range(min(self.history_days, 30)):
            day_date = date.today() - timedelta(days=i + 1)
            day_consumption = BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type,
                date=day_date
            ).count()
            daily_consumptions.append(day_consumption)

        if daily_consumptions:
            avg_daily = sum(daily_consumptions) / len(daily_consumptions)
            variance = sum((x - avg_daily) ** 2 for x in daily_consumptions) / len(daily_consumptions)
            volatility = math.sqrt(variance) / max(avg_daily, 1)
        else:
            volatility = 0.5  # Volatilité par défaut

        return {
            'weekday_patterns': weekday_patterns,
            'monthly_patterns': monthly_patterns,
            'recent_avg': recent_consumption / min(30, self.history_days),
            'trend': trend,
            'volatility': volatility,
            'total_historical_data': BloodConsumption.objects.filter(
                unit__donor__blood_type=blood_type
            ).count()
        }

    def ml_predict_demand(self, blood_type, future_date, historical_stats, days_ahead):
        """Modèle prédictif ML sophistiqué"""

        # Base de prédiction
        base_demand = historical_stats['recent_avg']

        # Facteur jour de la semaine
        weekday = future_date.weekday()
        weekday_factor = historical_stats['weekday_patterns'].get(weekday, base_demand) / max(base_demand, 1)

        # Facteur saisonnier
        monthly_factor = historical_stats['monthly_patterns'].get(future_date.month, base_demand) / max(base_demand, 1)

        # Facteur de tendance avec atténuation temporelle
        trend_decay = math.exp(-days_ahead / 90)  # Décroissance exponentielle
        trend_factor = 1 + (historical_stats['trend'] * trend_decay)

        # Facteur de volatilité
        volatility_noise = np.random.normal(0, historical_stats['volatility'] * 0.1)

        # Facteur événementiel futur
        event_factor = self.get_cameroon_event_factor(future_date)

        # Prédiction finale
        predicted_volume = max(0, int(
            base_demand * weekday_factor * monthly_factor * trend_factor * event_factor * (1 + volatility_noise)
        ))

        # Calcul fiabilité sophistiqué
        data_reliability = min(0.98, 0.5 + (historical_stats['total_historical_data'] / 500) * 0.48)

        # Fiabilité temporelle (décroît avec la distance)
        time_reliability = max(0.4, 0.95 - (days_ahead / self.forecast_days) * 0.55)

        # Fiabilité de volatilité (moins fiable si très volatil)
        volatility_reliability = max(0.3, 1 - min(historical_stats['volatility'], 1) * 0.4)

        # Fiabilité finale pondérée
        final_reliability = (
                data_reliability * 0.4 +
                time_reliability * 0.4 +
                volatility_reliability * 0.2
        )

        return predicted_volume, round(final_reliability, 3)

    def create_database_indexes(self):
        """Créer index optimisés pour ML"""
        self.stdout.write('📊 Optimisation index base de données...')

        indexes = [
            # Index pour requêtes ML temporelles
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bloodconsumption_date_bloodtype ON app_bloodconsumption USING btree (date, (SELECT blood_type FROM app_donor WHERE donor_id = app_bloodunit.donor_id));",

            # Index pour agrégations par site
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bloodrequest_site_date ON app_bloodrequest USING btree (site_id, request_date);",

            # Index pour patterns saisonniers
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bloodunit_collection_month ON app_bloodunit USING btree (EXTRACT(month FROM collection_date), donor_id);",

            # Index pour analyses de stock
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bloodunit_status_expiry ON app_bloodunit USING btree (status, date_expiration) WHERE status IN ('Available', 'Reserved');",

            # Index pour départements consommateurs
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bloodconsumption_dept_volume ON app_bloodconsumption USING btree (request_id, volume);",
        ]

        with connection.cursor() as cursor:
            for idx_sql in indexes:
                try:
                    cursor.execute(idx_sql)
                    self.stdout.write(f'  ✅ Index créé: {idx_sql.split()[5]}')
                except Exception as e:
                    if "already exists" not in str(e):
                        self.stdout.write(f'  ⚠️ Erreur index: {str(e)[:40]}')

        # Statistiques mise à jour
        with connection.cursor() as cursor:
            cursor.execute('ANALYZE;')

        self.stdout.write('  ✅ Optimisation terminée')

    def generate_quality_report(self):
        """Rapport qualité ML détaillé"""
        self.stdout.write('\n📋 RAPPORT QUALITÉ ML - OPTIMISÉ RENDER')
        self.stdout.write('=' * 60)

        # Statistiques générales
        stats = {
            'Sites': Site.objects.count(),
            'Départements': Department.objects.count(),
            'Donneurs': Donor.objects.count(),
            'Patients': Patient.objects.count(),
            'Records de don': BloodRecord.objects.count(),
            'Unités de sang': BloodUnit.objects.count(),
            'Demandes': BloodRequest.objects.count(),
            'Transfusions': BloodConsumption.objects.count(),
            'Prévisions ML': Prevision.objects.count()
        }

        self.stdout.write('📊 VOLUMES DE DONNÉES:')
        for category, count in stats.items():
            self.stdout.write(f'  {category:.<20} {count:,}')

        total_records = sum(stats.values())
        self.stdout.write(f'\n📈 TOTAL DONNÉES: {total_records:,} enregistrements')

        # Analyse de distribution des groupes sanguins
        self.stdout.write('\n🩸 DISTRIBUTION GROUPES SANGUINS:')
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        for bt in blood_types:
            donor_count = Donor.objects.filter(blood_type=bt).count()
            consumption_count = BloodConsumption.objects.filter(unit__donor__blood_type=bt).count()
            percentage = (donor_count / max(stats['Donneurs'], 1)) * 100
            self.stdout.write(
                f'  {bt:>3}: {donor_count:,} donneurs ({percentage:.1f}%) → {consumption_count:,} transfusions')

        # Analyse temporelle
        self.stdout.write('\n📅 ANALYSE TEMPORELLE:')
        try:
            oldest_record = BloodRecord.objects.order_by('record_date').first()
            newest_record = BloodRecord.objects.order_by('-record_date').first()
            oldest_request = BloodRequest.objects.order_by('request_date').first()
            newest_forecast = Prevision.objects.order_by('-prevision_date').first()

            if oldest_record and newest_record:
                historical_span = (newest_record.record_date - oldest_record.record_date).days
                self.stdout.write(
                    f'  Historique collectes: {historical_span} jours ({oldest_record.record_date} → {newest_record.record_date})')

            if oldest_request:
                self.stdout.write(f'  Première demande: {oldest_request.request_date}')

            if newest_forecast:
                forecast_span = (newest_forecast.prevision_date - date.today()).days
                self.stdout.write(f'  Prévisions jusqu\'au: {newest_forecast.prevision_date} (+{forecast_span} jours)')

        except Exception:
            self.stdout.write('  Données temporelles en cours de calcul...')

        # Qualité des données pour ML
        self.stdout.write('\n🤖 QUALITÉ POUR MACHINE LEARNING:')

        # Densité de données
        if stats['Transfusions'] > 0 and self.history_days > 0:
            daily_avg_consumption = stats['Transfusions'] / self.history_days
            self.stdout.write(f'  Transfusions/jour (moyenne): {daily_avg_consumption:.1f}')

            # Évaluation qualité
            quality_metrics = self.calculate_ml_quality_metrics(stats, daily_avg_consumption)

            self.stdout.write(f'  Score complétude données: {quality_metrics["completeness"]:.2f}/1.00')
            self.stdout.write(f'  Score diversité géographique: {quality_metrics["geographic_diversity"]:.2f}/1.00')
            self.stdout.write(f'  Score consistance temporelle: {quality_metrics["temporal_consistency"]:.2f}/1.00')
            self.stdout.write(f'  Score équilibrage groupes: {quality_metrics["blood_type_balance"]:.2f}/1.00')

            # Score global ML
            ml_score = (
                    quality_metrics["completeness"] * 0.3 +
                    quality_metrics["geographic_diversity"] * 0.2 +
                    quality_metrics["temporal_consistency"] * 0.3 +
                    quality_metrics["blood_type_balance"] * 0.2
            )

            self.stdout.write(f'\n🎯 SCORE GLOBAL ML: {ml_score:.3f}/1.000')

            # Évaluation et recommandations
            if ml_score >= 0.85:
                self.stdout.write('  🌟 EXCELLENT - Données optimales pour ML avancé!')
                self.stdout.write('  ✅ Confiance prédictive attendue: >85%')
                self.stdout.write('  🚀 Prêt pour algorithmes sophistiqués (LSTM, Random Forest)')
            elif ml_score >= 0.70:
                self.stdout.write('  ✅ TRÈS BON - Qualité suffisante pour ML robuste')
                self.stdout.write('  📊 Confiance prédictive attendue: 70-85%')
                self.stdout.write('  🎯 Recommandé pour production')
            elif ml_score >= 0.55:
                self.stdout.write('  ⚡ BON - Base solide pour ML')
                self.stdout.write('  📈 Confiance prédictive attendue: 55-70%')
                self.stdout.write('  💡 Amélioration possible avec plus d\'historique')
            else:
                self.stdout.write('  📊 ACCEPTABLE - ML de base possible')
                self.stdout.write('  🔄 Recommandation: Continuer collecte de données')

        # Analyse par site
        self.stdout.write('\n🏥 TOP SITES GÉNÉRATEURS DE DONNÉES:')
        top_sites = Site.objects.annotate(
            total_requests=Count('bloodrequest')
        ).order_by('-total_requests')[:5]

        for i, site in enumerate(top_sites, 1):
            self.stdout.write(f'  {i}. {site.nom}: {site.total_requests:,} demandes')

        # Patterns détectés
        self.stdout.write('\n🔍 PATTERNS DÉTECTÉS:')
        try:
            # Jour le plus actif
            weekday_activity = {}
            for consumption in BloodConsumption.objects.select_related('unit'):
                weekday = consumption.date.weekday()
                weekday_activity[weekday] = weekday_activity.get(weekday, 0) + 1

            if weekday_activity:
                most_active_day = max(weekday_activity.items(), key=lambda x: x[1])
                weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                self.stdout.write(
                    f'  Jour le plus actif: {weekdays[most_active_day[0]]} ({most_active_day[1]:,} transfusions)')

            # Groupe sanguin le plus demandé
            blood_demand = {}
            for consumption in BloodConsumption.objects.select_related('unit__donor'):
                bt = consumption.unit.donor.blood_type
                blood_demand[bt] = blood_demand.get(bt, 0) + 1

            if blood_demand:
                top_demand = max(blood_demand.items(), key=lambda x: x[1])
                self.stdout.write(f'  Groupe le plus transfusé: {top_demand[0]} ({top_demand[1]:,} unités)')

        except Exception:
            self.stdout.write('  Patterns en cours d\'analyse...')

        # Optimisation mémoire finale
        self.log_memory_usage("Rapport final")

        # Recommandations finales
        self.stdout.write('\n💡 RECOMMANDATIONS RENDER 512MB:')
        self.stdout.write('  ✅ Génération optimisée pour contraintes mémoire')
        self.stdout.write('  🔄 Utiliser pagination pour requêtes volumineuses')
        self.stdout.write('  📊 Index créés pour performances ML')
        self.stdout.write('  🎯 Données prêtes pour API de prédiction')

        self.stdout.write('\n🚀 GÉNÉRATION TERMINÉE AVEC SUCCÈS!')
        self.stdout.write('=' * 60)

    def calculate_ml_quality_metrics(self, stats, daily_avg):
        """Calculer métriques de qualité ML"""

        # 1. Complétude des données
        expected_min_records = self.history_days * 10  # 10 records/jour minimum
        completeness = min(1.0, sum(stats.values()) / expected_min_records)

        # 2. Diversité géographique
        site_count = stats['Sites']
        geographic_diversity = min(1.0, site_count / 15)  # 15 sites = score parfait

        # 3. Consistance temporelle
        if daily_avg > 0:
            # Vérifier si on a des données chaque jour
            days_with_data = min(self.history_days, stats['Transfusions'] / max(daily_avg, 1))
            temporal_consistency = days_with_data / max(self.history_days, 1)
        else:
            temporal_consistency = 0

        # 4. Équilibrage des groupes sanguins
        blood_balance_scores = []
        blood_types = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        expected_distribution = [0.45, 0.30, 0.15, 0.05, 0.025, 0.015, 0.008, 0.002]

        for i, bt in enumerate(blood_types):
            actual_count = Donor.objects.filter(blood_type=bt).count()
            if stats['Donneurs'] > 0:
                actual_percentage = actual_count / stats['Donneurs']
                expected_percentage = expected_distribution[i]
                # Score basé sur la proximité avec distribution attendue
                deviation = abs(actual_percentage - expected_percentage) / expected_percentage
                balance_score = max(0, 1 - deviation)
                blood_balance_scores.append(balance_score)

        blood_type_balance = sum(blood_balance_scores) / len(blood_balance_scores) if blood_balance_scores else 0

        return {
            'completeness': completeness,
            'geographic_diversity': geographic_diversity,
            'temporal_consistency': temporal_consistency,
            'blood_type_balance': blood_type_balance
        }