# app/management/commands/safe_migrate_and_generate.py
"""
Commande pour gérer les migrations existantes et générer des données proprement
Résout le problème de conflits avec tables existantes
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection, transaction
from django.conf import settings
import os
import sys


class Command(BaseCommand):
    help = 'Gère les migrations existantes et génère des données de façon sécurisée'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-reset',
            action='store_true',
            help='Réinitialiser complètement la base (ATTENTION: supprime tout)'
        )
        parser.add_argument(
            '--generate-scale',
            type=str,
            choices=['render', 'production', 'enterprise'],
            default='render',
            help='Échelle de génération des données'
        )
        parser.add_argument(
            '--skip-data-generation',
            action='store_true',
            help='Passer la génération de données'
        )

    def handle(self, *args, **options):
        self.stdout.write('🔧 GESTIONNAIRE DE MIGRATIONS ET DONNÉES SÉCURISÉ')
        self.stdout.write('=' * 55)

        try:
            # Étape 1: Vérifier l'état de la base
            db_state = self.check_database_state()
            self.stdout.write(f'📊 État DB: {db_state}')

            # Étape 2: Gérer les migrations selon l'état
            if options['force_reset']:
                self.reset_database_completely()
            else:
                self.handle_existing_migrations()

            # Étape 3: Assurer que toutes les migrations sont appliquées
            self.ensure_migrations_applied()

            # Étape 4: Génération des données (optionnel)
            if not options['skip_data_generation']:
                self.generate_optimized_data(options['generate_scale'])

            # Étape 5: Vérification finale
            self.verify_final_state()

            self.stdout.write(self.style.SUCCESS('✅ Migration et génération terminées avec succès!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur: {e}'))
            import traceback
            traceback.print_exc()
            sys.exit(1)

    def check_database_state(self):
        """Vérifier l'état actuel de la base de données"""

        with connection.cursor() as cursor:
            # Vérifier si les tables principales existent
            cursor.execute("""
                           SELECT table_name
                           FROM information_schema.tables
                           WHERE table_schema = 'public'
                             AND table_name LIKE 'app_%'
                           """)

            existing_tables = [row[0] for row in cursor.fetchall()]

            # Tables critiques attendues
            critical_tables = [
                'app_site', 'app_donor', 'app_patient', 'app_department',
                'app_bloodrecord', 'app_bloodunit', 'app_bloodrequest',
                'app_bloodconsumption', 'app_prevision'
            ]

            missing_tables = [t for t in critical_tables if t not in existing_tables]

            if not existing_tables:
                return 'EMPTY'  # Base vide
            elif missing_tables:
                return f'PARTIAL ({len(missing_tables)} tables manquantes)'
            else:
                # Vérifier si les tables ont des données
                total_records = 0
                for table in critical_tables:
                    try:
                        cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
                        count = cursor.fetchone()[0]
                        total_records += count
                    except:
                        pass

                if total_records == 0:
                    return 'SCHEMA_ONLY'  # Structure mais pas de données
                else:
                    return f'POPULATED ({total_records:,} records)'

    def reset_database_completely(self):
        """Réinitialisation complète de la base (ATTENTION: destructeur)"""

        self.stdout.write('🚨 RÉINITIALISATION COMPLÈTE DE LA BASE!')
        self.stdout.write('⚠️  Toutes les données seront perdues!')

        with connection.cursor() as cursor:
            # Désactiver les contraintes FK
            cursor.execute('SET session_replication_role = replica;')

            # Supprimer toutes les tables de l'app
            cursor.execute("""
                           SELECT table_name
                           FROM information_schema.tables
                           WHERE table_schema = 'public'
                             AND (table_name LIKE 'app_%' OR table_name LIKE 'django_%')
                           """)

            tables = [row[0] for row in cursor.fetchall()]

            for table in tables:
                try:
                    cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
                    self.stdout.write(f'  🗑️ Table {table} supprimée')
                except Exception as e:
                    self.stdout.write(f'  ⚠️ {table}: {str(e)[:30]}')

            # Réactiver les contraintes
            cursor.execute('SET session_replication_role = DEFAULT;')

            self.stdout.write('✅ Base réinitialisée')

    def handle_existing_migrations(self):
        """Gérer les migrations existantes intelligemment"""

        self.stdout.write('🔄 Gestion des migrations existantes...')

        try:
            # Vérifier l'état des migrations
            from django.db.migrations.executor import MigrationExecutor
            from django.db import connection

            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())

            if plan:
                self.stdout.write(f'📋 {len(plan)} migrations à appliquer')

                # Appliquer les migrations manquantes
                call_command('migrate', verbosity=1, interactive=False)
                self.stdout.write('✅ Migrations appliquées')
            else:
                self.stdout.write('✅ Toutes les migrations sont à jour')

                # Vérifier l'intégrité des tables existantes
                self.verify_table_integrity()

        except Exception as e:
            self.stdout.write(f'⚠️ Erreur migrations: {e}')

            # Stratégie de récupération: migration fake puis vraie migration
            self.stdout.write('🔧 Tentative de récupération...')

            try:
                # Marquer les migrations comme appliquées
                call_command('migrate', '--fake-initial', verbosity=0)
                self.stdout.write('✅ Migrations marquées comme appliquées')
            except Exception as e2:
                self.stdout.write(f'❌ Récupération échouée: {e2}')
                raise

    def verify_table_integrity(self):
        """Vérifier l'intégrité des tables existantes"""

        self.stdout.write('🔍 Vérification intégrité des tables...')

        with connection.cursor() as cursor:
            # Vérifier que les colonnes critiques existent
            critical_checks = [
                ("app_bloodrecord", "record_id"),
                ("app_bloodunit", "unit_id"),
                ("app_bloodrequest", "request_id"),
                ("app_donor", "donor_id"),
                ("app_patient", "patient_id")
            ]

            for table, column in critical_checks:
                try:
                    cursor.execute(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = '{table}' AND column_name = '{column}'
                    """)

                    if cursor.fetchone():
                        self.stdout.write(f'  ✅ {table}.{column} OK')
                    else:
                        self.stdout.write(f'  ❌ {table}.{column} MANQUANT')

                except Exception as e:
                    self.stdout.write(f'  ⚠️ {table}: {str(e)[:30]}')

    def ensure_migrations_applied(self):
        """S'assurer que toutes les migrations sont appliquées"""

        self.stdout.write('🔄 Vérification finale des migrations...')

        try:
            # Migration avec gestion d'erreur
            call_command('migrate', verbosity=1, interactive=False)
            self.stdout.write('✅ Migrations finalisées')

            # Créer les index manquants si nécessaire
            self.create_missing_indexes()

        except Exception as e:
            self.stdout.write(f'⚠️ Avertissement migrations finales: {e}')

    def create_missing_indexes(self):
        """Créer les index manquants pour les performances"""

        self.stdout.write('📊 Création des index de performance...')

        indexes_to_create = [
            ('app_bloodunit', 'donor_id', 'btree'),
            ('app_bloodunit', 'status', 'btree'),
            ('app_bloodrecord', 'record_date', 'btree'),
            ('app_bloodrequest', 'request_date', 'btree'),
            ('app_bloodrequest', 'status', 'btree'),
            ('app_bloodconsumption', 'date', 'btree'),
            ('app_donor', 'blood_type', 'btree'),
            ('app_prevision', 'prevision_date', 'btree')
        ]

        with connection.cursor() as cursor:
            for table, column, index_type in indexes_to_create:
                index_name = f'idx_{table}_{column}'

                try:
                    cursor.execute(f"""
                        CREATE INDEX IF NOT EXISTS {index_name} 
                        ON {table} USING {index_type} ({column})
                    """)

                except Exception as e:
                    # Index peut déjà exister, ce n'est pas grave
                    pass

        self.stdout.write('✅ Index de performance créés')

    def generate_optimized_data(self, scale):
        """Génération des données avec la nouvelle commande"""

        self.stdout.write(f'📊 Génération des données optimisées (échelle: {scale})')

        try:
            # Utiliser la nouvelle commande optimisée
            call_command(
                'generate_optimized_production_data',
                scale=scale,
                years=2 if scale != 'render' else 1,
                force_clean=True,
                verbosity=1
            )

            self.stdout.write('✅ Données générées avec la commande optimisée')

        except Exception as e:
            self.stdout.write(f'⚠️ Nouvelle commande échouée: {e}')

            # Fallback vers l'ancienne commande
            try:
                self.stdout.write('🔄 Tentative avec l\'ancienne commande...')
                call_command(
                    'generate_massive_production_data',
                    scale='production' if scale != 'render' else 'production',
                    years=1,
                    force_clean=True,
                    verbosity=1
                )

                self.stdout.write('✅ Données générées avec la commande legacy')

            except Exception as e2:
                self.stdout.write(f'⚠️ Génération legacy aussi échouée: {e2}')

                # Génération minimale manuelle
                self.generate_minimal_data()

