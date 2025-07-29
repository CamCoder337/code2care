# app/services/embeddings_langchain.py - Embeddings compatible LangChain sans PyTorch

import os
import logging
import numpy as np
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import requests

# Import LangChain (léger)
from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__name__)


class LightweightEmbeddings(Embeddings):
    """
    Classe d'embeddings légère compatible avec LangChain
    Remplace HuggingFaceEmbeddings sans PyTorch
    """

    def __init__(self, model_name: str = "lightweight-tfidf"):
        self.model_name = model_name
        self.dimension = 384  # Même que all-MiniLM-L6-v2
        self.tfidf_vectorizer = None
        self._corpus_initialized = False
        logger.info(f"✅ Lightweight embeddings initialized: {model_name}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Interface LangChain : embed_documents
        Retourne une liste d'embeddings pour une liste de documents
        """
        embeddings = []
        for text in texts:
            embedding = self._get_embedding(text)
            embeddings.append(embedding)

        logger.debug(f"Embedded {len(texts)} documents")
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        """
        Interface LangChain : embed_query
        Retourne un embedding pour une requête
        """
        embedding = self._get_embedding(text)
        logger.debug(f"Embedded query: {text[:50]}...")
        return embedding

    def _get_embedding(self, text: str) -> List[float]:
        """Génère un embedding avec stratégies multiples"""

        # Stratégie 1: API externe (optionnel)
        try:
            return self._get_api_embedding(text)
        except Exception as e:
            logger.debug(f"API embedding failed: {e}")

        # Stratégie 2: TF-IDF (principal)
        try:
            return self._get_tfidf_embedding(text)
        except Exception as e:
            logger.warning(f"TF-IDF embedding failed: {e}")

        # Stratégie 3: Hash-based (fallback)
        return self._get_hash_embedding(text)

    def _get_api_embedding(self, text: str) -> List[float]:
        """Utilise une API externe si disponible"""
        # Option 1: OpenAI (si clé disponible)
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            headers = {
                'Authorization': f'Bearer {openai_key}',
                'Content-Type': 'application/json'
            }

            data = {
                'input': text,
                'model': 'text-embedding-3-small'  # Plus abordable
            }

            try:
                response = requests.post(
                    'https://api.openai.com/v1/embeddings',
                    headers=headers,
                    json=data,
                    timeout=10
                )

                if response.status_code == 200:
                    result = response.json()
                    embedding = result['data'][0]['embedding']
                    return self._resize_to_384(embedding)
            except Exception as e:
                logger.debug(f"OpenAI API failed: {e}")

        # Option 2: Groq (si ils supportent les embeddings)
        # Pour l'instant, Groq ne fait que le chat, pas les embeddings

        raise Exception("No API embedding available")

    def _get_tfidf_embedding(self, text: str) -> List[float]:
        """Génère un embedding TF-IDF"""
        if not self.tfidf_vectorizer or not self._corpus_initialized:
            self._initialize_tfidf_corpus(text)

        # Transformer le texte
        try:
            vector = self.tfidf_vectorizer.transform([text]).toarray()[0]
        except:
            # Re-initialiser avec le nouveau texte si erreur
            self._initialize_tfidf_corpus(text)
            vector = self.tfidf_vectorizer.transform([text]).toarray()[0]

        # Ajuster à 384 dimensions
        return self._resize_to_384(vector.tolist())

    def _initialize_tfidf_corpus(self, current_text: str):
        """Initialise le TF-IDF avec un corpus médical"""
        # Corpus médical de base
        medical_corpus = [
            current_text,  # Inclure le texte actuel
            "medical diagnosis treatment patient healthcare clinical",
            "symptoms disease condition therapy medication prescription",
            "doctor physician hospital clinic medical center",
            "health record clinical summary patient history",
            "laboratory test results blood analysis examination",
            "surgical procedure operation intervention surgery",
            "pharmaceutical drug medicine treatment therapy",
            "cardiovascular respiratory neurological psychiatric conditions",
            "diagnostic imaging radiology ultrasound CT scan MRI"
        ]

        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=384,
            stop_words='english',
            ngram_range=(1, 2),
            sublinear_tf=True,
            norm='l2'
        )

        self.tfidf_vectorizer.fit(medical_corpus)
        self._corpus_initialized = True
        logger.debug("TF-IDF corpus initialized with medical terms")

    def _get_hash_embedding(self, text: str) -> List[float]:
        """Embedding basé sur le hachage (fallback robuste)"""
        embeddings = []

        # Générer 48 hash différents pour 384 dimensions (48 * 8)
        for i in range(48):
            hash_input = f"{text}_{i}_medical_embedding".encode('utf-8')
            hash_val = hashlib.sha256(hash_input).hexdigest()

            # Convertir les 8 premiers caractères hex en float
            for j in range(0, 8):
                val = int(hash_val[j], 16) / 15.0  # Normaliser 0-1
                embeddings.append(val - 0.5)  # Centrer autour de 0

        # Normaliser le vecteur
        norm = np.linalg.norm(embeddings)
        if norm > 0:
            embeddings = [x / norm for x in embeddings]

        return embeddings

    def _resize_to_384(self, embedding: List[float]) -> List[float]:
        """Redimensionne un embedding à 384 dimensions"""
        current_size = len(embedding)

        if current_size == 384:
            return embedding
        elif current_size < 384:
            # Répéter et compléter
            repeat_count = 384 // current_size
            remainder = 384 % current_size
            result = embedding * repeat_count + embedding[:remainder]
            return result
        else:
            # Réduire par moyennage
            chunk_size = current_size // 384
            result = []
            for i in range(384):
                start = i * chunk_size
                end = start + chunk_size
                if end <= current_size:
                    chunk_mean = np.mean(embedding[start:end])
                    result.append(float(chunk_mean))
                else:
                    result.append(float(embedding[start]))
            return result

    def similarity(self, text1: str, text2: str) -> float:
        """Calcule la similarité entre deux textes"""
        emb1 = np.array(self.embed_query(text1)).reshape(1, -1)
        emb2 = np.array(self.embed_query(text2)).reshape(1, -1)
        return float(cosine_similarity(emb1, emb2)[0][0])


# Instance globale pour remplacer HuggingFaceEmbeddings
def get_lightweight_embeddings():
    """Factory function pour obtenir les embeddings légers"""
    return LightweightEmbeddings(model_name="lightweight-medical-embeddings")


# Test de compatibilité
if __name__ == "__main__":
    embedder = get_lightweight_embeddings()

    # Test basique
    test_texts = [
        "Le patient présente des symptômes de diabète",
        "Diagnostic médical et traitement approprié",
        "Consultation cardiologique recommandée"
    ]

    print("🧪 Test embeddings légers...")
    embeddings = embedder.embed_documents(test_texts)
    print(f"✅ {len(embeddings)} embeddings générés, dimension: {len(embeddings[0])}")

    query_emb = embedder.embed_query("symptômes diabète")
    print(f"✅ Query embedding, dimension: {len(query_emb)}")

    similarity = embedder.similarity(test_texts[0], "diabète symptômes")
    print(f"✅ Similarité calculée: {similarity:.3f}")