"use client"

import { useState, useEffect } from "react"
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
  Filter,
  Download,
  Building,
  Phone,
  Mail,
  Users,
  Activity,
  Clock,
  Trash2,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  TrendingUp,
  Settings
} from "lucide-react"

// Mock data pour les tests
const mockSitesData = {
  results: [
    {
      site_id: "H001",
      nom: "Hôpital Central de Yaoundé",
      ville: "Yaoundé",
      type: "hospital",
      address: "Avenue Kennedy, Yaoundé",
      phone: "+237677123456",
      email: "contact@hcy.cm",
      manager: "Dr. Ngozi Mballa",
      capacity: "500",
      region: "Centre",
      status: "active",
      blood_bank: true,
      current_patients: 350,
      total_requests: 125,
      last_request: "2024-01-15T10:30:00Z"
    },
    {
      site_id: "C002",
      nom: "Clinique des Spécialités",
      ville: "Douala",
      type: "clinic",
      address: "Rue de la Liberté, Douala",
      phone: "+237666789012",
      email: "info@clinique-spec.cm",
      manager: "Dr. Marie Foko",
      capacity: "150",
      region: "Littoral",
      status: "active",
      blood_bank: false,
      current_patients: 89,
      total_requests: 45,
      last_request: "2024-01-14T15:45:00Z"
    },
    {
      site_id: "CC003",
      nom: "Centre de Collecte Nord",
      ville: "Garoua",
      type: "collection_center",
      address: "Quartier Plateau, Garoua",
      phone: "+237655345678",
      email: "nord@collecte.cm",
      manager: "Ahmadou Bello",
      capacity: "100",
      region: "Nord",
      status: "maintenance",
      blood_bank: true,
      current_patients: 0,
      total_requests: 78,
      last_request: "2024-01-10T09:15:00Z"
    }
  ],
  count: 3,
  next: null,
  previous: null
}

// Hook simulé pour les sites
const useSites = (params) => {
  const [data, setData] = useState(mockSitesData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return { data, loading, error, refetch }
}

const useCreateSite = () => {
  const [loading, setLoading] = useState(false)

  const createSite = async (siteData) => {
    setLoading(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        setLoading(false)
        resolve(siteData)
      }, 1000)
    })
  }

  return { createSite, loading }
}

const useUpdateSite = () => {
  const [loading, setLoading] = useState(false)

  const updateSite = async (siteId, siteData) => {
    setLoading(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        setLoading(false)
        resolve(siteData)
      }, 1000)
    })
  }

  return { updateSite, loading }
}

const useDeleteSite = () => {
  const [loading, setLoading] = useState(false)

  const deleteSite = async (siteId) => {
    setLoading(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        setLoading(false)
        resolve()
      }, 1000)
    })
  }

  return { deleteSite, loading }
}

export default function Sites() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRegion, setFilterRegion] = useState("all")
  const [notification, setNotification] = useState(null)
  const [newSite, setNewSite] = useState({
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

  // Paramètres de recherche
  const queryParams = {
    search: searchTerm,
    page: currentPage,
    page_size: pageSize,
    ...(filterType !== "all" && { type: filterType }),
    ...(filterStatus !== "all" && { status: filterStatus }),
    ...(filterRegion !== "all" && { region: filterRegion })
  }

  const { data: sitesData, loading, error, refetch } = useSites(queryParams)
  const { createSite, loading: createLoading } = useCreateSite()
  const { updateSite, loading: updateLoading } = useUpdateSite()
  const { deleteSite, loading: deleteLoading } = useDeleteSite()

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleCreateSite = async (e) => {
    e.preventDefault()
    try {
      await createSite(newSite)
      setIsCreateDialogOpen(false)
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
      refetch()
      showNotification("Site créé avec succès!")
    } catch (error) {
      showNotification("Erreur lors de la création: " + error.message, "error")
    }
  }

  const handleEditSite = async (e) => {
    e.preventDefault()
    try {
      await updateSite(selectedSite.site_id, selectedSite)
      setIsEditDialogOpen(false)
      refetch()
      showNotification("Site mis à jour avec succès!")
    } catch (error) {
      showNotification("Erreur lors de la mise à jour: " + error.message, "error")
    }
  }

  const handleDeleteSite = async () => {
    try {
      await deleteSite(selectedSite.site_id)
      setIsDeleteDialogOpen(false)
      setSelectedSite(null)
      refetch()
      showNotification("Site supprimé avec succès!")
    } catch (error) {
      showNotification("Erreur lors de la suppression: " + error.message, "error")
    }
  }

  const handleExport = async () => {
    try {
      // Simulation d'export
      showNotification("Export réussi!")
    } catch (error) {
      showNotification("Erreur lors de l'export: " + error.message, "error")
    }
  }

  const getStatusBadge = (status) => {
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

  const getTypeBadge = (type) => {
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

  const getTypeLabel = (type) => {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <Alert className="max-w-md mx-auto mt-20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des sites: {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Notification */}
        {notification && (
          <Alert className={`fixed top-4 right-4 z-50 max-w-md ${
            notification.type === 'error' 
              ? 'border-red-200 bg-red-50 text-red-900' 
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

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestion des Sites
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Réseau des hôpitaux, cliniques et centres de collecte partenaires
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
                <form onSubmit={handleCreateSite} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site_id">ID du Site *</Label>
                      <Input
                        id="site_id"
                        value={newSite.site_id}
                        onChange={(e) => setNewSite({...newSite, site_id: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nom">Nom du Site *</Label>
                      <Input
                        id="nom"
                        value={newSite.nom}
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
                        value={newSite.ville}
                        onChange={(e) => setNewSite({...newSite, ville: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Région *</Label>
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
                      value={newSite.address}
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
                        value={newSite.phone}
                        onChange={(e) => setNewSite({...newSite, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newSite.email}
                        onChange={(e) => setNewSite({...newSite, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manager">Responsable</Label>
                      <Input
                        id="manager"
                        value={newSite.manager}
                        onChange={(e) => setNewSite({...newSite, manager: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacité</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={newSite.capacity}
                        onChange={(e) => setNewSite({...newSite, capacity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type de Site</Label>
                      <Select value={newSite.type} onValueChange={(value) => setNewSite({...newSite, type: value})}>
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
                      <Select value={newSite.status} onValueChange={(value) => setNewSite({...newSite, status: value})}>
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
                      checked={newSite.blood_bank}
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
                    <Button type="submit" disabled={createLoading}>
                      {createLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Créer le Site
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="px-6 py-3 hover:scale-105 transition-all duration-300 bg-transparent" onClick={handleExport}>
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

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    <SelectItem value="Centre">Centre</SelectItem>
                    <SelectItem value="Littoral">Littoral</SelectItem>
                    <SelectItem value="Nord">Nord</SelectItem>
                    <SelectItem value="Ouest">Ouest</SelectItem>
                    <SelectItem value="Sud">Sud</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType("all")
                    setFilterStatus("all")
                    setFilterRegion("all")
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
                  <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">{sitesData.count || 0}</p>
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
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {sitesData.results?.filter(s => s.status === "active").length || 0}
                  </p>
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
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {sitesData.results?.filter(s => s.blood_bank).length || 0}
                  </p>
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
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {sitesData.results?.filter(s => s.status === "maintenance").length || 0}
                  </p>
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
                onClick={refetch}
                className="text-white hover:bg-white/20"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
            <CardDescription className="text-teal-100">
              {sitesData.count} site{sitesData.count > 1 ? "s" : ""} trouvé
              {sitesData.count > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                <span className="ml-2 text-gray-600">Chargement des sites...</span>
              </div>
            ) : sitesData.results?.length === 0 ? (
              <div className="text-center p-8">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Aucun site trouvé</p>
                <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
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
                    {sitesData.results?.map((site) => (
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
                                ID: {site.site_id} • {site.manager || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{site.address || site.ville}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <Badge className={getTypeBadge(site.type)}>{getTypeLabel(site.type)}</Badge>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Région {site.region || site.ville}</p>
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
                            {site.capacity && (
                              <>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(((site.current_patients || 0) / site.capacity) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {Math.round(((site.current_patients || 0) / site.capacity) * 100)}% occupé
                                </p>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <Badge className={getStatusBadge(site.status)}>
                              {site.status === "active"
                                ? "Actif"
                                : site.status === "maintenance"
                                  ? "Maintenance"
                                  : "Inactif"}
                            </Badge>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Dernière mise à jour: {site.last_request ? new Date(site.last_request).toLocaleDateString("fr-FR") : 'N/A'}
                            </p>
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
        {sitesData.count > pageSize && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, sitesData.count)} sur {sitesData.count} sites
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!sitesData.previous}
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
                    disabled={!sitesData.next}
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
                      {selectedSite.status === "active" ? "Actif" : selectedSite.status === "maintenance" ? "Maintenance" : "Inactif"}
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

                {/* Capacity and Services */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Capacité et Services</h4>
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
                </div>

                {/* Statistics */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Statistiques</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-700">{selectedSite.total_requests || 0}</p>
                        <p className="text-sm text-blue-600">Total Demandes</p>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-700">{selectedSite.current_patients || 0}</p>
                        <p className="text-sm text-green-600">Patients Actuels</p>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-700">
                          {selectedSite.capacity ? Math.round(((selectedSite.current_patients || 0) / selectedSite.capacity) * 100) : 0}%
                        </p>
                        <p className="text-sm text-purple-600">Taux d'Occupation</p>
                      </div>
                    </Card>
                  </div>
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
              <form onSubmit={handleEditSite} className="space-y-4">
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
                      min="1"
                      value={selectedSite.capacity || ''}
                      onChange={(e) => setSelectedSite({...selectedSite, capacity: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_type">Type de Site</Label>
                    <Select
                      value={selectedSite.type}
                      onValueChange={(value) => setSelectedSite({...selectedSite, type: value})}
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
                  <div>
                    <Label htmlFor="edit_status">Statut</Label>
                    <Select
                      value={selectedSite.status}
                      onValueChange={(value) => setSelectedSite({...selectedSite, status: value})}
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
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_blood_bank"
                    checked={selectedSite.blood_bank || false}
                    onChange={(e) => setSelectedSite({...selectedSite, blood_bank: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="edit_blood_bank">Dispose d'une banque de sang</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" disabled={updateLoading}>
                    {updateLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </form>
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
                disabled={deleteLoading}
              >
                {deleteLoading ? (
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