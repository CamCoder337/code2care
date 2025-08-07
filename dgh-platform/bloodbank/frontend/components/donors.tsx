"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Phone,
  CalendarIcon,
  Droplets,
  Heart,
  Eye,
  CalendarDays,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw,
  Award,
  TrendingUp,
  Medal,
  Crown,
  Trophy,
  Star,
  BarChart3,
  X
} from "lucide-react"
import { useDonors, useCreateDonor, useUpdateDonor, useDeleteDonor } from "../lib/hooks/useApi"
import { Donor } from "../lib/api"
import { toast } from "sonner"

// Types étendus pour inclure les donations
interface DonorWithStats extends Donor {
  total_donations: number
  total_volume_ml: number
  last_donation_date?: string
  donation_frequency: number
  donor_rank: 'gold' | 'silver' | 'bronze' | 'new'
  contributions: DonorContribution[]
}

interface DonorContribution {
  id: string
  donation_date: string
  volume_ml: number
  site_name: string
  hemoglobin_level?: number
  status: 'completed' | 'pending' | 'rejected'
}

// Mock data pour simuler les données étendues
const generateMockStats = (donor: Donor): DonorWithStats => {
  const donations = Math.floor(Math.random() * 15) + 1
  const volume = donations * (450 + Math.random() * 50)

  return {
    ...donor,
    total_donations: donations,
    total_volume_ml: Math.floor(volume),
    last_donation_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    donation_frequency: Math.floor(donations / 2) + 1,
    donor_rank: donations > 10 ? 'gold' : donations > 5 ? 'silver' : donations > 2 ? 'bronze' : 'new',
    contributions: Array.from({ length: donations }, (_, i) => ({
      id: `contrib_${i + 1}`,
      donation_date: new Date(Date.now() - i * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      volume_ml: 450 + Math.floor(Math.random() * 50),
      site_name: ['CHU Yaoundé', 'Hôpital Central', 'Centre de Don Essos'][Math.floor(Math.random() * 3)],
      hemoglobin_level: 12 + Math.random() * 4,
      status: 'completed' as const
    }))
  }
}

export function Donors() {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBloodType, setFilterBloodType] = useState("all")
  const [filterGender, setFilterGender] = useState("all")
  const [filterRank, setFilterRank] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Dialog states
  const [showAddDonor, setShowAddDonor] = useState(false)
  const [showEditDonor, setShowEditDonor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDonorDetails, setShowDonorDetails] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState<DonorWithStats | null>(null)

  // Form state (sans donor_id pour la modification)
  const [donorForm, setDonorForm] = useState({
    donor_id: "",
    first_name: "",
    last_name: "",
    blood_type: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
  })

  // Build API parameters
  const apiParams = {
    search: searchTerm || undefined,
    blood_type: filterBloodType !== "all" ? filterBloodType : undefined,
    page: currentPage,
    page_size: pageSize,
  }

  // API hooks
  const { data: donorsData, isLoading, error, refetch } = useDonors(apiParams)
  const createDonorMutation = useCreateDonor()
  const updateDonorMutation = useUpdateDonor()
  const deleteDonorMutation = useDeleteDonor()

  // Transform donors with mock stats
  const donorsWithStats = (donorsData?.results || []).map(generateMockStats)

  // Apply client-side filtering and sorting
  let filteredDonors = donorsWithStats.filter(donor => {
    const matchesGender = filterGender === "all" || donor.gender === filterGender
    const matchesRank = filterRank === "all" || donor.donor_rank === filterRank
    return matchesGender && matchesRank
  })

  // Apply sorting
  filteredDonors.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case "name":
        comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        break
      case "donations":
        comparison = a.total_donations - b.total_donations
        break
      case "volume":
        comparison = a.total_volume_ml - b.total_volume_ml
        break
      case "last_donation":
        comparison = (a.last_donation_date || "").localeCompare(b.last_donation_date || "")
        break
      default:
        comparison = 0
    }
    return sortOrder === "desc" ? -comparison : comparison
  })

  const totalCount = donorsData?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Reset form
  const resetForm = () => {
    setDonorForm({
      donor_id: "",
      first_name: "",
      last_name: "",
      blood_type: "",
      phone_number: "",
      date_of_birth: "",
      gender: "",
    })
  }

  // Handle create donor
  const handleCreateDonor = async () => {
    try {
      await createDonorMutation.mutateAsync({
        donor_id: donorForm.donor_id,
        first_name: donorForm.first_name,
        last_name: donorForm.last_name,
        blood_type: donorForm.blood_type,
        phone_number: donorForm.phone_number,
        date_of_birth: donorForm.date_of_birth,
        gender: donorForm.gender as 'M' | 'F',
      })
      setShowAddDonor(false)
      resetForm()
    } catch (error) {
      console.error('Error creating donor:', error)
    }
  }

  // Handle update donor (sans donor_id)
  const handleUpdateDonor = async () => {
    if (!selectedDonor) return

    try {
      await updateDonorMutation.mutateAsync({
        donorId: selectedDonor.donor_id,
        donor: {
          first_name: donorForm.first_name,
          last_name: donorForm.last_name,
          blood_type: donorForm.blood_type,
          phone_number: donorForm.phone_number,
          date_of_birth: donorForm.date_of_birth,
          gender: donorForm.gender as 'M' | 'F',
        }
      })
      setShowEditDonor(false)
      setSelectedDonor(null)
      resetForm()
    } catch (error) {
      console.error('Error updating donor:', error)
    }
  }

  // Handle delete donor
  const handleDeleteDonor = async () => {
    if (!selectedDonor) return

    try {
      await deleteDonorMutation.mutateAsync(selectedDonor.donor_id)
      setShowDeleteConfirm(false)
      setSelectedDonor(null)
    } catch (error) {
      console.error('Error deleting donor:', error)
    }
  }

  // Open edit dialog (sans donor_id dans le formulaire)
  const openEditDialog = (donor: DonorWithStats) => {
    setSelectedDonor(donor)
    setDonorForm({
      donor_id: donor.donor_id, // Gardé pour référence mais pas modifiable
      first_name: donor.first_name,
      last_name: donor.last_name,
      blood_type: donor.blood_type,
      phone_number: donor.phone_number,
      date_of_birth: donor.date_of_birth,
      gender: donor.gender,
    })
    setShowEditDonor(true)
  }

  // Open details dialog
  const openDetailsDialog = (donor: DonorWithStats) => {
    setSelectedDonor(donor)
    setShowDonorDetails(true)
  }

  // Open delete dialog
  const openDeleteDialog = (donor: DonorWithStats) => {
    setSelectedDonor(donor)
    setShowDeleteConfirm(true)
  }

  // Get rank icon and color
  const getRankDetails = (rank: string) => {
    switch (rank) {
      case 'gold':
        return { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Donneur Or' }
      case 'silver':
        return { icon: Medal, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Donneur Argent' }
      case 'bronze':
        return { icon: Trophy, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Donneur Bronze' }
      default:
        return { icon: Star, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Nouveau Donneur' }
    }
  }

  // Calculate age
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Handle search with debounce
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchTerm, filterBloodType, filterGender, filterRank, sortBy])

  // Calculate statistics
  const totalDonors = totalCount
  const goldDonors = filteredDonors.filter(d => d.donor_rank === 'gold').length
  const activeDonors = filteredDonors.filter(d => d.total_donations > 0).length
  const totalDonations = filteredDonors.reduce((sum, d) => sum + d.total_donations, 0)

  const donorStats = [
    { label: "Total Donneurs", value: totalDonors.toLocaleString(), change: "+8%", icon: Users, color: "text-blue-600" },
    { label: "Donneurs Actifs", value: activeDonors.toLocaleString(), change: "+12%", icon: Heart, color: "text-green-600" },
    { label: "Donneurs Or", value: goldDonors.toLocaleString(), change: "+24%", icon: Crown, color: "text-yellow-600" },
    { label: "Total Donations", value: totalDonations.toLocaleString(), change: "+15%", icon: Droplets, color: "text-red-600" },
  ]

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-8 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4">Impossible de charger les données des donneurs</p>
              <Button onClick={() => refetch()} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
              Gestion des Donneurs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Gérer et suivre les donneurs de sang avec classement</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="rounded-xl px-4 py-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Dialog open={showAddDonor} onOpenChange={setShowAddDonor}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl px-6 py-3">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Nouveau Donneur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-blue-700">Ajouter un nouveau donneur</DialogTitle>
                  <DialogDescription>Entrez les informations du donneur pour l'enregistrer</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="donor_id">ID Donneur</Label>
                      <Input
                        id="donor_id"
                        value={donorForm.donor_id}
                        onChange={(e) => setDonorForm({ ...donorForm, donor_id: e.target.value })}
                        className="mt-1 rounded-xl"
                        placeholder="Ex: D001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        value={donorForm.first_name}
                        onChange={(e) => setDonorForm({ ...donorForm, first_name: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        value={donorForm.last_name}
                        onChange={(e) => setDonorForm({ ...donorForm, last_name: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Téléphone</Label>
                      <Input
                        id="phone_number"
                        value={donorForm.phone_number}
                        onChange={(e) => setDonorForm({ ...donorForm, phone_number: e.target.value })}
                        className="mt-1 rounded-xl"
                        placeholder="+237XXXXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="blood_type">Groupe sanguin</Label>
                      <Select
                        value={donorForm.blood_type}
                        onValueChange={(value) => setDonorForm({ ...donorForm, blood_type: value })}
                      >
                        <SelectTrigger className="mt-1 rounded-xl">
                          <SelectValue placeholder="Sélectionner le groupe sanguin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="gender">Sexe</Label>
                      <Select
                        value={donorForm.gender}
                        onValueChange={(value) => setDonorForm({ ...donorForm, gender: value })}
                      >
                        <SelectTrigger className="mt-1 rounded-xl">
                          <SelectValue placeholder="Sélectionner le sexe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculin</SelectItem>
                          <SelectItem value="F">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date de naissance</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={donorForm.date_of_birth}
                        onChange={(e) => setDonorForm({ ...donorForm, date_of_birth: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDonor(false)
                      resetForm()
                    }}
                    className="rounded-xl"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateDonor}
                    disabled={createDonorMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-xl"
                  >
                    {createDonorMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {donorStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.label}
                className="bg-white dark:bg-slate-800 shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden animate-slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-1">
                  <CardContent className="bg-white dark:bg-slate-800 m-1 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-green-600 mt-1">
                          <span>{stat.change}</span> ce mois
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="bg-white dark:bg-slate-800 shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
            <CardTitle className="flex items-center text-xl font-bold">
              <Filter className="w-6 h-6 mr-3 text-blue-600" />
              Recherche & Filtres Avancés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, ID, ou téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Select value={filterBloodType} onValueChange={setFilterBloodType}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Groupe sanguin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRank} onValueChange={setFilterRank}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Classement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rangs</SelectItem>
                  <SelectItem value="gold">🏆 Donneur Or</SelectItem>
                  <SelectItem value="silver">🥈 Donneur Argent</SelectItem>
                  <SelectItem value="bronze">🥉 Donneur Bronze</SelectItem>
                  <SelectItem value="new">⭐ Nouveau</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium">Trier par:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="donations">Nb Donations</SelectItem>
                    <SelectItem value="volume">Volume Total</SelectItem>
                    <SelectItem value="last_donation">Dernière Donation</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="rounded-xl"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {(searchTerm || filterBloodType !== "all" || filterGender !== "all" || filterRank !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterBloodType("all")
                      setFilterGender("all")
                      setFilterRank("all")
                    }}
                    className="rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donors Table */}
        <Card className="bg-white dark:bg-slate-800 shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20">
            <CardTitle className="flex items-center text-xl font-bold">
              <Users className="w-6 h-6 mr-3 text-blue-600" />
              Répertoire des Donneurs avec Classement
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Liste complète des donneurs avec leurs contributions ({filteredDonors.length} affichés sur {totalCount} total)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Chargement des donneurs...</span>
              </div>
            ) : filteredDonors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun donneur trouvé</h3>
                <p className="text-gray-500">Aucun donneur ne correspond à vos critères de recherche</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 dark:border-gray-800">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Donneur</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Classement</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Groupe sanguin</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total Donations</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Volume Total</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Dernière Donation</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonors.map((donor, index) => {
                      const rankDetails = getRankDetails(donor.donor_rank)
                      const RankIcon = rankDetails.icon

                      return (
                        <TableRow
                          key={donor.donor_id}
                          className="animate-slide-in-right hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-gray-100 dark:border-gray-800"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg">
                                <AvatarFallback className="text-white font-semibold text-lg">
                                  {donor.first_name[0]?.toUpperCase()}
                                  {donor.last_name[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-800 dark:text-white">
                                  {donor.first_name} {donor.last_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {donor.donor_id} • {calculateAge(donor.date_of_birth)} ans • {donor.gender === "M" ? "H" : "F"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${rankDetails.bg} ${rankDetails.color}`}>
                              <RankIcon className="w-4 h-4 mr-2" />
                              {rankDetails.label}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                              <Droplets className="w-3 h-3 mr-1" />
                              {donor.blood_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-lg text-blue-600">{donor.total_donations}</span>
                              <div className="flex items-center text-xs text-gray-500">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {donor.donation_frequency} /an
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-red-600">{(donor.total_volume_ml / 1000).toFixed(1)}L</span>
                              <div className="text-xs text-gray-500">
                                ({donor.total_volume_ml} ml)
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {donor.last_donation_date ? (
                                <div>
                                  <div className="font-medium text-gray-800 dark:text-white">
                                    {new Date(donor.last_donation_date).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Il y a {Math.floor((Date.now() - new Date(donor.last_donation_date).getTime()) / (1000 * 60 * 60 * 24))} jours
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Jamais</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{donor.phone_number}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetailsDialog(donor)}
                                className="rounded-xl px-3 py-1"
                                title="Voir détails"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(donor)}
                                className="rounded-xl px-3 py-1"
                                title="Modifier"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteDialog(donor)}
                                className="rounded-xl px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} donneurs
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-xl"
              >
                Précédent
              </Button>
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="rounded-xl w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}

        {/* Donor Details Dialog */}
        <Dialog open={showDonorDetails} onOpenChange={setShowDonorDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg">
                    <AvatarFallback className="text-white font-semibold text-lg">
                      {selectedDonor?.first_name[0]?.toUpperCase()}
                      {selectedDonor?.last_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selectedDonor?.first_name} {selectedDonor?.last_name}</div>
                    {selectedDonor && (
                      <div className="flex items-center space-x-2 mt-1">
                        {(() => {
                          const rankDetails = getRankDetails(selectedDonor.donor_rank)
                          const RankIcon = rankDetails.icon
                          return (
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rankDetails.bg} ${rankDetails.color}`}>
                              <RankIcon className="w-3 h-3 mr-1" />
                              {rankDetails.label}
                            </div>
                          )
                        })()}
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {selectedDonor.blood_type}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Informations détaillées et historique des contributions
              </DialogDescription>
            </DialogHeader>

            {selectedDonor && (
              <div className="space-y-6 mt-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedDonor.total_donations}</div>
                    <div className="text-sm text-gray-600">Donations</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{(selectedDonor.total_volume_ml / 1000).toFixed(1)}L</div>
                    <div className="text-sm text-gray-600">Volume Total</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedDonor.donation_frequency}</div>
                    <div className="text-sm text-gray-600">Donations/An</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{calculateAge(selectedDonor.date_of_birth)}</div>
                    <div className="text-sm text-gray-600">Ans</div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Informations Personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">ID Donneur</Label>
                      <div className="text-lg font-semibold">{selectedDonor.donor_id}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Sexe</Label>
                      <div className="text-lg">{selectedDonor.gender === 'M' ? 'Masculin' : 'Féminin'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Date de naissance</Label>
                      <div className="text-lg">{new Date(selectedDonor.date_of_birth).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                      <div className="text-lg">{selectedDonor.phone_number}</div>
                    </div>
                  </div>
                </div>

                {/* Donation Progress */}
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Progression des Donations
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Vers le prochain niveau</span>
                        <span>{selectedDonor.total_donations} / {selectedDonor.donor_rank === 'gold' ? '15+' : selectedDonor.donor_rank === 'silver' ? '10' : selectedDonor.donor_rank === 'bronze' ? '5' : '2'}</span>
                      </div>
                      <Progress
                        value={selectedDonor.donor_rank === 'gold' ? 100 : (selectedDonor.total_donations / (selectedDonor.donor_rank === 'silver' ? 10 : selectedDonor.donor_rank === 'bronze' ? 5 : 2)) * 100}
                        className="h-3"
                      />
                    </div>
                  </div>
                </div>

                {/* Contributions History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Droplets className="w-5 h-5 mr-2" />
                    Historique des Contributions ({selectedDonor.contributions.length})
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                          <TableRow>
                            <TableHead className="text-left">Date</TableHead>
                            <TableHead className="text-left">Volume</TableHead>
                            <TableHead className="text-left">Site</TableHead>
                            <TableHead className="text-left">Hémoglobine</TableHead>
                            <TableHead className="text-left">Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDonor.contributions.map((contribution, index) => (
                            <TableRow key={contribution.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <TableCell className="font-medium">
                                {new Date(contribution.donation_date).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Droplets className="w-4 h-4 text-red-500" />
                                  <span>{contribution.volume_ml} ml</span>
                                </div>
                              </TableCell>
                              <TableCell>{contribution.site_name}</TableCell>
                              <TableCell>
                                {contribution.hemoglobin_level ? `${contribution.hemoglobin_level.toFixed(1)} g/dL` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={contribution.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {contribution.status === 'completed' ? 'Complété' : 'En attente'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDonorDetails(false)}
                className="rounded-xl"
              >
                Fermer
              </Button>
              <Button
                onClick={() => {
                  if (selectedDonor) {
                    setShowDonorDetails(false)
                    openEditDialog(selectedDonor)
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-xl"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Donor Dialog (sans ID modifiable) */}
        <Dialog open={showEditDonor} onOpenChange={setShowEditDonor}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-700">Modifier le donneur</DialogTitle>
              <DialogDescription>
                Mettre à jour les informations du donneur {selectedDonor?.donor_id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label>ID Donneur (non modifiable)</Label>
                  <Input
                    value={donorForm.donor_id}
                    disabled
                    className="mt-1 rounded-xl bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_first_name">Prénom</Label>
                  <Input
                    id="edit_first_name"
                    value={donorForm.first_name}
                    onChange={(e) => setDonorForm({ ...donorForm, first_name: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Nom</Label>
                  <Input
                    id="edit_last_name"
                    value={donorForm.last_name}
                    onChange={(e) => setDonorForm({ ...donorForm, last_name: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone_number">Téléphone</Label>
                  <Input
                    id="edit_phone_number"
                    value={donorForm.phone_number}
                    onChange={(e) => setDonorForm({ ...donorForm, phone_number: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_blood_type">Groupe sanguin</Label>
                  <Select
                    value={donorForm.blood_type}
                    onValueChange={(value) => setDonorForm({ ...donorForm, blood_type: value })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder="Sélectionner le groupe sanguin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_gender">Sexe</Label>
                  <Select
                    value={donorForm.gender}
                    onValueChange={(value) => setDonorForm({ ...donorForm, gender: value })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder="Sélectionner le sexe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_date_of_birth">Date de naissance</Label>
                  <Input
                    id="edit_date_of_birth"
                    type="date"
                    value={donorForm.date_of_birth}
                    onChange={(e) => setDonorForm({ ...donorForm, date_of_birth: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDonor(false)
                  setSelectedDonor(null)
                  resetForm()
                }}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateDonor}
                disabled={updateDonorMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-xl"
              >
                {updateDonorMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Mettre à jour
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-700">Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer le donneur{" "}
                <span className="font-semibold">
                  {selectedDonor?.first_name} {selectedDonor?.last_name}
                </span>{" "}
                ? Cette action est irréversible et supprimera également son historique de {selectedDonor?.total_donations} donations.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedDonor(null)
                }}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteDonor}
                disabled={deleteDonorMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {deleteDonorMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Supprimer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slide-in-right {
          from { 
            opacity: 0; 
            transform: translateX(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}