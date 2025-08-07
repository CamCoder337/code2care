#!/usr/bin/env python
"""
Script pour créer un patient de test dans l'API Gateway
"""

import os
import django
import uuid
from datetime import date

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, Patient


def create_test_patient():
    """Crée un patient de test avec votre numéro"""
    
    # Créer un utilisateur de base
    test_user, created = User.objects.get_or_create(
        phone_number='+237654260994',
        defaults={
            'username': 'test_patient_654260994',
            'user_type': 'patient',
            'is_verified': True,
            'email': 'test@example.com'
        }
    )
    
    if created:
        test_user.set_password('testpassword123')
        test_user.save()
        print(f"✅ Utilisateur créé: {test_user.id}")
    else:
        print(f"📋 Utilisateur existant: {test_user.id}")
    
    # Créer le profil patient
    test_patient, created = Patient.objects.get_or_create(
        user=test_user,
        defaults={
            'first_name': 'Test',
            'last_name': 'Patient',
            'date_of_birth': date(1990, 1, 1),
            'gender': 'M',
            'preferred_language': 'fr',
            'preferred_contact_method': 'sms'
        }
    )
    
    if created:
        print(f"✅ Patient créé: {test_patient.patient_id}")
    else:
        print(f"📋 Patient existant: {test_patient.patient_id}")
    
    print(f"\n📱 Numéro: {test_user.phone_number}")
    print(f"🆔 Patient ID: {test_patient.patient_id}")
    print(f"👤 Nom: {test_patient.first_name} {test_patient.last_name}")
    print(f"🗣️  Langue: {test_patient.preferred_language}")
    print(f"📞 Contact: {test_patient.preferred_contact_method}")
    
    return test_patient


if __name__ == "__main__":
    print("🚀 CRÉATION D'UN PATIENT DE TEST")
    patient = create_test_patient()
    
    print(f"\n🔗 Test de l'endpoint:")
    print(f"GET /api/v1/patient/{patient.patient_id}/profile/")
    print("Cet endpoint devrait maintenant retourner les infos du patient")