"""
Extraction intelligente de thèmes pour les feedbacks patients
Utilise Groq API pour analyser le contenu et assigner des thèmes pertinents
"""
import json
import logging
import os
from django.conf import settings
from groq import Groq
from apps.feedback.models import FeedbackTheme

logger = logging.getLogger(__name__)

# Client Groq global (réutilise celui de sentimental_analysis si disponible)
_groq_client = None

def _get_groq_client():
    """Initialise le client Groq pour l'extraction de thèmes"""
    global _groq_client
    if _groq_client is None:
        api_key = getattr(settings, 'GROQ_API_KEY', os.getenv('GROQ_API_KEY'))
        if not api_key:
            raise ValueError("GROQ_API_KEY non configurée")
        _groq_client = Groq(api_key=api_key)
        logger.info("Client Groq pour extraction de thèmes initialisé")
    return _groq_client


def _get_existing_themes() -> list:
    """Récupère la liste des thèmes existants dans la base de données"""
    try:
        themes = FeedbackTheme.objects.filter(is_active=True).values_list('theme_name', flat=True)
        return list(themes)
    except Exception as e:
        logger.warning(f"Erreur récupération thèmes existants: {e}")
        return [
            "Satisfaction - Service excellent",
            "Satisfaction - Service correct", 
            "Insatisfaction - Problème majeur",
            "Insatisfaction - Service à améliorer",
            "Neutre - Globalement satisfait",
            "Neutre - Globalement insatisfait",
            "Neutre - Service moyen",
            "Feedback - Évaluation générale"
        ]


def _extract_theme_with_groq(feedback_text: str, sentiment: str, existing_themes: list) -> dict:
    """
    Utilise Groq pour extraire ou assigner un thème au feedback
    
    Args:
        feedback_text: Texte du feedback patient
        sentiment: Sentiment détecté (positive, negative, neutral)
        existing_themes: Liste des thèmes existants
        
    Returns:
        dict: {
            'theme': str,
            'is_new': bool,
            'confidence': float
        }
    """
    try:
        client = _get_groq_client()
        
        # Construction du prompt avec thèmes existants
        themes_list = "\n".join([f"- {theme}" for theme in existing_themes])
        
        prompt = f"""Tu es un expert en classification de feedbacks médicaux. Analyse ce feedback patient et assigne-lui le thème le plus approprié.

FEEDBACK À ANALYSER:
"{feedback_text}"

SENTIMENT DÉTECTÉ: {sentiment}

THÈMES EXISTANTS (utilise un de ces thèmes si approprié):
{themes_list}

INSTRUCTIONS:
1. Si le feedback correspond à un thème existant, utilise EXACTEMENT ce thème
2. Si aucun thème existant ne convient, propose un nouveau thème descriptif
3. Le thème doit être concis et refléter le contenu principal du feedback
4. Évite les doublons sémantiques avec les thèmes existants

Réponds UNIQUEMENT au format JSON suivant:
{{
    "theme": "nom du thème choisi ou créé",
    "is_new": true/false,
    "confidence": 0.85,
    "reasoning": "explication courte du choix"
}}"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Tu es un expert en classification de feedbacks médicaux. Réponds uniquement en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300
        )
        
        response_text = response.choices[0].message.content.strip()
        logger.debug(f"Réponse Groq theme extraction: {response_text}")
        
        # Parse la réponse JSON
        try:
            result = json.loads(response_text)
            
            # Validation du format
            required_keys = ["theme", "is_new", "confidence"]
            if not all(key in result for key in required_keys):
                raise ValueError("Clés manquantes dans la réponse")
                
            # Validation des types
            if not isinstance(result["theme"], str) or not result["theme"].strip():
                raise ValueError("Theme invalide")
            if not isinstance(result["is_new"], bool):
                raise ValueError("is_new doit être boolean")
            if not isinstance(result["confidence"], (int, float)) or not 0 <= result["confidence"] <= 1:
                raise ValueError("confidence doit être entre 0 et 1")
                
            return {
                "theme": result["theme"].strip(),
                "is_new": result["is_new"],
                "confidence": float(result["confidence"])
            }
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.warning(f"Erreur parsing réponse Groq theme: {e}, réponse: {response_text}")
            raise ValueError(f"Réponse Groq invalide: {e}")
            
    except Exception as e:
        logger.error(f"Erreur Groq theme extraction: {e}")
        raise


def _fallback_theme_extraction(sentiment: str, rating: int = None) -> dict:
    """
    Extraction de thème fallback basée sur des règles simples
    """
    if not sentiment:
        sentiment = "neutral"
    
    # Logique fallback basée sur sentiment et rating
    if sentiment == "positive":
        if rating and rating >= 4:
            theme = "Satisfaction - Service excellent"
        else:
            theme = "Satisfaction - Service correct"
    elif sentiment == "negative":
        if rating and rating <= 2:
            theme = "Insatisfaction - Problème majeur"
        else:
            theme = "Insatisfaction - Service à améliorer"
    else:  # neutral
        if rating and rating >= 4:
            theme = "Neutre - Globalement satisfait"
        elif rating and rating <= 2:
            theme = "Neutre - Globalement insatisfait"
        else:
            theme = "Neutre - Service moyen"
    
    return {
        "theme": theme,
        "is_new": False,
        "confidence": 0.7
    }


def get_feedback_theme(feedback_text: str = None, sentiment: str = None, rating: int = None) -> str:
    """
    Détermine le thème d'un feedback de manière intelligente
    
    Args:
        feedback_text: Texte du feedback (optionnel pour rétrocompatibilité)
        sentiment: Sentiment détecté (positive, negative, neutral) 
        rating: Note donnée par le patient (1-5, optionnel)
        
    Returns:
        theme_name: Nom du thème approprié
    """
    try:
        # Si on a le texte du feedback, utilise Groq pour analyse intelligente
        if feedback_text and feedback_text.strip():
            logger.info("Extraction de thème via Groq API...")
            
            existing_themes = _get_existing_themes()
            groq_result = _extract_theme_with_groq(feedback_text, sentiment or "neutral", existing_themes)
            
            # Si c'est un nouveau thème, le créer en base
            if groq_result["is_new"]:
                try:
                    theme_obj, created = FeedbackTheme.objects.get_or_create(
                        theme_name=groq_result["theme"],
                        defaults={'is_active': True}
                    )
                    if created:
                        logger.info(f"Nouveau thème créé: {groq_result['theme']}")
                    else:
                        logger.info(f"Thème existant trouvé: {groq_result['theme']}")
                except Exception as e:
                    logger.warning(f"Erreur création thème en base: {e}")
            
            logger.info(f"Thème extrait via Groq: {groq_result['theme']} (confidence: {groq_result['confidence']})")
            return groq_result["theme"]
            
        else:
            # Fallback pour rétrocompatibilité (pas de texte fourni)
            logger.info("Utilisation du fallback theme extraction (pas de texte)")
            fallback_result = _fallback_theme_extraction(sentiment, rating)
            return fallback_result["theme"]
            
    except Exception as e:
        logger.warning(f"Erreur extraction thème via Groq, utilisation du fallback: {e}")
        fallback_result = _fallback_theme_extraction(sentiment, rating)
        return fallback_result["theme"]