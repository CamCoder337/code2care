#!/usr/bin/env python3
"""
Test de l'authentification et autorisation pour les appointments
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, Patient, Professional

def test_user_detection():
    print("=== 🔍 TEST DE DÉTECTION DU TYPE D'UTILISATEUR ===\n")
    
    # Test avec le user_id du token
    user_id = "a1c14a1e-6062-4d1e-952d-e8de3f4f3da2"
    
    try:
        user = User.objects.get(id=user_id)
        print(f"👤 Utilisateur trouvé: {user.username}")
        print(f"📋 Type dans le modèle: {user.user_type}")
        print(f"✅ Est actif: {user.is_active}")
        print()
        
        # Simulation de la nouvelle logique
        print("=== 🧪 TEST DE LA NOUVELLE LOGIQUE ===")
        user_type = None
        user_id_final = None
        
        if user.user_type == 'patient':
            print("🔄 Détection: Patient")
            try:
                patient = Patient.objects.get(user=user)
                user_type = 'patient'
                user_id_final = str(patient.patient_id)
                print(f"✅ Patient ID: {user_id_final}")
            except Patient.DoesNotExist:
                print("❌ ERREUR: Profil patient manquant")
                
        elif user.user_type == 'professional':
            print("🔄 Détection: Professional")
            try:
                professional = Professional.objects.get(user=user)
                user_type = 'professional'
                user_id_final = str(professional.professional_id)
                print(f"✅ Professional ID: {user_id_final}")
            except Professional.DoesNotExist:
                print("❌ ERREUR: Profil professionnel manquant")
                
        elif user.user_type == 'admin':
            print("🔄 Détection: Admin")
            user_type = 'admin'
            user_id_final = str(user.id)
            print(f"✅ Admin ID: {user_id_final}")
        else:
            print(f"❌ Type non supporté: {user.user_type}")
            
        print()
        print("=== 📊 RÉSULTAT FINAL ===")
        print(f"user_type: {user_type}")
        print(f"user_id: {user_id_final}")
        
        # Test d'autorisation pour appointments
        print()
        print("=== 🔐 TEST D'AUTORISATION APPOINTMENTS ===")
        if user_type in ['professional', 'admin']:
            print("✅ AUTORISÉ à créer des appointments")
        else:
            print("❌ NON AUTORISÉ à créer des appointments")
            print(f"   Type reçu: {user_type}")
            print(f"   Types autorisés: ['professional', 'admin']")
        
    except User.DoesNotExist:
        print(f"❌ Utilisateur {user_id} introuvable!")
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")

if __name__ == "__main__":
    test_user_detection()