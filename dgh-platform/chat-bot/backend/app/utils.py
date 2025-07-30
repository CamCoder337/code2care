from openai import OpenAI
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

qdrant = QdrantClient(host="localhost", port=6333)
embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Client OpenAI pointant vers le serveur vLLM local
openai_client = OpenAI(api_key="doesnotmatter", base_url="http://localhost:8000/v1")
