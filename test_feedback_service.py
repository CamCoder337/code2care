#!/usr/bin/env python3
"""
Test direct du feedback-service pour les appointments
"""
import requests
import json

def test_feedback_service_direct():
    print("=== 🔍 TEST DIRECT DU FEEDBACK-SERVICE ===\n")
    
    # URL du feedback-service (à adapter selon votre config)
    feedback_service_url = "http://localhost:8001/api/v1/appointments/"  # Port par défaut Django
    
    headers = {
        'Content-Type': 'application/json',
        'X-User-ID': '737d5582-bfdb-43f3-b928-b847f7d462e8',
        'X-User-Type': 'professional',
    }
    
    data = {
        "scheduled": "2025-08-10T15:30:00Z",
        "type": "suivi",
        "patient_id": "d646c7cd-9593-4762-adb4-6cf445eab586",
        "professional_id": "737d5582-bfdb-43f3-b928-b847f7d462e8"
    }
    
    print("📡 Test de communication avec le feedback-service...")
    print(f"URL: {feedback_service_url}")
    print(f"Headers: {headers}")
    print(f"Data: {data}")
    print()
    
    try:
        response = requests.post(
            feedback_service_url,
            headers=headers,
            json=data,
            timeout=10
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ SUCCESS: Appointment créé directement via feedback-service!")
        else:
            print("❌ FAILED: Erreur lors de la création via feedback-service")
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Feedback-service non accessible")
        print("   Vérifiez que le feedback-service est démarré")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_feedback_service_direct()