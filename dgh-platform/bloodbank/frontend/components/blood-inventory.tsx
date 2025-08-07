"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useBloodUnits } from "@/lib/hooks/useApi";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  MapPin,
  Phone,
  User,
  TestTube,
  Thermometer,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Timer,
  Package,
  Zap,
  Globe,
  Star,
  Award,
  Heart,
  Settings,
  Filter as FilterIcon,
  SortAsc,
  MoreHorizontal,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

// Données simulées pour la démo
const mockBloodUnits = [
  {
    unit_id: "BU-2024-001237",
    donor: {
      donor_id: "D-2024-456",
      first_name: "Marie",
      last_name: "Dubois",
      blood_type: "O+",
      age: 28,
      phone_number: "+237 677 123 456"
    },
    collection_date: "2024-01-15",
    volume_ml: 450,
    hemoglobin_g_dl: 14.2,
    date_expiration: "2024-02-20",
    status: "Available",
    site_name: "Centre Hospitalier de Yaoundé",
    days_until_expiry: 12,
    blood_type: "O+",
    is_expired: false,
    record: "R-2024-789",
    temperature_stored: 4.2,
    quality_score: 95
  },
  {
    unit_id: "BU-2024-001238",
    donor: {
      donor_id: "D-2024-457",
      first_name: "Paul",
      last_name: "Nkomo",
      blood_type: "A+",
      age: 34,
      phone_number: "+237 699 987 654"
    },
    collection_date: "2024-01-10",
    volume_ml: 420,
    hemoglobin_g_dl: 13.8,
    date_expiration: "2024-02-15",
    status: "Reserved",
    site_name: "Hôpital Général de Douala",
    days_until_expiry: 7,
    blood_type: "A+",
    is_expired: false,
    record: "R-2024-790",
    temperature_stored: 3.8,
    quality_score: 92
  },
  {
    unit_id: "BU-2024-001239",
    donor: {
      donor_id: "D-2024-458",
      first_name: "Awa",
      last_name: "Sow",
      blood_type: "B-",
      age: 25,
      phone_number: "+237 655 321 789"
    },
    collection_date: "2024-01-05",
    volume_ml: 480,
    hemoglobin_g_dl: 15.1,
    date_expiration: "2024-02-10",
    status: "Used",
    site_name: "Clinique Pasteur",
    days_until_expiry: 2,
    blood_type: "B-",
    is_expired: false,
    record: "R-2024-791",
    temperature_stored: 4.0,
    quality_score: 98
  },
  {
    unit_id: "BU-2024-001240",
    donor: {
      donor_id: "D-2024-459",
      first_name: "Jean",
      last_name: "Tagne",
      blood_type: "AB+",
      age: 42,
      phone_number: "+237 676 555 111"
    },
    collection_date: "2023-12-20",
    volume_ml: 400,
    hemoglobin_g_dl: 12.9,
    date_expiration: "2024-01-25",
    status: "Expired",
    site_name: "Centre de Collecte Bafoussam",
    days_until_expiry: -7,
    blood_type: "AB+",
    is_expired: true,
    record: "R-2024-792",
    temperature_stored: 4.5,
    quality_score: 88
  }
]

export default function EnhancedBloodInventory() {
  // États locaux
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBloodType, setSelectedBloodType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [expiringDays, setExpiringDays] = useState("")
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  const statuses = ["Available", "Reserved", "Used", "Expired"]

  // Données calculées
  const totalUnits = mockBloodUnits.length
  const availableUnits = mockBloodUnits.filter(unit => unit.status === 'Available').length
  const expiringUnits = mockBloodUnits.filter(unit => unit.days_until_expiry <= 7 && unit.days_until_expiry > 0).length
  const expiredUnits = mockBloodUnits.filter(unit => unit.status === 'Expired').length
  const utilizationRate = Math.round((mockBloodUnits.filter(unit => unit.status === 'Used').length / totalUnits) * 100)

  // Filtres et recherche
  const filteredUnits = useMemo(() => {
    return mockBloodUnits.filter(unit => {
      const matchesSearch = searchTerm === "" ||
        unit.unit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.donor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.donor.last_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesBloodType = selectedBloodType === "" || unit.blood_type === selectedBloodType
      const matchesStatus = selectedStatus === "" || unit.status === selectedStatus

      let matchesExpiry = true
      if (expiringDays) {
        const days = parseInt(expiringDays)
        matchesExpiry = unit.days_until_expiry <= days && unit.days_until_expiry > 0
      }

      return matchesSearch && matchesBloodType && matchesStatus && matchesExpiry
    })
  }, [mockBloodUnits, searchTerm, selectedBloodType, selectedStatus, expiringDays])

  // Handlers
  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.success("Données d'inventaire actualisées")
  }

  const handleExport = async () => {
    toast.success("Export en cours...")
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
      case 'Reserved':
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
      case 'Used':
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30'
      case 'Expired':
        return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  const getExpiryStatus = (daysUntilExpiry) => {
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'text-red-600 bg-red-50 border-red-200' }
    if (daysUntilExpiry <= 3) return { status: 'critical', color: 'text-red-600 bg-red-50 border-red-200' }
    if (daysUntilExpiry <= 7) return { status: 'warning', color: 'text-amber-600 bg-amber-50 border-amber-200' }
    return { status: 'good', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
  }

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      'O+': 'bg-red-500 text-white',
      'O-': 'bg-red-700 text-white',
      'A+': 'bg-blue-500 text-white',
      'A-': 'bg-blue-700 text-white',
      'B+': 'bg-green-500 text-white',
      'B-': 'bg-green-700 text-white',
      'AB+': 'bg-purple-500 text-white',
      'AB-': 'bg-purple-700 text-white'
    }
    return colors[bloodType] || 'bg-gray-500 text-white'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

          <div className="relative p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                {/* Left Content */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                          <Droplets className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                          Inventaire Sanguin
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-100 text-sm font-medium">Système opérationnel</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                      Gestion intelligente et suivi en temps réel de votre inventaire sanguin avec analyses prédictives avancées
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Unités totales', value: totalUnits, icon: Package },
                      { label: 'Disponibles', value: availableUnits, icon: CheckCircle },
                      { label: 'Expire bientôt', value: expiringUnits, icon: Timer },
                      { label: 'Taux utilisation', value: `${utilizationRate}%`, icon: TrendingUp }
                    ].map((stat, index) => (
                      <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <stat.icon className="w-6 h-6 text-white/80" />
                          <div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-blue-200 text-sm">{stat.label}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                  <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-4 font-semibold rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>

                  <Button
                    onClick={handleExport}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            {
              title: "Unités Disponibles",
              value: availableUnits,
              subtitle: `${Math.round((availableUnits/totalUnits)*100)}% du stock`,
              icon: Droplets,
              gradient: "from-emerald-500 to-green-600",
              bg: "from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50",
              trend: "+12% cette semaine"
            },
            {
              title: "Expire Bientôt",
              value: expiringUnits,
              subtitle: "Dans les 7 prochains jours",
              icon: Clock,
              gradient: "from-amber-500 to-orange-600",
              bg: "from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50",
              trend: "Action requise"
            },
            {
              title: "Unités Expirées",
              value: expiredUnits,
              subtitle: "Nécessite élimination",
              icon: AlertTriangle,
              gradient: "from-red-500 to-pink-600",
              bg: "from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50",
              trend: "-5% vs mois dernier"
            },
            {
              title: "Performance",
              value: `${utilizationRate}%`,
              subtitle: "Taux d'utilisation global",
              icon: Award,
              gradient: "from-blue-500 to-indigo-600",
              bg: "from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50",
              trend: "Excellent"
            }
          ].map((card, index) => (
            <Card key={index} className={`bg-gradient-to-br ${card.bg} border-0 shadow-lg hover:shadow-xl transition-all duration-500 group`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.subtitle}
                    </p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      {card.trend}
                    </p>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Section */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FilterIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Recherche & Filtres</CardTitle>
                  <CardDescription>Affinez votre recherche pour des résultats précis</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {filteredUnits.length} résultats
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Rechercher unité, donneur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Blood Type Filter */}
              <Select value={selectedBloodType} onValueChange={setSelectedBloodType}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                  <SelectValue placeholder="Groupe sanguin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getBloodTypeColor(type)}`}></div>
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'Available' ? 'Disponible' :
                       status === 'Reserved' ? 'Réservé' :
                       status === 'Used' ? 'Utilisé' :
                       status === 'Expired' ? 'Expiré' : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Expiring Filter */}
              <Select value={expiringDays} onValueChange={setExpiringDays}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                  <SelectValue placeholder="Expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="1">Expire dans 1 jour</SelectItem>
                  <SelectItem value="3">Expire dans 3 jours</SelectItem>
                  <SelectItem value="7">Expire dans 7 jours</SelectItem>
                  <SelectItem value="14">Expire dans 14 jours</SelectItem>
                  <SelectItem value="30">Expire dans 30 jours</SelectItem>
                </SelectContent>
              </Select>

              {/* Page Size */}
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
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
          </CardContent>
        </Card>

        {/* Blood Units Table */}
        <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <TestTube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Unités de Sang</CardTitle>
                  <CardDescription>{filteredUnits.length} unités • Dernière mise à jour il y a 2 minutes</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <SortAsc className="w-4 h-4 mr-2" />
                  Trier
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Unité & Groupe</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Donneur</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Qualité & Volume</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Dates Critiques</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Statut & Site</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit) => {
                    const expiryInfo = getExpiryStatus(unit.days_until_expiry)

                    return (
                      <TableRow
                        key={unit.unit_id}
                        className="border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* Unité & Groupe */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getBloodTypeColor(unit.blood_type)}`}>
                              {unit.blood_type}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{unit.unit_id}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Réf: {unit.record}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Donneur */}
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {unit.donor.first_name} {unit.donor.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{unit.donor.age} ans</span>
                              <span>•</span>
                              <span>ID: {unit.donor.donor_id}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Qualité & Volume */}
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <TestTube className="w-4 h-4 text-blue-500" />
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{unit.volume_ml} ml</span>
                              <div className={`w-2 h-2 rounded-full ${unit.quality_score >= 95 ? 'bg-green-500' : unit.quality_score >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Heart className="w-3 h-3 text-red-400" />
                                <span className="text-gray-600 dark:text-gray-400">Hb: {unit.hemoglobin_g_dl} g/dL</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Star className="w-3 h-3 text-yellow-400" />
                                <span className="text-gray-600 dark:text-gray-400">Qualité: {unit.quality_score}%</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Dates Critiques */}
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Collecté: {new Date(unit.collection_date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-medium border ${expiryInfo.color}`}>
                              <Clock className="w-4 h-4" />
                              <span>
                                {unit.days_until_expiry < 0
                                  ? `Expiré il y a ${Math.abs(unit.days_until_expiry)} j`
                                  : unit.days_until_expiry === 0
                                  ? 'Expire aujourd\'hui'
                                  : `Expire dans ${unit.days_until_expiry} j`
                                }
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Statut & Site */}
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Badge className={`${getStatusColor(unit.status)} border font-medium`}>
                              {unit.status === 'Available' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {unit.status === 'Reserved' && <Clock className="w-3 h-3 mr-1" />}
                              {unit.status === 'Used' && <Activity className="w-3 h-3 mr-1" />}
                              {unit.status === 'Expired' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {unit.status === 'Available' ? 'Disponible' :
                               unit.status === 'Reserved' ? 'Réservé' :
                               unit.status === 'Used' ? 'Utilisé' :
                               unit.status === 'Expired' ? 'Expiré' : unit.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{unit.site_name}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                                  onClick={() => setSelectedUnit(unit)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getBloodTypeColor(unit.blood_type)}`}>
                                      {unit.blood_type}
                                    </div>
                                    Détails de l'unité {unit.unit_id}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Informations complètes et historique de l'unité de sang
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                  {/* Informations Générales */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <TestTube className="w-5 h-5 text-blue-600" />
                                        Informations Générales
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">ID Unité:</span>
                                        <span className="font-semibold">{unit.unit_id}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Groupe sanguin:</span>
                                        <Badge className={`${getBloodTypeColor(unit.blood_type)} font-semibold`}>
                                          {unit.blood_type}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Volume:</span>
                                        <span className="font-semibold">{unit.volume_ml} ml</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Hémoglobine:</span>
                                        <span className="font-semibold">{unit.hemoglobin_g_dl} g/dL</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Score qualité:</span>
                                        <div className="flex items-center gap-2">
                                          <Progress value={unit.quality_score} className="w-16 h-2" />
                                          <span className="font-semibold">{unit.quality_score}%</span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Température:</span>
                                        <div className="flex items-center gap-1">
                                          <Thermometer className="w-4 h-4 text-blue-500" />
                                          <span className="font-semibold">{unit.temperature_stored}°C</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Informations Donneur */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="w-5 h-5 text-green-600" />
                                        Donneur
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Nom complet:</span>
                                        <span className="font-semibold">{unit.donor.first_name} {unit.donor.last_name}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">ID Donneur:</span>
                                        <span className="font-mono text-sm">{unit.donor.donor_id}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Âge:</span>
                                        <span className="font-semibold">{unit.donor.age} ans</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Téléphone:</span>
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-4 h-4 text-gray-400" />
                                          <span className="font-semibold">{unit.donor.phone_number}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Dates et Localisation */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-purple-600" />
                                        Dates & Localisation
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Date de collecte:</span>
                                        <span className="font-semibold">
                                          {new Date(unit.collection_date).toLocaleDateString('fr-FR')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Date d'expiration:</span>
                                        <span className="font-semibold">
                                          {new Date(unit.date_expiration).toLocaleDateString('fr-FR')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Jours restants:</span>
                                        <Badge className={`${expiryInfo.color} border font-medium`}>
                                          {unit.days_until_expiry < 0
                                            ? `Expiré (-${Math.abs(unit.days_until_expiry)}j)`
                                            : `${unit.days_until_expiry} jours`
                                          }
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between items-start">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Site:</span>
                                        <div className="text-right">
                                          <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="font-semibold">{unit.site_name}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Statut et Actions */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-orange-600" />
                                        Statut & Actions
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Statut actuel:</span>
                                        <Badge className={`${getStatusColor(unit.status)} border font-medium`}>
                                          {unit.status === 'Available' && <CheckCircle className="w-3 h-3 mr-1" />}
                                          {unit.status === 'Reserved' && <Clock className="w-3 h-3 mr-1" />}
                                          {unit.status === 'Used' && <Activity className="w-3 h-3 mr-1" />}
                                          {unit.status === 'Expired' && <AlertCircle className="w-3 h-3 mr-1" />}
                                          {unit.status === 'Available' ? 'Disponible' :
                                           unit.status === 'Reserved' ? 'Réservé' :
                                           unit.status === 'Used' ? 'Utilisé' :
                                           unit.status === 'Expired' ? 'Expiré' : unit.status}
                                        </Badge>
                                      </div>

                                      <div className="space-y-2 pt-2">
                                        <Button className="w-full" variant="outline">
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          Voir historique complet
                                        </Button>
                                        {unit.status === 'Available' && (
                                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                            Réserver cette unité
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredUnits.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Droplets className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Aucune unité trouvée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Aucune unité ne correspond à vos critères de recherche. Essayez de modifier vos filtres ou d'élargir votre recherche.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedBloodType("")
                      setSelectedStatus("")
                      setExpiringDays("")
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>

            {/* Enhanced Pagination */}
            {Math.ceil(filteredUnits.length / pageSize) > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, filteredUnits.length)} sur {filteredUnits.length} unités
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(filteredUnits.length / pageSize)) }, (_, i) => {
                      const totalPages = Math.ceil(filteredUnits.length / pageSize)
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredUnits.length / pageSize), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredUnits.length / pageSize)}
                    className="flex items-center gap-2"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  )
}