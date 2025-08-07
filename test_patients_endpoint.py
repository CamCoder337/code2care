#!/usr/bin/env python3
"""
Script de test pour l'endpoint de liste des patients avec pagination et recherche
"""
import requests
import json

def test_patients_endpoint():
    print("=== 🧪 TEST ENDPOINT PATIENTS AVEC PAGINATION ET RECHERCHE ===\n")
    
    # Token d'un professionnel (nécessaire pour accéder à la liste des patients)
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0NTQwMTQ0LCJpYXQiOjE3NTQ0NTM3NDQsImp0aSI6IjcwMDAyMjFiMGNjYzQxYmRhN2M0ZjBiZmMyNTIyMTEwIiwidXNlcl9pZCI6ImExYzE0YTFlLTYwNjItNGQxZS05NTJkLWU4ZGUzZjRmM2RhMiJ9.6S6Idi8pLwviOiKFSV7npedUqdMYjZufUKjYQt7Frxc"
    
    base_url = "http://localhost:8000/api/v1/patients/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    test_cases = [
        {
            "name": "1️⃣ Liste basique (page 1)",
            "params": {}
        },
        {
            "name": "2️⃣ Pagination (page 1, taille 5)",
            "params": {"page": 1, "page_size": 5}
        },
        {
            "name": "3️⃣ Recherche par prénom",
            "params": {"search": "admin", "page_size": 10}
        },
        {
            "name": "4️⃣ Tri par nom de famille (décroissant)",
            "params": {"ordering": "-last_name", "page_size": 10}
        },
        {
            "name": "5️⃣ Recherche par téléphone",
            "params": {"search": "123", "page_size": 10}
        },
        {
            "name": "6️⃣ Page 2 avec recherche",
            "params": {"page": 2, "page_size": 2, "search": "admin"}
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"{test_case['name']}")
        
        try:
            response = requests.get(
                base_url,
                headers=headers,
                params=test_case['params'],
                timeout=10
            )
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Afficher les métadonnées de pagination
                print(f"  📊 Métadonnées:")
                print(f"    - Total: {data.get('count', 'N/A')}")
                print(f"    - Pages: {data.get('num_pages', 'N/A')}")
                print(f"    - Page courante: {data.get('current_page', 'N/A')}")
                print(f"    - Taille de page: {data.get('page_size', 'N/A')}")
                print(f"    - Page suivante: {data.get('next_page', 'N/A')}")
                print(f"    - Page précédente: {data.get('previous_page', 'N/A')}")
                
                # Afficher quelques résultats
                results = data.get('results', [])
                print(f"  📋 Résultats ({len(results)} patients):")
                
                for j, patient in enumerate(results[:3]):  # Limiter à 3 pour la lisibilité
                    print(f"    {j+1}. {patient.get('first_name')} {patient.get('last_name')}")
                    print(f"       ID: {patient.get('patient_id', 'N/A')[:8]}...")
                    print(f"       Téléphone: {patient.get('user', {}).get('phone_number', 'N/A')}")
                
                if len(results) > 3:
                    print(f"    ... et {len(results) - 3} autres patients")
                    
            else:
                print(f"  ❌ Erreur: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Erreur de connexion: {e}")
        
        print("-" * 50)
    
    # Test des erreurs
    print("\n=== 🚫 TESTS D'ERREURS ===\n")
    
    # Test sans authentification
    print("7️⃣ Test sans authentification")
    try:
        response = requests.get(base_url, timeout=5)
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:100]}...")
    except Exception as e:
        print(f"  Erreur: {e}")
    
    print("-" * 50)
    
    # Test avec paramètres invalides
    print("8️⃣ Test avec paramètres invalides")
    try:
        response = requests.get(
            base_url,
            headers=headers,
            params={"page": "abc", "page_size": 1000},
            timeout=5
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}...")
    except Exception as e:
        print(f"  Erreur: {e}")

if __name__ == "__main__":
    test_patients_endpoint()