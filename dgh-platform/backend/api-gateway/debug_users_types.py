from apps.users.models import User, Patient, Professional

print("\n=== 🧪 DÉBOGAGE DES TYPES D'UTILISATEURS ===\n")

users = User.objects.all()
print(f'Total d\'utilisateurs: {users.count()}')
print("=" * 40)

for user in users[:3]:  # Limiter à 3 pour le debug
    print(f"👤 Utilisateur: {user.username}")
    print(f"   ➤ Type: {user.user_type}")

    if user.user_type == 'professional':
        try:
            prof = Professional.objects.get(user=user)
            print(f"   ✅ ID Professionnel: {prof.professional_id}")
        except Professional.DoesNotExist:
            print("   ❌ ERREUR: Profil professionnel manquant!")

    elif user.user_type == 'patient':
        try:
            pat = Patient.objects.get(user=user)
            print(f"   ✅ ID Patient: {pat.patient_id}")
        except Patient.DoesNotExist:
            print("   ❌ ERREUR: Profil patient manquant!")

    else:
        print("   ⚠️ Type d'utilisateur inconnu ou non géré.")

    print("-" * 40)
