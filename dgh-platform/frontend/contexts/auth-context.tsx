"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Professional } from "@/types/medical"

/**
 * Helper function to read a cookie from the browser.
 * This is necessary to get the CSRF token that Django sets.
 * @param name The name of the cookie to read (e.g., 'csrftoken')
 * @returns The value of the cookie, or null if not found.
 */
function getCookie(name: string): string | null {
    // Can't access document on the server, so return null.
    if (typeof document === "undefined") {
        return null
    }

    let cookieValue = null
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";")
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    return cookieValue
}

interface AuthContextType {
    professional: Professional | null
    login: (username: string, password: string) => Promise<Professional | null>
    logout: () => void
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [professional, setProfessional] = useState<Professional | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        try {
            const savedProfessional = localStorage.getItem("professional")
            if (savedProfessional) {
                setProfessional(JSON.parse(savedProfessional))
            }
        } catch (e) {
            console.error("Failed to parse professional data from localStorage", e)
            localStorage.removeItem("professional")
        } finally {
            setIsLoading(false)
        }
    }, [])

    const login = async (username: string, password: string): Promise<Professional | null> => {
        setIsLoading(true)
        setError(null)

        try {
            // 1. Récupérer le jeton CSRF depuis les cookies
            const csrftoken = getCookie("csrftoken")

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                Accept: "application/json",
            }

            // 2. Ajouter le jeton CSRF aux en-têtes s'il existe
            if (csrftoken) {
                headers["X-CSRFToken"] = csrftoken
            }

            const response = await fetch("https://high5-gateway.onrender.com/api/v1/auth/login/", {
                method: "POST",
                headers: headers, // Utiliser les en-têtes dynamiques
                body: JSON.stringify({
                    username,
                    password,
                }),
            })

            const data = await response.json()

            // 3. Améliorer la gestion des erreurs
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Nom d'utilisateur ou mot de passe incorrect.")
                }
                throw new Error(data.detail || `Une erreur est survenue: ${response.statusText}`)
            }

            const professionalData: Professional = {
                professional_id: data.user.id,
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                date_of_birth: data.user.date_of_birth,
                gender: data.user.gender,
                specialization: data.user.specialization,
                department_id: data.user.department_id,
                email: data.user.email,
                phone: data.user.phone,
                username: data.user.username,
                access_token: data.access,
                refresh_token: data.refresh,
            }

            setProfessional(professionalData)
            localStorage.setItem("professional", JSON.stringify(professionalData))
            return professionalData
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
            setError(errorMessage)
            console.error("Login failed:", errorMessage) // Ce console.error est la source du message dans votre console
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setProfessional(null)
        localStorage.removeItem("professional")
    }

    return (
        <AuthContext.Provider
            value={{
                professional,
                login,
                logout,
                isAuthenticated: !!professional,
                isLoading,
                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}