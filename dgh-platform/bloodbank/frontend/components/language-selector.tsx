"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import { ChevronDown, Globe } from "lucide-react"

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: "fr" as const, name: "Français", flag: "🇫🇷", country: "Cameroun" },
    { code: "en" as const, name: "English", flag: "🇬🇧", country: "Cameroon" },
  ]

  const currentLanguage = languages.find((lang) => lang.code === language)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 px-3 py-2 h-auto text-left hover:bg-blue-600/20 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 flex-1">
          <Globe className="w-4 h-4 text-blue-400" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLanguage?.flag}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{currentLanguage?.name}</span>
              <span className="text-xs text-gray-400">{currentLanguage?.country}</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              className={`w-full justify-start gap-3 px-3 py-3 h-auto text-left rounded-none hover:bg-blue-600/20 transition-colors ${
                language === lang.code ? "bg-blue-600/30" : ""
              }`}
              onClick={() => {
                setLanguage(lang.code)
                setIsOpen(false)
              }}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{lang.name}</span>
                <span className="text-xs text-gray-400">{lang.country}</span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
