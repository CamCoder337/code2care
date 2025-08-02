// Fichier : app/patient/layout.tsx

"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation" // Importation de usePathname
import { PatientAuthProvider, usePatientAuth } from "@/components/patient-auth-context"
import { Loader2 } from "lucide-react"

/**
 * Ce composant interne gère la logique de protection.
 * Il doit être un enfant de PatientAuthProvider pour pouvoir utiliser le hook.
 */
function PatientAuthGuard({ children }: { children: ReactNode }) {
    // 1. On récupère tous les hooks nécessaires sans condition
    const { isAuthenticated, isLoading } = usePatientAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // On s'assure de ne pas rediriger si on est déjà sur la page de connexion
        if (!isLoading && !isAuthenticated && pathname !== "/patient/login") {
            router.replace("/patient/login")
        }
    }, [isLoading, isAuthenticated, router, pathname])

    // 2. On utilise une logique de rendu conditionnelle claire

    // Cas 1: Si on est sur la page de connexion, on l'affiche directement sans protection.
    if (pathname === "/patient/login") {
        return <>{children}</>
    }

    // Cas 2: Si on est sur une page protégée et que l'état d'authentification charge
    // ou que l'utilisateur n'est pas connecté (avant la redirection), on affiche un loader.
    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    // Cas 3: Si tout est en ordre (page protégée, utilisateur connecté), on affiche la page.
    return <>{children}</>
}

/**
 * C'est le layout principal pour la section patient.
 * Il fournit le contexte d'authentification et utilise le garde pour protéger ses enfants.
 */
export default function PatientLayout({ children }: { children: ReactNode }) {
    return (
        <PatientAuthProvider>
            <PatientAuthGuard>{children}</PatientAuthGuard>
        </PatientAuthProvider>
    )
}