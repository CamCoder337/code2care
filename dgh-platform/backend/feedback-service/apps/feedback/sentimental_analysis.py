"""
Analyse de sentiment pour les feedbacks patients
Basé sur l'API Groq pour une analyse rapide et efficace
"""
import time
import json
import logging
import os
from groq import Groq
from django.conf import settings

logger = logging.getLogger(__name__)

# Configuration Groq API
GROQ_MODEL = "llama-3.1-8b-instant"  # Modèle rapide et gratuit
_groq_client = None

def _get_groq_client():
    """Initialise le client Groq de façon lazy pour groq==0.30.0"""
    global _groq_client
    if _groq_client is None:
        api_key = getattr(settings, 'GROQ_API_KEY', os.getenv('GROQ_API_KEY'))
        if not api_key:
            raise ValueError("GROQ_API_KEY non configurée")
        
        # Pour groq==0.30.0, utilisation directe sans paramètres supplémentaires
        try:
            _groq_client = Groq(api_key=api_key)
            logger.info("Client Groq v0.30.0 initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur initialisation client Groq v0.30.0: {e}")
            raise ValueError(f"Impossible d'initialiser Groq: {e}")
    return _groq_client


def _analyze_sentiment_groq(text: str) -> dict:
    """
    Analyse le sentiment via l'API Groq
    
    Args:
        text: Texte du feedback à analyser
        
    Returns:
        dict: Résultat de l'analyse avec sentiment et scores
    """
    try:
        client = _get_groq_client()
        
        # Prompt structuré pour l'analyse de sentiment
        prompt = f"""Tu es un expert en analyse de sentiment médical. Analyse le sentiment de ce feedback patient en français.

Feedback: "{text}"

Réponds UNIQUEMENT au format JSON exact suivant, sans texte supplémentaire:
{{
    "sentiment": "positive|negative|neutral",
    "confidence": {{
        "positive": 85.2,
        "negative": 10.1,
        "neutral": 4.7
    }}
}}

Les pourcentages doivent totaliser 100%. Sois précis sur le sentiment médical."""

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "Tu es un expert en analyse de sentiment médical. Réponds uniquement en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Faible pour consistance
            max_tokens=200
        )
        
        response_text = response.choices[0].message.content.strip()
        logger.debug(f"Réponse Groq brute: {response_text}")
        
        # Parse la réponse JSON
        try:
            result = json.loads(response_text)
            
            # Validation du format
            if "sentiment" not in result or "confidence" not in result:
                raise ValueError("Format JSON invalide")
                
            sentiment = result["sentiment"].lower()
            if sentiment not in ["positive", "negative", "neutral"]:
                raise ValueError(f"Sentiment invalide: {sentiment}")
                
            confidence = result["confidence"]
            required_keys = ["positive", "negative", "neutral"]
            if not all(key in confidence for key in required_keys):
                raise ValueError("Clés de confiance manquantes")
                
            return {
                "sentiment": sentiment,
                "confidence": {
                    "positive": float(confidence["positive"]),
                    "negative": float(confidence["negative"]),
                    "neutral": float(confidence["neutral"])
                }
            }
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.warning(f"Erreur parsing réponse Groq: {e}, réponse: {response_text}")
            raise ValueError(f"Réponse Groq invalide: {e}")
            
    except Exception as e:
        logger.error(f"Erreur API Groq: {e}")
        raise


def _simple_sentiment_analysis(text: str) -> tuple:
    """
    Analyse de sentiment légère basée sur des mots-clés pour fallback
    """
    text_lower = text.lower()
    
    # Mots positifs étendus (contexte médical)
    positive_words = [
        'excellent', 'parfait', 'très bien', 'super', 'formidable', 'fantastique', 'merveilleux',
        'satisfait', 'content', 'heureux', 'bon', 'bien', 'génial', 'top', 'recommande',
        'bravo', 'félicitations', 'efficace', 'rapide', 'professionnel', 'qualité', 'compétent',
        'attentif', 'bienveillant', 'rassurant', 'disponible', 'aimable', 'gentil', 'souriant'
    ]
    
    # Mots négatifs étendus (contexte médical)
    negative_words = [
        'mauvais', 'nul', 'problème', 'insatisfait', 'décevant', 'terrible', 'catastrophique', 'mal',
        'lent', 'attente', 'retard', 'erreur', 'difficile', 'compliqué', 'inquiet', 'peur',
        'douleur', 'souffrance', 'déçu', 'mécontent', 'plainte', 'inadéquat', 'impoli', 'froid',
        'indisponible', 'négligent', 'incompétent', 'désagréable', 'stressant', 'angoissant'
    ]
    
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    if positive_count > negative_count:
        confidence = min(60.0 + (positive_count * 10), 90.0)
        return "positive", {
            "negative": 10.0, 
            "neutral": 100.0 - confidence - 10.0, 
            "positive": confidence
        }
    elif negative_count > positive_count:
        confidence = min(60.0 + (negative_count * 10), 90.0)
        return "negative", {
            "negative": confidence, 
            "neutral": 100.0 - confidence - 10.0, 
            "positive": 10.0
        }
    else:
        return "neutral", {"negative": 30.0, "neutral": 40.0, "positive": 30.0}


def analyze_sentiment(text: str) -> dict:
    """
    Analyse le sentiment d'un texte unique via Groq API
    
    Args:
        text: Texte du feedback à analyser
        
    Returns:
        dict: Résultat de l'analyse avec prediction, scores et temps de traitement
    """
    start = time.time()
    
    try:
        # Analyse via Groq API
        groq_result = _analyze_sentiment_groq(text)
        
        end = time.time()
        elapsed = round(end - start, 3)
        
        result = {
            "text": text,
            "prediction": groq_result["sentiment"],
            "confidence": {
                "negative": round(groq_result["confidence"]["negative"], 2),
                "neutral": round(groq_result["confidence"]["neutral"], 2),
                "positive": round(groq_result["confidence"]["positive"], 2)
            },
            "processing_time_seconds": elapsed,
            "method": "groq_api"
        }
        
        logger.info(f"Sentiment analysé via Groq: {groq_result['sentiment']} en {elapsed}s")
        return result
        
    except Exception as e:
        logger.warning(f"Erreur Groq API, utilisation du fallback: {e}")
        
        # Fallback vers analyse par mots-clés
        sentiment, confidence = _simple_sentiment_analysis(text)
        
        end = time.time()
        elapsed = round(end - start, 3)
        
        return {
            "text": text,
            "prediction": sentiment,
            "confidence": confidence,
            "processing_time_seconds": elapsed,
            "method": "keyword_fallback",
            "error": str(e)
        }


def get_sentiment_data(text: str) -> tuple:
    """
    Version simplifiée qui retourne seulement le sentiment et les scores
    Compatible avec l'API existante
    
    Args:
        text: Texte à analyser
        
    Returns:
        tuple: (sentiment, scores_dict)
    """
    try:
        logger.info("Analyse de sentiment via Groq API...")
        result = analyze_sentiment(text)
        logger.info(f"Analyse réussie ({result.get('method', 'unknown')}): {result['prediction']}")
        return result["prediction"], result["confidence"]
    except Exception as e:
        logger.error(f"Erreur totale d'analyse de sentiment: {e}")
        # Fallback d'urgence
        return "neutral", {"negative": 33.33, "neutral": 33.33, "positive": 33.33}