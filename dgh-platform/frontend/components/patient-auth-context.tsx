"use client"

import React, {createContext, useCallback, useContext, useEffect, useState} from "react"
import {useRouter} from "next/navigation"

// --- Re-add getCookie helper function ---
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


// Interface for user data (without tokens)
interface PatientUser {
    patient_id: string
    first_name: string
    last_name: string
    username: string
    email?: string
}

// Interface for the context, with accessToken at the top level
interface PatientAuthContextType {
    patient: PatientUser | null
    accessToken: string | null // The required property, now directly accessible
    login: (username: string, password: string) => Promise<PatientUser | null>
    logout: () => void
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined)

export function PatientAuthProvider({children}: { children: React.ReactNode }) {
    const [patient, setPatient] = useState<PatientUser | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // On component mount, check for an existing session in localStorage
    useEffect(() => {
        try {
            const savedPatient = localStorage.getItem("patient")
            const savedToken = localStorage.getItem("accessToken")

            if (savedPatient && savedToken) {
                setPatient(JSON.parse(savedPatient))
                setAccessToken(savedToken)
            }
        } catch (e) {
            console.error("Failed to parse data from localStorage", e)
            // Clear storage in case of corrupted data
            localStorage.clear()
        } finally {
            setIsLoading(false)
        }
    }, [])

    const login = useCallback(async (username: string, password: string): Promise<PatientUser | null> => {
        setIsLoading(true)
        setError(null)
        try {
            // --- Re-add CSRF token handling ---
            const csrftoken = getCookie("csrftoken")

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                Accept: "application/json",
            }

            if (csrftoken) {
                headers["X-CSRFToken"] = csrftoken
            }
            // ----------------------------------

            const response = await fetch("https://high5-gateway.onrender.com/api/v1/auth/login/", {
                method: "POST",
                headers: headers, // <-- Use the headers with CSRF token
                body: JSON.stringify({username, password}),
            })

            const data = await response.json()

            if (!response.ok) {
                // More specific error handling for 401
                if (response.status === 401) {
                    throw new Error("Nom d'utilisateur ou mot de passe incorrect.")
                }
                throw new Error(data.detail || `An error occurred: ${response.statusText}`)
            }

            // Separate user data from tokens
            const userPayload = data.user
            const newAccessToken = data.access
            const newRefreshToken = data.refresh

            const patientData: PatientUser = {
                patient_id: userPayload.id,
                first_name: userPayload.first_name,
                last_name: userPayload.last_name,
                username: userPayload.username,
                email: userPayload.email,
            }

            // Update states separately
            setPatient(patientData)
            setAccessToken(newAccessToken)

            // Save to localStorage using separate keys
            localStorage.setItem("patient", JSON.stringify(patientData))
            localStorage.setItem("accessToken", newAccessToken)
            localStorage.setItem("refreshToken", newRefreshToken)

            return patientData
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
            setError(errorMessage)
            console.error("Patient login failed:", errorMessage) // Add more specific logging
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    const logout = useCallback(() => {
        setPatient(null)
        setAccessToken(null)
        localStorage.removeItem("patient")
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        router.push("/")
    }, [router])

    return (
        <PatientAuthContext.Provider
            value={{
                patient,
                accessToken, // The token is now available here
                login,
                logout,
                isAuthenticated: !!accessToken, // Authentication depends on the token's presence
                isLoading,
                error,
            }}
        >
            {children}
        </PatientAuthContext.Provider>
    )
}

// Custom hook to use the context
export function usePatientAuth() {
    const context = useContext(PatientAuthContext)
    if (context === undefined) {
        throw new Error("usePatientAuth must be used within a PatientAuthProvider")
    }
    return context
}