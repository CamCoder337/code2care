"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import {
  useDashboardOverview,
  useAlerts,
  useAcknowledgeAllAlerts,
  useResolveAlert,
  useExportReport,
  useRefreshAll,
} from "@/lib/hooks/useApi"
import {
  Droplets,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  Activity,
  RefreshCw,
  Eye,
  Heart,
  Zap,
  Shield,
  Target,
  BarChart3,
  Loader2,
  Users,
  FileText,
  TrendingDown,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

export function Dashboard() {
  const { t } = useLanguage()
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [animatedValues, setAnimatedValues] = useState({
    totalUnits: 0,
    availableUnits: 0,
    pendingRequests: 0,
    criticalAlerts: 0,
  })

  // API Hooks
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardOverview()

  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts()

  const acknowledgeAllAlerts = useAcknowledgeAllAlerts()
  const resolveAlert = useResolveAlert()
  const exportReport = useExportReport()
  const refreshAll = useRefreshAll()

  // Animation des valeurs au chargement
  useEffect(() => {
    if (dashboardData) {
      const animateValues = () => {
        const duration = 1500
        const steps = 40
        const stepDuration = duration / steps

        let currentStep = 0
        const interval = setInterval(() => {
          const progress = currentStep / steps
          const easeOutQuart = 1 - Math.pow(1 - progress, 3)

          setAnimatedValues({
            totalUnits: Math.floor(dashboardData.overview.total_units * easeOutQuart),
            availableUnits: Math.floor(dashboardData.overview.available_units * easeOutQuart),
            pendingRequests: Math.floor(dashboardData.overview.pending_requests * easeOutQuart),
            criticalAlerts: Math.floor((alertsData?.alerts.length || 0) * easeOutQuart),
          })

          currentStep++
          if (currentStep > steps) {
            clearInterval(interval)
          }
        }, stepDuration)

        return () => clearInterval(interval)
      }

      animateValues()
    }
  }, [dashboardData, alertsData])

  // Gestion du rafraîchissement
  const handleRefresh = async () => {
    try {
      await Promise.all([refetchDashboard(), refetchAlerts()])
      toast.success(t("data_refreshed_successfully"))
    } catch (error) {
      toast.error(t("refresh_error"))
    }
  }

  // Gestion des actions sur les alertes
  const handleAlertAction = async (alertId: number, action: string) => {
    try {
      await resolveAlert.mutateAsync({ alertId, action })
    } catch (error) {
      console.error("Erreur lors de l'action sur l'alerte:", error)
    }
  }

  const handleAcknowledgeAllAlerts = async () => {
    try {
      await acknowledgeAllAlerts.mutateAsync()
    } catch (error) {
      console.error("Erreur lors de la reconnaissance des alertes:", error)
    }
  }

  // Gestion de l'export de rapport
  const handleExportReport = async () => {
    try {
      await exportReport.mutateAsync({ type: 'inventory', format: 'csv' })
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
    }
  }

  // États de chargement et d'erreur
  if (dashboardLoading || alertsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t("loading")}</p>
              <p className="text-gray-600 dark:text-gray-400">{t("loading_system_data")}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (dashboardError || alertsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto space-y-6">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-600" />
            <div className="space-y-3">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{t("system_error")}</p>
              <p className="text-lg text-red-600 dark:text-red-300">
                {dashboardError?.message || alertsError?.message || t("data_loading_error")}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={dashboardLoading || alertsLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("retry")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  const overview = dashboardData.overview
  const stockByBloodType = dashboardData.stock_by_blood_type
  const alerts = alertsData?.alerts || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "from-emerald-400 to-green-600"
      case "warning":
        return "from-amber-400 to-orange-500"
      case "critical":
        return "from-red-400 to-rose-600"
      default:
        return "from-slate-400 to-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "good":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200"
      case "warning":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200"
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200"
    }
  }

  const getBloodTypeStatus = (count: number) => {
    if (count < 5) return 'critical'
    if (count < 15) return 'warning'
    return 'good'
  }

  const efficiency = ((overview.total_units - overview.expired_units) / overview.total_units) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="p-6 space-y-6">

        {/* En-tête simplifié */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("dashboard")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t("system_overview")} - {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={dashboardLoading || alertsLoading}
              variant="outline"
              className="hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(dashboardLoading || alertsLoading) ? 'animate-spin' : ''}`} />
              {t("refresh")}
            </Button>

            <Button
              onClick={handleExportReport}
              disabled={exportReport.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {exportReport.isLoading ? t("exporting") : t("export_report")}
            </Button>
          </div>
        </div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Stock Total */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("total_stock")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {animatedValues.totalUnits.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {overview.utilization_rate.toFixed(1)}% {t("utilization")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Disponible */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("available_stock")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {animatedValues.availableUnits.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    {Math.round((overview.available_units / overview.total_units) * 100)}% {t("ready")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demandes en Attente */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("pending_requests")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {animatedValues.pendingRequests}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {overview.urgent_requests} {t("urgent")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Efficacité Système */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("system_efficiency")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {efficiency.toFixed(1)}%
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    {overview.expired_units} {t("expired")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques Secondaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Activité Quotidienne */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                {t("daily_activity")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("transfusions_today")}</span>
                <span className="text-lg font-bold text-blue-600">{overview.today_transfusions}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("units_used")}</span>
                <span className="text-lg font-bold text-green-600">{overview.used_units}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("expiring_soon")}</span>
                <span className="text-lg font-bold text-amber-600">{overview.expiring_soon}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stock par Groupe Sanguin (Top 4) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Droplets className="w-5 h-5 mr-2 text-red-600" />
                {t("blood_type_stock")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stockByBloodType?.slice(0, 4).map((stock) => {
                const percentage = (stock.count / (overview.total_units || 1)) * 100
                const status = getBloodTypeStatus(stock.count)

                return (
                  <div key={stock.blood_type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{stock.blood_type}</span>
                        <Badge className={`text-xs ${getStatusBadge(status)}`}>
                          {status === "critical" ? t("critical") : status === "warning" ? t("low") : t("good")}
                        </Badge>
                      </div>
                      <span className="font-semibold">{stock.count}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => console.log("Voir tous les groupes sanguins")}
              >
                {t("view_all")}
              </Button>
            </CardContent>
          </Card>

          {/* Alertes Critiques Résumées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                {t("system_alerts")} ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            {alert.message}
                          </p>
                          {alert.blood_type && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {t("blood_type")}: {alert.blood_type}
                            </p>
                          )}
                        </div>
                        <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                          {alert.severity === "critical" ? t("critical") : t("warning")}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {alerts.length > 3 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {t("and_more", { count: alerts.length - 3 })}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={handleAcknowledgeAllAlerts}
                      disabled={acknowledgeAllAlerts.isLoading}
                    >
                      {acknowledgeAllAlerts.isLoading ? t("processing") : t("acknowledge_all")}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-red-600 hover:bg-red-700"
                      onClick={() => console.log("Voir toutes les alertes")}
                    >
                      {t("view_all")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Shield className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t("no_alerts")}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{t("all_systems_normal")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Indicateur de dernière mise à jour */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("last_updated")}: {new Date(dashboardData.last_updated).toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  )
}