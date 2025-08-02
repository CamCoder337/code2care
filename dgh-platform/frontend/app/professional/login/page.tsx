// Fichier : app/professional/login/page.tsx

"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Login } from "@/components/login"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()

    // Ce hook est la clé : il surveille l'état d'authentification.
    // Dès que `isAuthenticated` devient `true`, il redirige.
    useEffect(() => {
        // On ne redirige que si l'authentification est réussie et que le chargement est terminé.
        if (!isLoading && isAuthenticated) {
            router.push("/professional/dashboard")
        }
    }, [isAuthenticated, isLoading, router])

    return <Login />
}