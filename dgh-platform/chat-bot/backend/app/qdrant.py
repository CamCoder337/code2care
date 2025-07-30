import csv
from datetime import datetime
from django.core.management.base import BaseCommand
from .models import ClinicalSummary, SummaryEmbedding
from .utils import qdrant, embed_model
from qdrant_client.models import VectorParams, PointStruct

class Command(BaseCommand):
    help = "Import clinical_summaries.csv and index in Qdrant"

    def handle(self, *args, **options):
        ClinicalSummary.objects.all().delete()
        SummaryEmbedding.objects.all().delete()

        # (Re)création de la collection Qdrant
        qdrant.delete_collection("clinical_summaries", ignore_missing=True)
        qdrant.create_collection(
            collection_name="clinical_summaries",
            vectors_config=VectorParams(size=384, distance="Cosine")
        )

        points = []
        with open("clinical_summaries.csv", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter="\t")
            for idx, row in enumerate(reader):
                cs = ClinicalSummary.objects.create(
                    title=row["summary_id"],
                    content=row["summary_text"],
                )
                vec = embed_model.encode([cs.content])[0].tolist()
                SummaryEmbedding.objects.create(summary=cs, vector=vec)

                points.append(PointStruct(id=idx, vector=vec, payload={
                    "summary_id": cs.title, "content": cs.content
                }))

        qdrant.upsert(collection_name="clinical_summaries", points=points)
        self.stdout.write(self.style.SUCCESS("✅ Import terminé"))
