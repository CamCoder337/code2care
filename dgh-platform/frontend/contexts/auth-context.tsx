"use client"

import type React from "react"
import {createContext, useContext, useEffect, useState} from "react"
import type {Professional} from "@/types/medical"

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

export function AuthProvider({children}: { children: React.ReactNode }) {
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
                headers: headers,
                body: JSON.stringify({
                    username,
                    password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Nom d'utilisateur ou mot de passe incorrect.")
                }
                throw new Error(data.detail || `Une erreur est survenue: ${response.statusText}`)
            }

            // --- LA CORRECTION CLÉ EST ICI ---
            // On lit les données depuis les bons objets (`profile`, `user`, `tokens`)
            // conformément à la structure de votre API.
            const professionalData: Professional = {
                professional_id: data.profile.professional_id,
                first_name: data.profile.first_name,
                last_name: data.profile.last_name,
                date_of_birth: data.profile.date_of_birth,
                gender: data.profile.gender,
                specialization: data.profile.specialization,
                department_id: data.profile.department_id,
                email: data.user.username, // L'email est le username dans l'objet `user`
                phone: data.user.phone_number, // Le téléphone est dans l'objet `user`
                username: data.user.username, // Le username est dans l'objet `user`
                access_token: data.tokens.access, // Le jeton est dans l'objet `tokens`
                refresh_token: data.tokens.refresh, // Le jeton est dans l'objet `tokens`
            }

            setProfessional(professionalData)
            localStorage.setItem("professional", JSON.stringify(professionalData))
            return professionalData
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
            setError(errorMessage)
            console.error("Login failed:", errorMessage)
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