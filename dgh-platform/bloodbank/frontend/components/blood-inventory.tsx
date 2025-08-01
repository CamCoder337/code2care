"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLanguage } from "@/lib/i18n"
import {
  useBloodUnits,
  useInventoryAnalytics,
  useSystemConfig,
  useExportReport,
} from "@/lib/hooks/useApi"
import {
  Droplets,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

export function BloodInventory() {
  const { t } = useLanguage()

  // États locaux pour les filtres et la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBloodType, setSelectedBloodType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [expiringDays, setExpiringDays] = useState("")

  // API Hooks
  const {
    data: bloodUnitsData,
    isLoading: unitsLoading,
    error: unitsError,
    refetch: refetchUnits,
  } = useBloodUnits({
    blood_type: selectedBloodType || undefined,
    status: selectedStatus || undefined,
    expiring_days: expiringDays ? parseInt(expiringDays) : undefined,
    page: currentPage,
    page_size: pageSize,
  })

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useInventoryAnalytics(30)

  const {
    data: systemConfig,
    isLoading: configLoading,
  } = useSystemConfig()

  const exportReport = useExportReport()

  // Données calculées
  const bloodUnits = bloodUnitsData?.results || []
  const totalUnits = bloodUnitsData?.count || 0
  const hasNextPage = bloodUnitsData?.next !== null
  const hasPreviousPage = bloodUnitsData?.previous !== null
  const totalPages = Math.ceil(totalUnits / pageSize)

  // Filtres et recherche côté client pour améliorer l'UX
  const filteredUnits = useMemo(() => {
    return bloodUnits.filter(unit => {
      const matchesSearch = searchTerm === "" ||
        unit.unit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.donor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.donor.last_name.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [bloodUnits, searchTerm])

  // Handlers
  const handleRefresh = async () => {
    try {
      await refetchUnits()
      toast.success("Données d'inventaire actualisées")
    } catch (error) {
      toast.error("Erreur lors de l'actualisation")
    }
  }

  const handleExport = async (type: 'inventory' | 'waste') => {
    try {
      await exportReport.mutateAsync({ type, format: 'csv' })
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'Reserved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Used':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'Expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 3) return 'critical'
    if (daysUntilExpiry <= 7) return 'warning'
    return 'good'
  }

  const getExpiryColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'critical':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'warning':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
      default:
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
    }
  }

  // Loading state
  if (unitsLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600" />
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">Chargement de l'inventaire...</p>
              <p className="text-lg text-gray-600 dark:text-gray-400">Récupération des données des unités de sang</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (unitsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 dark:from-red-900/20 dark:via-pink-900/20 dark:to-rose-900/20">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto space-y-6">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-600" />
            <div className="space-y-3">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">Erreur de chargement</p>
              <p className="text-lg text-red-600 dark:text-red-300">
                {unitsError.message || "Impossible de charger les données d'inventaire"}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                <Droplets className="inline-block w-12 h-12 mr-4" />
                Inventaire Sanguin
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                Gestion complète des stocks et suivi des unités de sang en temps réel
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>{totalUnits} unités totales</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Mise à jour en temps réel</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleRefresh}
                disabled={unitsLoading}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-3 font-semibold rounded-xl backdrop-blur-sm hover:scale-105 transition-all duration-300"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${unitsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>

              <Button
                onClick={() => handleExport('inventory')}
                disabled={exportReport.isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Download className="w-5 h-5 mr-2" />
                {exportReport.isLoading ? 'Export...' : 'Exporter'}
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {analyticsData && !analyticsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              {
                title: "Unités Disponibles",
                value: bloodUnits.filter(unit => unit.status === 'Available').length,
                icon: Droplets,
                bgGradient: "from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20",
                textColor: "text-emerald-600 dark:text-emerald-400",
                valueColor: "text-emerald-700 dark:text-emerald-300",
                iconBg: "from-emerald-500 to-green-600"
              },
              {
                title: "Expirant Bientôt",
                value: bloodUnits.filter(unit => unit.days_until_expiry <= 7 && unit.days_until_expiry > 0).length,
                icon: Clock,
                bgGradient: "from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20",
                textColor: "text-amber-600 dark:text-amber-400",
                valueColor: "text-amber-700 dark:text-amber-300",
                iconBg: "from-amber-500 to-orange-600"
              },
              {
                title: "Unités Expirées",
                value: bloodUnits.filter(unit => unit.status === 'Expired').length,
                icon: AlertTriangle,
                bgGradient: "from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20",
                textColor: "text-red-600 dark:text-red-400",
                valueColor: "text-red-700 dark:text-red-300",
                iconBg: "from-red-500 to-pink-600"
              },
              {
                title: "Taux d'Utilisation",
                value: `${bloodUnits.length > 0 ? Math.round((bloodUnits.filter(unit => unit.status === 'Used').length / bloodUnits.length) * 100) : 0}%`,
                icon: TrendingUp,
                bgGradient: "from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20",
                textColor: "text-blue-600 dark:text-blue-400",
                valueColor: "text-blue-700 dark:text-blue-300",
                iconBg: "from-blue-500 to-indigo-600"
              }
            ].map((card, index) => {
              const Icon = card.icon
              return (
                <Card key={`analytics-card-${index}`} className={`bg-gradient-to-br ${card.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-500`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className={`text-sm font-semibold ${card.textColor} uppercase tracking-wide`}>
                          {card.title}
                        </p>
                        <p className={`text-3xl font-bold ${card.valueColor}`}>
                          {card.value}
                        </p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-br ${card.iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Filters and Search */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl font-bold">
              <Filter className="w-6 h-6 mr-3 text-blue-600" />
              Filtres et Recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par ID, donneur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                />
              </div>

              {/* Blood Type Filter */}
              <Select value={selectedBloodType} onValueChange={setSelectedBloodType}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                  <SelectValue placeholder="Groupe sanguin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">Tous les groupes</SelectItem>
                  {systemConfig?.blood_types.map((type) => (
                    <SelectItem key={`blood-type-${type}`} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">Tous les statuts</SelectItem>
                  {systemConfig?.unit_statuses.map((status) => (
                    <SelectItem key={`status-${status}`} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Expiring Filter */}
              <Select value={expiringDays} onValueChange={setExpiringDays}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                  <SelectValue placeholder="Expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_dates">Toutes les dates</SelectItem>
                  <SelectItem value="3">Expire dans 3 jours</SelectItem>
                  <SelectItem value="7">Expire dans 7 jours</SelectItem>
                  <SelectItem value="14">Expire dans 14 jours</SelectItem>
                  <SelectItem value="30">Expire dans 30 jours</SelectItem>
                </SelectContent>
              </Select>

              {/* Page Size */}
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 par page</SelectItem>
                  <SelectItem value="20">20 par page</SelectItem>
                  <SelectItem value="50">50 par page</SelectItem>
                  <SelectItem value="100">100 par page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results summary */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalUnits)} sur {totalUnits} unités
              </span>
              <span>
                Page {currentPage} sur {totalPages}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Blood Units Table */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold">
              <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
              Unités de Sang ({totalUnits})
            </CardTitle>
            <CardDescription>
              Liste détaillée de toutes les unités de sang avec leur statut et informations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-slate-600">
                    <TableHead className="font-semibold">ID Unité</TableHead>
                    <TableHead className="font-semibold">Groupe Sanguin</TableHead>
                    <TableHead className="font-semibold">Donneur</TableHead>
                    <TableHead className="font-semibold">Date Collecte</TableHead>
                    <TableHead className="font-semibold">Volume (ml)</TableHead>
                    <TableHead className="font-semibold">Expiration</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit) => {
                    const expiryStatus = getExpiryStatus(unit.days_until_expiry)

                    return (
                      <TableRow
                        key={`unit-${unit.unit_id}`}
                        className="border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <TableCell className="font-mono text-sm font-semibold">
                          {unit.unit_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {unit.donor.blood_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{unit.donor.first_name} {unit.donor.last_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {unit.donor.donor_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {new Date(unit.collection_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold">{unit.volume_ml}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-medium ${getExpiryColor(expiryStatus)}`}>
                            <Clock className="w-4 h-4" />
                            <span>
                              {unit.days_until_expiry < 0
                                ? `Expiré il y a ${Math.abs(unit.days_until_expiry)} jours`
                                : unit.days_until_expiry === 0
                                ? 'Expire aujourd\'hui'
                                : `Dans ${unit.days_until_expiry} jours`
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(unit.status)}>
                            {unit.status === 'Available' ? 'Disponible' :
                             unit.status === 'Reserved' ? 'Réservé' :
                             unit.status === 'Used' ? 'Utilisé' :
                             unit.status === 'Expired' ? 'Expiré' : unit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                            onClick={() => {
                              console.log(`Voir détails de l'unité ${unit.unit_id}`)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredUnits.length === 0 && (
                <div className="text-center py-12">
                  <Droplets className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Aucune unité trouvée
                  </p>
                  <p className="text-gray-500 dark:text-gray-500">
                    Essayez de modifier vos critères de recherche ou filtres
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPreviousPage || unitsLoading}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    return (
                      <Button
                        key={`page-${pageNum}`}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={unitsLoading}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage || unitsLoading}
                  className="flex items-center gap-2"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}