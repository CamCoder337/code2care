"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useExportReport, useInventoryAnalytics, useDashboardOverview } from "@/lib/hooks/useApi"
import { toast } from "sonner"
import {
  BarChart3,
  Download,
  FileText,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  Droplets,
  Activity,
  PieChart,
  LineChart,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react"

export function Reports() {
  const [reportType, setReportType] = useState("inventory")
  const [dateRange, setDateRange] = useState("30days")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Hooks pour récupérer les données du backend
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardOverview()
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryAnalytics(30)
  const exportReportMutation = useExportReport()

  const reportTypes = [
    { value: "inventory", label: "Rapport d'Inventaire", icon: Droplets },
    { value: "donors", label: "Analyse des Donneurs", icon: Users },
    { value: "consumption", label: "Analyse de Consommation", icon: Activity },
    { value: "waste", label: "Rapport de Gaspillage", icon: AlertTriangle },
  ]

  // Données dynamiques basées sur le backend
  const quickReports = [
    {
      title: "Résumé d'Inventaire Quotidien",
      description: "Niveaux de stock actuels par groupe sanguin",
      type: "inventory",
      lastGenerated: "Il y a 2 heures",
      size: "2.3 MB",
      count: dashboardData?.overview?.total_units || 0,
      available: true,
    },
    {
      title: "Rapport Hebdomadaire des Donneurs",
      description: "Activité et tendances d'inscription des donneurs",
      type: "donors",
      lastGenerated: "Il y a 1 jour",
      size: "1.8 MB",
      count: 0, // Sera calculé depuis le backend
      available: true,
    },
    {
      title: "Analyse Mensuelle de Consommation",
      description: "Modèles et tendances d'utilisation du sang",
      type: "consumption",
      lastGenerated: "Il y a 3 jours",
      size: "4.1 MB",
      count: dashboardData?.overview?.today_transfusions || 0,
      available: true,
    },
    {
      title: "Rapport de Gaspillage",
      description: "Unités expirées et analyse de perte",
      type: "waste",
      lastGenerated: "Il y a 1 semaine",
      size: "1.2 MB",
      count: dashboardData?.overview?.expired_units || 0,
      available: true,
    },
  ]

  // Métriques de rapports calculées dynamiquement
  const reportMetrics = [
    {
      label: "Rapports Générés",
      value: "1,247",
      change: "+18%",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      label: "Points de Données",
      value: `${dashboardData?.overview?.total_units || 0}`,
      change: `+${Math.round((dashboardData?.overview?.utilization_rate || 0) * 100)}%`,
      icon: BarChart3,
      color: "text-green-600"
    },
    {
      label: "Téléchargements d'Export",
      value: "892",
      change: "+24%",
      icon: Download,
      color: "text-teal-600"
    },
    {
      label: "Rapports Programmés",
      value: "5",
      change: "+2",
      icon: CalendarIcon,
      color: "text-purple-600"
    },
  ]

  const getReportIcon = (type: string) => {
    const reportType = reportTypes.find((rt) => rt.value === type)
    if (reportType) {
      const Icon = reportType.icon
      return <Icon className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "inventory":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "donors":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "consumption":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "waste":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      await exportReportMutation.mutateAsync({
        type: reportType as 'inventory' | 'consumption' | 'waste' | 'donors',
        format: 'csv'
      })
      toast.success(`Rapport ${reportType} généré et téléchargé avec succès`)
    } catch (error) {
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleQuickReportDownload = async (reportType: string) => {
    try {
      await exportReportMutation.mutateAsync({
        type: reportType as 'inventory' | 'consumption' | 'waste' | 'donors',
        format: 'csv'
      })
      toast.success(`Rapport ${reportType} téléchargé avec succès`)
    } catch (error) {
      toast.error("Erreur lors du téléchargement")
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
            Rapports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Générer des rapports complets et des insights</p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 transition-all duration-200 hover:scale-105"
        >
          {isGeneratingReport ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exporter Tout
            </>
          )}
        </Button>
      </div>

      {/* Report Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.label}
              className="hover:shadow-lg transition-all duration-200 hover:scale-105 animate-slide-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{metric.change}</span> par rapport au mois dernier
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Generator */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-teal-600" />
            Générateur de Rapports Personnalisés
          </CardTitle>
          <CardDescription>Créer des rapports personnalisés avec des paramètres spécifiques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Type de Rapport</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de rapport" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 Derniers Jours</SelectItem>
                  <SelectItem value="30days">30 Derniers Jours</SelectItem>
                  <SelectItem value="90days">90 Derniers Jours</SelectItem>
                  <SelectItem value="1year">Année Dernière</SelectItem>
                  <SelectItem value="custom">Période Personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Personnalisée</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? selectedDate.toDateString() : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 transition-all duration-200 hover:scale-105"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Générer le Rapport
                </>
              )}
            </Button>
            <Button variant="outline" className="hover:scale-105 transition-transform bg-transparent">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Programmer le Rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" />
            Rapports Rapides
          </CardTitle>
          <CardDescription>Rapports pré-générés prêts au téléchargement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickReports.map((report, index) => (
              <div
                key={report.title}
                className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 animate-slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getReportIcon(report.type)}
                    <h3 className="font-semibold">{report.title}</h3>
                  </div>
                  <Badge className={getTypeColor(report.type)}>
                    {reportTypes.find((rt) => rt.value === report.type)?.label.split(" ")[0]}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{report.description}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Dernière génération: {report.lastGenerated}</span>
                  <span>Taille: {report.size}</span>
                </div>

                {report.count > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium">Données:</span>
                    <Badge variant="outline" className="text-xs">
                      {report.count} {report.type === 'inventory' ? 'unités' :
                       report.type === 'consumption' ? 'transfusions' : 'enregistrements'}
                    </Badge>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:scale-105 transition-transform bg-transparent"
                    onClick={() => handleQuickReportDownload(report.type)}
                    disabled={exportReportMutation.isPending}
                  >
                    {exportReportMutation.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 mr-1" />
                    )}
                    Télécharger
                  </Button>
                  <Button size="sm" variant="outline" className="hover:scale-105 transition-transform bg-transparent">
                    Voir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <PieChart className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Analytics d'Inventaire</CardTitle>
            <CardDescription>Niveaux de stock, taux de rotation et optimisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rapports Disponibles:</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Stock Total:</span>
                <span className="text-blue-600 font-semibold">
                  {dashboardData?.overview?.available_units || 0} unités
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dernière Mise à Jour:</span>
                <span className="text-green-600">Il y a 2 heures</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <LineChart className="w-12 h-12 mx-auto text-green-600 mb-2" />
            <CardTitle className="text-lg">Analyse des Tendances</CardTitle>
            <CardDescription>Tendances historiques et reconnaissance de motifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rapports Disponibles:</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taux d'Utilisation:</span>
                <span className="text-green-600 font-semibold">
                  {Math.round((dashboardData?.overview?.utilization_rate || 0) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dernière Mise à Jour:</span>
                <span className="text-green-600">Il y a 1 jour</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-purple-600 mb-2" />
            <CardTitle className="text-lg">Rapports Prédictifs</CardTitle>
            <CardDescription>Prévisions et prédictions alimentées par l'IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rapports Disponibles:</span>
                <span className="font-semibold">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Demandes Urgentes:</span>
                <span className="text-red-600 font-semibold">
                  {dashboardData?.overview?.urgent_requests || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dernière Mise à Jour:</span>
                <span className="text-green-600">Il y a 30 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-teal-600" />
            Rapports Programmés
          </CardTitle>
          <CardDescription>Planification automatique de génération de rapports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div>
                  <p className="font-medium">Résumé d'Inventaire Quotidien</p>
                  <p className="text-sm text-muted-foreground">Chaque jour à 08h00</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="font-medium">Analytics Hebdomadaire des Donneurs</p>
                  <p className="text-sm text-muted-foreground">Chaque lundi à 09h00</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div>
                  <p className="font-medium">Rapport Mensuel de Performance</p>
                  <p className="text-sm text-muted-foreground">Premier jour de chaque mois</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <div>
                  <p className="font-medium">Analyse de Gaspillage</p>
                  <p className="text-sm text-muted-foreground">Chaque vendredi à 17h00</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Clock className="w-3 h-3 mr-1" />
                En attente
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}