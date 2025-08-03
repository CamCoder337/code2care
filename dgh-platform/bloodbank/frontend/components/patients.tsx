"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n"
import { UserCheck, Search, Plus, Edit, Eye, Filter, Download, Calendar, Phone, Mail, Activity, Loader2, AlertCircle } from "lucide-react"
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from "@/lib/hooks/useApi"
import { toast } from "sonner"

export function Patients() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    blood_type: "",
    page: 1,
    page_size: 20
  })

  // Construire les paramètres de requête
  const queryParams = {
    search: searchTerm || undefined,
    blood_type: filters.blood_type || undefined,
    page: currentPage,
    page_size: filters.page_size,
  }

  // Hooks API
  const {
    data: patientsData,
    isLoading,
    isError,
    error,
    refetch
  } = usePatients(queryParams)

  const createPatientMutation = useCreatePatient()
  const updatePatientMutation = useUpdatePatient()
  const deletePatientMutation = useDeletePatient()

  // Effet pour gérer les changements de recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1) // Reset à la page 1 lors d'une nouvelle recherche
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Calculer les statistiques à partir des données
  const getStatistics = () => {
    if (!patientsData?.results) {
      return {
        totalPatients: 0,
        activePatients: 0,
        transfusionsThisMonth: 0,
        emergencies: 0
      }
    }

    // Pour les statistiques complètes, on aurait besoin d'endpoints dédiés
    // Ici on utilise les données disponibles
    const totalPatients = patientsData.count || 0
    const activePatients = patientsData.results.length || 0

    return {
      totalPatients,
      activePatients,
      transfusionsThisMonth: 0, // Nécessiterait un endpoint dédié
      emergencies: 0 // Nécessiterait un endpoint dédié
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
    setCurrentPage(1)
  }

  const statistics = getStatistics()

  // Affichage du loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6 lg:p-8 space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="text-lg text-gray-600 dark:text-gray-400">
                Chargement des patients...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Affichage des erreurs
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6 lg:p-8 space-y-8">
          <div className="flex items-center justify-center h-64">
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Erreur de chargement</h3>
                  <p className="text-sm">
                    {error?.message || "Impossible de charger les patients"}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => refetch()}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const patients = patientsData?.results || []
  const totalCount = patientsData?.count || 0
  const hasNextPage = !!patientsData?.next
  const hasPreviousPage = !!patientsData?.previous

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Gestion des Patients
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Suivi et gestion des patients nécessitant des transfusions sanguines
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 hover:scale-105 transition-all duration-300"
              onClick={() => {
                // Ouvrir modal de création
                toast.info("Fonctionnalité de création en cours de développement")
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Patient
            </Button>
            <Button
              variant="outline"
              className="px-6 py-3 hover:scale-105 transition-all duration-300 bg-transparent"
              onClick={() => {
                // Export functionality
                toast.info("Fonctionnalité d'export en cours de développement")
              }}
            >
              <Download className="w-5 h-5 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Rechercher par nom, ID ou groupe sanguin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <select
                value={filters.blood_type}
                onChange={(e) => handleFilterChange('blood_type', e.target.value)}
                className="px-4 h-12 border border-gray-300 rounded-md bg-white dark:bg-slate-800 dark:border-gray-600"
              >
                <option value="">Tous les groupes sanguins</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <Button variant="outline" className="px-6 h-12 bg-transparent">
                <Filter className="w-5 h-5 mr-2" />
                Plus de filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Patients</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{statistics.totalPatients}</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Patients Actifs</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{statistics.activePatients}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Transfusions ce mois</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{statistics.transfusionsThisMonth}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Urgences</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{statistics.emergencies}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <CardTitle className="text-2xl font-bold">Liste des Patients</CardTitle>
            <CardDescription className="text-purple-100">
              {totalCount} patient{totalCount > 1 ? "s" : ""} au total, {patients.length} affiché{patients.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {patients.length === 0 ? (
              <div className="p-8 text-center">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Aucun patient trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filters.blood_type
                    ? "Aucun patient ne correspond à vos critères de recherche."
                    : "Aucun patient enregistré dans le système."
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Patient
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Groupe Sanguin
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Date de Naissance
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Historique
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {patients.map((patient) => (
                        <tr
                          key={patient.patient_id}
                          className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {getPatientInitials(patient.first_name, patient.last_name)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  ID: {patient.patient_id} • {patient.age} ans
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-bold">
                              {patient.blood_type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(patient.date_of_birth)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                              {patient.patient_history || "Aucun historique"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent"
                                onClick={() => {
                                  setSelectedPatient(patient)
                                  toast.info("Détails du patient")
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent"
                                onClick={() => {
                                  toast.info("Fonctionnalité d'édition en cours de développement")
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalCount > filters.page_size && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} sur {Math.ceil(totalCount / filters.page_size)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasPreviousPage}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Précédent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasNextPage}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </CardTitle>
                    <CardDescription className="text-purple-100">
                      ID: {selectedPatient.patient_id}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    onClick={() => setSelectedPatient(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Groupe Sanguin
                    </label>
                    <p className="font-semibold">{selectedPatient.blood_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Âge
                    </label>
                    <p className="font-semibold">{selectedPatient.age} ans</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Date de Naissance
                    </label>
                    <p className="font-semibold">{formatDate(selectedPatient.date_of_birth)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Historique Médical
                  </label>
                  <p className="mt-1 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                    {selectedPatient.patient_history || "Aucun historique disponible"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}