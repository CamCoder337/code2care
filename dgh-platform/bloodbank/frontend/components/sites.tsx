"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Eye,
  Download,
  Building,
  Phone,
  Mail,
  Users,
  Activity,
  Trash2,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Clock
} from "lucide-react"

// Import des hooks API avec gestion d'erreur
import { useSites, useCreateSite, useUpdateSite, useDeleteSite } from "@/lib/hooks/useApi"

// Types pour les sites
interface ExtendedSite {
  site_id: string
  nom: string
  ville: string
  type: "hospital" | "clinic" | "collection_center"
  address?: string
  phone?: string
  email?: string
  manager?: string
  capacity?: number | string
  region?: string
  status: "active" | "maintenance" | "inactive"
  blood_bank?: boolean
  current_patients?: number
  total_requests?: number
  last_request?: string
  created_at?: string
  updated_at?: string
}

// Données de fallback en cas d'erreur API
const FALLBACK_SITES: ExtendedSite[] = [
  {
    site_id: "S001",
    nom: "CHU Yaoundé",
    type: "hospital",
    ville: "Yaoundé",
    address: "Avenue Kennedy, Yaoundé",
    phone: "+237 222 XX XX XX",
    email: "contact@chu-yaounde.cm",
    manager: "Dr. Marie Atangana",
    capacity: 500,
    current_patients: 342,
    blood_bank: true,
    status: "active",
    last_request: "2024-01-22",
    total_requests: 156,
    region: "Centre",
  },
  {
    site_id: "S002",
    nom: "Hôpital Général de Douala",
    type: "hospital",
    ville: "Douala",
    address: "Boulevard de la Liberté, Douala",
    phone: "+237 233 XX XX XX",
    email: "contact@hgd.cm",
    manager: "Dr. Paul Mbarga",
    capacity: 400,
    current_patients: 298,
    blood_bank: true,
    status: "active",
    last_request: "2024-01-21",
    total_requests: 134,
    region: "Littoral",
  },
]

export default function Sites() {
  // États locaux
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState<ExtendedSite | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [filterType, setFilterType] = useState("all")
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null)
  const [useApiData, setUseApiData] = useState(true)

  // État pour le nouveau site
  const [newSite, setNewSite] = useState<Partial<ExtendedSite>>({
    site_id: "",
    nom: "",
    ville: "",
    type: "hospital",
    address: "",
    phone: "",
    email: "",
    manager: "",
    capacity: "",
    region: "",
    status: "active",
    blood_bank: false
  })

  // Paramètres de recherche pour l'API - Nettoyage des paramètres undefined
  const queryParams = React.useMemo(() => {
    const params: any = {
      page: currentPage,
      page_size: pageSize,
    }

    if (searchTerm?.trim()) {
      params.search = searchTerm.trim()
    }

    if (filterType && filterType !== "all") {
      params.type = filterType
    }

    return params
  }, [searchTerm, currentPage, pageSize, filterType])

  // Hooks API avec gestion d'erreur améliorée
  const sitesQuery = useSites(queryParams, {
    enabled: useApiData,
    retry: (failureCount, error) => {
      console.warn(`Tentative ${failureCount + 1} échouée:`, error)
      if (failureCount >= 2) {
        setUseApiData(false)
        return false
      }
      return true
    },
    onError: (error) => {
      console.error("Erreur lors du chargement des sites:", error)
      showNotification("Utilisation des données hors ligne", "warning")
      setUseApiData(false)
    },
    onSuccess: () => {
      if (!useApiData) {
        setUseApiData(true)
        showNotification("Connexion API rétablie!", "success")
      }
    }
  })

  const createSiteMutation = useCreateSite({
    onSuccess: () => {
      setIsCreateDialogOpen(false)
      resetNewSite()
      showNotification("Site créé avec succès!", "success")
    },
    onError: (error: any) => {
      showNotification(`Erreur lors de la création: ${error?.message || 'Erreur inconnue'}`, "error")
    }
  })

  const updateSiteMutation = useUpdateSite({
    onSuccess: () => {
      setIsEditDialogOpen(false)
      showNotification("Site mis à jour avec succès!", "success")
    },
    onError: (error: any) => {
      showNotification(`Erreur lors de la mise à jour: ${error?.message || 'Erreur inconnue'}`, "error")
    }
  })

  const deleteSiteMutation = useDeleteSite({
    onSuccess: () => {
      setIsDeleteDialogOpen(false)
      setSelectedSite(null)
      showNotification("Site supprimé avec succès!", "success")
    },
    onError: (error: any) => {
      showNotification(`Erreur lors de la suppression: ${error?.message || 'Erreur inconnue'}`, "error")
    }
  })

  // Fonctions utilitaires
  const showNotification = (message: string, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const resetNewSite = () => {
    setNewSite({
      site_id: "",
      nom: "",
      ville: "",
      type: "hospital",
      address: "",
      phone: "",
      email: "",
      manager: "",
      capacity: "",
      region: "",
      status: "active",
      blood_bank: false
    })
  }

  // Gestion des données avec fallback
  const sitesData = useApiData ? sitesQuery.data : null
  const isLoading = useApiData ? sitesQuery.isLoading : false
  const error = useApiData ? sitesQuery.error : null

  // Données finales avec fallback
  const sites = sitesData?.results || (useApiData ? [] : FALLBACK_SITES)
  const totalCount = sitesData?.count || sites.length

  // Filtrage local si pas d'API
  const filteredSites = React.useMemo(() => {
    if (useApiData) {
      return sites
    }

    return FALLBACK_SITES.filter(site => {
      const matchesSearch = !searchTerm ||
        site.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.site_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.region && site.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
        site.type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === "all" || site.type === filterType

      return matchesSearch && matchesType
    })
  }, [useApiData, sites, searchTerm, filterType])

  // Handlers
  const handleCreateSite = async () => {
    if (!newSite.site_id || !newSite.nom || !newSite.ville) {
      showNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    if (useApiData) {
      try {
        await createSiteMutation.mutateAsync(newSite as ExtendedSite)
      } catch (error) {
        console.error("Erreur lors de la création:", error)
      }
    } else {
      // Simulation locale
      showNotification("Mode hors ligne - Changements non sauvegardés", "warning")
      setIsCreateDialogOpen(false)
      resetNewSite()
    }
  }

  const handleEditSite = async () => {
    if (!selectedSite) return

    if (useApiData) {
      try {
        await updateSiteMutation.mutateAsync({
          siteId: selectedSite.site_id,
          site: selectedSite
        })
      } catch (error) {
        console.error("Erreur lors de la modification:", error)
      }
    } else {
      showNotification("Mode hors ligne - Changements non sauvegardés", "warning")
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteSite = async () => {
    if (!selectedSite) return

    if (useApiData) {
      try {
        await deleteSiteMutation.mutateAsync(selectedSite.site_id)
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
      }
    } else {
      showNotification("Mode hors ligne - Changements non sauvegardés", "warning")
      setIsDeleteDialogOpen(false)
      setSelectedSite(null)
    }
  }

  const handleRefresh = () => {
    if (useApiData) {
      sitesQuery.refetch()
    } else {
      setUseApiData(true)
      showNotification("Tentative de reconnexion...", "info")
    }
  }

  // Fonctions utilitaires pour les badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "hospital":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "clinic":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "collection_center":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "hospital":
        return "Hôpital"
      case "clinic":
        return "Clinique"
      case "collection_center":
        return "Centre de Collecte"
      default:
        return type
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif"
      case "maintenance":
        return "Maintenance"
      case "inactive":
        return "Inactif"
      default:
        return status
    }
  }

  // Statistiques calculées de manière sécurisée
  const statistics = React.useMemo(() => {
    const sitesToCalculate = filteredSites || []
    return {
      total: totalCount,
      active: sitesToCalculate.filter((s: any) => s.status === "active").length,
      withBloodBank: sitesToCalculate.filter((s: any) => s.blood_bank).length,
      maintenance: sitesToCalculate.filter((s: any) => s.status === "maintenance").length,
    }
  }, [filteredSites, totalCount])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Notification */}
        {notification && (
          <Alert className={`fixed top-4 right-4 z-50 max-w-md ${
            notification.type === 'error' 
              ? 'border-red-200 bg-red-50 text-red-900' 
              : notification.type === 'warning'
              ? 'border-yellow-200 bg-yellow-50 text-yellow-900'
              : notification.type === 'info'
              ? 'border-blue-200 bg-blue-50 text-blue-900'
              : 'border-green-200 bg-green-50 text-green-900'
          }`}>
            {notification.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Indicateur de mode hors ligne */}
        {!useApiData && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Mode hors ligne - Données limitées disponibles</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reconnecter
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestion des Sites
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Réseau des hôpitaux, cliniques et centres de collecte partenaires
              {!useApiData && " (Mode hors ligne)"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white px-6 py-3 hover:scale-105 transition-all duration-300">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau Site
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un Nouveau Site</DialogTitle>
                  <DialogDescription>
                    Ajouter un nouveau site au réseau de partenaires
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site_id">ID du Site *</Label>
                      <Input
                        id="site_id"
                        value={newSite.site_id || ""}
                        onChange={(e) => setNewSite({...newSite, site_id: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nom">Nom du Site *</Label>
                      <Input
                        id="nom"
                        value={newSite.nom || ""}
                        onChange={(e) => setNewSite({...newSite, nom: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ville">Ville *</Label>
                      <Input
                        id="ville"
                        value={newSite.ville || ""}
                        onChange={(e) => setNewSite({...newSite, ville: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Région</Label>
                      <Select value={newSite.region || ""} onValueChange={(value) => setNewSite({...newSite, region: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une région" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Centre">Centre</SelectItem>
                          <SelectItem value="Littoral">Littoral</SelectItem>
                          <SelectItem value="Nord">Nord</SelectItem>
                          <SelectItem value="Ouest">Ouest</SelectItem>
                          <SelectItem value="Sud">Sud</SelectItem>
                          <SelectItem value="Est">Est</SelectItem>
                          <SelectItem value="Adamaoua">Adamaoua</SelectItem>
                          <SelectItem value="Nord-Ouest">Nord-Ouest</SelectItem>
                          <SelectItem value="Sud-Ouest">Sud-Ouest</SelectItem>
                          <SelectItem value="Extrême-Nord">Extrême-Nord</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Textarea
                      id="address"
                      value={newSite.address || ""}
                      onChange={(e) => setNewSite({...newSite, address: e.target.value})}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newSite.phone || ""}
                        onChange={(e) => setNewSite({...newSite, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newSite.email || ""}
                        onChange={(e) => setNewSite({...newSite, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manager">Responsable</Label>
                      <Input
                        id="manager"
                        value={newSite.manager || ""}
                        onChange={(e) => setNewSite({...newSite, manager: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacité</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newSite.capacity || ""}
                        onChange={(e) => setNewSite({...newSite, capacity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type de Site</Label>
                      <Select value={newSite.type} onValueChange={(value: any) => setNewSite({...newSite, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hôpital</SelectItem>
                          <SelectItem value="clinic">Clinique</SelectItem>
                          <SelectItem value="collection_center">Centre de Collecte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select value={newSite.status} onValueChange={(value: any) => setNewSite({...newSite, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="blood_bank"
                      checked={newSite.blood_bank || false}
                      onChange={(e) => setNewSite({...newSite, blood_bank: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="blood_bank">Dispose d'une banque de sang</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button onClick={handleCreateSite} disabled={createSiteMutation.isPending}>
                      {createSiteMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Créer le Site
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="px-6 py-3 hover:scale-105 transition-all duration-300 bg-transparent">
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
                  placeholder="Rechercher par nom, ID, région ou type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="hospital">Hôpital</SelectItem>
                    <SelectItem value="clinic">Clinique</SelectItem>
                    <SelectItem value="collection_center">Centre de Collecte</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType("all")
                    setSearchTerm("")
                  }}
                  className="bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-teal-50 to-blue-100 dark:from-teal-900/20 dark:to-blue-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-600 dark:text-teal-400">Total Sites</p>
                  <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">{statistics.total}</p>
                </div>
                <Building className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Sites Actifs</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{statistics.active}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Avec Banque de Sang</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{statistics.withBloodBank}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">En Maintenance</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{statistics.maintenance}</p>
                </div>
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites List */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6">
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Réseau des Sites Partenaires</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-white hover:bg-white/20"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
            <CardDescription className="text-teal-100">
              {filteredSites.length} site{filteredSites.length > 1 ? "s" : ""} trouvé{filteredSites.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                <span className="ml-2 text-gray-600">Chargement des sites...</span>
              </div>
            ) : filteredSites.length === 0 ? (
              <div className="text-center p-8">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Aucun site trouvé</p>
                <p className="text-gray-500">
                  {searchTerm ? "Essayez de modifier vos critères de recherche" : "Commencez par créer votre premier site"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Site</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Type & Région</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Contact</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Capacité</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Statut</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSites.map((site: any) => (
                      <tr
                        key={site.site_id}
                        className="hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {site.type === "hospital" ? (
                                <Building className="w-6 h-6" />
                              ) : site.type === "clinic" ? (
                                <Activity className="w-6 h-6" />
                              ) : (
                                <MapPin className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{site.nom}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                ID: {site.site_id}
                                {site.manager && ` • ${site.manager}`}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{site.ville}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <Badge className={getTypeBadge(site.type)}>{getTypeLabel(site.type)}</Badge>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {site.region || site.ville}
                            </p>
                            {site.blood_bank && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
                                Banque de Sang
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">{site.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">{site.email || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {site.current_patients || 0}/{site.capacity || 'N/A'}
                              </span>
                            </div>
                            {site.capacity && site.current_patients !== undefined && (
                              <>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min((site.current_patients / Number(site.capacity)) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {Math.round((site.current_patients / Number(site.capacity)) * 100)}% occupé
                                </p>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <Badge className={getStatusBadge(site.status)}>
                              {getStatusLabel(site.status)}
                            </Badge>
                            {site.last_request && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Dernière demande: {new Date(site.last_request).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent"
                              onClick={() => {
                                setSelectedSite(site)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent"
                              onClick={() => {
                                setSelectedSite(site)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent text-red-600"
                              onClick={() => {
                                setSelectedSite(site)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalCount > pageSize && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} sites
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded text-sm font-medium">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * pageSize >= totalCount}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Site Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Détails du Site - {selectedSite?.nom}
              </DialogTitle>
              <DialogDescription>
                Informations complètes du site {selectedSite?.site_id}
              </DialogDescription>
            </DialogHeader>
            {selectedSite && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">ID du Site</Label>
                    <p className="text-lg font-semibold">{selectedSite.site_id}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Nom</Label>
                    <p className="text-lg font-semibold">{selectedSite.nom}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Ville</Label>
                    <p>{selectedSite.ville}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Région</Label>
                    <p>{selectedSite.region || 'N/A'}</p>
                  </div>
                </div>

                {/* Type and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Type</Label>
                    <Badge className={getTypeBadge(selectedSite.type)}>
                      {getTypeLabel(selectedSite.type)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Statut</Label>
                    <Badge className={getStatusBadge(selectedSite.status)}>
                      {getStatusLabel(selectedSite.status)}
                    </Badge>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Informations de Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Téléphone</Label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedSite.phone || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selectedSite.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Adresse</Label>
                    <p>{selectedSite.address || 'Non renseignée'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Responsable</Label>
                    <p>{selectedSite.manager || 'Non renseigné'}</p>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Services</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Capacité</Label>
                      <p className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {selectedSite.capacity || 'Non renseignée'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Banque de Sang</Label>
                      <p className="flex items-center gap-2">
                        {selectedSite.blood_bank ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Disponible
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            Non disponible
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedSite.current_patients !== undefined && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Occupation Actuelle</Label>
                      <p className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        {selectedSite.current_patients}/{selectedSite.capacity} patients
                      </p>
                    </div>
                  )}
                  {selectedSite.total_requests !== undefined && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Total des Demandes</Label>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {selectedSite.total_requests} demandes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Site Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le Site</DialogTitle>
              <DialogDescription>
                Mettre à jour les informations du site {selectedSite?.site_id}
              </DialogDescription>
            </DialogHeader>
            {selectedSite && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_nom">Nom du Site *</Label>
                    <Input
                      id="edit_nom"
                      value={selectedSite.nom}
                      onChange={(e) => setSelectedSite({...selectedSite, nom: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_ville">Ville *</Label>
                    <Input
                      id="edit_ville"
                      value={selectedSite.ville}
                      onChange={(e) => setSelectedSite({...selectedSite, ville: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit_address">Adresse</Label>
                  <Textarea
                    id="edit_address"
                    value={selectedSite.address || ''}
                    onChange={(e) => setSelectedSite({...selectedSite, address: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_phone">Téléphone</Label>
                    <Input
                      id="edit_phone"
                      type="tel"
                      value={selectedSite.phone || ''}
                      onChange={(e) => setSelectedSite({...selectedSite, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={selectedSite.email || ''}
                      onChange={(e) => setSelectedSite({...selectedSite, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_manager">Responsable</Label>
                    <Input
                      id="edit_manager"
                      value={selectedSite.manager || ''}
                      onChange={(e) => setSelectedSite({...selectedSite, manager: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_capacity">Capacité</Label>
                    <Input
                      id="edit_capacity"
                      type="number"
                      value={selectedSite.capacity || ''}
                      onChange={(e) => setSelectedSite({...selectedSite, capacity: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_region">Région</Label>
                    <Select
                      value={selectedSite.region || ""}
                      onValueChange={(value) => setSelectedSite({...selectedSite, region: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Centre">Centre</SelectItem>
                        <SelectItem value="Littoral">Littoral</SelectItem>
                        <SelectItem value="Nord">Nord</SelectItem>
                        <SelectItem value="Ouest">Ouest</SelectItem>
                        <SelectItem value="Sud">Sud</SelectItem>
                        <SelectItem value="Est">Est</SelectItem>
                        <SelectItem value="Adamaoua">Adamaoua</SelectItem>
                        <SelectItem value="Nord-Ouest">Nord-Ouest</SelectItem>
                        <SelectItem value="Sud-Ouest">Sud-Ouest</SelectItem>
                        <SelectItem value="Extrême-Nord">Extrême-Nord</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_type">Type de Site</Label>
                    <Select
                      value={selectedSite.type}
                      onValueChange={(value: any) => setSelectedSite({...selectedSite, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hôpital</SelectItem>
                        <SelectItem value="clinic">Clinique</SelectItem>
                        <SelectItem value="collection_center">Centre de Collecte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_status">Statut</Label>
                    <Select
                      value={selectedSite.status}
                      onValueChange={(value: any) => setSelectedSite({...selectedSite, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="edit_blood_bank"
                      checked={selectedSite.blood_bank || false}
                      onChange={(e) => setSelectedSite({...selectedSite, blood_bank: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="edit_blood_bank">Dispose d'une banque de sang</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleEditSite} disabled={updateSiteMutation.isPending}>
                    {updateSiteMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Confirmer la Suppression
              </DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer le site "{selectedSite?.nom}" ?
                Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSite}
                disabled={deleteSiteMutation.isPending}
              >
                {deleteSiteMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Supprimer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}