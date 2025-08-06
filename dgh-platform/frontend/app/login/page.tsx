"use client"

import {useEffect} from "react"
import {useRouter} from "next/navigation"
import {useAuthStore} from "@/stores/auth-store"
import {UnifiedLoginForm} from "@/components/unified-login-form"
import {Loader2} from "lucide-react"

export default function LoginPage() {
    const {user, isLoading, hasHydrated, redirectToRoleDashboard} = useAuthStore()
    const router = useRouter()
    const isAuthenticated = !!user

    useEffect(() => {
        if (hasHydrated && !isLoading && isAuthenticated) {
            redirectToRoleDashboard()
        }
    }, [hasHydrated, isAuthenticated, isLoading, redirectToRoleDashboard])

    if (!hasHydrated || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        )
    }

    if (isAuthenticated) {
        return null // Redirection en cours
    }

    return <UnifiedLoginForm/>
}