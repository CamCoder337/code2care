"use client"

import {usePatientAuth} from "@/components/patient-auth-context"
import {useRouter} from "next/navigation"
import {useEffect} from "react"
import {Loader2} from "lucide-react"

// Ce composant va "envelopper" les pages qui nécessitent une authentification
export function ProtectedRoute({children}: { children: React.ReactNode }) {
    const {isAuthenticated, isLoading} = usePatientAuth()
    const router = useRouter()

    useEffect(() => {
        // On attend que le chargement initial soit terminé
        if (!isLoading) {
            // Si le chargement est terminé et que l'utilisateur n'est PAS authentifié...
            if (!isAuthenticated) {
                // ...on le redirige vers la page de connexion.
                router.push("/patient/login")
            }
        }
    }, [isLoading, isAuthenticated, router]) // Dépendances de l'effet

    // 1. Pendant que le contexte vérifie l'authentification, on affiche un loader.
    // C'est la clé pour éviter la redirection prématurée.
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
            </div>
        )
    }

    // 2. Si le chargement est terminé et que l'utilisateur est authentifié, on affiche la page.
    if (isAuthenticated) {
        return <>{children}</>
    }

    // 3. Si le chargement est terminé mais l'utilisateur n'est pas authentifié,
    // on ne rend rien en attendant que le `useEffect` fasse la redirection.
    return null
}