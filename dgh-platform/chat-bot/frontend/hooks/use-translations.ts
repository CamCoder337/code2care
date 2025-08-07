import { useLanguage } from "@/lib/language-context"
import { useMemo } from "react"

// Import dynamique des traductions
const translations = {
  fr: () => import("@/messages/fr.json").then(module => module.default),
  en: () => import("@/messages/en.json").then(module => module.default),
}

export function useTranslations() {
  const { language } = useLanguage()

  const t = useMemo(() => {
    return async (key: string): Promise<string> => {
      try {
        const messages = await translations[language]()
        const keys = key.split(".")
        let value: any = messages

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k]
          } else {
            console.warn(`Translation key not found: ${key}`)
            return key // Return the key if translation not found
          }
        }

        return typeof value === "string" ? value : key
      } catch (error) {
        console.error("Error loading translations:", error)
        return key
      }
    }
  }, [language])

  // Synchronous version for immediate use
  const tSync = useMemo(() => {
    return (key: string): string => {
      // For now, return the key - in a real implementation, you'd want to preload translations
      return key
    }
  }, [language])

  return { t, tSync, language }
}

// Hook for getting a specific translation section
export function useTranslationSection(section: string) {
  const { language } = useLanguage()

  const sectionTranslations = useMemo(async () => {
    try {
      const messages = await translations[language]()
      return messages[section] || {}
    } catch (error) {
      console.error("Error loading translation section:", error)
      return {}
    }
  }, [language, section])

  return sectionTranslations
}

