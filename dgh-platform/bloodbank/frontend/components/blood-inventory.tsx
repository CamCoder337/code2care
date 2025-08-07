import React, { useState, useMemo } from "react"
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
  TestTube,
  Thermometer,
  CheckCircle,
  Timer,
  Package,
  Loader2,
  MapPin,
  Phone,
  User,
  Heart,
  Star,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  MoreHorizontal,
  Languages,
  Sun,
  Moon
} from "lucide-react"

// Mock data pour démonstration
const mockBloodUnits = [
  {
    unit_id: "BU2024001",
    blood_type: "O+",
    volume_ml: 450,
    collection_date: "2024-01-15",
    expiry_date: "2024-02-14",
    days_until_expiry: 8,
    status: "Available",
    quality_score: 98,
    hemoglobin_g_dl: 14.2,
    temperature_stored: 4,
    site_name: "Centre Hospitalier de Douala",
    donor: {
      donor_id: "D001",
      first_name: "Jean",
      last_name: "Mballa",
      age: 32,
      phone_number: "+237 655 123 456"
    }
  },
  {
    unit_id: "BU2024002",
    blood_type: "A-",
    volume_ml: 450,
    collection_date: "2024-01-12",
    expiry_date: "2024-02-11",
    days_until_expiry: 5,
    status: "Available",
    quality_score: 95,
    hemoglobin_g_dl: 13.8,
    temperature_stored: 4,
    site_name: "Hôpital Général de Yaoundé",
    donor: {
      donor_id: "D002",
      first_name: "Marie",
      last_name: "Fotso",
      age: 28,
      phone_number: "+237 677 987 654"
    }
  },
  {
    unit_id: "BU2024003",
    blood_type: "B+",
    volume_ml: 450,
    collection_date: "2024-01-18",
    expiry_date: "2024-02-17",
    days_until_expiry: 11,
    status: "Reserved",
    quality_score: 92,
    hemoglobin_g_dl: 15.1,
    temperature_stored: 4,
    site_name: "Centre Hospitalier de Douala",
    donor: {
      donor_id: "D003",
      first_name: "Paul",
      last_name: "Nkomo",
      age: 35,
      phone_number: "+237 694 555 777"
    }
  }
]

const mockAnalytics = {
  available_units: 234,
  expiring_units: 12,
  expired_units: 3,
  utilization_rate: 87,
  total_units: 249,
  trends: {
    available: "Stable this week",
    expired: "2 units disposed"
  }
}

// Contexte de langue mock
const useLanguageMock = () => {
  const [language, setLanguage] = useState("fr")
  const [isDark, setIsDark] = useState(false)

  const translations = {
    fr: {
      blood_inventory: "Inventaire Sanguin",
      intelligent_management: "Gestion intelligente et suivi en temps réel",
      operational_system: "Système opérationnel",
      total_units: "Unités totales",
      available_units: "Disponibles",
      expiring_soon: "Expire bientôt",
      utilization_rate: "Taux utilisation",
      refresh: "Actualiser",
      export: "Exporter",
      search_filters: "Recherche & Filtres",
      refine_search: "Affinez votre recherche pour des résultats précis",
      results: "résultats",
      search_placeholder: "Rechercher unité, donneur...",
      blood_type: "Groupe sanguin",
      all_blood_types: "Tous les groupes",
      status: "Statut",
      all_statuses: "Tous les statuts",
      available: "Disponible",
      reserved: "Réservé",
      used: "Utilisé",
      expired: "Expiré",
      expiration: "Expiration",
      all_dates: "Toutes les dates",
      expires_in_1_day: "Expire dans 1 jour",
      expires_in_3_days: "Expire dans 3 jours",
      expires_in_7_days: "Expire dans 7 jours",
      per_page: "par page",
      blood_units: "Unités de Sang",
      page: "Page",
      of: "sur",
      unit_blood_type: "Unité & Groupe",
      donor: "Donneur",
      quality_volume: "Qualité & Volume",
      critical_dates: "Dates Critiques",
      status_site: "Statut & Site",
      actions: "Actions",
      collected: "Collecté",
      expires_today: "Expire aujourd'hui",
      expires_in: "Expire dans",
      days: "j",
      expired_ago: "Expiré il y a",
      anonymous_donor: "Donneur anonyme",
      years_old: "ans",
      unknown_site: "Site inconnu",
      unit_details: "Détails de l'unité",
      complete_information: "Informations complètes et historique de l'unité de sang",
      general_info: "Informations Générales",
      unit_id: "ID Unité",
      volume: "Volume",
      hemoglobin: "Hémoglobine",
      quality_score: "Score qualité",
      temperature: "Température",
      donor_info: "Donneur",
      full_name: "Nom complet",
      donor_id: "ID Donneur",
      age: "Âge",
      phone: "Téléphone",
      dates_location: "Dates & Localisation",
      collection_date: "Date de collecte",
      expiry_date: "Date d'expiration",
      days_remaining: "Jours restants",
      site: "Site",
      status_actions: "Statut & Actions",
      current_status: "Statut actuel",
      view_history: "Voir historique complet",
      reserve_unit: "Réserver cette unité",
      no_units_found: "Aucune unité trouvée",
      no_units_message: "Aucune unité ne correspond à vos critères de recherche.",
      reset_filters: "Réinitialiser les filtres",
      previous: "Précédent",
      next: "Suivant",
      displaying: "Affichage de",
      to: "à",
      loading: "Chargement...",
      error_loading: "Erreur lors du chargement",
      retry: "Réessayer"
    },
    en: {
      blood_inventory: "Blood Inventory",
      intelligent_management: "Intelligent management and real-time monitoring",
      operational_system: "Operational system",
      total_units: "Total units",
      available_units: "Available",
      expiring_soon: "Expiring soon",
      utilization_rate: "Utilization rate",
      refresh: "Refresh",
      export: "Export",
      search_filters: "Search & Filters",
      refine_search: "Refine your search for precise results",
      results: "results",
      search_placeholder: "Search unit, donor...",
      blood_type: "Blood type",
      all_blood_types: "All blood types",
      status: "Status",
      all_statuses: "All statuses",
      available: "Available",
      reserved: "Reserved",
      used: "Used",
      expired: "Expired",
      expiration: "Expiration",
      all_dates: "All dates",
      expires_in_1_day: "Expires in 1 day",
      expires_in_3_days: "Expires in 3 days",
      expires_in_7_days: "Expires in 7 days",
      per_page: "per page",
      blood_units: "Blood Units",
      page: "Page",
      of: "of",
      unit_blood_type: "Unit & Type",
      donor: "Donor",
      quality_volume: "Quality & Volume",
      critical_dates: "Critical Dates",
      status_site: "Status & Site",
      actions: "Actions",
      collected: "Collected",
      expires_today: "Expires today",
      expires_in: "Expires in",
      days: "d",
      expired_ago: "Expired",
      anonymous_donor: "Anonymous donor",
      years_old: "years old",
      unknown_site: "Unknown site",
      unit_details: "Unit details",
      complete_information: "Complete information and blood unit history",
      general_info: "General Information",
      unit_id: "Unit ID",
      volume: "Volume",
      hemoglobin: "Hemoglobin",
      quality_score: "Quality score",
      temperature: "Temperature",
      donor_info: "Donor",
      full_name: "Full name",
      donor_id: "Donor ID",
      age: "Age",
      phone: "Phone",
      dates_location: "Dates & Location",
      collection_date: "Collection date",
      expiry_date: "Expiry date",
      days_remaining: "Days remaining",
      site: "Site",
      status_actions: "Status & Actions",
      current_status: "Current status",
      view_history: "View complete history",
      reserve_unit: "Reserve this unit",
      no_units_found: "No units found",
      no_units_message: "No units match your search criteria.",
      reset_filters: "Reset filters",
      previous: "Previous",
      next: "Next",
      displaying: "Displaying",
      to: "to",
      loading: "Loading...",
      error_loading: "Error loading",
      retry: "Retry"
    }
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  return { language, setLanguage, t, isDark, setIsDark }
}

export default function EnhancedBloodInventoryWithI18n() {
  const { language, setLanguage, t, isDark, setIsDark } = useLanguageMock()

  // État local
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

  // Filtrage des données
  const filteredUnits = useMemo(() => {
    let filtered = mockBloodUnits

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(unit =>
        unit.unit_id.toLowerCase().includes(search) ||
        unit.donor?.first_name?.toLowerCase().includes(search) ||
        unit.donor?.last_name?.toLowerCase().includes(search)
      )
    }

    if (selectedBloodType) {
      filtered = filtered.filter(unit => unit.blood_type === selectedBloodType)
    }

    if (selectedStatus) {
      filtered = filtered.filter(unit => unit.status === selectedStatus)
    }

    if (expiringDays) {
      const days = parseInt(expiringDays)
      filtered = filtered.filter(unit => unit.days_until_expiry <= days && unit.days_until_expiry > 0)
    }

    return filtered
  }, [searchTerm, selectedBloodType, selectedStatus, expiringDays])

  const totalUnits = filteredUnits.length
  const totalPages = Math.ceil(totalUnits / pageSize)

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    const colors = {
      Available: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400",
      Reserved: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400",
      Used: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400",
      Expired: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400"
    }
    return colors[status] || "bg-gray-50 text-gray-700"
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
      'O-': 'bg-red-600 text-white',
      'A+': 'bg-blue-500 text-white',
      'A-': 'bg-blue-600 text-white',
      'B+': 'bg-green-500 text-white',
      'B-': 'bg-green-600 text-white',
      'AB+': 'bg-purple-500 text-white',
      'AB-': 'bg-purple-600 text-white'
    }
    return colors[bloodType] || 'bg-gray-500 text-white'
  }

  const formatStatusText = (status) => {
    const statusMap = {
      'Available': t('available'),
      'Reserved': t('reserved'),
      'Used': t('used'),
      'Expired': t('expired')
    }
    return statusMap[status] || status
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1)

    switch (filterType) {
      case 'bloodType':
        setSelectedBloodType(value === 'all' ? '' : value)
        break
      case 'status':
        setSelectedStatus(value === 'all' ? '' : value)
        break
      case 'expiring':
        setExpiringDays(value === 'all' ? '' : value)
        break
    }
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header simplifié */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Titre principal */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('blood_inventory')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('intelligent_management')}
                  </p>
                </div>
              </div>
            </div>

            {/* Contrôles dans le header */}
            <div className="flex items-center gap-4">
              {/* Contrôles de langue et thème */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                  className="flex items-center gap-2"
                >
                  <Languages className="w-4 h-4" />
                  {language.toUpperCase()}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDark(!isDark)}
                  className="flex items-center gap-2"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>

              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </Button>

              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Download className="w-4 h-4" />
                {t('export')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Statistiques simplifiées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: t('total_units'),
              value: mockAnalytics.total_units,
              icon: Package,
              color: "blue"
            },
            {
              title: t('available_units'),
              value: mockAnalytics.available_units,
              icon: CheckCircle,
              color: "green"
            },
            {
              title: t('expiring_soon'),
              value: mockAnalytics.expiring_units,
              icon: Timer,
              color: "amber"
            },
            {
              title: t('utilization_rate'),
              value: `${mockAnalytics.utilization_rate}%`,
              icon: TrendingUp,
              color: "purple"
            }
          ].map((stat, index) => (
            <Card key={index} className="bg-white dark:bg-gray-900 border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtres simplifiés */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('search_filters')}
            </CardTitle>
            <CardDescription>{t('refine_search')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedBloodType} onValueChange={(value) => handleFilterChange('bloodType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('blood_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_blood_types')}</SelectItem>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_statuses')}</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatusText(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={expiringDays} onValueChange={(value) => handleFilterChange('expiring', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('expiration')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_dates')}</SelectItem>
                  <SelectItem value="1">{t('expires_in_1_day')}</SelectItem>
                  <SelectItem value="3">{t('expires_in_3_days')}</SelectItem>
                  <SelectItem value="7">{t('expires_in_7_days')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 {t('per_page')}</SelectItem>
                  <SelectItem value="20">20 {t('per_page')}</SelectItem>
                  <SelectItem value="50">50 {t('per_page')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tableau simplifié */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                {t('blood_units')}
              </div>
              <Badge variant="secondary">
                {totalUnits} {t('results')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('unit_blood_type')}</TableHead>
                    <TableHead>{t('donor')}</TableHead>
                    <TableHead>{t('quality_volume')}</TableHead>
                    <TableHead>{t('critical_dates')}</TableHead>
                    <TableHead>{t('status_site')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((unit) => {
                    const expiryInfo = getExpiryStatus(unit.days_until_expiry)

                    return (
                      <TableRow key={unit.unit_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {/* Unité & Groupe */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getBloodTypeColor(unit.blood_type)}`}>
                              {unit.blood_type}
                            </div>
                            <div>
                              <p className="font-semibold">{unit.unit_id}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Donneur */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {unit.donor ? `${unit.donor.first_name} ${unit.donor.last_name}` : t('anonymous_donor')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {unit.donor?.age || 'N/A'} {t('years_old')}
                            </p>
                          </div>
                        </TableCell>

                        {/* Volume & Qualité */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{unit.volume_ml} ml</p>
                            <div className="flex items-center gap-2">
                              <Progress value={unit.quality_score} className="w-16 h-2" />
                              <span className="text-sm">{unit.quality_score}%</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Dates */}
                        <TableCell>
                          <div className="space-y-2">
                            <p className="text-sm">
                              {t('collected')}: {new Date(unit.collection_date).toLocaleDateString()}
                            </p>
                            <Badge className={`${expiryInfo.color} text-xs`}>
                              {unit.days_until_expiry < 0
                                ? `${t('expired_ago')} ${Math.abs(unit.days_until_expiry)}${t('days')}`
                                : unit.days_until_expiry === 0
                                ? t('expires_today')
                                : `${t('expires_in')} ${unit.days_until_expiry}${t('days')}`}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Statut */}
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={`${getStatusColor(unit.status)} text-xs`}>
                              {formatStatusText(unit.status)}
                            </Badge>
                            <p className="text-xs text-gray-500 truncate max-w-[100px]">
                              {unit.site_name || t('unknown_site')}
                            </p>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUnit(unit)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getBloodTypeColor(unit.blood_type)}`}>
                                    {unit.blood_type}
                                  </div>
                                  {t('unit_details')} {unit.unit_id}
                                </DialogTitle>
                                <DialogDescription>
                                  {t('complete_information')}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                {/* Informations Générales */}
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <TestTube className="w-5 h-5 text-blue-600" />
                                      {t('general_info')}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('unit_id')}:</span>
                                      <span className="font-semibold">{unit.unit_id}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('blood_type')}:</span>
                                      <Badge className={`${getBloodTypeColor(unit.blood_type)} font-semibold`}>
                                        {unit.blood_type}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('volume')}:</span>
                                      <span className="font-semibold">{unit.volume_ml} ml</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('hemoglobin')}:</span>
                                      <span className="font-semibold">{unit.hemoglobin_g_dl} g/dL</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('quality_score')}:</span>
                                      <div className="flex items-center gap-2">
                                        <Progress value={unit.quality_score} className="w-16 h-2" />
                                        <span className="font-semibold">{unit.quality_score}%</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('temperature')}:</span>
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
                                      {t('donor_info')}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('full_name')}:</span>
                                      <span className="font-semibold">
                                        {unit.donor ? `${unit.donor.first_name} ${unit.donor.last_name}` : t('anonymous_donor')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('donor_id')}:</span>
                                      <span className="font-mono text-sm">{unit.donor?.donor_id || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('age')}:</span>
                                      <span className="font-semibold">{unit.donor?.age || 'N/A'} {t('years_old')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('phone')}:</span>
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="font-semibold">{unit.donor?.phone_number || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Dates et Localisation */}
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <Calendar className="w-5 h-5 text-purple-600" />
                                      {t('dates_location')}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('collection_date')}:</span>
                                      <span className="font-semibold">
                                        {new Date(unit.collection_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('expiry_date')}:</span>
                                      <span className="font-semibold">
                                        {new Date(unit.expiry_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('days_remaining')}:</span>
                                      <Badge className={`${expiryInfo.color} font-medium`}>
                                        {unit.days_until_expiry < 0
                                          ? `${t('expired_ago')} ${Math.abs(unit.days_until_expiry)}${t('days')}`
                                          : `${unit.days_until_expiry} ${t('days')}`}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-start">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('site')}:</span>
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
                                      {t('status_actions')}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('current_status')}:</span>
                                      <Badge className={`${getStatusColor(unit.status)} font-medium`}>
                                        {unit.status === 'Available' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {unit.status === 'Reserved' && <Clock className="w-3 h-3 mr-1" />}
                                        {unit.status === 'Used' && <Activity className="w-3 h-3 mr-1" />}
                                        {unit.status === 'Expired' && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {formatStatusText(unit.status)}
                                      </Badge>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                      <Button className="w-full" variant="outline">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        {t('view_history')}
                                      </Button>
                                      {unit.status === 'Available' && (
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          {t('reserve_unit')}
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {filteredUnits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="space-y-4">
                          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Droplets className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {t('no_units_found')}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {t('no_units_message')}
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
                              {t('reset_filters')}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination simplifiée */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('displaying')} {((currentPage - 1) * pageSize) + 1} {t('to')} {Math.min(currentPage * pageSize, totalUnits)} {t('of')} {totalUnits}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t('previous')}
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const startPage = Math.max(1, Math.min(totalPages - 4, currentPage - 2))
                        const pageNum = startPage + i
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
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {t('next')}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}