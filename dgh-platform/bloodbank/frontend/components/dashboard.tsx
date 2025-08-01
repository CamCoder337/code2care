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
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Loader2,
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
        const duration = 2000
        const steps = 60
        const stepDuration = duration / steps

        let currentStep = 0
        const interval = setInterval(() => {
          const progress = currentStep / steps
          const easeOutQuart = 1 - Math.pow(1 - progress, 4)

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
      toast.success("Données actualisées avec succès")
    } catch (error) {
      toast.error("Erreur lors de l'actualisation")
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600" />
              <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">Chargement en cours...</p>
              <p className="text-lg text-gray-600 dark:text-gray-400">Récupération des données du système</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (dashboardError || alertsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 dark:from-red-900/20 dark:via-pink-900/20 dark:to-rose-900/20">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto space-y-6">
            <div className="relative">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-600" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">Erreur Système</p>
              <p className="text-lg text-red-600 dark:text-red-300">
                {dashboardError?.message || alertsError?.message || "Erreur lors du chargement des données"}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={dashboardLoading || alertsLoading}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <RefreshCw className="w-5 h-5 mr-3" />
              Réessayer
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

  // Déterminer le statut des stocks par groupe sanguin
  const getBloodTypeStatus = (count: number) => {
    if (count < 5) return 'critical'
    if (count < 15) return 'warning'
    return 'good'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
        {/* 🎨 HEADER MAGNIFIQUE */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-green-200 font-medium">Système Opérationnel</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                {t("welcome_message")}
                <Sparkles className="inline-block w-8 h-8 ml-3 text-yellow-300" />
              </h1>

              <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                Tableau de bord intelligent pour la gestion optimale des ressources sanguines
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Dernière mise à jour: {new Date(dashboardData.last_updated).toLocaleTimeString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Sécurité: Niveau Maximum</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Performance: {overview.utilization_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleRefresh}
                disabled={dashboardLoading || alertsLoading}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-8 py-4 text-lg font-semibold rounded-xl backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 mr-3 ${(dashboardLoading || alertsLoading) ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>

              <Button
                onClick={handleExportReport}
                disabled={exportReport.isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                {exportReport.isLoading ? 'Export...' : 'Rapport Complet'}
              </Button>
            </div>
          </div>
        </div>

        {/* 🎯 MÉTRIQUES CLÉS ANIMÉES */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Total Units */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {t("total_units")}
                    </p>
                    <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">
                      Stock Total
                    </Badge>
                  </div>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                    {animatedValues.totalUnits.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">
                      {overview.utilization_rate.toFixed(1)}% utilisation
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Droplets className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Units */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      {t("available_units")}
                    </p>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1">Prêt</Badge>
                  </div>
                  <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {animatedValues.availableUnits.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600 font-medium">
                      {Math.round((overview.available_units / overview.total_units) * 100)}%
                      disponible
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      {t("pending_requests")}
                    </p>
                    <Badge className="bg-red-100 text-red-700 text-xs px-2 py-1 animate-pulse">
                      {overview.urgent_requests} urgent
                    </Badge>
                  </div>
                  <p className="text-4xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                    {animatedValues.pendingRequests}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-medium">Traitement en cours</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs font-bold">{overview.urgent_requests}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                      {t("critical_alerts")}
                    </p>
                    <Badge className="bg-red-100 text-red-700 text-xs px-2 py-1 animate-pulse">Action requise</Badge>
                  </div>
                  <p className="text-4xl font-bold text-red-700 dark:text-red-300 tabular-nums">
                    {animatedValues.criticalAlerts}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-600 font-medium">Intervention immédiate</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🩸 INVENTAIRE SANGUIN DÉTAILLÉ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Stock par Groupe Sanguin */}
          <Card className="xl:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-2xl font-bold">
                    <Activity className="w-8 h-8 mr-4" />
                    {t("blood_inventory_overview")}
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-lg mt-2">
                    Analyse détaillée des stocks par groupe sanguin
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={handleExportReport}
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              {stockByBloodType?.map((stock, index) => {
                const percentage = (stock.count / (overview.total_units || 1)) * 100
                const status = getBloodTypeStatus(stock.count)
                const isLow = status === "critical" || status === "warning"

                return (
                  <div
                    key={stock.blood_type}
                    className="group p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      console.log(`Détails pour le groupe sanguin ${stock.blood_type}`)
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-r ${getStatusColor(status)} shadow-lg`}
                          />
                          {isLow && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-2xl text-gray-800 dark:text-white">{stock.blood_type}</span>
                            <Badge className={`text-sm px-3 py-1 border ${getStatusBadge(status)}`}>
                              {status === "critical" ? "Critique" : status === "warning" ? "Faible" : "Bon"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Volume total: {(stock.total_volume / 1000).toFixed(1)}L
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-2xl font-bold text-gray-800 dark:text-white">{stock.count}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">unités</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Niveau de stock</span>
                        <span className="font-semibold">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {isLow && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {status === "critical"
                              ? "Stock critique - Action immédiate requise"
                              : "Stock faible - Surveillance recommandée"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Statistiques rapides et Métriques */}
          <div className="space-y-8">
            {/* Métriques de Performance */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-xl">
                <CardTitle className="flex items-center text-xl font-bold">
                  <TrendingUp className="w-6 h-6 mr-3" />
                  Métriques de Performance
                </CardTitle>
                <CardDescription className="text-emerald-100 mt-1">Indicateurs clés du système</CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-600">{overview.today_transfusions}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transfusions aujourd'hui</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600">{overview.expiring_soon}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expirent bientôt</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-orange-600">{overview.expired_units}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unités expirées</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-600">{overview.used_units}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unités utilisées</p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taux d'Utilisation</p>
                      <p className="text-xl font-bold text-blue-600">{overview.utilization_rate.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Efficacité</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {(((overview.total_units - overview.expired_units) / overview.total_units) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Sparkles className="w-4 h-4" />
                    <span>Performance optimale du système</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Évolution des Stocks */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
                <CardTitle className="flex items-center text-xl font-bold">
                  <LineChart className="w-6 h-6 mr-3" />
                  Évolution des Stocks
                </CardTitle>
                <CardDescription className="text-purple-100 mt-1">Tendances sur 7 derniers jours</CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  {dashboardData.stock_evolution?.slice(-7).map((evolution, index) => (
                    <div
                      key={evolution.date}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 hover:from-purple-50 hover:to-pink-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {new Date(evolution.date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-purple-600">{evolution.stock}</span>
                        <span className="text-sm text-gray-500 ml-1">unités</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 bg-transparent"
                  onClick={() => {
                    console.log("Voir l'évolution détaillée")
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Voir l'analyse complète
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 🚨 ALERTES CRITIQUES MAGNIFIQUES */}
        {alerts.length > 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-r from-red-50 via-pink-50 to-rose-50 dark:from-red-900/20 dark:via-pink-900/20 dark:to-rose-900/20 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500"></div>

            <CardHeader className="relative bg-gradient-to-r from-red-600 to-pink-600 text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-2xl font-bold">
                    <AlertTriangle className="w-8 h-8 mr-4 animate-pulse" />
                    Alertes Critiques
                    <Badge className="ml-4 bg-white/20 text-white px-3 py-1">
                      {alerts.length} active{alerts.length > 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-red-100 text-lg mt-2">
                    Interventions immédiates requises pour maintenir la sécurité
                  </CardDescription>
                </div>

                <Button
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={handleAcknowledgeAllAlerts}
                  disabled={acknowledgeAllAlerts.isLoading}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {acknowledgeAllAlerts.isLoading ? 'Traitement...' : 'Tout marquer comme vu'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="relative p-8 space-y-6">
              {alerts.map((alert, index) => (
                <div
                  key={alert.id}
                  className="group relative p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-red-100 dark:border-red-900/30"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Icône et Statut */}
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <AlertTriangle
                          className={`w-8 h-8 ${
                            alert.severity === "critical" ? "text-red-600 animate-pulse" : "text-amber-600"
                          }`}
                        />
                        <div
                          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                            alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                          } animate-ping`}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`text-sm px-3 py-1 font-semibold ${
                              alert.severity === "critical"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {alert.severity === "critical" ? "CRITIQUE" : "ATTENTION"}
                          </Badge>

                          {alert.blood_type && (
                            <Badge variant="outline" className="text-sm px-3 py-1">
                              {alert.blood_type}
                            </Badge>
                          )}
                        </div>

                        <h3
                          className={`text-lg font-bold ${
                            alert.severity === "critical"
                              ? "text-red-800 dark:text-red-200"
                              : "text-amber-800 dark:text-amber-200"
                          }`}
                        >
                          {alert.message}
                        </h3>

                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {alert.count && (
                            <p>
                              <strong>Unités concernées:</strong> {alert.count}
                            </p>
                          )}
                          {alert.days_left && (
                            <p>
                              <strong>Jours restants:</strong> {alert.days_left}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                        onClick={() => {
                          setSelectedAlert(alert)
                          console.log(`Détails de l'alerte ${alert.id}`)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>

                      <Button
                        size="lg"
                        className={`px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${
                          alert.severity === "critical"
                            ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        }`}
                        onClick={() => handleAlertAction(alert.id, "resolve")}
                        disabled={resolveAlert.isLoading}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {resolveAlert.isLoading ? 'Résolution...' : 'Résoudre'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}