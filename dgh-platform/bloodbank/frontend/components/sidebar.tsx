"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { useLanguage } from "@/lib/i18n"
import { useTheme } from "next-themes"
import Image from "next/image"
import {
  LayoutDashboard,
  Droplets,
  Users,
  UserCheck,
  FileText,
  MapPin,
  TrendingUp,
  BarChart3,
  Settings,
  Upload,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Heart,
} from "lucide-react"

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Sidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()


  const menuItems = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      id: "inventory",
      label: t("blood_inventory"),
      icon: Droplets,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
    },
    {
      id: "donors",
      label: t("donors"),
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      id: "patients",
      label: t("patients"),
      icon: UserCheck,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      id: "requests",
      label: t("blood_requests"),
      icon: FileText,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
    {
      id: "sites",
      label: t("sites"),
      icon: MapPin,
      color: "text-teal-400",
      bgColor: "bg-teal-500/20",
    },
    {
      id: "forecasting",
      label: t("forecasting"),
      icon: TrendingUp,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/20",
    },
    {
      id: "reports",
      label: t("reports"),
      icon: BarChart3,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
    },
    {
      id: "import",
      label: t("data_import"),
      icon: Upload,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
    },
    {
      id: "settings",
      label: t("settings"),
      icon: Settings,
      color: "text-gray-400",
      bgColor: "bg-gray-500/20",
    },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <Button
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 hover:bg-slate-700 text-white p-2"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header avec Logo HIGH5 */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-teal-500 to-green-500 rounded-xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-all duration-300">
                  <Image
                    src="/high5-logo.png"
                    alt="HIGH5 Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HIGH5</h1>
                <p className="text-sm text-gray-400">Blood Bank System</p>
                <p className="text-xs text-gray-500">République du Cameroun</p>
              </div>
            </div>

            {/* Sélecteur de Langue */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {t("language")} / LANGUAGE
              </p>
              <LanguageSelector />
            </div>

            {/* Profil Utilisateur */}
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                BM
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Blood Manager</p>
                <p className="text-xs text-gray-400">Administrator</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-green-400">En ligne</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">NAVIGATION</p>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeView === item.id

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-3 py-3 h-auto text-left transition-all duration-200 ${
                        isActive
                          ? `${item.bgColor} ${item.color} shadow-lg scale-105`
                          : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                      }`}
                      onClick={() => {
                        setActiveView(item.id)
                        setSidebarOpen(false) // Close mobile sidebar after selection
                      }}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? item.color : "text-gray-400"}`} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && <div className="ml-auto w-2 h-2 bg-current rounded-full animate-pulse" />}
                    </Button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 space-y-3">
            {/* Mode Sombre Toggle */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
              )}
              <span className="font-medium text-sm">{theme === "dark" ? "Mode Clair" : "Mode Sombre"}</span>
            </Button>

            {/* Déconnexion */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t("logout")}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
