"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { BloodInventory } from "@/components/blood-inventory"
import { Donors } from "@/components/donors"
import { Patients } from "@/components/patients"
import { BloodRequests } from "@/components/blood-requests"
import Sites from "@/components/sites"
import Forecasting from "@/components/forecasting"
import { Reports } from "@/components/reports"
import { Settings } from "@/components/settings"
import { DataImport } from "@/components/data-import"
import { LanguageProvider } from "@/lib/i18n"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "sonner"
import { useHealthCheck } from "@/lib/hooks/useApi"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

// Composant pour afficher le statut de santé du système
function SystemHealthIndicator() {
  const { data: health, isError, isLoading } = useHealthCheck()

  if (isLoading) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 ${
          isError
            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
            : health?.status === "healthy"
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
            : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
        }`}
      >
        {isError ? (
          <XCircle className="w-4 h-4" />
        ) : health?.status === "healthy" ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
        <span>
          {isError
            ? "Système hors ligne"
            : health?.status === "healthy"
            ? "Système opérationnel"
            : "Problème système"}
        </span>
      </div>
    </div>
  )
}

// Composant principal de navigation
function AppContent() {
  const [activeView, setActiveView] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />
      case "inventory":
        return <BloodInventory />
      case "donors":
        return <Donors />
      case "patients":
        return <Patients />
      case "requests":
        return <BloodRequests />
      case "sites":
        return <Sites />
      case "forecasting":
        return <Forecasting />
      case "reports":
        return <Reports />
      case "settings":
        return <Settings />
      case "import":
        return <DataImport />
      default:
        return <Dashboard />
    }
  }

  return (
    <>
      <SystemHealthIndicator />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main Content avec marge responsive synchronisée */}
        <main
          className={`
            min-h-screen transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}
          `}
        >
          <div className="w-full h-full">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </>
  )
}

export default function Home() {
  return (
    <QueryProvider>
      <LanguageProvider>
        <AppContent />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            },
            className: 'toast-custom',
            duration: 4000,
          }}
        />
      </LanguageProvider>
    </QueryProvider>
  )
}