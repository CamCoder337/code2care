"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Loader2 } from "lucide-react"

/**
 * Ce composant interne gère l'interface utilisateur et la logique de protection.
 * Il est un enfant de AuthProvider et peut donc utiliser useAuth() en toute sécurité.
 */
function ProfessionalAuthGuard({ children }: { children: ReactNode }) {
    // --- 1. Appel de tous les Hooks sans condition ---
    const { professional, logout, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    // --- 2. Logique des effets de bord (useEffect) pour la protection ---
    useEffect(() => {
        // Si le chargement est terminé et que l'utilisateur n'est PAS authentifié...
        // ... et qu'on n'est pas déjà sur la page de login...
        if (!isLoading && !isAuthenticated && pathname !== "/professional/login") {
            // ...on le redirige.
            router.replace("/professional/login")
        }
    }, [isLoading, isAuthenticated, router, pathname])

    // --- 3. Logique de rendu conditionnelle ---

    // Cas 1: Si on est sur la page de login, on affiche simplement le formulaire.
    if (pathname === "/professional/login") {
        return <>{children}</>
    }

    // Cas 2: Si on charge les données ou si l'utilisateur n'est pas encore authentifié
    // (avant que le useEffect ne le redirige), on affiche un loader.
    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    // Cas 3: L'utilisateur est authentifié. On affiche le layout complet.
    const handleLogout = () => {
        logout()
        // La redirection est maintenant gérée par le useEffect ci-dessus qui détectera
        // le changement de `isAuthenticated`.
    }

    // Prépare les données utilisateur pour la Sidebar.
    const currentUser = {
        firstName: professional?.first_name || "Dr.",
        lastName: professional?.last_name || "Utilisateur",
        department: professional?.specialization || "Spécialité",
        avatarUrl: "", // Vous pouvez ajouter une URL d'avatar si elle est disponible.
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                onLogout={handleLogout}
                currentUser={currentUser}
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
            />
            <main
                className={`flex-1 overflow-y-auto transition-all duration-300 ${
                    collapsed ? "lg:ml-20" : "lg:ml-80"
                }`}
            >
                {/* Espace réservé pour le bouton de menu mobile en position 'fixed' */}
                <div className="h-16 lg:hidden" />
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    )
}

/**
 * C'est le layout principal pour la section professionnelle.
 * Son seul rôle est de fournir le contexte d'authentification et de déléguer
 * le reste au composant garde.
 */
export default function ProfessionalLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ProfessionalAuthGuard>{children}</ProfessionalAuthGuard>
        </AuthProvider>
    )
}