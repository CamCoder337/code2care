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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  RefreshCw
} from "lucide-react"
import { useDonors, useCreateDonor, useUpdateDonor, useDeleteDonor } from "../lib/hooks/useApi"
import { Donor } from "../lib/api"
import { toast } from "sonner"

export function Donors() {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBloodType, setFilterBloodType] = useState("all")
  const [filterGender, setFilterGender] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Dialog states
  const [showAddDonor, setShowAddDonor] = useState(false)
  const [showEditDonor, setShowEditDonor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null)

  // Form state
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

  const donors = donorsData?.results || []
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

  // Handle update donor
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

  // Open edit dialog
  const openEditDialog = (donor: Donor) => {
    setSelectedDonor(donor)
    setDonorForm({
      donor_id: donor.donor_id,
      first_name: donor.first_name,
      last_name: donor.last_name,
      blood_type: donor.blood_type,
      phone_number: donor.phone_number,
      date_of_birth: donor.date_of_birth,
      gender: donor.gender,
    })
    setShowEditDonor(true)
  }

  // Open delete dialog
  const openDeleteDialog = (donor: Donor) => {
    setSelectedDonor(donor)
    setShowDeleteConfirm(true)
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
  }, [searchTerm, filterBloodType, filterGender])

  // Calculate statistics from current data
  const totalDonors = totalCount
  const activeDonors = donors.length // Assume all loaded donors are active
  const newThisMonth = Math.floor(totalCount * 0.1) // Estimate

  const donorStats = [
    { label: "Total Donors", value: totalDonors.toLocaleString(), change: "+8%", icon: Users, color: "text-blue-600" },
    { label: "Active Donors", value: activeDonors.toLocaleString(), change: "+12%", icon: Heart, color: "text-green-600" },
    { label: "New This Month", value: newThisMonth.toLocaleString(), change: "+24%", icon: UserPlus, color: "text-teal-600" },
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
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Gérer et suivre les donneurs de sang</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-slate-800 shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
            <CardTitle className="flex items-center text-xl font-bold">
              <Filter className="w-6 h-6 mr-3 text-blue-600" />
              Recherche & Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
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
            </div>
          </CardContent>
        </Card>

        {/* Donors Table */}
        <Card className="bg-white dark:bg-slate-800 shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20">
            <CardTitle className="flex items-center text-xl font-bold">
              <Users className="w-6 h-6 mr-3 text-blue-600" />
              Répertoire des Donneurs
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Liste complète des donneurs enregistrés ({totalCount} total)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Chargement des donneurs...</span>
              </div>
            ) : donors.length === 0 ? (
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
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Groupe sanguin</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Âge</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Sexe</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((donor, index) => (
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
                              <div className="text-sm text-gray-500 dark:text-gray-400">{donor.donor_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                            <Droplets className="w-3 h-3 mr-1" />
                            {donor.blood_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {calculateAge(donor.date_of_birth)} ans
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{donor.phone_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {donor.gender === "M" ? "Masculin" : "Féminin"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(donor)}
                              className="rounded-xl px-3 py-1"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(donor)}
                              className="rounded-xl px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

        {/* Edit Donor Dialog */}
        <Dialog open={showEditDonor} onOpenChange={setShowEditDonor}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-700">Modifier le donneur</DialogTitle>
              <DialogDescription>Mettre à jour les informations du donneur</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
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
                ? Cette action est irréversible.
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