"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/lib/theme-context"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslationsSync } from "@/hooks/use-translations-sync"
import { X, Sun, Moon, Monitor } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslationsSync()

  if (!isOpen) return null

  const themeOptions = [
    { value: "light", label: t("settings.lightMode"), icon: Sun },
    { value: "dark", label: t("settings.darkMode"), icon: Moon },
    { value: "system", label: t("settings.systemMode"), icon: Monitor },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {t("settings.title")}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings.language")}
            </h3>
            <LanguageSelector />
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings.theme")}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-4">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              {t("common.close")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

