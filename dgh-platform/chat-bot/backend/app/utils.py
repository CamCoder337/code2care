import os
import logging
from openai import OpenAI
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from django.conf import settings

logger = logging.getLogger(__name__)

# Configuration Qdrant
QDRANT_CLOUD_URL = "https://2fb00d86-37a3-405d-8b4c-b08155fb91f5.europe-west3-0.gcp.cloud.qdrant.io:6333"
QDRANT_CLOUD_API_KEY = os.getenv('QDRANT_API_KEY')  # À définir dans vos variables d'environnement

# Configuration locale par défaut
QDRANT_LOCAL_HOST = "localhost"
QDRANT_LOCAL_PORT = 6333
QDRANT_LOCAL_GRPC_PORT = 6334


def create_qdrant_client():
    """
    Crée un client Qdrant en tentant d'abord le cloud, puis le local
    """
    # Tentative de connexion au cloud
    if QDRANT_CLOUD_API_KEY:
        try:
            cloud_client = QdrantClient(
                url=QDRANT_CLOUD_URL,
                api_key=QDRANT_CLOUD_API_KEY,
                timeout=10  # Timeout court pour éviter d'attendre trop longtemps
            )

            # Test de la connexion
            collections = cloud_client.get_collections()
            logger.info(f"✅ Connexion Qdrant Cloud réussie - {len(collections.collections)} collections")
            return cloud_client, "cloud"

        except Exception as e:
            logger.warning(f"⚠️ Échec connexion Qdrant Cloud: {e}")
    else:
        logger.info("🔧 Clé API Qdrant Cloud non configurée, utilisation du local")

    # Fallback vers l'instance locale
    try:
        local_client = QdrantClient(
            host=QDRANT_LOCAL_HOST,
            port=QDRANT_LOCAL_PORT,
            grpc_port=QDRANT_LOCAL_GRPC_PORT,
            prefer_grpc=True,
            timeout=60
        )

        # Test de la connexion
        collections = local_client.get_collections()
        logger.info(f"✅ Connexion Qdrant Local réussie - {len(collections.collections)} collections")
        return local_client, "local"

    except Exception as e:
        logger.error(f"❌ Échec connexion Qdrant Local: {e}")
        raise ConnectionError(
            "Impossible de se connecter à Qdrant (ni cloud ni local). "
            "Vérifiez votre configuration et que Docker Qdrant est démarré."
        )


# Initialisation du client Qdrant
try:
    qdrant, qdrant_mode = create_qdrant_client()
    logger.info(f"🔗 Mode Qdrant actif: {qdrant_mode}")
except Exception as e:
    logger.error(f"❌ Erreur d'initialisation Qdrant: {e}")
    qdrant = None
    qdrant_mode = "none"

# Modèle d'embedding
try:
    embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    logger.info("✅ Modèle d'embedding chargé")
except Exception as e:
    logger.error(f"❌ Erreur chargement modèle embedding: {e}")
    embed_model = None

# Client OpenAI pointant vers le serveur vLLM local
try:
    openai_client = OpenAI(
        api_key="doesnotmatter",
        base_url="http://localhost:8000/v1"
    )
    logger.info("✅ Client OpenAI/vLLM configuré")
except Exception as e:
    logger.error(f"❌ Erreur configuration OpenAI client: {e}")
    openai_client = None


def get_qdrant_info():
    """Retourne les informations sur la connexion Qdrant active"""
    if qdrant is None:
        return {"status": "disconnected", "mode": "none"}

    try:
        collections = qdrant.get_collections()
        return {
            "status": "connected",
            "mode": qdrant_mode,
            "url": QDRANT_CLOUD_URL if qdrant_mode == "cloud" else f"{QDRANT_LOCAL_HOST}:{QDRANT_LOCAL_PORT}",
            "collections_count": len(collections.collections)
        }
    except Exception as e:
        return {"status": "error", "mode": qdrant_mode, "error": str(e)}