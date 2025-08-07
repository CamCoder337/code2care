"use client"

import React from "react"
import { useLanguage } from "@/lib/language-context"
import { useTranslations } from "@/hooks/use-translations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Globe, ChevronDown } from "lucide-react"

export function LanguageSelector(): React.JSX.Element {
  const { language, setLanguage } = useLanguage()
  const { tSync } = useTranslations()

  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ]

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as "fr" | "en")
  }

  const currentLanguage = languages.find(lang => lang.code === language)

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{currentLanguage?.flag}</span>
              <span className="hidden sm:inline">{currentLanguage?.name}</span>
              <span className="sm:hidden">{currentLanguage?.code.toUpperCase()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Version compacte pour la sidebar
export function LanguageSelectorCompact(): React.JSX.Element {
  const { language, setLanguage } = useLanguage()
  const { tSync } = useTranslations()

  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ]

  const currentLanguage = languages.find(lang => lang.code === language)
  const nextLanguage = languages.find(lang => lang.code !== language) || languages[0]

  const toggleLanguage = () => {
    setLanguage(nextLanguage.code as "fr" | "en")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
      title={`${tSync("settings.language")}: ${nextLanguage.name}`}
    >
      <Globe className="h-4 w-4" />
    </Button>
  )
}

