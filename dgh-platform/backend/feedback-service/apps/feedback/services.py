"""
Services pour le traitement automatique des feedbacks
"""
from .models import FeedbackTheme, Feedback
from .sentimental_analysis import get_sentiment_data
from .theme_extraction import get_feedback_theme
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def categorize_feedback_theme(feedback_text: str, sentiment: str, rating: int = None) -> str:
    """
    Détermine le thème basé sur le texte du feedback, sentiment et rating
    
    Args:
        feedback_text: Texte du feedback pour analyse intelligente
        sentiment: Sentiment détecté
        rating: Note optionnelle du patient
    """
    return get_feedback_theme(feedback_text=feedback_text, sentiment=sentiment, rating=rating)



def get_or_create_theme(theme_name: str) -> FeedbackTheme:
    """
    Récupère ou crée un thème de feedback
    
    Args:
        theme_name: Nom du thème
        
    Returns:
        FeedbackTheme: Instance du thème
    """
    theme, created = FeedbackTheme.objects.get_or_create(
        theme_name=theme_name,
        defaults={'is_active': True}
    )
    if created:
        logger.info(f"Nouveau thème créé: {theme_name}")
    return theme


def process_feedback(feedback: Feedback) -> Feedback:
    """
    Traite un feedback : analyse sentiment et catégorise
    
    Args:
        feedback: Instance de feedback à traiter
        
    Returns:
        feedback: Feedback traité et mis à jour
    """
    try:
        logger.info(f"Traitement du feedback {feedback.feedback_id}")
        
        # Analyse de sentiment
        logger.info("Début analyse de sentiment...")
        sentiment, scores = get_sentiment_data(feedback.description)
        logger.info(f"Sentiment obtenu: {sentiment}, scores: {scores}")
        
        # Mise à jour du sentiment et des scores
        feedback.sentiment = sentiment
        feedback.sentiment_positive_score = scores.get('positive', 0)
        feedback.sentiment_negative_score = scores.get('negative', 0)
        feedback.sentiment_neutral_score = scores.get('neutral', 0)
        
        # Catégorisation thématique intelligente avec le texte
        theme_name = categorize_feedback_theme(feedback.description, sentiment, feedback.rating)
        theme = get_or_create_theme(theme_name)
        
        # Finalisation
        feedback.theme = theme
        feedback.is_processed = True
        feedback.processed_at = timezone.now()
        feedback.save()
        
        logger.info(f"Feedback traité: sentiment={sentiment}, thème={theme_name}")
        return feedback
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement du feedback {feedback.feedback_id}: {e}")
        return feedback