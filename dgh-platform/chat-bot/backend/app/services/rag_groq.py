# app/services/rag_groq.py - Version avec lazy loading et gestion d'erreurs

import os
from typing import Tuple, Optional, List
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import logging

# LANGCHAIN IMPORTS (version légère)
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, AIMessage, Document
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

# Notre classe d'embeddings légère (compatible LangChain)
from .embeddings_langchain import LightweightEmbeddings

logger = logging.getLogger(__name__)

# Configuration Qdrant
QDRANT_CLOUD_URL = "https://2fb00d86-37a3-405d-8b4c-b08155fb91f5.europe-west3-0.gcp.cloud.qdrant.io:6333"
QDRANT_CLOUD_API_KEY = os.getenv('QDRANT_API_KEY')

# Variables globales pour le cache (lazy loading)
_client = None
_client_mode = None
_embedder = None
_retrieval_chain = None


def get_embedder():
    """Get embedder with lazy initialization"""
    global _embedder
    if _embedder is None:
        _embedder = LightweightEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _embedder


def get_qdrant_client() -> Tuple[Optional[QdrantClient], str]:
    """Obtient le client Qdrant avec fallback cloud -> local et gestion d'erreurs robuste"""
    global _client, _client_mode

    # Retourner le client en cache s'il existe
    if _client is not None:
        return _client, _client_mode

    # Tentative cloud d'abord (PRIORITAIRE)
    if QDRANT_CLOUD_API_KEY:
        try:
            logger.info("🌐 Tentative de connexion Qdrant Cloud...")
            cloud_client = QdrantClient(
                url=QDRANT_CLOUD_URL,
                api_key=QDRANT_CLOUD_API_KEY,
                timeout=10  # Timeout réduit pour éviter les blocages
            )
            # Test de connexion avec une vraie requête
            collections = cloud_client.get_collections()
            logger.info(f"🌐 ✅ Qdrant Cloud connecté - {len(collections.collections)} collections")
            _client = cloud_client
            _client_mode = "cloud"
            return _client, _client_mode
        except Exception as e:
            logger.warning(f"⚠️ Qdrant Cloud indisponible: {e}")
    else:
        logger.warning("🔑 QDRANT_API_KEY non configurée - impossible d'utiliser le cloud")

    # Fallback vers local seulement si le cloud échoue
    try:
        logger.info("🏠 Tentative de connexion Qdrant Local...")
        local_client = QdrantClient(
            host="localhost",
            port=6333,
            grpc_port=6334,
            prefer_grpc=True,
            timeout=5  # Timeout encore plus court pour local
        )
        collections = local_client.get_collections()
        logger.info(f"🏠 ✅ Qdrant Local connecté - {len(collections.collections)} collections")
        _client = local_client
        _client_mode = "local"
        return _client, _client_mode
    except Exception as e:
        logger.error(f"❌ Qdrant Local indisponible: {e}")

    # Si tout échoue, mode offline
    logger.error("❌ Aucun Qdrant disponible (ni cloud ni local) - Mode offline")
    _client = None
    _client_mode = "offline"
    return _client, _client_mode


def ensure_collection_exists():
    """Ensure the Qdrant collection exists, create it if it doesn't"""
    client, client_mode = get_qdrant_client()

    if not client or client_mode == "offline":
        logger.warning("⚠️ Pas de client Qdrant disponible pour créer la collection")
        return False

    collection_name = "clinical_summaries"

    try:
        # Try to get collection info
        collection_info = client.get_collection(collection_name)
        logger.info(f"✅ Collection '{collection_name}' existe sur {client_mode}")
        return True
    except Exception as e:
        if "doesn't exist" in str(e) or "Not found" in str(e) or "404" in str(e):
            logger.warning(f"⚠️ Collection '{collection_name}' inexistante, création...")
            try:
                # Create the collection with appropriate vector size
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=384,  # Dimension for all-MiniLM-L6-v2
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"✅ Collection '{collection_name}' créée sur {client_mode}")
                return True
            except Exception as create_error:
                logger.error(f"❌ Échec création collection: {create_error}")
                return False
        else:
            logger.error(f"❌ Erreur vérification collection: {e}")
            return False


def get_qdrant_store():
    """Get QdrantVectorStore instance, creating collection if needed"""
    client, client_mode = get_qdrant_client()

    if not client or client_mode == "offline":
        raise Exception("Client Qdrant non disponible - mode offline")

    if ensure_collection_exists():
        embedder = get_embedder()
        return QdrantVectorStore(
            client=client,
            collection_name="clinical_summaries",
            embedding=embedder,
            retrieval_mode=RetrievalMode.DENSE,
        )
    else:
        raise Exception("Impossible d'initialiser la collection Qdrant")


def get_retrieval_chain():
    """Get the retrieval chain with lazy initialization and caching"""
    global _retrieval_chain

    # Retourner la chaîne en cache si elle existe
    if _retrieval_chain is not None:
        return _retrieval_chain

    try:
        client, client_mode = get_qdrant_client()

        if not client or client_mode == "offline":
            raise Exception("Qdrant non disponible - impossible de créer la chaîne de récupération")

        qdrant_store = get_qdrant_store()

        retriever = qdrant_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 20, "lambda_mult": 0.5},
        )

        llm = ChatGroq(
            model_name="llama-3.1-8b-instant",
            temperature=0.3,
            streaming=False,
        )

        # Template de prompt avec historique
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", f"""Tu es un assistant médical expert. Utilise le contexte fourni et l'historique de conversation pour répondre de manière précise et contextuelle.

Contexte médical:
{{context}}

Instructions:
- Réponds en français ou anglais selon la question
- Sois précis et professionnel
- Utilise l'historique pour maintenir la cohérence
- Si tu ne sais pas, dis-le clairement
- Source des données: Qdrant {client_mode}"""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])

        # Chaîne de documents avec les bonnes variables
        document_chain = create_stuff_documents_chain(llm, prompt_template)
        _retrieval_chain = create_retrieval_chain(retriever, document_chain)

        logger.info(f"✅ Chaîne de récupération initialisée (mode: {client_mode})")
        return _retrieval_chain
    except Exception as e:
        logger.error(f"❌ Échec initialisation chaîne: {e}")
        raise


def ask_question_with_history(question: str, chat_history: list):
    """Ask a question with chat history context - Version avec fallback robuste"""
    try:
        client, client_mode = get_qdrant_client()

        # Si Qdrant n'est pas disponible, retourner une réponse de fallback
        if not client or client_mode == "offline":
            logger.warning("⚠️ Qdrant non disponible - utilisation du fallback LLM")
            return fallback_llm_response(question, chat_history)

        # Get the retrieval chain (lazy initialization)
        retrieval_chain = get_retrieval_chain()

        # Convertir l'historique en messages LangChain
        history_messages = []
        for role, content in chat_history:
            if role == "human":
                history_messages.append(HumanMessage(content=content))
            elif role == "ai":
                history_messages.append(AIMessage(content=content))

        logger.info(f"🤖 Question: {question[:50]}... (historique: {len(history_messages)} messages)")

        # Exécuter la chaîne
        result = retrieval_chain.invoke({
            "input": question,
            "chat_history": history_messages
        })

        # Récupérer les documents sources si disponibles
        context_docs = result.get("context", [])

        logger.info(f"✅ Réponse générée avec RAG (sources: {len(context_docs)})")
        return result["answer"], context_docs

    except Exception as e:
        logger.error(f"❌ Erreur dans ask_question_with_history: {e}")
        # Fallback en cas d'erreur
        return fallback_llm_response(question, chat_history, error=str(e))


def fallback_llm_response(question: str, chat_history: list, error: str = None):
    """Réponse de fallback utilisant seulement le LLM sans RAG"""
    try:
        llm = ChatGroq(
            model_name="llama-3.1-8b-instant",
            temperature=0.3,
            streaming=False,
        )

        # Construire le contexte depuis l'historique
        context = ""
        if chat_history:
            context = "\n".join([f"{role}: {content}" for role, content in chat_history[-5:]])  # Derniers 5 messages

        # Prompt simplifié sans RAG
        system_msg = """Tu es un assistant médical. Réponds de manière professionnelle et précise.

IMPORTANT: Indique clairement que tu n'as pas accès à la base de connaissances spécialisée actuellement."""

        if error:
            system_msg += f"\n\nNote technique: {error}"

        messages = [
            {"role": "system", "content": system_msg},
        ]

        if context:
            messages.append({"role": "system", "content": f"Contexte de conversation récent:\n{context}"})

        messages.append({"role": "user", "content": question})

        response = llm.invoke(messages)

        fallback_note = "\n\n⚠️ Réponse générée sans accès à la base de connaissances spécialisée."

        logger.info("✅ Réponse de fallback générée")
        return response.content + fallback_note, []

    except Exception as fallback_error:
        logger.error(f"❌ Erreur même dans le fallback: {fallback_error}")
        error_msg = f"Désolé, une erreur technique est survenue. Veuillez réessayer plus tard."
        if error:
            error_msg += f"\n\nDétails: {error}"
        return error_msg, []


def get_qdrant_status():
    """Retourne le statut de la connexion Qdrant avec lazy loading"""
    try:
        client, client_mode = get_qdrant_client()

        if not client or client_mode == "offline":
            return {
                "status": "offline",
                "mode": "offline",
                "error": "Aucun client Qdrant disponible",
                "embedding_model": "lightweight-tfidf-384d"
            }

        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]

        return {
            "status": "connected",
            "mode": client_mode,
            "collections_count": len(collections.collections),
            "collections": collection_names,
            "url": QDRANT_CLOUD_URL if client_mode == "cloud" else "localhost:6333",
            "has_clinical_summaries": "clinical_summaries" in collection_names,
            "embedding_model": "lightweight-tfidf-384d"
        }
    except Exception as e:
        return {
            "status": "error",
            "mode": _client_mode or "unknown",
            "error": str(e),
            "embedding_model": "lightweight-tfidf-384d"
        }


def add_sample_documents():
    """Add some sample documents to the collection for testing"""
    try:
        client, client_mode = get_qdrant_client()

        if not client or client_mode == "offline":
            raise Exception("Qdrant non disponible pour ajouter des documents")

        qdrant_store = get_qdrant_store()

        sample_docs = [
            "Le diabète de type 2 est une maladie chronique caractérisée par une résistance à l'insuline.",
            "L'hypertension artérielle est un facteur de risque majeur pour les maladies cardiovasculaires.",
            "Les symptômes de l'angine de poitrine incluent une douleur thoracique et un essoufflement.",
            "La pneumonie est une infection pulmonaire qui peut être causée par des bactéries ou des virus.",
            "L'insuffisance cardiaque congestive affecte la capacité du cœur à pomper le sang efficacement."
        ]

        # Convertir en Documents LangChain
        documents = [Document(page_content=doc, metadata={"source": "sample", "id": i})
                     for i, doc in enumerate(sample_docs)]

        # Ajouter via LangChain
        qdrant_store.add_documents(documents)
        logger.info(f"✅ {len(sample_docs)} documents d'exemple ajoutés sur {client_mode}")

    except Exception as e:
        logger.error(f"❌ Échec ajout documents d'exemple: {e}")
        raise


def diagnose_qdrant():
    """Fonction de diagnostic pour déboguer les problèmes"""
    print("🔍 DIAGNOSTIC QDRANT (VERSION CORRIGÉE)")
    print("=" * 50)

    print(f"🔑 QDRANT_API_KEY configurée: {'✅ Oui' if QDRANT_CLOUD_API_KEY else '❌ Non'}")
    print(f"🌐 URL Cloud: {QDRANT_CLOUD_URL}")

    # Test de connexion
    client, client_mode = get_qdrant_client()
    print(f"🔗 Mode actuel: {client_mode}")
    print(f"🧠 Embeddings: LightweightEmbeddings (TF-IDF + fallbacks, 384D)")

    status = get_qdrant_status()
    print(f"📊 Statut: {status}")

    if status["status"] == "connected":
        print(f"📚 Collections: {status.get('collections', [])}")
        print(f"🩺 Collection clinical_summaries: {'✅' if status.get('has_clinical_summaries') else '❌'}")

    # Test des embeddings
    try:
        embedder = get_embedder()
        test_embedding = embedder.embed_query("test médical")
        print(f"🔢 Test embedding: ✅ {len(test_embedding)} dimensions")
    except Exception as e:
        print(f"🔢 Test embedding: ❌ {e}")

    return status


# Export des fonctions principales (interface identique)
__all__ = [
    "ask_question_with_history",
    "get_qdrant_status",
    "add_sample_documents",
    "diagnose_qdrant",
    "get_embedder",
    "get_qdrant_client"
]