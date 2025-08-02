import os
import csv
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from app.models import ClinicalSummary, SummaryEmbedding
from app.utils import embed_model
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, PointStruct, HnswConfigDiff, Distance
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import clinical_summaries.csv into DB and index in Qdrant (Cloud PRIORITAIRE avec Local fallback)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-path',
            type=str,
            help='Custom path to the CSV file',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=200,
            help='Batch size for Qdrant uploads (default: 200)',
        )
        parser.add_argument(
            '--skip-delete',
            action='store_true',
            help='Skip deletion of existing data',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually importing data',
        )
        parser.add_argument(
            '--force-local',
            action='store_true',
            help='Force using local Qdrant instance (ignore cloud)',
        )
        parser.add_argument(
            '--cloud-only',
            action='store_true',
            help='Use ONLY cloud Qdrant (fail if cloud unavailable)',
        )

    def handle(self, *args, **options):
        # Determine CSV path
        if options['csv_path']:
            csv_path = options['csv_path']
        else:
            BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            csv_path = os.path.join(BASE_DIR, "clinical_summaries.csv")

        self.stdout.write(f"📁 Chemin CSV : {csv_path}")

        # Validate CSV file exists
        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f"❌ Fichier introuvable : {csv_path}"))
            return

        # Validate CSV structure
        if not self._validate_csv_structure(csv_path):
            return

        if options['dry_run']:
            self.stdout.write(self.style.WARNING("🧪 Mode dry-run activé - aucune donnée ne sera importée"))
            self._perform_dry_run(csv_path)
            return

        # Clear existing data if requested
        if not options['skip_delete']:
            self._clear_existing_data()

        # Initialize Qdrant client avec priorité cloud
        qdrant, qdrant_mode = self._initialize_qdrant_client(
            force_local=options['force_local'],
            cloud_only=options['cloud_only']
        )
        if not qdrant:
            return

        # Setup Qdrant collection
        if not self._setup_qdrant_collection(qdrant, qdrant_mode, options['skip_delete']):
            return

        # Import data
        self._import_data(csv_path, qdrant, qdrant_mode, options['batch_size'])

    def _validate_csv_structure(self, csv_path):
        """Validate that the CSV has the required columns"""
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                fieldnames = reader.fieldnames

                required_fields = ['summary_id', 'summary_text']
                missing_fields = [field for field in required_fields if field not in fieldnames]

                if missing_fields:
                    self.stderr.write(
                        self.style.ERROR(
                            f"❌ Colonnes manquantes dans le CSV : {missing_fields}\n"
                            f"Colonnes disponibles : {fieldnames}"
                        )
                    )
                    return False

                self.stdout.write(f"✅ Structure CSV validée. Colonnes : {fieldnames}")
                return True

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Erreur lors de la validation du CSV : {e}"))
            return False

    def _perform_dry_run(self, csv_path):
        """Perform a dry run to show what would be imported"""
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                valid_count = 0

                for idx, row in enumerate(reader):
                    count += 1
                    summary_id = row.get("summary_id", "").strip()
                    content = row.get("summary_text", "").strip()

                    if summary_id and content:
                        valid_count += 1
                        if idx < 5:  # Show first 5 entries
                            self.stdout.write(f"  📄 {summary_id}: {content[:100]}...")
                    else:
                        self.stdout.write(f"  ⚠️ Ligne {idx + 1}: Données manquantes")

                self.stdout.write(f"📊 Résumé dry-run:")
                self.stdout.write(f"  - Total des lignes : {count}")
                self.stdout.write(f"  - Lignes valides : {valid_count}")
                self.stdout.write(f"  - Lignes avec des problèmes : {count - valid_count}")

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Erreur lors du dry-run : {e}"))

    def _clear_existing_data(self):
        """Clear existing data from Django models"""
        try:
            with transaction.atomic():
                embedding_count = SummaryEmbedding.objects.count()
                summary_count = ClinicalSummary.objects.count()

                SummaryEmbedding.objects.all().delete()
                ClinicalSummary.objects.all().delete()

                self.stdout.write(
                    f"🗑️ Données supprimées : {summary_count} résumés, {embedding_count} embeddings"
                )
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Erreur lors de la suppression : {e}"))
            raise

    def _initialize_qdrant_client(self, force_local=False, cloud_only=False):
        """Initialize Qdrant client avec logique cloud/local"""

        # Configuration Cloud
        QDRANT_CLOUD_URL = "https://2fb00d86-37a3-405d-8b4c-b08155fb91f5.europe-west3-0.gcp.cloud.qdrant.io:6333"
        QDRANT_CLOUD_API_KEY = os.getenv('QDRANT_API_KEY')

        # Mode cloud uniquement
        if cloud_only:
            if not QDRANT_CLOUD_API_KEY:
                self.stderr.write(
                    self.style.ERROR("❌ Mode --cloud-only mais QDRANT_API_KEY non configurée")
                )
                return None, "none"

            try:
                qdrant = QdrantClient(
                    url=QDRANT_CLOUD_URL,
                    api_key=QDRANT_CLOUD_API_KEY,
                    timeout=30
                )
                collections = qdrant.get_collections()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"🌐 ✅ Connexion Qdrant Cloud EXCLUSIVE. Collections: {len(collections.collections)}"
                    )
                )
                return qdrant, "cloud"
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"❌ Échec connexion cloud (mode --cloud-only): {e}")
                )
                return None, "none"

        # Mode local forcé
        if force_local:
            self.stdout.write(self.style.WARNING("⚠️ Mode --force-local activé, ignorant le cloud"))
            try:
                qdrant = QdrantClient(
                    host="localhost",
                    port=6333,
                    grpc_port=6334,
                    prefer_grpc=True,
                    timeout=60
                )
                collections = qdrant.get_collections()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"🏠 ✅ Connexion Qdrant Local FORCÉE. Collections: {len(collections.collections)}"
                    )
                )
                return qdrant, "local"
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"❌ Impossible de se connecter à Qdrant local (mode forcé): {e}"
                    )
                )
                return None, "none"

        # Mode normal: Cloud d'abord, puis local en fallback
        if QDRANT_CLOUD_API_KEY:
            self.stdout.write("🌐 Tentative de connexion Qdrant Cloud...")
            try:
                qdrant = QdrantClient(
                    url=QDRANT_CLOUD_URL,
                    api_key=QDRANT_CLOUD_API_KEY,
                    timeout=20
                )
                collections = qdrant.get_collections()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"🌐 ✅ Connexion Qdrant Cloud réussie! Collections: {len(collections.collections)}"
                    )
                )
                return qdrant, "cloud"

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f"⚠️ Échec connexion Qdrant Cloud: {e}\n"
                        f"🏠 Basculement vers l'instance locale..."
                    )
                )
        else:
            self.stdout.write("🔑 QDRANT_API_KEY non configurée, utilisation du local directement")

        # Fallback vers l'instance locale
        try:
            qdrant = QdrantClient(
                host="localhost",
                port=6333,
                grpc_port=6334,
                prefer_grpc=True,
                timeout=60
            )
            collections = qdrant.get_collections()
            self.stdout.write(
                self.style.SUCCESS(
                    f"🏠 ✅ Connexion Qdrant Local (fallback). Collections: {len(collections.collections)}"
                )
            )
            return qdrant, "local"

        except Exception as e:
            self.stderr.write(
                self.style.ERROR(
                    f"❌ Impossible de se connecter à Qdrant (ni cloud ni local): {e}\n"
                    f"   💡 Pour le local: docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant\n"
                    f"   💡 Pour le cloud: configurez QDRANT_API_KEY dans vos variables d'environnement"
                )
            )
            return None, "none"

    def _setup_qdrant_collection(self, qdrant, mode, skip_delete=False):
        """Setup Qdrant collection"""
        collection_name = "clinical_summaries"

        try:
            # Check if collection exists
            collection_exists = qdrant.collection_exists(collection_name)

            if collection_exists and not skip_delete:
                self.stdout.write(f"🗑️ Suppression de la collection existante '{collection_name}' sur {mode}")
                qdrant.delete_collection(collection_name)
                collection_exists = False

            if not collection_exists:
                self.stdout.write(f"🔧 Création de la collection '{collection_name}' sur {mode}")
                qdrant.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=384,  # Size for sentence-transformers/all-MiniLM-L6-v2
                        distance=Distance.COSINE
                    ),
                    hnsw_config=HnswConfigDiff(m=16, ef_construct=100)  # Better HNSW parameters
                )
            else:
                self.stdout.write(f"✅ Utilisation de la collection existante '{collection_name}' sur {mode}")

            return True

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Erreur lors de la configuration Qdrant ({mode}): {e}"))
            return False

    def _import_data(self, csv_path, qdrant, mode, batch_size):
        """Import data from CSV to Django models and Qdrant"""
        points = []
        imported_count = 0
        skipped_count = 0

        self.stdout.write(f"📤 Import vers Qdrant {mode.upper()}...")

        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)

                with transaction.atomic():
                    for idx, row in enumerate(reader):
                        summary_id = row.get("summary_id", "").strip()
                        content = row.get("summary_text", "").strip()

                        if not summary_id or not content:
                            self.stderr.write(
                                self.style.WARNING(
                                    f"⚠️ Ligne {idx + 1} ignorée : summary_id='{summary_id}', "
                                    f"content_length={len(content)}"
                                )
                            )
                            skipped_count += 1
                            continue

                        # Create Django model
                        try:
                            cs = ClinicalSummary.objects.create(
                                title=summary_id,
                                content=content
                            )

                            # Generate embedding
                            vec = embed_model.encode([cs.content])[0].tolist()

                            # Create embedding record
                            SummaryEmbedding.objects.create(
                                summary=cs,
                                vector=vec
                            )

                            # Prepare point for Qdrant
                            points.append(PointStruct(
                                id=cs.id,  # Use Django model ID instead of CSV index
                                vector=vec,
                                payload={
                                    "summary_id": cs.title,
                                    "content": cs.content,
                                    "django_id": cs.id
                                }
                            ))

                            imported_count += 1

                            # Progress indicator
                            if imported_count % 100 == 0:
                                self.stdout.write(f"📊 {imported_count} entrées traitées...")

                        except Exception as e:
                            self.stderr.write(
                                self.style.ERROR(f"❌ Erreur ligne {idx + 1}: {e}")
                            )
                            skipped_count += 1
                            continue

            # Upload to Qdrant in batches
            self._upload_to_qdrant(qdrant, mode, points, batch_size)

            # Final summary
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Import terminé sur Qdrant {mode.upper()} !\n"
                    f"  - Entrées importées : {imported_count}\n"
                    f"  - Entrées ignorées : {skipped_count}\n"
                    f"  - Points Qdrant : {len(points)}"
                )
            )

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Erreur lors de l'import : {e}"))
            raise

    def _upload_to_qdrant(self, qdrant, mode, points, batch_size):
        """Upload points to Qdrant in batches"""
        if not points:
            self.stdout.write("⚠️ Aucun point à uploader vers Qdrant")
            return

        total_batches = (len(points) + batch_size - 1) // batch_size
        self.stdout.write(f"🚀 Upload vers Qdrant {mode.upper()}: {len(points)} points en {total_batches} batchs")

        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            batch_num = i // batch_size + 1

            try:
                qdrant.upsert(
                    collection_name="clinical_summaries",
                    points=batch
                )
                self.stdout.write(
                    f"✅ Batch {batch_num}/{total_batches} uploadé vers {mode.upper()} ({len(batch)} points)")

            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"❌ Erreur batch {batch_num} sur {mode}: {e}")
                )
                raise