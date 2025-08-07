#!/usr/bin/env python3
"""
Test spécifique du POST sur API Gateway vs Feedback-Service
"""
import requests
import json

def test_post_appointments():
    print("=== 📝 TEST POST APPOINTMENTS ===\n")
    
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0NTQwMTQ0LCJpYXQiOjE3NTQ0NTM3NDQsImp0aSI6IjcwMDAyMjFiMGNjYzQxYmRhN2M0ZjBiZmMyNTIyMTEwIiwidXNlcl9pZCI6ImExYzE0YTFlLTYwNjItNGQxZS05NTJkLWU4ZGUzZjRmM2RhMiJ9.6S6Idi8pLwviOiKFSV7npedUqdMYjZufUKjYQt7Frxc"
    
    appointment_data = {
        "scheduled": "2025-08-10T15:30:00Z",
        "type": "suivi",
        "patient_id": "d646c7cd-9593-4762-adb4-6cf445eab586",
        "professional_id": "737d5582-bfdb-43f3-b928-b847f7d462e8"
    }
    
    print("1️⃣ TEST API Gateway POST (port 8000):")
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/appointments/",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json=appointment_data,
            timeout=10
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
    except Exception as e:
        print(f"  Error: {e}")
    
    print("\n" + "="*50)
    
    print("2️⃣ TEST Feedback-Service POST direct (port 8001):")
    try:
        response = requests.post(
            "http://localhost:8001/api/v1/appointments/",
            headers={
                "Content-Type": "application/json",
                "X-User-Type": "professional",
                "X-User-ID": "737d5582-bfdb-43f3-b928-b847f7d462e8"
            },
            json=appointment_data,
            timeout=10
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    test_post_appointments()