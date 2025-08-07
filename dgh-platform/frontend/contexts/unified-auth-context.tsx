"use client"

import React, {createContext, useCallback, useContext, useEffect, useState} from "react"
import {useRouter} from "next/navigation"

// Helper function pour les cookies CSRF
function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null

    let cookieValue = null
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";")
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    return cookieValue
}

// Types unifiés
export type UserRole = 'patient' | 'professional'

export interface BaseUser {
    id: string
    first_name: string
    last_name: string
    username: string
    email?: string
    role: UserRole
}

export interface PatientUser extends BaseUser {
    role: 'patient'
    patient_id: string
}

export interface ProfessionalUser extends BaseUser {
    role: 'professional'
    professional_id: string
    specialization: string
    department_id: string
    date_of_birth: string
    gender: string
    phone: string
}

export type User = PatientUser | ProfessionalUser

interface AuthContextType {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    role: UserRole | null
    login: (username: string, password: string) => Promise<User | null>
    logout: () => void
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    hasRole: (requiredRole: UserRole) => boolean
    redirectToRoleDashboard: () => void
}

const UnifiedAuthContext = createContext<AuthContextType | undefined>(undefined)

export function UnifiedAuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [refreshToken, setRefreshToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Récupération des données depuis localStorage au montage
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem("user")
            const savedAccessToken = localStorage.getItem("accessToken")
            const savedRefreshToken = localStorage.getItem("refreshToken")

            if (savedUser && savedAccessToken) {
                setUser(JSON.parse(savedUser))
                setAccessToken(savedAccessToken)
                setRefreshToken(savedRefreshToken)
            }
        } catch (e) {
            console.error("Failed to parse auth data from localStorage", e)
            localStorage.clear()
        } finally {
            setIsLoading(false)
        }
    }, [])

    const login = useCallback(async (username: string, password: string): Promise<User | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const csrftoken = getCookie("csrftoken")
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                Accept: "application/json",
            }

            if (csrftoken) {
                headers["X-CSRFToken"] = csrftoken
            }

            const response = await fetch("https://high5-gateway.onrender.com/api/v1/auth/login/", {
                method: "POST",
                headers,
                body: JSON.stringify({username, password}),
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Nom d'utilisateur ou mot de passe incorrect.")
                }
                throw new Error(data.detail || `Erreur: ${response.statusText}`)
            }

            let userData: User

            // Détection automatique du rôle basée sur la structure de réponse
            if (data.profile && data.profile.professional_id) {
                // C'est un professionnel
                userData = {
                    id: data.user.id || data.profile.professional_id,
                    professional_id: data.profile.professional_id,
                    first_name: data.profile.first_name,
                    last_name: data.profile.last_name,
                    username: data.user.username,
                    email: data.user.username,
                    phone: data.user.phone_number,
                    specialization: data.profile.specialization,
                    department_id: data.profile.department_id,
                    date_of_birth: data.profile.date_of_birth,
                    gender: data.profile.gender,
                    role: 'professional'
                }
            } else {
                // C'est un patient
                userData = {
                    id: data.user.id,
                    patient_id: data.user.id,
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                    username: data.user.username,
                    email: data.user.email,
                    role: 'patient'
                }
            }

            const newAccessToken = data.tokens?.access || data.access
            const newRefreshToken = data.tokens?.refresh || data.refresh

            // Mise à jour des états
            setUser(userData)
            setAccessToken(newAccessToken)
            setRefreshToken(newRefreshToken)

            // Sauvegarde sécurisée
            localStorage.setItem("user", JSON.stringify(userData))
            localStorage.setItem("accessToken", newAccessToken)
            localStorage.setItem("refreshToken", newRefreshToken)

            return userData
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erreur inconnue"
            setError(errorMessage)
            console.error("Login failed:", errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    const logout = useCallback(() => {
        setUser(null)
        setAccessToken(null)
        setRefreshToken(null)
        setError(null)
        localStorage.clear()
        router.push("/")
    }, [router])

    const hasRole = useCallback((requiredRole: UserRole): boolean => {
        return user?.role === requiredRole
    }, [user])

    const redirectToRoleDashboard = useCallback(() => {
        if (!user) return

        if (user.role === 'patient') {
            router.push("/patient/home")
        } else if (user.role === 'professional') {
            router.push("/professional/dashboard")
        }
    }, [user, router])

    const value: AuthContextType = {
        user,
        accessToken,
        refreshToken,
        role: user?.role || null,
        login,
        logout,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        error,
        hasRole,
        redirectToRoleDashboard
    }

    return (
        <UnifiedAuthContext.Provider value={value}>
            {children}
        </UnifiedAuthContext.Provider>
    )
}

export function useUnifiedAuth() {
    const context = useContext(UnifiedAuthContext)
    if (context === undefined) {
        throw new Error("useUnifiedAuth must be used within a UnifiedAuthProvider")
    }
    return context
}