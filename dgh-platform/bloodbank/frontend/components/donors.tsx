"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Users, Search, Filter, UserPlus, Phone, CalendarIcon, Droplets, Heart, Eye, Trash2, Edit, Loader2, AlertTriangle } from "lucide-react"
import { useDonors, useCreateDonor, useUpdateDonor, useDeleteDonor } from "@/lib/hooks/useApi"
import { toast } from "sonner"

export function Donors() {
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBloodType, setFilterBloodType] = useState("all")
  const [filterGender, setFilterGender] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showAddDonor, setShowAddDonor] = useState(false)
  const [editingDonor, setEditingDonor] = useState(null)
  const [deletingDonor, setDeletingDonor] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [newDonor, setNewDonor] = useState({
    first_name: "",
    last_name: "",
    blood_type: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    address: "",
  })

  // API Hooks
  const {
    data: donorsData,
    isLoading: loading,
    error,
    refetch
  } = useDonors({
    search: searchTerm || undefined,
    blood_type: filterBloodType !== "all" ? filterBloodType : undefined,
    gender: filterGender !== "all" ? filterGender : undefined,
    page: currentPage,
    page_size: 20,
  })

  const createDonorMutation = useCreateDonor({
    onSuccess: () => {
      setShowAddDonor(false)
      setNewDonor({
        first_name: "",
        last_name: "",
        blood_type: "",
        phone_number: "",
        date_of_birth: "",
        gender: "",
        address: "",
      })
      refetch()
    }
  })

  const updateDonorMutation = useUpdateDonor({
    onSuccess: () => {
      setEditingDonor(null)
      refetch()
    }
  })

  const deleteDonorMutation = useDeleteDonor({
    onSuccess: () => {
      setDeletingDonor(null)
      refetch()
    }
  })

  // Extract data with fallbacks
  const donors = donorsData?.results || []
  const totalCount = donorsData?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterBloodType, filterGender, filterStatus])

  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getStatusBadge = (donorData) => {
    const lastDonation = donorData.last_donation_date
    if (!lastDonation) {
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 font-medium">New</Badge>
    }

    const daysSinceLastDonation = Math.floor((new Date().getTime() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastDonation <= 56) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-medium">Waiting Period</Badge>
    } else if (daysSinceLastDonation <= 180) {
      return <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">Active</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 font-medium">Inactive</Badge>
    }
  }

  const getDonorLevel = (donations) => {
    if (donations >= 20) return { level: "Gold", color: "text-yellow-600", icon: "🏆" }
    if (donations >= 10) return { level: "Silver", color: "text-gray-600", icon: "🥈" }
    if (donations >= 5) return { level: "Bronze", color: "text-orange-600", icon: "🥉" }
    return { level: "New", color: "text-blue-600", icon: "⭐" }
  }

  // Calculate stats from current data
  const donorStats = [
    {
      label: "Total Donors",
      value: totalCount.toLocaleString(),
      change: "+8%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      label: "Active Donors",
      value: donors.filter(d => {
        const lastDonation = d.last_donation_date
        if (!lastDonation) return false
        const daysSince = Math.floor((new Date().getTime() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24))
        return daysSince > 56 && daysSince <= 180
      }).length.toLocaleString(),
      change: "+12%",
      icon: Heart,
      color: "text-green-600"
    },
    {
      label: "New This Month",
      value: donors.filter(d => {
        if (!d.created_at) return false
        const createdDate = new Date(d.created_at)
        const thisMonth = new Date()
        thisMonth.setDate(1)
        return createdDate >= thisMonth
      }).length.toLocaleString(),
      change: "+24%",
      icon: UserPlus,
      color: "text-teal-600"
    },
  ]

  const handleAddDonor = () => {
    if (!newDonor.first_name || !newDonor.last_name || !newDonor.blood_type || !newDonor.date_of_birth) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    createDonorMutation.mutate(newDonor)
  }

  const handleUpdateDonor = (donorData) => {
    if (!donorData.first_name || !donorData.last_name || !donorData.blood_type) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    updateDonorMutation.mutate({
      donorId: donorData.donor_id,
      donor: donorData
    })
  }

  const handleDeleteDonor = () => {
    if (deletingDonor) {
      deleteDonorMutation.mutate(deletingDonor.donor_id)
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-8 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Erreur lors du chargement des donneurs</p>
              <p className="text-sm text-gray-600 mb-4">{error.message || error}</p>
              <Button onClick={() => refetch()}>
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
              Donor Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Manage and track blood donors</p>
          </div>
          <Dialog open={showAddDonor} onOpenChange={setShowAddDonor}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl px-6 py-3">
                <UserPlus className="w-5 h-5 mr-2" />
                Add New Donor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-blue-700">Add New Donor</DialogTitle>
                <DialogDescription>Enter donor information to register a new blood donor</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={newDonor.first_name}
                      onChange={(e) => setNewDonor({ ...newDonor, first_name: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={newDonor.last_name}
                      onChange={(e) => setNewDonor({ ...newDonor, last_name: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={newDonor.phone_number}
                      onChange={(e) => setNewDonor({ ...newDonor, phone_number: e.target.value })}
                      className="mt-1 rounded-xl"
                      placeholder="+237..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newDonor.address}
                      onChange={(e) => setNewDonor({ ...newDonor, address: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="blood_type">Blood Type *</Label>
                    <Select
                      value={newDonor.blood_type}
                      onValueChange={(value) => setNewDonor({ ...newDonor, blood_type: value })}
                    >
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue placeholder="Select blood type" />
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
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={newDonor.gender}
                      onValueChange={(value) => setNewDonor({ ...newDonor, gender: value })}
                    >
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={newDonor.date_of_birth}
                      onChange={(e) => setNewDonor({ ...newDonor, date_of_birth: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <Button variant="outline" onClick={() => setShowAddDonor(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDonor}
                  disabled={createDonorMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-xl"
                >
                  {createDonorMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Donor"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Donor Statistics */}
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
                          <span>{stat.change}</span> from last month
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
              Search & Filter Donors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Select value={filterBloodType} onValueChange={setFilterBloodType}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Blood Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
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
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="New">New</SelectItem>
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
              Donor Directory
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Complete list of registered donors ({totalCount} total)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading donors...</p>
              </div>
            ) : donors.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No donors found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-10 gap-4 p-4 bg-gray-50 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-300 border-b">
                      <div>Donor</div>
                      <div>Blood Type</div>
                      <div>Age</div>
                      <div>Contact</div>
                      <div>Last Donation</div>
                      <div>Total Donations</div>
                      <div>Level</div>
                      <div>Status</div>
                      <div className="col-span-2">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {donors.map((donor, index) => {
                        const donorLevel = getDonorLevel(donor.total_donations || 0)
                        return (
                          <div
                            key={donor.donor_id}
                            className="grid grid-cols-10 gap-4 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors animate-slide-in-right"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg">
                                <AvatarFallback className="text-white font-semibold text-lg">
                                  {donor.first_name?.[0]}
                                  {donor.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-800 dark:text-white">
                                  {donor.first_name} {donor.last_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{donor.donor_id}</div>
                              </div>
                            </div>

                            <div>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                                <Droplets className="w-3 h-3 mr-1" />
                                {donor.blood_type}
                              </Badge>
                            </div>

                            <div className="text-gray-700 dark:text-gray-300">
                              {donor.age || calculateAge(donor.date_of_birth)} years
                            </div>

                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {donor.phone_number || 'N/A'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'Never'}
                              </span>
                            </div>

                            <div className="text-center">
                              <div className="font-bold text-blue-600 text-lg">{donor.total_donations || 0}</div>
                              <div className="text-xs text-gray-500">donations</div>
                            </div>

                            <div className="flex items-center space-x-1">
                              <span className="text-lg">{donorLevel.icon}</span>
                              <span className={`text-sm font-semibold ${donorLevel.color}`}>{donorLevel.level}</span>
                            </div>

                            <div>{getStatusBadge(donor)}</div>

                            <div className="col-span-2 flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1 font-medium transition-all duration-300"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-blue-700">Donor Profile</DialogTitle>
                                    <DialogDescription>
                                      Complete information about {donor.first_name} {donor.last_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-4">
                                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <h3 className="font-semibold text-blue-700 mb-3">Personal Information</h3>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Full Name:</span>
                                            <span className="font-semibold">
                                              {donor.first_name} {donor.last_name}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Donor ID:</span>
                                            <span className="font-semibold">{donor.donor_id}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Age:</span>
                                            <span className="font-semibold">
                                              {donor.age || calculateAge(donor.date_of_birth)} years
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Gender:</span>
                                            <span className="font-semibold">
                                              {donor.gender === "M" ? "Male" : "Female"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Date of Birth:</span>
                                            <span className="font-semibold">{donor.date_of_birth}</span>
                                          </div>
                                          {donor.address && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Address:</span>
                                              <span className="font-semibold">{donor.address}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                        <h3 className="font-semibold text-green-700 mb-3">Contact Information</h3>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Phone:</span>
                                            <div className="flex items-center space-x-1">
                                              <Phone className="w-4 h-4 text-green-600" />
                                              <span className="font-semibold">{donor.phone_number || 'N/A'}</span>
                                            </div>
                                          </div>
                                        </div