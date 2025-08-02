#!/usr/bin/env python
"""
Test manuel - lance immédiatement le traitement des rappels
"""

import os
import django
import uuid
from datetime import datetime, timedelta
from django.utils import timezone

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.feedback.models import Reminder
from apps.feedback.tasks import send_medication_reminder
from apps.feedback.twilio_service import format_sms_reminder


def create_and_process_immediate_reminder():
    """Crée un rappel et le traite immédiatement"""
    print("🚀 TEST MANUEL - CRÉATION ET TRAITEMENT IMMÉDIAT")
    
    # Programmer le rappel pour maintenant (il sera immédiatement éligible)
    scheduled_time = timezone.now() - timedelta(seconds=10)  # 10 secondes dans le passé
    print(f"Rappel programmé pour: {scheduled_time.strftime('%H:%M:%S')} UTC")
    
    # Votre numéro
    test_phone = input("Entrez votre numéro (+237XXXXXXXXX): ").strip()
    if not test_phone.startswith('+'):
        test_phone = '+237' + test_phone.lstrip('0')
    
    # Message de test  
    message = format_sms_reminder(
        medication_name="TEST MANUEL",
        dosage="500mg", 
        instructions="Test manuel immédiat",
        language='fr'
    )
    
    # Créer le rappel avec des UUIDs valides
    reminder = Reminder.objects.create(
        channel='sms',
        scheduled_time=scheduled_time,
        message_content=message,
        language='fr',
        patient_id=uuid.uuid4(),
        prescription_id=uuid.uuid4(),
        status='pending'
    )
    
    print(f"✅ Rappel créé: {reminder.reminder_id}")
    print(f"📱 Numéro: {test_phone}")  
    print(f"💬 Message: {message}")
    
    # Vérifier qu'il est bien éligible
    from apps.feedback.reminder_service import get_pending_reminders
    pending = get_pending_reminders(limit=10)
    
    eligible_reminder = next((r for r in pending if r.reminder_id == reminder.reminder_id), None)
    
    if eligible_reminder:
        print("✅ Rappel éligible pour traitement")
        
        # ÉTAPE 1: Simuler get_patient_info pour retourner le bon numéro
        from unittest.mock import patch
        mock_patient_info = {
            'phone_number': test_phone,
            'preferred_language': 'fr',
            'preferred_contact_method': 'sms',
            'first_name': 'Test',
            'last_name': 'Manuel'
        }
        
        print("🔄 Lancement du traitement manuel...")
        
        # ÉTAPE 2: Traiter manuellement le rappel 
        with patch('apps.feedback.reminder_service.get_patient_info', return_value=mock_patient_info):
            try:
                # Lancer directement la tâche d'envoi (sans .delay() pour exécution synchrone)
                result = send_medication_reminder(str(reminder.reminder_id))
                print(f"📤 Résultat envoi: {result}")
                
                # Vérifier le statut final
                reminder.refresh_from_db()
                print(f"📊 Statut final: {reminder.status}")
                if reminder.twilio_sid:
                    print(f"📞 Twilio SID: {reminder.twilio_sid}")
                
            except Exception as e:
                print(f"❌ Erreur durant l'envoi: {e}")
                import traceback
                traceback.print_exc()
    else:
        print("❌ Rappel non éligible - vérifiez l'heure")
        
    return reminder


if __name__ == "__main__":
    create_and_process_immediate_reminder()