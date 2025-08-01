// Fichier : app/patient/login/page.tsx

"use client"

import { PatientLoginForm } from "@/components/patient-login-form"
import { usePatientAuth } from "@/components/patient-auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function PatientLoginPage() {
  // Renommons `isLoading` en `isAuthLoading` pour plus de clarté.
  // Il représente le chargement de l'état d'authentification, pas la soumission du formulaire.
  const { isAuthenticated, isLoading: isAuthLoading } = usePatientAuth()
  const router = useRouter()

  useEffect(() => {
    // Cette logique de redirection est parfaite et ne change pas.
    if (!isAuthLoading && isAuthenticated) {
      router.push("/patient/home")
    }
  }, [isAuthenticated, isAuthLoading, router])

  // 1. Gérer l'état de chargement initial de la page.
  // Ceci s'affiche uniquement la première fois que la page est chargée.
  if (isAuthLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  // 2. Si l'utilisateur est déjà authentifié, on ne montre rien pendant la redirection.
  if (isAuthenticated) {
    return null
  }

  // 3. Si le chargement initial est terminé et que l'utilisateur n'est pas authentifié,
  // on affiche TOUJOURS le formulaire. Le formulaire gérera son propre état de chargement sur le bouton.
  return <PatientLoginForm />
}