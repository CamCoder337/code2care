"""
Tâches Celery pour le traitement asynchrone des feedbacks
"""
from celery import shared_task
from .models import Feedback
from .services import process_feedback
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_feedback_async(self, feedback_id: str):
    """
    Tâche asynchrone pour traiter un feedback
    Utilise la logique existante dans services.py
    
    Args:
        feedback_id: UUID du feedback à traiter
        
    Returns:
        dict: Résultat du traitement
    """
    try:
        logger.info(f"Début traitement asynchrone du feedback {feedback_id}")
        
        # Récupération du feedback
        feedback = Feedback.objects.get(feedback_id=feedback_id)
        
        if feedback.is_processed:
            logger.info(f"Feedback {feedback_id} déjà traité")
            return {"status": "already_processed", "feedback_id": feedback_id}
        
        # Utilise la logique existante du service
        processed_feedback = process_feedback(feedback)
        
        result = {
            "status": "success",
            "feedback_id": feedback_id,
            "sentiment": processed_feedback.sentiment,
            "theme": processed_feedback.theme.theme_name if processed_feedback.theme else None,
            "processing_time": processed_feedback.processed_at.isoformat() if processed_feedback.processed_at else None
        }
        
        logger.info(f"Feedback traité avec succès: {result}")
        return result
        
    except Feedback.DoesNotExist:
        logger.error(f"Feedback {feedback_id} introuvable")
        return {"status": "error", "message": "Feedback not found"}
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement du feedback {feedback_id}: {e}")
        
        # Retry automatique en cas d'erreur
        if self.request.retries < self.max_retries:
            logger.info(f"Retry {self.request.retries + 1}/{self.max_retries} pour {feedback_id}")
            raise self.retry(countdown=60, exc=e)
        
        return {"status": "error", "message": str(e), "feedback_id": feedback_id}