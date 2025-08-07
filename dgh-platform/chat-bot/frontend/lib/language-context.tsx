"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useHydrationSafe } from "@/hooks/use-hydration-safe"

export type Language = "fr" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr")
  const [isLoading, setIsLoading] = useState(true)
  const isClient = useHydrationSafe()

  // Load language from localStorage on mount
  useEffect(() => {
    if (!isClient) return

    const loadLanguage = () => {
      try {
        const savedLanguage = localStorage.getItem("high5-language") as Language
        if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "en")) {
          setLanguageState(savedLanguage)
        } else {
          // Default to French
          setLanguageState("fr")
          localStorage.setItem("high5-language", "fr")
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la langue:", error)
        setLanguageState("fr")
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguage()
  }, [isClient])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (isClient) {
      try {
        localStorage.setItem("high5-language", lang)
      } catch (error) {
        console.error("Erreur lors de la sauvegarde de la langue:", error)
      }
    }
  }

  const value = {
    language,
    setLanguage,
    isLoading,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

