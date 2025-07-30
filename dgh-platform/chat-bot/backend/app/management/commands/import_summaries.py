import os
import csv
from django.core.management.base import BaseCommand
from app.models import ClinicalSummary, SummaryEmbedding
from app.utils import embed_model
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, PointStruct, HnswConfigDiff

class Command(BaseCommand):
    help = "Import clinical_summaries.csv into DB and index in Qdrant"

    def handle(self, *args, **options):
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        csv_path = os.path.join(BASE_DIR, "clinical_summaries.csv")
        self.stdout.write(f"📁 Chemin CSV : {csv_path}")
        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f"❌ Fichier introuvable : {csv_path}"))
            return

        # Vider la base Django
        ClinicalSummary.objects.all().delete()
        SummaryEmbedding.objects.all().delete()

        # Configurer Qdrant avec gRPC
        qdrant = QdrantClient(
            host="localhost",
            port=6333,
            grpc_port=6334,
            prefer_grpc=True,
            timeout=60
        )

        # Supprimer + créer la collection
        if qdrant.collection_exists("clinical_summaries"):
            qdrant.delete_collection("clinical_summaries")
        qdrant.create_collection(
            collection_name="clinical_summaries",
            vectors_config=VectorParams(size=384, distance="Cosine"),
            hnsw_config=HnswConfigDiff(m=0)
        )

        points = []
        with open(csv_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)  # adaptez delimiter si besoin
            for idx, row in enumerate(reader):
                summary_id = row.get("summary_id")
                if not summary_id:
                    self.stderr.write(self.style.WARNING(f"Ligne {idx} ignorée : pas de summary_id"))
                    continue
                content = row.get("summary_text", "").strip()
                cs = ClinicalSummary.objects.create(title=summary_id.strip(), content=content)
                vec = embed_model.encode([cs.content])[0].tolist()
                SummaryEmbedding.objects.create(summary=cs, vector=vec)
                points.append(PointStruct(
                    id=idx,
                    vector=vec,
                    payload={"summary_id": cs.title, "content": cs.content}
                ))

        # Upload en batchs
        batch_size = 200
        for i in range(0, len(points), batch_size):
            qdrant.upsert(
                collection_name="clinical_summaries",
                points=points[i:i + batch_size]
            )
            self.stdout.write(f"⚙️ Batch {i // batch_size + 1} uploaded")

        self.stdout.write(self.style.SUCCESS("✅ Import terminé"))
