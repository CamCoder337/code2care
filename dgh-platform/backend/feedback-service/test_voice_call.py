#!/usr/bin/env python
"""
Script de test pour les appels vocaux Twilio
Usage: python test_voice_call.py
"""

import os
import django
import uuid
from datetime import timedelta
from django.utils import timezone

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.feedback.models import Reminder
from apps.feedback.twilio_service import format_voice_reminder


def create_voice_reminder():
    """Crée un rappel vocal immédiat"""
    print("📞 CRÉATION D'UN RAPPEL VOCAL POUR TEST TWILIO")
    
    # Programmer le rappel pour maintenant (éligible immédiatement)
    scheduled_time = timezone.now() - timedelta(minutes=1)
    print(f"Rappel programmé pour: {scheduled_time.strftime('%H:%M:%S')} UTC")
    
    # Votre numéro de téléphone
    test_phone = input("Entrez votre numéro (+237XXXXXXXXX): ").strip()
    if not test_phone.startswith('+'):
        test_phone = '+237' + test_phone.lstrip('0')
    
    # Message vocal de test
    message = format_voice_reminder(
        medication_name="Paracétamol TEST VOCAL",
        dosage="500mg",
        instructions="Test système vocal complet",
        language='fr'
    )
    
    # Créer le rappel VOCAL
    reminder = Reminder.objects.create(
        channel='voice',  # APPEL VOCAL
        scheduled_time=scheduled_time,
        message_content=message,
        language='fr',
        patient_id='8abba6ba-cc84-429a-9ded-92f89c5e7a43',  # Patient de test existant
        prescription_id=uuid.uuid4(),
        status='pending'
    )
    
    print(f"✅ Rappel VOCAL créé: {reminder.reminder_id}")
    print(f"📞 Canal: {reminder.channel}")
    print(f"📱 Numéro: {test_phone}")
    print(f"🗣️  Message vocal: {message[:100]}...")
    print("\n📞 SURVEILLEZ VOTRE TÉLÉPHONE - Vous devriez recevoir un APPEL dans 1-5 minutes")
    print("⏰ Celery Beat va traiter ce rappel automatiquement")
    
    return reminder


if __name__ == "__main__":
    create_voice_reminder()