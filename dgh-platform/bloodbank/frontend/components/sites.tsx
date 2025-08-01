"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n"
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
} from "lucide-react"

export function Sites() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState<any>(null)

  // Mock sites data
  const sites = [
    {
      id: "S001",
      name: "CHU Yaoundé",
      type: "hospital",
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
      id: "S002",
      name: "Hôpital Général de Douala",
      type: "hospital",
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
    {
      id: "S003",
      name: "Centre de Collecte Garoua",
      type: "collection_center",
      address: "Quartier Plateau, Garoua",
      phone: "+237 222 XX XX XX",
      email: "garoua@bloodcenter.cm",
      manager: "Mme Fatima Oumarou",
      capacity: 50,
      current_patients: 0,
      blood_bank: false,
      status: "active",
      last_request: "2024-01-20",
      total_requests: 45,
      region: "Nord",
    },
    {
      id: "S004",
      name: "Clinique des Spécialités",
      type: "clinic",
      address: "Bastos, Yaoundé",
      phone: "+237 222 XX XX XX",
      email: "contact@clinique-specialites.cm",
      manager: "Dr. Jean Nkomo",
      capacity: 100,
      current_patients: 67,
      blood_bank: false,
      status: "maintenance",
      last_request: "2024-01-18",
      total_requests: 23,
      region: "Centre",
    },
  ]

  const filteredSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-8">
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
            <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white px-6 py-3 hover:scale-105 transition-all duration-300">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Site
            </Button>
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
              <Button variant="outline" className="px-6 h-12 bg-transparent">
                <Filter className="w-5 h-5 mr-2" />
                Filtres
              </Button>
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
                  <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">{sites.length}</p>
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
                    {sites.filter((s) => s.status === "active").length}
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
                    {sites.filter((s) => s.blood_bank).length}
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
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Demandes ce mois</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {sites.reduce((sum, site) => sum + site.total_requests, 0)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites List */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6">
            <CardTitle className="text-2xl font-bold">Réseau des Sites Partenaires</CardTitle>
            <CardDescription className="text-teal-100">
              {filteredSites.length} site{filteredSites.length > 1 ? "s" : ""} trouvé
              {filteredSites.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Site</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Type & Région
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Capacité
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSites.map((site) => (
                    <tr
                      key={site.id}
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
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{site.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {site.id} • {site.manager}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">{site.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <Badge className={getTypeBadge(site.type)}>{getTypeLabel(site.type)}</Badge>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Région {site.region}</p>
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
                            <span className="text-gray-600 dark:text-gray-400">{site.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{site.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {site.current_patients}/{site.capacity}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(site.current_patients / site.capacity) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {Math.round((site.current_patients / site.capacity) * 100)}% occupé
                          </p>
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
                            Dernière demande: {new Date(site.last_request).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent"
                            onClick={() => setSelectedSite(site)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent"
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
