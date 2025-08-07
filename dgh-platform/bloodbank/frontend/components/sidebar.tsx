"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LanguageSelector, CompactLanguageSelector } from "./language-selector"
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
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react"

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen, onCollapsedChange }: SidebarProps) {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20 dark:bg-blue-500/30",
      hoverColor: "hover:bg-blue-500/10 dark:hover:bg-blue-500/20",
    },
    {
      id: "inventory",
      label: t("blood_inventory"),
      icon: Droplets,
      color: "text-red-400",
      bgColor: "bg-red-500/20 dark:bg-red-500/30",
      hoverColor: "hover:bg-red-500/10 dark:hover:bg-red-500/20",
    },
    {
      id: "donors",
      label: t("donors"),
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/20 dark:bg-green-500/30",
      hoverColor: "hover:bg-green-500/10 dark:hover:bg-green-500/20",
    },
    {
      id: "patients",
      label: t("patients"),
      icon: UserCheck,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20 dark:bg-purple-500/30",
      hoverColor: "hover:bg-purple-500/10 dark:hover:bg-purple-500/20",
    },
    {
      id: "requests",
      label: t("blood_requests"),
      icon: FileText,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20 dark:bg-orange-500/30",
      hoverColor: "hover:bg-orange-500/10 dark:hover:bg-orange-500/20",
    },
    {
      id: "sites",
      label: t("sites"),
      icon: MapPin,
      color: "text-teal-400",
      bgColor: "bg-teal-500/20 dark:bg-teal-500/30",
      hoverColor: "hover:bg-teal-500/10 dark:hover:bg-teal-500/20",
    },
    {
      id: "forecasting",
      label: t("forecasting"),
      icon: TrendingUp,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/20 dark:bg-indigo-500/30",
      hoverColor: "hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20",
    },
    {
      id: "reports",
      label: t("reports"),
      icon: BarChart3,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20 dark:bg-pink-500/30",
      hoverColor: "hover:bg-pink-500/10 dark:hover:bg-pink-500/20",
    },
    {
      id: "import",
      label: t("data_import"),
      icon: Upload,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20 dark:bg-cyan-500/30",
      hoverColor: "hover:bg-cyan-500/10 dark:hover:bg-cyan-500/20",
    },
  ]

  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
  const closeMobileMenu = () => setSidebarOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      {!sidebarOpen && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden rounded-full w-10 h-10 p-0 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white border-gray-300 dark:border-slate-600 shadow-lg"
          aria-label={t("open_menu")}
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${collapsed ? "w-20" : "w-72"}
          fixed h-[100vh] bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 
          border-r border-gray-200 dark:border-slate-700 shadow-xl dark:shadow-2xl 
          transition-all duration-300 z-50 top-0 left-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
        aria-label={t("sidebar")}
      >
        {/* Header */}
        <header className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0 relative">
          <div className="flex items-center justify-center mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-teal-500 to-green-500 rounded-xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-all duration-300">
                <Image
                  src="/high5-logo.png"
                  alt="HIGH5 Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain filter brightness-0 invert"
                  priority
                />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
          </div>

          {!collapsed && (
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">HIGH5</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("blood_bank_system")}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t("cameroon")}</p>
            </div>
          )}

          {/* Mobile Close Button */}
          {sidebarOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={closeMobileMenu}
              className="absolute top-4 right-4 z-50 lg:hidden rounded-full w-10 h-10 p-0 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white border-gray-300 dark:border-slate-600 shadow-lg"
              aria-label={t("close_menu")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </header>

        {/* User Profile */}
        <section className="p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              BM
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("blood_manager")}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t("administrator")}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-green-600 dark:text-green-400">{t("online")}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 min-h-0" aria-label={t("main_navigation")}>
          <div className="px-4">
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                {t("navigation")}
              </p>
            )}
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                const isActive = activeView === item.id

                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={`
                        w-full justify-start gap-3 px-3 py-3 h-auto transition-all duration-200
                        ${
                          isActive
                            ? `${item.bgColor} ${item.color} shadow-md scale-105 border border-current/20`
                            : `text-gray-600 dark:text-gray-300 ${item.hoverColor} hover:text-gray-900 dark:hover:text-white`
                        }
                        ${collapsed ? "justify-center px-2" : ""}
                      `}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => {
                        setActiveView(item.id)
                        setSidebarOpen(false)
                      }}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? item.color : "text-gray-500 dark:text-gray-400"} flex-shrink-0`} />
                      {!collapsed && (
                        <>
                          <span className="font-medium">{item.label}</span>
                          {isActive && <div className="ml-auto w-2 h-2 bg-current rounded-full animate-pulse" />}
                        </>
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <footer className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
          {collapsed ? (
            /* Layout compact en grille 2x2 pour sidebar collapsed */
            <div className="grid grid-cols-2 gap-1">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all duration-300"
                onClick={toggleTheme}
                title={theme === "dark" ? t("light_mode") : t("dark_mode")}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-500" />
                )}
              </Button>

              {/* Compact Language Selector */}
              <CompactLanguageSelector />

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all duration-300"
                onClick={() => {
                  setActiveView("settings")
                  setSidebarOpen(false)
                }}
                title={t("settings")}
              >
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </Button>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 p-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300"
                title={t("logout")}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            /* Layout étendu pour sidebar expanded */
            <div className="space-y-3">
              {/* Language Selector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("language")}
                  </span>
                </div>
                <LanguageSelector />
              </div>

              {/* Actions en grille 2x2 */}
              <div className="grid grid-cols-2 gap-2">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-16 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all duration-300"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="text-xs font-medium text-center leading-tight">
                    {theme === "dark" ? t("light") : t("dark")}
                  </span>
                </Button>

                {/* Settings */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-16 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all duration-300"
                  onClick={() => {
                    setActiveView("settings")
                    setSidebarOpen(false)
                  }}
                >
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {t("settings")}
                  </span>
                </Button>

                {/* Logout - Span sur 2 colonnes */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-2 flex items-center justify-center gap-2 h-12 p-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("logout")}</span>
                </Button>
              </div>
            </div>
          )}
        </footer>

        {/* Collapse Toggle - Desktop only */}
        <Button
          variant="outline"
          size="sm"
          className="absolute -right-3 top-20 rounded-full w-6 h-6 p-0 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white hidden lg:flex shadow-lg"
          onClick={toggleCollapse}
          aria-label={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>
    </>
  )
}