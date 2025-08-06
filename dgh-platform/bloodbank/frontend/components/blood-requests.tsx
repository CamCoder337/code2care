"use client"

import { useState, useMemo, useEffect } from "react"
import { useBloodRequests, useCreateBloodRequest, useSites, useSystemConfig } from "@/lib/hooks/useApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hospital,
  Calendar,
  Droplets,
  Eye,
  Settings,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Save,
  X,
  RefreshCw,
  Activity,
  Users,
  Target,
  Stethoscope
} from "lucide-react"
import { toast } from "sonner"

// Types pour les départements
interface Department {
  department_id: string
  site: string
  name: string
  department_type: string
  description?: string
  head_of_department?: string
  phone_extension?: string
  email?: string
  floor?: string
  wing?: string
  bed_capacity?: number
  current_occupancy: number
  staff_count: number
  monthly_blood_usage: number
  blood_type_priority: string[]
  is_active: boolean
  is_emergency_department: boolean
  requires_blood_products: boolean
}

// Mock des départements (dans un vrai projet, ces données viendraient de l'API)
const mockDepartments: Department[] = [
  {
    department_id: "DEP001",
    site: "SITE001",
    name: "Service des Urgences",
    department_type: "emergency",
    description: "Service d'urgence 24h/24",
    head_of_department: "Dr. Marie Kouam",
    phone_extension: "2101",
    email: "urgences@hospital.cm",
    floor: "RDC",
    wing: "Aile Ouest",
    bed_capacity: 20,
    current_occupancy: 15,
    staff_count: 25,
    monthly_blood_usage: 45,
    blood_type_priority: ["O-", "O+", "A+"],
    is_active: true,
    is_emergency_department: true,
    requires_blood_products: true
  },
  {
    department_id: "DEP002",
    site: "SITE001",
    name: "Chirurgie Générale",
    department_type: "surgery",
    description: "Chirurgie générale et spécialisée",
    head_of_department: "Dr. Paul Mbarga",
    phone_extension: "2201",
    email: "chirurgie@hospital.cm",
    floor: "2ème",
    wing: "Aile Est",
    bed_capacity: 30,
    current_occupancy: 22,
    staff_count: 18,
    monthly_blood_usage: 78,
    blood_type_priority: ["O-", "A+", "B+"],
    is_active: true,
    is_emergency_department: false,
    requires_blood_products: true
  },
  {
    department_id: "DEP003",
    site: "SITE002",
    name: "Cardiologie",
    department_type: "cardiology",
    description: "Cardiologie interventionnelle",
    head_of_department: "Dr. Judith Ngo Bama",
    phone_extension: "3101",
    email: "cardio@clinic.cm",
    floor: "3ème",
    wing: "Aile Sud",
    bed_capacity: 25,
    current_occupancy: 18,
    staff_count: 20,
    monthly_blood_usage: 35,
    blood_type_priority: ["O-", "A-", "AB+"],
    is_active: true,
    is_emergency_department: false,
    requires_blood_products: true
  }
]

export function BloodRequests() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)

  // États pour la création de requête
  const [newRequest, setNewRequest] = useState({
    department: "",
    site: "",
    blood_type: "",
    quantity: "",
    priority: "Routine",
    reason: "",
    patient_details: "",
    expected_date: "",
    doctor_name: "",
    contact_number: ""
  })

  // Hooks d'API
  const { data: requestsData, isLoading, error, refetch } = useBloodRequests({
    status: filterStatus !== "all" ? filterStatus : undefined,
    priority: filterPriority !== "all" ? filterPriority : undefined,
    page: 1,
    page_size: 50
  })

  const { data: sitesData } = useSites()
  const { data: systemConfig } = useSystemConfig()
  const createRequestMutation = useCreateBloodRequest()

  const requests = requestsData?.results || []
  const sites = sitesData?.results || []
  const bloodTypes = systemConfig?.blood_types || ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

  // Obtenir les départements pour un site donné
  const getDepartmentsForSite = (siteId: string) => {
    return mockDepartments.filter(dept => dept.site === siteId && dept.is_active)
  }

  // Filtrer les requêtes basé sur le terme de recherche
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests

    return requests.filter(request =>
      request.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.blood_type.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [requests, searchTerm])

  // Calculer les statistiques des requêtes
  const requestStats = useMemo(() => {
    const totalRequests = requests.length
    const pendingRequests = requests.filter(req => req.status === "Pending").length
    const urgentRequests = requests.filter(req => req.priority === "Urgent").length
    const fulfilledToday = requests.filter(req =>
      req.status === "Fulfilled" &&
      new Date(req.request_date).toDateString() === new Date().toDateString()
    ).length

    return [
      { label: "Total Requests", value: totalRequests.toString(), change: `+${Math.round(totalRequests * 0.08)}%`, icon: FileText, color: "text-blue-600" },
      { label: "Pending", value: pendingRequests.toString(), change: `+${pendingRequests}`, icon: Clock, color: "text-yellow-600" },
      { label: "Urgent Requests", value: urgentRequests.toString(), change: `+${urgentRequests}`, icon: AlertTriangle, color: "text-red-600" },
      { label: "Fulfilled Today", value: fulfilledToday.toString(), change: `+${Math.round(fulfilledToday * 0.18)}%`, icon: CheckCircle, color: "text-green-600" },
    ]
  }, [requests])

  // Filtrer les requêtes urgentes en attente
  const urgentPendingRequests = useMemo(() => {
    return requests.filter(req => req.priority === "Urgent" && req.status === "Pending")
  }, [requests])

  // Gérer la création de nouvelle requête
  const handleCreateRequest = async () => {
    try {
      // Validation basique
      if (!newRequest.department || !newRequest.blood_type || !newRequest.quantity) {
        toast.error("Veuillez remplir tous les champs obligatoires")
        return
      }

      if (parseInt(newRequest.quantity) <= 0) {
        toast.error("La quantité doit être supérieure à 0")
        return
      }

      // Générer un ID de requête unique
      const requestId = `REQ${Date.now().toString().slice(-6)}`

      const requestData = {
        request_id: requestId,
        department: newRequest.department,
        site: newRequest.site,
        blood_type: newRequest.blood_type,
        quantity: parseInt(newRequest.quantity),
        priority: newRequest.priority,
        status: "Pending",
        request_date: newRequest.expected_date || new Date().toISOString().split('T')[0],
        reason: newRequest.reason,
        patient_details: newRequest.patient_details,
        doctor_name: newRequest.doctor_name,
        contact_number: newRequest.contact_number
      }

      await createRequestMutation.mutateAsync(requestData)

      // Réinitialiser le formulaire
      setNewRequest({
        department: "",
        site: "",
        blood_type: "",
        quantity: "",
        priority: "Routine",
        reason: "",
        patient_details: "",
        expected_date: "",
        doctor_name: "",
        contact_number: ""
      })

      setShowCreateDialog(false)
      refetch()
      toast.success("Demande créée avec succès")
    } catch (error) {
      toast.error("Erreur lors de la création de la demande")
      console.error(error)
    }
  }

  // Gérer le traitement d'une requête
  const handleProcessRequest = async (action: 'approve' | 'reject' | 'fulfill') => {
    if (!selectedRequest) return

    try {
      let newStatus = selectedRequest.status

      switch (action) {
        case 'approve':
          newStatus = 'Approved'
          break
        case 'reject':
          newStatus = 'Rejected'
          break
        case 'fulfill':
          newStatus = 'Fulfilled'
          break
      }

      // Ici vous appelleriez l'API pour mettre à jour le statut
      // Pour la démo, on simule la réussite
      toast.success(`Demande ${selectedRequest.request_id} ${action === 'approve' ? 'approuvée' : action === 'reject' ? 'rejetée' : 'satisfaite'}`)
      setShowProcessDialog(false)
      refetch()
    } catch (error) {
      toast.error("Erreur lors du traitement de la demande")
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading blood requests...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading blood requests: {error}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "Approved":
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case "Fulfilled":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Rejected":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case "Approved":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Approved</Badge>
      case "Fulfilled":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Fulfilled</Badge>
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">🚨 Urgent</Badge>
      case "Routine":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">📋 Routine</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getDepartmentDetails = (departmentId: string) => {
    return mockDepartments.find(dept => dept.department_id === departmentId)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
            Blood Requests
          </h1>
          <p className="text-muted-foreground mt-1">Manage blood requests from medical departments</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 transition-all duration-200 hover:scale-105">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-teal-600" />
                Create New Blood Request
              </DialogTitle>
              <DialogDescription>
                Fill in the details to create a new blood request for a medical department
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="medical">Medical Details</TabsTrigger>
                  <TabsTrigger value="contact">Contact Info</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site">Hospital/Site *</Label>
                      <Select value={newRequest.site} onValueChange={(value) => {
                        setNewRequest(prev => ({ ...prev, site: value, department: "" }))
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                        <SelectContent>
                          {sites.map((site) => (
                            <SelectItem key={site.site_id} value={site.site_id}>
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-4 h-4" />
                                <span>{site.nom} - {site.ville}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={newRequest.department}
                        onValueChange={(value) => setNewRequest(prev => ({ ...prev, department: value }))}
                        disabled={!newRequest.site}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDepartmentsForSite(newRequest.site).map((dept) => (
                            <SelectItem key={dept.department_id} value={dept.department_id}>
                              <div className="flex items-center space-x-2">
                                <Hospital className="w-4 h-4" />
                                <span>{dept.name}</span>
                                {dept.is_emergency_department && <AlertTriangle className="w-3 h-3 text-red-500" />}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="blood_type">Blood Type *</Label>
                      <Select value={newRequest.blood_type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, blood_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          {bloodTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center space-x-2">
                                <Droplets className="w-4 h-4 text-red-500" />
                                <span>{type}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantity (units) *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="50"
                        value={newRequest.quantity}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="Number of units needed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newRequest.priority} onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Routine">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>Routine</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Urgent">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span>Urgent</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expected_date">Expected Date</Label>
                      <Input
                        id="expected_date"
                        type="date"
                        value={newRequest.expected_date}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, expected_date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Medical Reason/Indication *</Label>
                    <Textarea
                      id="reason"
                      value={newRequest.reason}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Surgical procedure, trauma, chronic anemia, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient_details">Patient Information</Label>
                    <Textarea
                      id="patient_details"
                      value={newRequest.patient_details}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, patient_details: e.target.value }))}
                      placeholder="Age, weight, medical history, current condition..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div>
                    <Label htmlFor="doctor_name">Requesting Doctor *</Label>
                    <Input
                      id="doctor_name"
                      value={newRequest.doctor_name}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, doctor_name: e.target.value }))}
                      placeholder="Dr. Full Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_number">Contact Number *</Label>
                    <Input
                      id="contact_number"
                      value={newRequest.contact_number}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, contact_number: e.target.value }))}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>

                  {/* Département détails si sélectionné */}
                  {newRequest.department && (
                    <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                      <h4 className="font-semibold text-teal-800 dark:text-teal-200 mb-2">Department Information</h4>
                      {(() => {
                        const dept = getDepartmentDetails(newRequest.department)
                        if (!dept) return null
                        return (
                          <div className="space-y-2 text-sm">
                            <p><strong>Head:</strong> {dept.head_of_department}</p>
                            <p><strong>Location:</strong> {dept.floor} - {dept.wing}</p>
                            <p><strong>Extension:</strong> {dept.phone_extension}</p>
                            <p><strong>Monthly Usage:</strong> {dept.monthly_blood_usage} units</p>
                            <p><strong>Priority Types:</strong> {dept.blood_type_priority.join(', ')}</p>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={createRequestMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {createRequestMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Request Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {requestStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className="hover:shadow-lg transition-all duration-200 hover:scale-105 animate-slide-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from yesterday
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search and Filters */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-teal-600" />
            Search & Filter Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by request ID, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Fulfilled">Fulfilled</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Requests Alert */}
      {urgentPendingRequests.length > 0 && (
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Urgent Requests Requiring Immediate Attention ({urgentPendingRequests.length})
            </CardTitle>
            <CardDescription>Critical blood requests that need immediate processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentPendingRequests.map((request, index) => (
                <div
                  key={`urgent-${request.request_id}`}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg animate-pulse"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        {request.department_name || request.department} - {request.blood_type} ({request.quantity} units)
                      </p>
                      <p className="text-sm text-red-600">
                        Request #{request.request_id} • {new Date(request.request_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowProcessDialog(true)
                      }}
                    >
                      Process
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-600 text-blue-600"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowViewDialog(true)
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" />
            Blood Request Management
          </CardTitle>
          <CardDescription>Complete list of blood requests from medical departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request, index) => (
                    <TableRow
                      key={`table-${request.request_id}`}
                      className="animate-slide-in-right hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TableCell className="font-medium">{request.request_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Hospital className="w-4 h-4 text-muted-foreground" />
                          <span>{request.department_name || request.department}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-teal-600 border-teal-200">
                          <Droplets className="w-3 h-3 mr-1" />
                          {request.blood_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-semibold">{request.quantity}</div>
                          <div className="text-xs text-muted-foreground">units</div>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell className="max-w-32 truncate">
                        {request.site_name || `Site ${request.site}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(request.request_date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:scale-105 transition-transform bg-transparent"
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowViewDialog(true)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {request.status === "Pending" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowProcessDialog(true)
                              }}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Process
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No blood requests found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Request Details - {selectedRequest?.request_id}
            </DialogTitle>
            <DialogDescription>
              Complete information about this blood request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="medical">Medical Info</TabsTrigger>
                  <TabsTrigger value="department">Department</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-teal-600" />
                          Request Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          {getStatusBadge(selectedRequest.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Priority:</span>
                          {getPriorityBadge(selectedRequest.priority)}
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Blood Type:</span>
                          <Badge variant="outline" className="text-red-600">
                            <Droplets className="w-3 h-3 mr-1" />
                            {selectedRequest.blood_type}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Quantity:</span>
                          <span className="font-semibold">{selectedRequest.quantity} units</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                          Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Requested:</span>
                          <span>{new Date(selectedRequest.request_date).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Expected:</span>
                          <span>Within 24h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Last Update:</span>
                          <span>{new Date().toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                        Medical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="font-semibold">Medical Indication:</Label>
                        <p className="text-muted-foreground mt-1">
                          {selectedRequest.reason || "Surgical procedure requiring blood transfusion"}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Patient Details:</Label>
                        <p className="text-muted-foreground mt-1">
                          {selectedRequest.patient_details || "Patient information confidential - available to authorized personnel only"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Requesting Doctor:</Label>
                          <p className="text-muted-foreground">{selectedRequest.doctor_name || "Dr. Medical Staff"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Contact:</Label>
                          <p className="text-muted-foreground">{selectedRequest.contact_number || "+237 6XX XXX XXX"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="department" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Hospital className="w-5 h-5 mr-2 text-purple-600" />
                        Department Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const dept = getDepartmentDetails(selectedRequest.department)
                        if (!dept) {
                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="font-medium">Department:</span>
                                <span>{selectedRequest.department_name || selectedRequest.department}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Site:</span>
                                <span>{selectedRequest.site_name || selectedRequest.site}</span>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <Label className="font-semibold">Department:</Label>
                                <p className="text-muted-foreground">{dept.name}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Head of Department:</Label>
                                <p className="text-muted-foreground">{dept.head_of_department}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Location:</Label>
                                <p className="text-muted-foreground">{dept.floor} - {dept.wing}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <Label className="font-semibold">Extension:</Label>
                                <p className="text-muted-foreground">{dept.phone_extension}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Monthly Usage:</Label>
                                <p className="text-muted-foreground">{dept.monthly_blood_usage} units</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Capacity:</Label>
                                <p className="text-muted-foreground">{dept.current_occupancy}/{dept.bed_capacity} beds</p>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-orange-600" />
                        Request Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium">Request Created</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(selectedRequest.request_date).toLocaleString()}
                            </p>
                            <p className="text-sm">Initial blood request submitted</p>
                          </div>
                        </div>

                        {selectedRequest.status !== 'Pending' && (
                          <div className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-2 ${
                              selectedRequest.status === 'Approved' ? 'bg-green-500' :
                              selectedRequest.status === 'Rejected' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div>
                              <p className="font-medium">Status Updated</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date().toLocaleString()}
                              </p>
                              <p className="text-sm">Request {selectedRequest.status.toLowerCase()}</p>
                            </div>
                          </div>
                        )}

                        {selectedRequest.status === 'Pending' && (
                          <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium">Awaiting Processing</p>
                              <p className="text-sm text-muted-foreground">Current status</p>
                              <p className="text-sm">Request pending review and approval</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedRequest?.status === "Pending" && (
              <Button
                onClick={() => {
                  setShowViewDialog(false)
                  setShowProcessDialog(true)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Process Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Request Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-600" />
              Process Request
            </DialogTitle>
            <DialogDescription>
              Choose an action for request #{selectedRequest?.request_id}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="space-y-2">
                  <p><strong>Department:</strong> {selectedRequest.department_name}</p>
                  <p><strong>Blood Type:</strong> {selectedRequest.blood_type}</p>
                  <p><strong>Quantity:</strong> {selectedRequest.quantity} units</p>
                  <p><strong>Priority:</strong> {selectedRequest.priority}</p>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action will update the request status and notify the requesting department.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
            <div className="flex space-x-2 w-full">
              <Button
                variant="outline"
                onClick={() => handleProcessRequest('approve')}
                className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProcessRequest('reject')}
                className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleProcessRequest('fulfill')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Fulfill
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
          onClick={() => setShowCreateDialog(true)}
        >
          <CardHeader className="text-center">
            <Plus className="w-12 h-12 mx-auto text-teal-600 mb-2" />
            <CardTitle className="text-lg">Create New Request</CardTitle>
            <CardDescription>Submit a new blood request</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-600 mb-2" />
            <CardTitle className="text-lg">Emergency Protocol</CardTitle>
            <CardDescription>Fast-track urgent requests ({urgentPendingRequests.length})</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <FileText className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Request History</CardTitle>
            <CardDescription>View detailed request logs ({requests.length} total)</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}