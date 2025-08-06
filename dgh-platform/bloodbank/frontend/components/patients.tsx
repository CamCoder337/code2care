"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/i18n"
import {
  UserCheck, Search, Plus, Edit, Eye, Filter, Download, Calendar, Activity,
  Loader2, AlertCircle, X, Save, User, Droplets, FileText, CalendarDays, Users,
  RefreshCw, Wifi, WifiOff
} from "lucide-react"
// ✅ Import corrigé - ajouter usePatients
import { usePatients, useCreatePatient, useUpdatePatient } from "@/lib/hooks/useApi"
import { toast } from "sonner"

interface PatientFormData {
  patient_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'M' | 'F' | ''
  blood_type: string
  patient_history: string
}

export function Patients() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<any>(null)
  const [filters, setFilters] = useState({
    blood_type: "",
    page: 1,
    page_size: 20
  })

  // État du formulaire
  const [formData, setFormData] = useState<PatientFormData>({
    patient_id: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: '',
    blood_type: "",
    patient_history: ""
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Construire les paramètres de requête
  const queryParams = {
    search: searchTerm || undefined,
    blood_type: filters.blood_type || undefined,
    page: currentPage,
    page_size: filters.page_size,
  }

  // ✅ Hooks API avec gestion d'erreur améliorée
  const {
    data: patientsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = usePatients(queryParams, {
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error("❌ Error loading patients:", error)
      // Ne pas afficher de toast ici pour éviter le spam
    },
    // Données de fallback en cas d'erreur réseau
    placeholderData: {
      results: [],
      count: 0,
      next: null,
      previous: null
    }
  })

  const createPatientMutation = useCreatePatient({
    onSuccess: () => {
      setShowCreateModal(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      console.error("❌ Error creating patient:", error)
    }
  })

  const updatePatientMutation = useUpdatePatient({
    onSuccess: () => {
      setShowEditModal(false)
      setEditingPatient(null)
      resetForm()
      refetch()
    },
    onError: (error) => {
      console.error("❌ Error updating patient:", error)
    }
  })

  // Effet pour gérer les changements de recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Génération automatique de l'ID patient
  const generatePatientId = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `P${timestamp}${random}`
  }

  // Reset du formulaire
  const resetForm = () => {
    setFormData({
      patient_id: "",
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: '',
      blood_type: "",
      patient_history: ""
    })
    setFormErrors({})
  }

  // Validation du formulaire
  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: Record<string, string> = {}

    if (!isEdit) {
      if (!formData.first_name.trim()) {
        errors.first_name = "Le prénom est requis"
      }

      if (!formData.last_name.trim()) {
        errors.last_name = "Le nom est requis"
      }

      if (!formData.date_of_birth) {
        errors.date_of_birth = "La date de naissance est requise"
      } else {
        const birthDate = new Date(formData.date_of_birth)
        const today = new Date()
        if (birthDate >= today) {
          errors.date_of_birth = "La date de naissance doit être antérieure à aujourd'hui"
        }

        const age = today.getFullYear() - birthDate.getFullYear()
        if (age > 120) {
          errors.date_of_birth = "Âge non valide"
        }
      }

      if (!formData.gender) {
        errors.gender = "Le sexe est requis"
      }

      if (!formData.blood_type) {
        errors.blood_type = "Le groupe sanguin est requis"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Gestion de la soumission du formulaire de création
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm(false)) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    try {
      const patientData = {
        ...formData,
        patient_id: generatePatientId() // ID généré automatiquement
      }
      await createPatientMutation.mutateAsync(patientData)
    } catch (error) {
      console.error("Erreur lors de la création:", error)
    }
  }

  // Gestion de la soumission du formulaire de modification
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingPatient) {
      toast.error("Aucun patient sélectionné pour modification")
      return
    }

    try {
      // Seul l'historique peut être modifié
      await updatePatientMutation.mutateAsync({
        patientId: editingPatient.patient_id,
        patient: { patient_history: formData.patient_history }
      })
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
    }
  }

  // Ouvrir le modal de création
  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  // Ouvrir le modal de modification
  const openEditModal = (patient: any) => {
    setEditingPatient(patient)
    setFormData({
      patient_id: patient.patient_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_type: patient.blood_type,
      patient_history: patient.patient_history || ""
    })
    setShowEditModal(true)
  }

  // ✅ Calculer les statistiques à partir des données avec fallback
  const getStatistics = () => {
    if (!patientsData?.results) {
      return {
        totalPatients: 0,
        activePatients: 0,
        malePatients: 0,
        femalePatients: 0
      }
    }

    const totalPatients = patientsData.count || 0
    const activePatients = patientsData.results.length || 0
    const malePatients = patientsData.results.filter(p => p.gender === 'M').length || 0
    const femalePatients = patientsData.results.filter(p => p.gender === 'F').length || 0

    return {
      totalPatients,
      activePatients,
      malePatients,
      femalePatients
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("fr-FR")
    } catch {
      return "N/A"
    }
  }

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const getGenderLabel = (gender: string) => {
    return gender === 'M' ? 'Masculin' : gender === 'F' ? 'Féminin' : 'N/A'
  }

  const getGenderIcon = (gender: string) => {
    return gender === 'M' ? '♂' : gender === 'F' ? '♀' : '?'
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

  // ✅ Gestion d'erreur améliorée - Éviter la page blanche
  if (isError && !patientsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6 lg:p-8 space-y-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <WifiOff className="w-12 h-12 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                    Connexion interrompue
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                    Impossible de se connecter au serveur. Vérifiez votre connexion internet.
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => refetch()}
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Reconnexion...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Réessayer
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={openCreateModal}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Travailler en mode hors ligne
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Affichage du loading avec fallback
  if (isLoading && !patientsData) {
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

  // ✅ Données avec fallback sécurisé
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
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                Gestion des Patients
              </h1>
              {/* ✅ Indicateur de connexion */}
              {isError ? (
                <WifiOff className="w-6 h-6 text-red-500" title="Hors ligne" />
              ) : isFetching ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" title="Synchronisation..." />
              ) : (
                <Wifi className="w-5 h-5 text-green-500" title="Connecté" />
              )}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Suivi et gestion des patients nécessitant des transfusions sanguines
            </p>
            {isError && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                Mode hors ligne - Certaines fonctionnalités peuvent être limitées
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 hover:scale-105 transition-all duration-300"
              onClick={openCreateModal}
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Patient
            </Button>
            <Button
              variant="outline"
              className="px-6 py-3 hover:scale-105 transition-all duration-300 bg-transparent"
              onClick={() => {
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
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Hommes</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{statistics.malePatients}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-600 dark:text-pink-400">Femmes</p>
                  <p className="text-3xl font-bold text-pink-700 dark:text-pink-300">{statistics.femalePatients}</p>
                </div>
                <Users className="w-8 h-8 text-pink-600" />
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
              {isError && " (Mode hors ligne)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {patients.length === 0 ? (
              <div className="p-8 text-center">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {isError ? "Données non disponibles" : "Aucun patient trouvé"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {isError
                    ? "Impossible de charger les patients. Vérifiez votre connexion."
                    : searchTerm || filters.blood_type
                    ? "Aucun patient ne correspond à vos critères de recherche."
                    : "Aucun patient enregistré dans le système."
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  {isError && (
                    <Button
                      variant="outline"
                      onClick={() => refetch()}
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Réessayer
                    </Button>
                  )}
                  <Button
                    onClick={openCreateModal}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isError ? "Ajouter en mode hors ligne" : "Ajouter le premier patient"}
                  </Button>
                </div>
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
                          Sexe
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
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                patient.gender === 'M' 
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                                  : 'bg-gradient-to-br from-pink-500 to-purple-500'
                              }`}>
                                {getPatientInitials(patient.first_name, patient.last_name)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  ID: {patient.patient_id} • {patient.age || 'N/A'} ans
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getGenderIcon(patient.gender)}</span>
                              <span className="text-sm font-medium">{getGenderLabel(patient.gender)}</span>
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
                                onClick={() => setSelectedPatient(patient)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent"
                                onClick={() => openEditModal(patient)}
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
                        disabled={!hasPreviousPage || isFetching}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Précédent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasNextPage || isFetching}
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

        {/* Create Patient Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-xl font-bold">Nouveau Patient</CardTitle>
                      <CardDescription className="text-purple-100">
                        Ajouter un nouveau patient dans le système
                        {isError && " (Mode hors ligne)"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isError && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Mode hors ligne: Les données seront synchronisées dès que la connexion sera rétablie.</span>
                    </div>
                  </div>
                )}
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  {/* Nom et Prénom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="Prénom du patient"
                        className={formErrors.first_name ? "border-red-500" : ""}
                      />
                      {formErrors.first_name && (
                        <p className="text-sm text-red-600">{formErrors.first_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Nom de famille du patient"
                        className={formErrors.last_name ? "border-red-500" : ""}
                      />
                      {formErrors.last_name && (
                        <p className="text-sm text-red-600">{formErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Date de naissance et Sexe */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Date de naissance
                      </Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className={formErrors.date_of_birth ? "border-red-500" : ""}
                      />
                      {formErrors.date_of_birth && (
                        <p className="text-sm text-red-600">{formErrors.date_of_birth}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Sexe
                      </Label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'M' | 'F' | '' }))}
                        className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 dark:border-gray-600 ${
                          formErrors.gender ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="">Sélectionner le sexe</option>
                        <option value="M">♂ Masculin</option>
                        <option value="F">♀ Féminin</option>
                      </select>
                      {formErrors.gender && (
                        <p className="text-sm text-red-600">{formErrors.gender}</p>
                      )}
                    </div>
                  </div>

                  {/* Groupe sanguin */}
                  <div className="space-y-2">
                    <Label htmlFor="blood_type" className="flex items-center gap-2">
                      <Droplets className="w-4 h-4" />
                      Groupe sanguin
                    </Label>
                    <select
                      id="blood_type"
                      value={formData.blood_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, blood_type: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 dark:border-gray-600 ${
                        formErrors.blood_type ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Sélectionner un groupe sanguin</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {formErrors.blood_type && (
                      <p className="text-sm text-red-600">{formErrors.blood_type}</p>
                    )}
                  </div>

                  {/* Historique médical */}
                  <div className="space-y-2">
                    <Label htmlFor="patient_history" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Historique médical
                    </Label>
                    <Textarea
                      id="patient_history"
                      value={formData.patient_history}
                      onChange={(e) => setFormData(prev => ({ ...prev, patient_history: e.target.value }))}
                      placeholder="Historique médical du patient (optionnel)"
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      disabled={createPatientMutation.isPending}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      disabled={createPatientMutation.isPending}
                    >
                      {createPatientMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {isError ? "Créer (hors ligne)" : "Créer le patient"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Patient Modal - Seul l'historique peut être modifié */}
        {showEditModal && editingPatient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Edit className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-xl font-bold">Modifier Historique Patient</CardTitle>
                      <CardDescription className="text-green-100">
                        Modifier l'historique médical de {editingPatient.first_name} {editingPatient.last_name}
                        {isError && " (Mode hors ligne)"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    onClick={() => setShowEditModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isError && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Mode hors ligne: Les modifications seront synchronisées dès que la connexion sera rétablie.</span>
                    </div>
                  </div>
                )}
                {/* Informations en lecture seule */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-6 space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Informations du patient (lecture seule)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">ID Patient:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{editingPatient.patient_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Nom complet:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {editingPatient.first_name} {editingPatient.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Sexe:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {getGenderIcon(editingPatient.gender)} {getGenderLabel(editingPatient.gender)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Groupe sanguin:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-bold ml-1">
                          {editingPatient.blood_type}
                        </Badge>
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Date de naissance:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {formatDate(editingPatient.date_of_birth)} ({editingPatient.age || 'N/A'} ans)
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-6">
                  {/* Historique médical - Seul champ modifiable */}
                  <div className="space-y-2">
                    <Label htmlFor="edit_patient_history" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Historique médical
                    </Label>
                    <Textarea
                      id="edit_patient_history"
                      value={formData.patient_history}
                      onChange={(e) => setFormData(prev => ({ ...prev, patient_history: e.target.value }))}
                      placeholder="Ajouter ou modifier l'historique médical du patient..."
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Note: Seul l'historique médical peut être modifié. Les autres informations du patient sont protégées.
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                      disabled={updatePatientMutation.isPending}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      disabled={updatePatientMutation.isPending}
                    >
                      {updatePatientMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Modification...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {isError ? "Sauvegarder (hors ligne)" : "Sauvegarder l'historique"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      selectedPatient.gender === 'M' 
                        ? 'bg-white/20' 
                        : 'bg-white/20'
                    }`}>
                      {getPatientInitials(selectedPatient.first_name, selectedPatient.last_name)}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        ID: {selectedPatient.patient_id} • {getGenderLabel(selectedPatient.gender)}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Sexe
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getGenderIcon(selectedPatient.gender)}</span>
                        <span className="font-semibold">{getGenderLabel(selectedPatient.gender)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Groupe Sanguin
                      </label>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-red-500" />
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-bold">
                          {selectedPatient.blood_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Âge
                      </label>
                      <p className="font-semibold flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {selectedPatient.age || 'N/A'} ans
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Date de Naissance
                      </label>
                      <p className="font-semibold">{formatDate(selectedPatient.date_of_birth)}</p>
                    </div>
                  </div>
                </div>

                {/* Historique médical */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Historique médical
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedPatient.patient_history || "Aucun historique médical disponible"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPatient(null)
                      openEditModal(selectedPatient)
                    }}
                    className="flex items-center gap-2"
                    disabled={isError}
                  >
                    <Edit className="w-4 h-4" />
                    {isError ? "Modification indisponible" : "Modifier l'historique"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}