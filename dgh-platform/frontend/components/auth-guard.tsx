"use client"

import {ReactNode, useEffect} from "react"
import {useRouter} from "next/navigation"
import {useAuthStore, type UserRole} from "@/stores/auth-store"
import {Loader2} from "lucide-react"

interface AuthGuardProps {
    children: ReactNode
    allowedRoles: UserRole[]
    fallbackPath?: string
    showUnauthorized?: boolean
}

export function AuthGuard({
                              children,
                              allowedRoles,
                              fallbackPath = "/",
                              showUnauthorized = false
                          }: AuthGuardProps) {
    const {user, isLoading, hasHydrated, hasRole} = useAuthStore()
    const router = useRouter()

    const isAuthenticated = !!user

    useEffect(() => {
        if (!hasHydrated || isLoading) return

        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        if (!allowedRoles.some(role => hasRole(role))) {
            if (user?.role === 'patient') {
                router.push("/patient/home")
            } else if (user?.role === 'professional') {
                router.push("/professional/dashboard")
            } else {
                router.push(fallbackPath)
            }
            return
        }
    }, [hasHydrated, isLoading, isAuthenticated, user, hasRole, allowedRoles, router, fallbackPath])

    if (!hasHydrated || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null // Redirection en cours
    }

    if (!allowedRoles.some(role => hasRole(role))) {
        if (showUnauthorized) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-background">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
                        <p className="text-muted-foreground">
                            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                        </p>
                    </div>
                </div>
            )
        }
        return null // Redirection en cours
    }

    return <>{children}</>
}

// Composants de garde spécialisés pour plus de simplicité
export function PatientGuard({children}: { children: ReactNode }) {
    return <AuthGuard allowedRoles={['patient']}>{children}</AuthGuard>
}

export function ProfessionalGuard({children}: { children: ReactNode }) {
    return <AuthGuard allowedRoles={['professional']}>{children}</AuthGuard>
}