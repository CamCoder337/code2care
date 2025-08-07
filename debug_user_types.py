#!/usr/bin/env python3
"""
Script de débogage pour vérifier les types d'utilisateurs
"""
import os
import sys
import django

# Configuration Django
sys.path.append('/home/camcoder/projects/datathon/HIGH5_Code2care/dgh-platform/backend/api-gateway')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, Patient, Professional

def debug_users():
    print("=== DÉBOGAGE DES TYPES D'UTILISATEURS ===\n")
    
    # Afficher tous les utilisateurs
    users = User.objects.all()
    print(f"Total des utilisateurs: {users.count()}\n")
    
    for user in users:
        print(f"User ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Phone: {user.phone_number}")
        print(f"User Type (model): {user.user_type}")
        print(f"Is Active: {user.is_active}")
        
        # Vérifier les profils associés
        try:
            if user.user_type == 'patient':
                patient = Patient.objects.get(user=user)
                print(f"Patient ID: {patient.patient_id}")
                print(f"Patient Name: {patient.first_name} {patient.last_name}")
            elif user.user_type == 'professional':
                professional = Professional.objects.get(user=user)
                print(f"Professional ID: {professional.professional_id}")
                print(f"Professional Name: Dr. {professional.first_name} {professional.last_name}")
        except (Patient.DoesNotExist, Professional.DoesNotExist) as e:
            print(f"ERREUR: Profil manquant pour user_type={user.user_type}: {e}")
        
        print("-" * 50)

if __name__ == "__main__":
    debug_users()