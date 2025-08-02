"""
Service de génération et gestion des rappels médicamenteux
"""
from datetime import datetime, timedelta, time
from typing import List, Dict, Tuple
import httpx
from django.conf import settings
from django.utils import timezone
from .models import Prescription, PrescriptionMedication, Reminder
import logging

logger = logging.getLogger(__name__)


def get_patient_info(patient_id: str) -> Dict:
    """
    Récupère les informations du patient depuis l'API Gateway
    
    Args:
        patient_id (str): UUID du patient
        
    Returns:
        dict: Informations du patient (phone, language, preferred_contact_method)
    """
    try:
        # URL de l'API Gateway pour récupérer les infos patient
        api_gateway_url = getattr(settings, 'MICROSERVICES', {}).get('API_GATEWAY', 'http://localhost:8000')
        
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{api_gateway_url}/api/v1/patient-simple/{patient_id}/profile/"
                # Pas de headers - endpoint public
            )
            
            if response.status_code == 200:
                patient_data = response.json()
                return {
                    'phone_number': patient_data.get('phone_number'),
                    'preferred_language': patient_data.get('preferred_language', 'fr'), 
                    'preferred_contact_method': patient_data.get('preferred_contact_method', 'sms'),
                    'first_name': patient_data.get('first_name', ''),
                    'last_name': patient_data.get('last_name', '')
                }
            else:
                logger.error(f"Erreur API Gateway pour patient {patient_id}: {response.status_code}")
                return None
                
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des infos patient {patient_id}: {e}")
        return None


def calculate_reminder_times(frequency: float) -> List[time]:
    """
    Calcule les heures de rappel basées sur la fréquence quotidienne
    
    Args:
        frequency (float): Nombre de prises par jour (ex: 1.0, 2.0, 3.0, 4.0)
        
    Returns:
        List[time]: Liste des heures de rappel dans la journée
    """
    frequency_schedules = {
        1.0: [time(20, 0)],  # 1 fois/jour -> 20h
        2.0: [time(8, 0), time(20, 0)],  # 2 fois/jour -> 8h, 20h
        3.0: [time(8, 0), time(14, 0), time(20, 0)],  # 3 fois/jour -> 8h, 14h, 20h
        4.0: [time(6, 0), time(12, 0), time(18, 0), time(22, 0)],  # 4 fois/jour -> 6h, 12h, 18h, 22h
        6.0: [time(6, 0), time(10, 0), time(14, 0), time(18, 0), time(20, 0), time(22, 0)]  # 6 fois/jour
    }
    
    # Pour les fréquences non standards, calcul automatique
    if frequency not in frequency_schedules:
        if frequency <= 1:
            return [time(20, 0)]
        elif frequency <= 8:
            # Répartition égale entre 6h et 22h
            interval_hours = 16 / (frequency - 1) if frequency > 1 else 16
            times = []
            for i in range(int(frequency)):
                hour = 6 + (interval_hours * i)
                times.append(time(int(hour), int((hour % 1) * 60)))
            return times
        else:
            # Fréquence très élevée, toutes les 2h entre 6h et 22h
            return [time(h, 0) for h in range(6, 23, 2)]
    
    return frequency_schedules[frequency]


def generate_reminder_dates(start_date, end_date, reminder_times: List[time]) -> List[datetime]:
    """
    Génère toutes les dates/heures de rappel pour la période de traitement
    
    Args:
        start_date: Date de début du traitement
        end_date: Date de fin du traitement
        reminder_times: Heures de rappel dans la journée
        
    Returns:
        List[datetime]: Liste de tous les rappels programmés
    """
    reminder_datetimes = []
    current_date = start_date
    
    while current_date <= end_date:
        for reminder_time in reminder_times:
            reminder_datetime = timezone.make_aware(
                datetime.combine(current_date, reminder_time)
            )
            
            # Ne pas créer de rappels dans le passé
            if reminder_datetime > timezone.now():
                reminder_datetimes.append(reminder_datetime)
        
        current_date += timedelta(days=1)
    
    return reminder_datetimes


def generate_medication_reminders(prescription_id: str) -> Dict:
    """
    Génère tous les rappels pour une prescription donnée
    
    Args:
        prescription_id (str): UUID de la prescription
        
    Returns:
        dict: Résultat de la génération avec statistiques
    """
    try:
        # Récupération de la prescription
        prescription = Prescription.objects.get(prescription_id=prescription_id)
        prescription_medications = prescription.medications.all()
        
        if not prescription_medications:
            logger.warning(f"Aucun médicament trouvé pour la prescription {prescription_id}")
            return {'success': False, 'message': 'Aucun médicament dans la prescription'}
        
        # Récupération du patient_id directement depuis l'appointment
        try:
            from .models import Appointment
            appointment = Appointment.objects.get(appointment_id=prescription.appointment_id)
            patient_id = str(appointment.patient_id)
        except Appointment.DoesNotExist:
            logger.error(f"Appointment {prescription.appointment_id} introuvable pour la prescription {prescription_id}")
            return {'success': False, 'message': 'Appointment introuvable'}
        
        # Récupération des infos patient
        patient_info = get_patient_info(patient_id)
        if not patient_info or not patient_info.get('phone_number'):
            logger.error(f"Informations patient incomplètes pour {patient_id}")
            return {'success': False, 'message': 'Informations patient incomplètes'}
        
        total_reminders = 0
        
        # Génération des rappels pour chaque médicament
        for prescription_med in prescription_medications:
            medication = prescription_med.medication
            
            # Calcul des heures de rappel basées sur la fréquence
            reminder_times = calculate_reminder_times(prescription_med.frequency)
            
            # Génération de toutes les dates/heures de rappel
            reminder_datetimes = generate_reminder_dates(
                prescription_med.start_date,
                prescription_med.end_date,
                reminder_times
            )
            
            # Création des objets Reminder
            for reminder_datetime in reminder_datetimes:
                # Formatage du message selon le canal préféré
                if patient_info['preferred_contact_method'] == 'voice':
                    from .twilio_service import format_voice_reminder
                    message = format_voice_reminder(
                        medication.name,
                        prescription_med.dosage,  # Dosage maintenant dans PrescriptionMedication
                        prescription_med.instructions or "Prenez selon prescription",
                        patient_info['preferred_language']
                    )
                else:  # SMS par défaut
                    from .twilio_service import format_sms_reminder
                    message = format_sms_reminder(
                        medication.name,
                        prescription_med.dosage,  # Dosage maintenant dans PrescriptionMedication
                        prescription_med.instructions or "Prenez selon prescription",
                        patient_info['preferred_language']
                    )
                
                # Création du rappel
                reminder = Reminder.objects.create(
                    channel=patient_info['preferred_contact_method'],
                    scheduled_time=reminder_datetime,
                    message_content=message,
                    language=patient_info['preferred_language'],
                    patient_id=patient_id,
                    prescription_id=prescription_id,
                    status='pending'
                )
                
                total_reminders += 1
                logger.info(f"Rappel créé: {reminder.reminder_id} pour {medication.name} à {reminder_datetime}")
        
        logger.info(f"Génération terminée: {total_reminders} rappels créés pour la prescription {prescription_id}")
        
        return {
            'success': True,
            'message': f'{total_reminders} rappels générés avec succès',
            'total_reminders': total_reminders,
            'prescription_id': prescription_id,
            'patient_id': patient_id
        }
        
    except Prescription.DoesNotExist:
        logger.error(f"Prescription {prescription_id} introuvable")
        return {'success': False, 'message': 'Prescription introuvable'}
    except Exception as e:
        logger.error(f"Erreur lors de la génération des rappels pour {prescription_id}: {e}")
        return {'success': False, 'message': f'Erreur: {str(e)}'}


def get_pending_reminders(limit: int = 100) -> List[Reminder]:
    """
    Récupère les rappels en attente d'envoi
    
    Args:
        limit (int): Nombre maximum de rappels à récupérer
        
    Returns:
        List[Reminder]: Liste des rappels à traiter
    """
    return Reminder.objects.filter(
        status='pending',
        scheduled_time__lte=timezone.now()
    ).order_by('scheduled_time')[:limit]


def update_reminder_status(reminder: Reminder, twilio_result: Dict) -> None:
    """
    Met à jour le statut d'un rappel après tentative d'envoi
    
    Args:
        reminder (Reminder): Instance du rappel
        twilio_result (dict): Résultat de l'envoi Twilio
    """
    try:
        if twilio_result['success']:
            reminder.status = 'sent'
            reminder.twilio_sid = twilio_result['twilio_sid']
            reminder.send_time = timezone.now()
            reminder.delivery_status = twilio_result.get('status', 'sent')
        else:
            reminder.status = 'failed'
            reminder.error_message = twilio_result.get('error_message', 'Envoi échoué')
        
        reminder.save()
        logger.info(f"Statut rappel {reminder.reminder_id} mis à jour: {reminder.status}")
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du statut rappel {reminder.reminder_id}: {e}")


def cancel_prescription_reminders(prescription_id: str) -> Dict:
    """
    Annule tous les rappels futurs d'une prescription
    
    Args:
        prescription_id (str): UUID de la prescription
        
    Returns:
        dict: Résultat de l'annulation
    """
    try:
        # Annule tous les rappels futurs non envoyés
        updated_count = Reminder.objects.filter(
            prescription_id=prescription_id,
            status='pending',
            scheduled_time__gt=timezone.now()
        ).update(status='cancelled')
        
        logger.info(f"{updated_count} rappels annulés pour la prescription {prescription_id}")
        
        return {
            'success': True,
            'message': f'{updated_count} rappels annulés',
            'cancelled_count': updated_count
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'annulation des rappels pour {prescription_id}: {e}")
        return {'success': False, 'message': f'Erreur: {str(e)}'}