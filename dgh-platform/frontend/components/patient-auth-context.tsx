"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

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

// L'interface pour les données du patient, nous ajouterons les tokens
interface PatientUser {
  patient_id: string
  first_name: string
  last_name: string
  phone_number: string
  preferred_language: "en" | "fr" | "duala" | "bassa" | "ewondo"
  email?: string
  username: string
  access_token: string
  refresh_token: string
}

interface PatientAuthContextType {
  patient: PatientUser | null
  login: (username: string, password: string) => Promise<PatientUser | null>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined)

export function PatientAuthProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<PatientUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const savedPatient = localStorage.getItem("patient")
      if (savedPatient) {
        setPatient(JSON.parse(savedPatient))
      }
    } catch (e) {
      console.error("Failed to parse patient data from localStorage", e)
      localStorage.removeItem("patient")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<PatientUser | null> => {
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
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      // 3. Améliorer la gestion des erreurs
      if (!response.ok) {
        // Fournir un message plus clair pour les erreurs 401
        if (response.status === 401) {
          throw new Error("Nom d'utilisateur ou mot de passe incorrect.")
        }
        // Pour les autres erreurs, utiliser le détail de l'API si disponible
        throw new Error(data.detail || `Une erreur est survenue: ${response.statusText}`)
      }

      // 4. Mappage des données de l'API vers notre interface PatientUser
      const patientData: PatientUser = {
        patient_id: data.user.id,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        phone_number: data.user.phone,
        preferred_language: data.user.preferred_language || "fr",
        email: data.user.email,
        username: data.user.username,
        access_token: data.access,
        refresh_token: data.refresh,
      }

      setPatient(patientData)
      localStorage.setItem("patient", JSON.stringify(patientData))

      return patientData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue."
      setError(errorMessage)
      console.error("Patient login failed:", errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setPatient(null)
    localStorage.removeItem("patient")
  }

  return (
      <PatientAuthContext.Provider
          value={{
            patient,
            login,
            logout,
            isAuthenticated: !!patient,
            isLoading,
            error,
          }}
      >
        {children}
      </PatientAuthContext.Provider>
  )
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext)
  if (context === undefined) {
    throw new Error("usePatientAuth must be used within a PatientAuthProvider")
  }
  return context
}