import { useLanguage } from "@/lib/language-context"
import { useState, useEffect } from "react"

// Import direct des traductions
import frMessages from "@/messages/fr.json"
import enMessages from "@/messages/en.json"

const messages = {
  fr: frMessages,
  en: enMessages,
}

export function useTranslationsSync() {
  const { language } = useLanguage()
  const [currentMessages, setCurrentMessages] = useState(messages.fr)

  useEffect(() => {
    setCurrentMessages(messages[language])
  }, [language])

  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = currentMessages

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key // Return the key if translation not found
      }
    }

    return typeof value === "string" ? value : key
  }

  return { t, language, messages: currentMessages }
}

// Hook pour obtenir une section spécifique des traductions
export function useTranslationSectionSync(section: string) {
  const { language } = useLanguage()
  const [sectionMessages, setSectionMessages] = useState<any>({})

  useEffect(() => {
    const messages = language === "fr" ? frMessages : enMessages
    setSectionMessages(messages[section] || {})
  }, [language, section])

  return sectionMessages
}

