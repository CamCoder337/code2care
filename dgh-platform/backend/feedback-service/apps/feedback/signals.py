"""
Signaux Django pour déclencher automatiquement le traitement des feedbacks
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Feedback, Prescription
from .tasks import process_feedback_async, generate_reminders_for_prescription
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Feedback)
def trigger_feedback_processing(sender, instance, created, **kwargs):
    """
    Signal déclenché après la création d'un nouveau feedback
    Lance automatiquement le traitement asynchrone
    
    Args:
        sender: Modèle Feedback
        instance: Instance du feedback créé
        created: True si c'est une création, False si c'est une mise à jour
        **kwargs: Arguments additionnels
    """
    print(f"🔥 SIGNAL FEEDBACK: {instance.feedback_id}, created={created}, is_processed={instance.is_processed}")
    logger.info(f"Signal déclenché pour feedback {instance.feedback_id}: created={created}, is_processed={instance.is_processed}")
    
    if created and not instance.is_processed:
        logger.info(f"Nouveau feedback créé: {instance.feedback_id}, lancement du traitement asynchrone")
        
        # Déclenche la tâche Celery en arrière-plan avec gestion d'erreur
        try:
            task = process_feedback_async.delay(str(instance.feedback_id))
            logger.info(f"Tâche Celery lancée: {task.id} pour feedback {instance.feedback_id}")
        except Exception as e:
            logger.error(f"Erreur Celery pour feedback {instance.feedback_id}: {e}")
            logger.info("Le feedback a été créé mais le traitement asynchrone a échoué")
    elif not created:
        logger.debug(f"Feedback {instance.feedback_id} mis à jour, pas de retraitement")
    else:
        logger.info(f"Feedback {instance.feedback_id} déjà traité ou condition non remplie")


@receiver(post_save, sender=Prescription)
def trigger_reminder_generation(sender, instance, created, **kwargs):
    """
    Signal déclenché après la création d'une nouvelle prescription
    Lance automatiquement la génération des rappels médicamenteux
    
    Args:
        sender: Modèle Prescription
        instance: Instance de la prescription créée
        created: True si c'est une création, False si c'est une mise à jour
        **kwargs: Arguments additionnels
    """
    print(f"🔥 SIGNAL PRESCRIPTION: {instance.prescription_id}, created={created}")
    logger.info(f"Signal déclenché pour prescription {instance.prescription_id}: created={created}")
    
    if created:
        logger.info(f"Nouvelle prescription créée: {instance.prescription_id}, génération des rappels médicamenteux")
        
        # Déclenche la génération des rappels APRÈS le commit de la transaction
        def launch_reminder_task():
            try:
                task = generate_reminders_for_prescription.apply_async(
                    args=[str(instance.prescription_id)],
                    countdown=5  # Réduit à 5 secondes maintenant que la transaction est commitée
                )
                logger.info(f"Tâche de génération de rappels lancée: {task.id} pour prescription {instance.prescription_id}")
            except Exception as e:
                logger.error(f"Erreur Celery pour génération rappels prescription {instance.prescription_id}: {e}")
                logger.info("La prescription a été créée mais la génération des rappels a échoué")
        
        # Utiliser transaction.on_commit pour s'assurer que les médicaments sont sauvegardés
        transaction.on_commit(launch_reminder_task)
    else:
        logger.debug(f"Prescription {instance.prescription_id} mise à jour, pas de re-génération des rappels")