#!/usr/bin/env python3
"""
Test direct du code de création d'appointment 
"""

# Simulation du request.user
class MockUser:
    def __init__(self, user_type, user_id):
        self.user_type = user_type
        self.id = user_id
        self.is_active = True

# Simulation d'un utilisateur professional
mock_user = MockUser('professional', 'a1c14a1e-6062-4d1e-952d-e8de3f4f3da2')

# Test de la logique
user_type = None
user_id = None

try:
    if mock_user.user_type == 'patient':
        print("👤 Détecté comme patient")
        user_type = 'patient'
        user_id = str(mock_user.id)  # En réalité, patient.patient_id
    elif mock_user.user_type == 'professional':
        print("👨‍⚕️ Détecté comme professional") 
        user_type = 'professional'
        user_id = str(mock_user.id)  # En réalité, professional.professional_id
    elif mock_user.user_type == 'admin':
        print("👑 Détecté comme admin")
        user_type = 'admin'
        user_id = str(mock_user.id)
    else:
        print("❌ Type d'utilisateur non supporté")
        
    print(f"✅ Résultat final: user_type={user_type}, user_id={user_id}")
    
except Exception as e:
    print(f"❌ Erreur: {e}")