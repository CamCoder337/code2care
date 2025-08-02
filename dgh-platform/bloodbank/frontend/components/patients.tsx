"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n"
import { UserCheck, Search, Plus, Edit, Eye, Filter, Download, Calendar, Phone, Mail, Activity } from "lucide-react"

export function Patients() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  // Mock patients data
  const patients = [
    {
      id: "P001",
      name: "Marie Dubois",
      age: 34,
      gender: "F",
      blood_type: "O+",
      phone: "+237 6XX XXX XXX",
      email: "marie.dubois@email.com",
      address: "Yaoundé, Cameroun",
      last_transfusion: "2024-01-15",
      total_transfusions: 3,
      status: "active",
      medical_conditions: ["Anémie"],
      emergency_contact: "Jean Dubois - +237 6XX XXX XXX",
    },
    {
      id: "P002",
      name: "Paul Ngono",
      age: 45,
      gender: "M",
      blood_type: "A-",
      phone: "+237 6XX XXX XXX",
      email: "paul.ngono@email.com",
      address: "Douala, Cameroun",
      last_transfusion: "2024-01-20",
      total_transfusions: 7,
      status: "active",
      medical_conditions: ["Leucémie"],
      emergency_contact: "Claire Ngono - +237 6XX XXX XXX",
    },
    {
      id: "P003",
      name: "Fatima Bello",
      age: 28,
      gender: "F",
      blood_type: "B+",
      phone: "+237 6XX XXX XXX",
      email: "fatima.bello@email.com",
      address: "Garoua, Cameroun",
      last_transfusion: "2024-01-10",
      total_transfusions: 2,
      status: "inactive",
      medical_conditions: ["Drépanocytose"],
      emergency_contact: "Ahmed Bello - +237 6XX XXX XXX",
    },
  ]

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.blood_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Gestion des Patients
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Suivi et gestion des patients nécessitant des transfusions sanguines
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 hover:scale-105 transition-all duration-300">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Patient
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
                  placeholder="Rechercher par nom, ID ou groupe sanguin..."
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
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Patients</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{patients.length}</p>
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
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {patients.filter((p) => p.status === "active").length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Transfusions ce mois</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">24</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Urgences</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">3</p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <CardTitle className="text-2xl font-bold">Liste des Patients</CardTitle>
            <CardDescription className="text-purple-100">
              {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""} trouvé
              {filteredPatients.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Groupe Sanguin
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Dernière Transfusion
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
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{patient.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {patient.id} • {patient.age} ans • {patient.gender === "M" ? "Homme" : "Femme"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-bold">
                          {patient.blood_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{patient.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{patient.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Date(patient.last_transfusion).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Total: {patient.total_transfusions} transfusions
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusBadge(patient.status)}>
                          {patient.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
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
