#!/usr/bin/env python
"""
Script de test IMMÉDIAT pour Twilio - programme un rappel dans 2 minutes
Usage: python test_twilio_immediate.py
"""

import os
import django
import sys
import uuid
from datetime import datetime, timedelta
from django.utils import timezone

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.feedback.models import Reminder
from apps.feedback.twilio_service import format_sms_reminder


def create_immediate_reminder():
    """Crée un rappel pour dans 2 minutes"""
    print("🚀 CRÉATION D'UN RAPPEL IMMÉDIAT POUR TEST TWILIO")
    
    now_utc = timezone.now()
    now_local = datetime.now()
    
    print(f"Heure UTC (Django): {now_utc.strftime('%H:%M:%S')}")
    print(f"Heure locale: {now_local.strftime('%H:%M:%S')}")
    
    # Programmer le rappel dans 2 minutes
    scheduled_time = now_utc + timedelta(minutes=2)
    scheduled_local = now_local + timedelta(minutes=2)
    
    print(f"Rappel programmé pour: {scheduled_time.strftime('%H:%M:%S')} UTC")
    print(f"Soit en heure locale: {scheduled_local.strftime('%H:%M:%S')}")
    
    # Votre vrai numéro de téléphone pour le test
    test_phone = input("Entrez votre numéro de téléphone (format: +237XXXXXXXXX): ").strip()
    if not test_phone.startswith('+'):
        test_phone = '+237' + test_phone.lstrip('0')
    
    # Message de test
    message = format_sms_reminder(
        medication_name="Paracétamol TEST",
        dosage="500mg",
        instructions="Test immédiat du système",
        language='fr'
    )
    
    # Créer le rappel avec des UUIDs valides
    test_patient_id = uuid.uuid4()
    test_prescription_id = uuid.uuid4()
    
    reminder = Reminder.objects.create(
        channel='sms',
        scheduled_time=scheduled_time,
        message_content=message,
        language='fr',
        patient_id=test_patient_id,
        prescription_id=test_prescription_id,
        status='pending'
    )
    
    print(f"✅ Rappel créé avec ID: {reminder.reminder_id}")
    print(f"📱 Numéro: {test_phone}")
    print(f"💬 Message: {message}")
    print(f"⏰ Sera envoyé à: {scheduled_time.strftime('%H:%M:%S')} UTC ({scheduled_local.strftime('%H:%M:%S')} heure locale)")
    
    print("\n🔄 Pour que le rappel soit envoyé, assurez-vous que:")
    print("1. Redis fonctionne")
    print("2. Celery worker tourne (celery -A config worker -l info)")
    print("3. Celery beat tourne (celery -A config beat -l info)")
    print("4. Twilio est configuré dans settings.py")
    
    print(f"\n⏱️  Surveillez votre téléphone dans 2 minutes (vers {scheduled_local.strftime('%H:%M')} heure locale)")
    
    return reminder


if __name__ == "__main__":
    create_immediate_reminder()