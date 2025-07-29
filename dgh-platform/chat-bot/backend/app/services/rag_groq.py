# app/services/rag_groq.py - Version avec LangChain léger (SANS PyTorch)

import os
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

# REMPLACE HuggingFaceEmbeddings par notre version légère
embedder = LightweightEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


def get_qdrant_client():
    """Obtient le client Qdrant avec fallback cloud -> local"""
    # Tentative cloud d'abord (PRIORITAIRE)
    if QDRANT_CLOUD_API_KEY:
        try:
            cloud_client = QdrantClient(
                url=QDRANT_CLOUD_URL,
                api_key=QDRANT_CLOUD_API_KEY,
                timeout=15  # Timeout plus généreux pour le cloud
            )
            # Test de connexion avec une vraie requête
            collections = cloud_client.get_collections()
            logger.info(f"🌐 ✅ Qdrant Cloud connecté - {len(collections.collections)} collections")
            return cloud_client, "cloud"
        except Exception as e:
            logger.warning(f"⚠️ Qdrant Cloud indisponible: {e}")
    else:
        logger.warning("🔑 QDRANT_API_KEY non configurée - impossible d'utiliser le cloud")

    # Fallback vers local seulement si le cloud échoue
    try:
        local_client = QdrantClient(
            host="localhost",
            port=6333,
            grpc_port=6334,
            prefer_grpc=True,
            timeout=10
        )
        collections = local_client.get_collections()
        logger.info(f"🏠 ✅ Qdrant Local connecté - {len(collections.collections)} collections")
        return local_client, "local"
    except Exception as e:
        logger.error(f"❌ Qdrant Local indisponible: {e}")
        raise ConnectionError("Aucun Qdrant disponible (ni cloud ni local)")


# Initialisation du client global
try:
    client, client_mode = get_qdrant_client()
    logger.info(f"🔗 Mode Qdrant actif: {client_mode}")
except Exception as e:
    logger.error(f"Erreur initialisation Qdrant: {e}")
    client = None
    client_mode = "none"


def ensure_collection_exists():
    """Ensure the Qdrant collection exists, create it if it doesn't"""
    if not client:
        raise Exception("Client Qdrant non disponible")

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
    if not client:
        raise Exception("Client Qdrant non disponible")

    if ensure_collection_exists():
        return QdrantVectorStore(
            client=client,
            collection_name="clinical_summaries",
            embedding=embedder,  # Utilise notre embedder léger
            retrieval_mode=RetrievalMode.DENSE,
        )
    else:
        raise Exception("Impossible d'initialiser la collection Qdrant")


def get_retrieval_chain():
    """Get the retrieval chain, initializing components as needed"""
    try:
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

        # Template de prompt avec historique - MÊME TEMPLATE QU'AVANT
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """Tu es un assistant médical expert. Utilise le contexte fourni et l'historique de conversation pour répondre de manière précise et contextuelle.

Contexte médical:
{context}

Instructions:
- Réponds en français ou anglais selon la question
- Sois précis et professionnel
- Utilise l'historique pour maintenir la cohérence
- Si tu ne sais pas, dis-le clairement
- Source des données: Qdrant """ + client_mode),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])

        # Chaîne de documents avec les bonnes variables
        document_chain = create_stuff_documents_chain(llm, prompt_template)
        retrieval_chain = create_retrieval_chain(retriever, document_chain)

        logger.info(f"✅ Chaîne de récupération initialisée (mode: {client_mode})")
        return retrieval_chain
    except Exception as e:
        logger.error(f"❌ Échec initialisation chaîne: {e}")
        raise


def ask_question_with_history(question: str, chat_history: list):
    """Ask a question with chat history context - INTERFACE IDENTIQUE"""
    try:
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

        # Exécuter la chaîne - MÊME LOGIQUE QU'AVANT
        result = retrieval_chain.invoke({
            "input": question,
            "chat_history": history_messages
        })

        # Récupérer les documents sources si disponibles
        context_docs = result.get("context", [])

        logger.info(f"✅ Réponse générée (sources: {len(context_docs)})")
        return result["answer"], context_docs

    except Exception as e:
        logger.error(f"❌ Erreur dans ask_question_with_history: {e}")
        # Return a fallback response with connection info
        error_msg = f"Désolé, une erreur est survenue lors du traitement de votre question: {str(e)}"
        if client_mode != "none":
            error_msg += f"\n\n(Mode Qdrant: {client_mode})"
        return error_msg, []
        client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.3,
            max_tokens=1000
        )

        answer = response.choices[0].message.content

        logger.info(f"✅ Réponse générée (sources: {len(relevant_docs)})")
        return answer, relevant_docs

    except Exception as e:
        logger.error(f"❌ Erreur dans ask_question_with_history: {e}")
        error_msg = f"Désolé, une erreur est survenue: {str(e)}"
        if client_mode != "none":
            error_msg += f"\n\n(Mode Qdrant: {client_mode})"
        return error_msg, []


def get_qdrant_status():
    """Retourne le statut de la connexion Qdrant - INTERFACE IDENTIQUE"""
    if not client:
        return {"status": "disconnected", "mode": "none", "error": "Client non initialisé"}

    try:
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]

        return {
            "status": "connected",
            "mode": client_mode,
            "collections_count": len(collections.collections),
            "collections": collection_names,
            "url": QDRANT_CLOUD_URL if client_mode == "cloud" else "localhost:6333",
            "has_clinical_summaries": "clinical_summaries" in collection_names,
            "embedding_model": "lightweight-tfidf-384d"  # Indication du modèle léger
        }
    except Exception as e:
        return {"status": "error", "mode": client_mode, "error": str(e)}


def add_sample_documents():
    """Add some sample documents to the collection for testing - COMPATIBLE LANGCHAIN"""
    try:
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

        # Ajouter via LangChain (utilise automatiquement notre embedder léger)
        qdrant_store.add_documents(documents)
        logger.info(f"✅ {len(sample_docs)} documents d'exemple ajoutés sur {client_mode}")

    except Exception as e:
        logger.error(f"❌ Échec ajout documents d'exemple: {e}")
        raise


def diagnose_qdrant():
    """Fonction de diagnostic pour déboguer les problèmes - INTERFACE IDENTIQUE"""
    print("🔍 DIAGNOSTIC QDRANT (VERSION LÉGÈRE)")
    print("=" * 50)

    print(f"🔑 QDRANT_API_KEY configurée: {'✅ Oui' if QDRANT_CLOUD_API_KEY else '❌ Non'}")
    print(f"🌐 URL Cloud: {QDRANT_CLOUD_URL}")
    print(f"🔗 Mode actuel: {client_mode}")
    print(f"🧠 Embeddings: LightweightEmbeddings (TF-IDF + fallbacks, 384D)")

    status = get_qdrant_status()
    print(f"📊 Statut: {status}")

    if status["status"] == "connected":
        print(f"📚 Collections: {status.get('collections', [])}")
        print(f"🩺 Collection clinical_summaries: {'✅' if status.get('has_clinical_summaries') else '❌'}")

    # Test des embeddings
    try:
        test_embedding = embedder.embed_query("test médical")
        print(f"🔢 Test embedding: ✅ {len(test_embedding)} dimensions")
    except Exception as e:
        print(f"🔢 Test embedding: ❌ {e}")

    return status


# Fonction utilitaire pour migration depuis HuggingFace
def migrate_from_huggingface():
    """
    Aide à la migration depuis HuggingFaceEmbeddings
    Vérifie la compatibilité et offre des conseils
    """
    print("🔄 GUIDE DE MIGRATION HUGGINGFACE -> LIGHTWEIGHT")
    print("=" * 55)

    print("✅ AVANTAGES:")
    print("  - Pas de PyTorch (économie ~2GB RAM)")
    print("  - Pas de sentence-transformers")
    print("  - Compatible 100% avec LangChain")
    print("  - Même interface (embed_documents, embed_query)")
    print("  - Fallbacks multiples (TF-IDF, hash, API)")

    print("\n⚠️  DIFFÉRENCES:")
    print("  - Qualité embeddings légèrement inférieure")
    print("  - Basé sur TF-IDF au lieu de transformers")
    print("  - Dimension fixe 384 (comme all-MiniLM-L6-v2)")

    print("\n🔧 POUR AMÉLIORER LA QUALITÉ:")
    print("  - Configurer OPENAI_API_KEY pour embeddings API")
    print("  - Enrichir le corpus médical TF-IDF")
    print("  - Ajuster les paramètres TF-IDF")

    print("\n🎯 REMPLACEMENT DIRECT:")
    print("  AVANT: HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')")
    print("  APRÈS: LightweightEmbeddings(model_name='all-MiniLM-L6-v2')")
    print("  ➡️  Aucun autre changement nécessaire!")


# Test de performance
def benchmark_embeddings(texts=None):
    """Benchmark des embeddings légers"""
    if texts is None:
        texts = [
            "Patient diabétique avec complications cardiovasculaires",
            "Diagnostic d'hypertension artérielle essentielle",
            "Symptômes respiratoires aigus avec fièvre",
            "Consultation cardiologique pour dyspnée d'effort",
            "Analyse sanguine révélant une anémie ferriprive"
        ]

    import time
    print("⏱️  BENCHMARK EMBEDDINGS LÉGERS")
    print("=" * 40)

    # Test embed_documents
    start = time.time()
    doc_embeddings = embedder.embed_documents(texts)
    doc_time = time.time() - start

    print(f"📄 Documents ({len(texts)}): {doc_time:.3f}s")
    print(f"   Dimension: {len(doc_embeddings[0])}")
    print(f"   Vitesse: {len(texts) / doc_time:.1f} docs/sec")

    # Test embed_query
    start = time.time()
    query_emb = embedder.embed_query(texts[0])
    query_time = time.time() - start

    print(f"🔍 Query: {query_time:.3f}s")
    print(f"   Dimension: {len(query_emb)}")

    return {
        "doc_time": doc_time,
        "query_time": query_time,
        "dimension": len(query_emb),
        "docs_per_sec": len(texts) / doc_time
    }


# Export des fonctions principales (interface identique)
__all__ = [
    "ask_question_with_history",
    "get_qdrant_status",
    "add_sample_documents",
    "diagnose_qdrant",
    "embedder",
    "client",
    "client_mode"
]