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


# ========== REMINDER TASKS ==========

@shared_task(bind=True, max_retries=3)
def generate_reminders_for_prescription(self, prescription_id: str):
    """
    Tâche asynchrone pour générer tous les rappels d'une prescription
    
    Args:
        prescription_id (str): UUID de la prescription
        
    Returns:
        dict: Résultat de la génération des rappels
    """
    try:
        from .reminder_service import generate_medication_reminders
        
        logger.info(f"Début génération rappels pour prescription {prescription_id}")
        
        result = generate_medication_reminders(prescription_id)
        
        if result['success']:
            logger.info(f"Rappels générés avec succès pour {prescription_id}: {result['total_reminders']} rappels")
        else:
            logger.error(f"Échec génération rappels pour {prescription_id}: {result['message']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération des rappels pour {prescription_id}: {e}")
        
        # Retry automatique en cas d'erreur
        if self.request.retries < self.max_retries:
            logger.info(f"Retry {self.request.retries + 1}/{self.max_retries} pour {prescription_id}")
            raise self.retry(countdown=300, exc=e)  # Retry après 5 minutes
        
        return {"status": "error", "message": str(e), "prescription_id": prescription_id}


@shared_task(bind=True, max_retries=2)
def send_medication_reminder(self, reminder_id: str):
    """
    Tâche asynchrone pour envoyer un rappel spécifique via Twilio
    
    Args:
        reminder_id (str): UUID du rappel à envoyer
        
    Returns:
        dict: Résultat de l'envoi
    """
    try:
        from .models import Reminder
        from .twilio_service import send_sms_reminder, send_voice_reminder
        from .reminder_service import update_reminder_status, get_patient_info
        
        logger.info(f"Début envoi rappel {reminder_id}")
        
        # Récupération du rappel
        reminder = Reminder.objects.get(reminder_id=reminder_id)
        
        if reminder.status != 'pending':
            logger.info(f"Rappel {reminder_id} déjà traité (statut: {reminder.status})")
            return {"status": "already_processed", "reminder_id": reminder_id}
        
        # Récupération des infos patient pour le numéro de téléphone
        patient_info = get_patient_info(str(reminder.patient_id))
        if not patient_info or not patient_info.get('phone_number'):
            logger.error(f"Numéro de téléphone introuvable pour patient {reminder.patient_id}")
            update_reminder_status(reminder, {
                'success': False,
                'error_message': 'Numéro de téléphone introuvable'
            })
            return {"status": "error", "message": "Numéro de téléphone introuvable"}
        
        phone_number = patient_info['phone_number']
        
        # Envoi selon le canal préféré
        if reminder.channel == 'voice':
            twilio_result = send_voice_reminder(
                phone_number,
                reminder.message_content,
                reminder.language
            )
        else:  # SMS par défaut
            twilio_result = send_sms_reminder(
                phone_number,
                reminder.message_content,
                reminder.language
            )
        
        # Mise à jour du statut du rappel
        update_reminder_status(reminder, twilio_result)
        
        result = {
            "status": "success" if twilio_result['success'] else "failed",
            "reminder_id": reminder_id,
            "channel": reminder.channel,
            "twilio_sid": twilio_result.get('twilio_sid'),
            "message": twilio_result.get('message')
        }
        
        logger.info(f"Rappel {reminder_id} traité: {result['status']}")
        return result
        
    except Reminder.DoesNotExist:
        logger.error(f"Rappel {reminder_id} introuvable")
        return {"status": "error", "message": "Rappel introuvable"}
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du rappel {reminder_id}: {e}")
        
        # Retry automatique en cas d'erreur
        if self.request.retries < self.max_retries:
            logger.info(f"Retry {self.request.retries + 1}/{self.max_retries} pour rappel {reminder_id}")
            raise self.retry(countdown=60, exc=e)  # Retry après 1 minute
        
        # Marquer le rappel comme échoué après tous les retries
        try:
            reminder = Reminder.objects.get(reminder_id=reminder_id)
            update_reminder_status(reminder, {
                'success': False,
                'error_message': f'Échec après {self.max_retries} tentatives: {str(e)}'
            })
        except:
            pass
        
        return {"status": "error", "message": str(e), "reminder_id": reminder_id}


@shared_task
def process_pending_reminders():
    """
    Tâche périodique pour traiter tous les rappels en attente
    Doit être exécutée toutes les 5 minutes via Celery Beat
    
    Returns:
        dict: Statistiques de traitement
    """
    try:
        from .reminder_service import get_pending_reminders
        
        logger.info("Début traitement des rappels en attente")
        
        # Récupération des rappels à traiter
        pending_reminders = get_pending_reminders(limit=50)  # Traiter 50 rappels max par batch
        
        if not pending_reminders:
            logger.info("Aucun rappel en attente")
            return {"status": "success", "processed_count": 0, "message": "Aucun rappel en attente"}
        
        processed_count = 0
        success_count = 0
        
        # Lancement asynchrone de l'envoi pour chaque rappel
        for reminder in pending_reminders:
            try:
                # Lancer la tâche d'envoi en arrière-plan
                send_medication_reminder.delay(str(reminder.reminder_id))
                processed_count += 1
                success_count += 1
                
                logger.info(f"Tâche d'envoi lancée pour rappel {reminder.reminder_id}")
                
            except Exception as e:
                logger.error(f"Erreur lors du lancement de la tâche pour rappel {reminder.reminder_id}: {e}")
                processed_count += 1
        
        result = {
            "status": "success",
            "processed_count": processed_count,
            "success_count": success_count,
            "failed_count": processed_count - success_count,
            "message": f"{success_count} tâches d'envoi lancées sur {processed_count} rappels"
        }
        
        logger.info(f"Traitement terminé: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement des rappels en attente: {e}")
        return {"status": "error", "message": str(e)}


@shared_task
def update_twilio_statuses():
    """
    Tâche périodique pour mettre à jour les statuts Twilio des rappels envoyés
    Doit être exécutée toutes les heures via Celery Beat
    
    Returns:
        dict: Statistiques de mise à jour
    """
    try:
        from .models import Reminder
        from .twilio_service import get_message_status
        
        logger.info("Début mise à jour des statuts Twilio")
        
        # Récupération des rappels envoyés sans statut final
        sent_reminders = Reminder.objects.filter(
            status='sent',
            twilio_sid__isnull=False,
            delivery_status__in=['sent', 'queued', 'sending', None]
        )[:100]  # Limite à 100 pour éviter de surcharger l'API Twilio
        
        if not sent_reminders:
            logger.info("Aucun rappel à mettre à jour")
            return {"status": "success", "updated_count": 0, "message": "Aucun rappel à mettre à jour"}
        
        updated_count = 0
        
        for reminder in sent_reminders:
            try:
                # Récupération du statut depuis Twilio
                twilio_status = get_message_status(reminder.twilio_sid)
                
                if twilio_status['success']:
                    reminder.delivery_status = twilio_status['status']
                    reminder.save()
                    updated_count += 1
                    
                    logger.info(f"Statut mis à jour pour rappel {reminder.reminder_id}: {twilio_status['status']}")
                
            except Exception as e:
                logger.error(f"Erreur lors de la mise à jour du statut pour rappel {reminder.reminder_id}: {e}")
        
        result = {
            "status": "success",
            "updated_count": updated_count,
            "total_checked": len(sent_reminders),
            "message": f"{updated_count} statuts mis à jour"
        }
        
        logger.info(f"Mise à jour terminée: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour des statuts Twilio: {e}")
        return {"status": "error", "message": str(e)}