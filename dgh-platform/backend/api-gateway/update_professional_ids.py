#!/usr/bin/env python
"""
Script pour mettre à jour les professional_id existants du format "PRO..." vers des UUID
À exécuter une seule fois après le changement du modèle
"""

import os
import sys
import django
import uuid

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import Professional
from django.db import connection

def update_professional_ids():
    """Met à jour tous les professional_id du format PRO vers UUID"""
    
    # Utiliser une requête SQL brute pour éviter les validations Django
    with connection.cursor() as cursor:
        # Vérifier combien de professionnels ont l'ancien format
        cursor.execute("SELECT COUNT(*) FROM professionals WHERE professional_id LIKE 'PRO%'")
        count = cursor.fetchone()[0]
        
        print(f"Trouvé {count} professionnels avec l'ancien format d'ID")
        
        if count == 0:
            print("✅ Aucun professionnel à mettre à jour")
            return
        
        # Récupérer les professionnels avec l'ancien format
        cursor.execute("""
            SELECT user_id, professional_id, first_name, last_name 
            FROM professionals 
            WHERE professional_id LIKE 'PRO%'
        """)
        
        professionals_data = cursor.fetchall()
        updated_count = 0
        
        for user_id, old_id, first_name, last_name in professionals_data:
            # Générer un nouveau UUID
            new_uuid = str(uuid.uuid4())
            
            # Mettre à jour directement en base
            cursor.execute("""
                UPDATE professionals 
                SET professional_id = %s 
                WHERE user_id = %s
            """, [new_uuid, user_id])
            
            print(f"✓ Professionnel {first_name} {last_name}: {old_id} → {new_uuid}")
            updated_count += 1
        
        print(f"\n✅ Mise à jour terminée! {updated_count} professionnels mis à jour.")
        
        # Vérification finale
        cursor.execute("SELECT COUNT(*) FROM professionals WHERE professional_id LIKE 'PRO%'")
        remaining = cursor.fetchone()[0]
        
        if remaining > 0:
            print(f"⚠️  Attention: {remaining} professionnels ont encore l'ancien format")
        else:
            print("✅ Tous les professional_id utilisent maintenant le format UUID")

if __name__ == "__main__":
    try:
        update_professional_ids()
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour: {e}")
        sys.exit(1)