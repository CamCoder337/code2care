#!/usr/bin/env python3
"""
Test de l'authentification JWT sur l'API Gateway
"""
import requests

def test_api_gateway_auth():
    print("=== 🔐 TEST AUTHENTIFICATION API GATEWAY ===\n")
    
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0NTQwMTQ0LCJpYXQiOjE3NTQ0NTM3NDQsImp0aSI6IjcwMDAyMjFiMGNjYzQxYmRhN2M0ZjBiZmMyNTIyMTEwIiwidXNlcl9pZCI6ImExYzE0YTFlLTYwNjItNGQxZS05NTJkLWU4ZGUzZjRmM2RhMiJ9.6S6Idi8pLwviOiKFSV7npedUqdMYjZufUKjYQt7Frxc"
    
    # Test sur API Gateway (port 8000)
    print("📡 Test API Gateway (port 8000):")
    try:
        response = requests.get(
            "http://localhost:8000/api/v1/appointments/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}...")
    except Exception as e:
        print(f"  Error: {e}")
    
    print()
    
    # Test sur Feedback-Service direct (port 8001) avec headers
    print("📡 Test Feedback-Service direct (port 8001) avec headers:")
    try:
        response = requests.get(
            "http://localhost:8001/api/v1/appointments/",
            headers={
                "X-User-Type": "professional",
                "X-User-ID": "737d5582-bfdb-43f3-b928-b847f7d462e8"
            },
            timeout=5
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}...")
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    test_api_gateway_auth()