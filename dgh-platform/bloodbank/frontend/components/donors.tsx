"use client"

import { useState } from "react"
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
import { Users, Search, Filter, UserPlus, Phone, CalendarIcon, Droplets, Heart, Eye, CalendarDays } from "lucide-react"

export function Donors() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBloodType, setFilterBloodType] = useState("all")
  const [filterGender, setFilterGender] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [showAddDonor, setShowAddDonor] = useState(false)
  const [newDonor, setNewDonor] = useState({
    firstName: "",
    lastName: "",
    bloodType: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  })

  const donors = [
    {
      id: "D001",
      firstName: "John",
      lastName: "Doe",
      bloodType: "O+",
      phone: "+1234567890",
      dateOfBirth: "1985-03-15",
      gender: "M",
      lastDonation: "2024-01-15",
      totalDonations: 12,
      status: "Active",
    },
    {
      id: "D002",
      firstName: "Jane",
      lastName: "Smith",
      bloodType: "A+",
      phone: "+1234567891",
      dateOfBirth: "1990-07-22",
      gender: "F",
      lastDonation: "2024-01-10",
      totalDonations: 8,
      status: "Active",
    },
    {
      id: "D003",
      firstName: "Michael",
      lastName: "Johnson",
      bloodType: "B-",
      phone: "+1234567892",
      dateOfBirth: "1988-11-03",
      gender: "M",
      lastDonation: "2023-12-20",
      totalDonations: 15,
      status: "Active",
    },
    {
      id: "D004",
      firstName: "Sarah",
      lastName: "Williams",
      bloodType: "AB+",
      phone: "+1234567893",
      dateOfBirth: "1992-05-18",
      gender: "F",
      lastDonation: "2024-01-20",
      totalDonations: 6,
      status: "Active",
    },
    {
      id: "D005",
      firstName: "David",
      lastName: "Brown",
      bloodType: "O-",
      phone: "+1234567894",
      dateOfBirth: "1987-09-12",
      gender: "M",
      lastDonation: "2023-12-15",
      totalDonations: 20,
      status: "Inactive",
    },
  ]

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">Active</Badge>
      case "Inactive":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 font-medium">Inactive</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getDonorLevel = (donations: number) => {
    if (donations >= 20) return { level: "Gold", color: "text-yellow-600", icon: "🏆" }
    if (donations >= 10) return { level: "Silver", color: "text-gray-600", icon: "🥈" }
    if (donations >= 5) return { level: "Bronze", color: "text-orange-600", icon: "🥉" }
    return { level: "New", color: "text-blue-600", icon: "⭐" }
  }

  const donorStats = [
    { label: "Total Donors", value: "3,456", change: "+8%", icon: Users, color: "text-blue-600" },
    { label: "Active Donors", value: "2,890", change: "+12%", icon: Heart, color: "text-green-600" },
    { label: "New This Month", value: "156", change: "+24%", icon: UserPlus, color: "text-teal-600" },
  ]

  const handleAddDonor = () => {
    // Add donor logic here
    console.log("Adding donor:", newDonor)
    setShowAddDonor(false)
    setNewDonor({
      firstName: "",
      lastName: "",
      bloodType: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
    })
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
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newDonor.firstName}
                      onChange={(e) => setNewDonor({ ...newDonor, firstName: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newDonor.lastName}
                      onChange={(e) => setNewDonor({ ...newDonor, lastName: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newDonor.phone}
                      onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select
                      value={newDonor.bloodType}
                      onValueChange={(value) => setNewDonor({ ...newDonor, bloodType: value })}
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
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newDonor.dateOfBirth}
                      onChange={(e) => setNewDonor({ ...newDonor, dateOfBirth: e.target.value })}
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
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-xl"
                >
                  Add Donor
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl border-gray-200 dark:border-gray-700 flex-1 bg-transparent"
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Date Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="text-sm font-medium">From Date</Label>
                        <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">To Date</Label>
                        <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
              Complete list of registered donors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 dark:border-gray-800">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Donor</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Blood Type</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Age</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Last Donation</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total Donations</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Level</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.map((donor, index) => {
                    const donorLevel = getDonorLevel(donor.totalDonations)
                    return (
                      <TableRow
                        key={donor.id}
                        className="animate-slide-in-right hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-gray-100 dark:border-gray-800"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg">
                              <AvatarFallback className="text-white font-semibold text-lg">
                                {donor.firstName[0]}
                                {donor.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-white">
                                {donor.firstName} {donor.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{donor.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                            <Droplets className="w-3 h-3 mr-1" />
                            {donor.bloodType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {calculateAge(donor.dateOfBirth)} years
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{donor.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{donor.lastDonation}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-bold text-blue-600 text-lg">{donor.totalDonations}</div>
                            <div className="text-xs text-gray-500">donations</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{donorLevel.icon}</span>
                            <span className={`text-sm font-semibold ${donorLevel.color}`}>{donorLevel.level}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(donor.status)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 font-medium transition-all duration-300 hover:scale-105"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-blue-700">Donor Profile</DialogTitle>
                                <DialogDescription>
                                  Complete information about {donor.firstName} {donor.lastName}
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
                                          {donor.firstName} {donor.lastName}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Donor ID:</span>
                                        <span className="font-semibold">{donor.id}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Age:</span>
                                        <span className="font-semibold">{calculateAge(donor.dateOfBirth)} years</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Gender:</span>
                                        <span className="font-semibold">
                                          {donor.gender === "M" ? "Male" : "Female"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Date of Birth:</span>
                                        <span className="font-semibold">{donor.dateOfBirth}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <h3 className="font-semibold text-green-700 mb-3">Contact Information</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Phone:</span>
                                        <div className="flex items-center space-x-1">
                                          <Phone className="w-4 h-4 text-green-600" />
                                          <span className="font-semibold">{donor.phone}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                    <h3 className="font-semibold text-red-700 mb-3">Blood Information</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Blood Type:</span>
                                        <Badge className="bg-red-100 text-red-700 font-semibold">
                                          <Droplets className="w-3 h-3 mr-1" />
                                          {donor.bloodType}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Total Donations:</span>
                                        <span className="font-bold text-red-600 text-lg">{donor.totalDonations}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Last Donation:</span>
                                        <div className="flex items-center space-x-1">
                                          <CalendarIcon className="w-4 h-4 text-red-600" />
                                          <span className="font-semibold">{donor.lastDonation}</span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Donor Level:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="text-lg">{donorLevel.icon}</span>
                                          <span className={`font-semibold ${donorLevel.color}`}>
                                            {donorLevel.level}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                    <h3 className="font-semibold text-yellow-700 mb-3">Status</h3>
                                    <div className="flex items-center justify-center">
                                      <Heart className="w-5 h-5 text-yellow-600 mr-2" />
                                      <span className="font-semibold text-lg">{donor.status}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
