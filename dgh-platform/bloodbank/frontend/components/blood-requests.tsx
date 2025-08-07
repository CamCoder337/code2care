import React, { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Building2,
  MapPin,
  Phone,
  Save,
  X,
  RefreshCw,
  Activity,
  Target,
  Menu,
  Check
} from "lucide-react"

// Mock data simulant l'API
const mockSites = [
  {
    site_id: "SITE001",
    nom: "Centre Médical d'Arrondissement (CMA) Yassa",
    ville: "Douala",
    type: "hospital",
    phone: "+237 233 42 15 30",
    manager: "Dr. Marie Kouam",
    departments: [
      {
        department_id: "DEP001",
        name: "Service des Urgences",
        department_type: "emergency",
        head_of_department: "Dr. Marie Kouam",
        phone_extension: "2101",
        is_emergency_department: true,
      },
      {
        department_id: "DEP002",
        name: "Gynéco-Obstétrique",
        department_type: "gynecology",
        head_of_department: "Dr. Paul Mbarga",
        phone_extension: "2201",
        is_emergency_department: false,
      },
      {
        department_id: "DEP003",
        name: "Pédiatrie",
        department_type: "pediatrics",
        head_of_department: "Dr. Judith Ngo Bama",
        phone_extension: "2301",
        is_emergency_department: false,
      }
    ]
  },
  {
    site_id: "SITE002",
    nom: "Hôpital Central de Yaoundé",
    ville: "Yaoundé",
    type: "hospital",
    phone: "+237 222 23 40 06",
    manager: "Prof. Jean Talom",
    departments: [
      {
        department_id: "DEP004",
        name: "Cardiologie",
        department_type: "cardiology",
        head_of_department: "Prof. Jean Talom",
        phone_extension: "3101",
        is_emergency_department: false,
      },
      {
        department_id: "DEP005",
        name: "Chirurgie Générale",
        department_type: "surgery",
        head_of_department: "Dr. Samuel Ndongo",
        phone_extension: "3201",
        is_emergency_department: false,
      }
    ]
  }
]

const mockRequests = [
  {
    request_id: "REQ000003306",
    department: "DEP002",
    department_name: "Gynéco-Obstétrique",
    site: "SITE001",
    site_name: "CMA Yassa - Douala",
    blood_type: "O+",
    quantity: 1,
    priority: "Routine",
    status: "Pending",
    request_date: "2025-08-05",
    reason: "Surgical procedure requiring blood transfusion"
  },
  {
    request_id: "REQ000003307",
    department: "DEP001",
    department_name: "Service des Urgences",
    site: "SITE001",
    site_name: "CMA Yassa - Douala",
    blood_type: "O-",
    quantity: 3,
    priority: "Urgent",
    status: "Pending",
    request_date: "2025-08-06",
    reason: "Emergency trauma case"
  },
  {
    request_id: "REQ000003308",
    department: "DEP004",
    department_name: "Cardiologie",
    site: "SITE002",
    site_name: "Hôpital Central - Yaoundé",
    blood_type: "A+",
    quantity: 2,
    priority: "Routine",
    status: "Fulfilled",
    request_date: "2025-08-04",
    reason: "Cardiac surgery preparation"
  }
]

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const priorityOptions = ['Urgent', 'Routine']

export default function BloodRequestsManagement() {
  const [requests, setRequests] = useState(useBloodRequests())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Form state
  const [newRequest, setNewRequest] = useState({
    site: "",
    department: "",
    blood_type: "",
    quantity: "",
    priority: "Routine",
    expected_date: ""
  })

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get departments for selected site
  const availableDepartments = useMemo(() => {
    const site = mockSites.find(s => s.site_id === newRequest.site)
    return site?.departments || []
  }, [newRequest.site])

  // Get site info for selected site
  const selectedSiteInfo = useMemo(() => {
    return mockSites.find(s => s.site_id === newRequest.site)
  }, [newRequest.site])

  // Get department info
  const selectedDepartmentInfo = useMemo(() => {
    return availableDepartments.find(d => d.department_id === newRequest.department)
  }, [availableDepartments, newRequest.department])

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = !searchTerm ||
        request.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.blood_type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || request.status === filterStatus
      const matchesPriority = filterPriority === "all" || request.priority === filterPriority

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [requests, searchTerm, filterStatus, filterPriority])

  // Calculate statistics
  const requestStats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter(r => r.status === "Pending").length
    const urgent = requests.filter(r => r.priority === "Urgent").length
    const fulfilled = requests.filter(r => r.status === "Fulfilled").length

    return [
      { label: "Total Requests", value: total, icon: FileText, color: "text-blue-600" },
      { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600" },
      { label: "Urgent", value: urgent, icon: AlertTriangle, color: "text-red-600" },
      { label: "Fulfilled", value: fulfilled, icon: CheckCircle, color: "text-green-600" },
    ]
  }, [requests])

  const urgentPendingRequests = useMemo(() => {
    return requests.filter(r => r.priority === "Urgent" && r.status === "Pending")
  }, [requests])

  // Handle create request
  const handleCreateRequest = useCallback(async () => {
    if (!newRequest.site || !newRequest.department || !newRequest.blood_type || !newRequest.quantity) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (parseInt(newRequest.quantity) <= 0) {
      alert("La quantité doit être supérieure à 0")
      return
    }

    const requestId = `REQ${Date.now().toString().slice(-6)}`
    const site = mockSites.find(s => s.site_id === newRequest.site)
    const department = availableDepartments.find(d => d.department_id === newRequest.department)

    const requestData = {
      request_id: requestId,
      department: newRequest.department,
      department_name: department?.name || "Unknown Department",
      site: newRequest.site,
      site_name: `${site?.nom} - ${site?.ville}` || "Unknown Site",
      blood_type: newRequest.blood_type,
      quantity: parseInt(newRequest.quantity),
      priority: newRequest.priority,
      status: "Pending",
      request_date: newRequest.expected_date || new Date().toISOString().split('T')[0],
      reason: "Medical procedure requiring blood transfusion"
    }

    setRequests(prev => [requestData, ...prev])

    // Reset form
    setNewRequest({
      site: "",
      department: "",
      blood_type: "",
      quantity: "",
      priority: "Routine",
      expected_date: ""
    })

    setShowCreateDialog(false)
    alert("Demande créée avec succès!")
  }, [newRequest, availableDepartments])

  // Handle process request
  const handleProcessRequest = useCallback((action) => {
    if (!selectedRequest) return

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

    setRequests(prev => prev.map(req =>
      req.request_id === selectedRequest.request_id
        ? { ...req, status: newStatus }
        : req
    ))

    setShowProcessDialog(false)
    alert(`Demande ${selectedRequest.request_id} ${action === 'approve' ? 'approuvée' : action === 'reject' ? 'rejetée' : 'satisfaite'}`)
  }, [selectedRequest])

  // Status and priority badges
  const getStatusBadge = (status) => {
    const variants = {
      "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "Approved": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Fulfilled": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    return <Badge className={variants[status] || ""}>{status}</Badge>
  }

  const getPriorityBadge = (priority) => {
    const variants = {
      "Urgent": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "Routine": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
    const icons = {
      "Urgent": "🚨",
      "Routine": "📋"
    }
    return (
      <Badge className={variants[priority] || ""}>
        {icons[priority]} {priority}
      </Badge>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
            Blood Requests
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Manage blood requests from medical departments
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              {isMobile ? "New" : "New Request"}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-lg">
                <Plus className="w-5 h-5 mr-2 text-teal-600" />
                Create Blood Request
              </DialogTitle>
              <DialogDescription className="text-sm">
                Fill in the details to create a new blood request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Site Selection */}
              <div className="space-y-2">
                <Label htmlFor="site" className="text-sm font-medium">Hospital/Site *</Label>
                <Select value={newRequest.site} onValueChange={(value) => {
                  setNewRequest(prev => ({ ...prev, site: value, department: "" }))
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select hospital/site" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSites.map((site) => (
                      <SelectItem key={site.site_id} value={site.site_id}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{site.nom}</span>
                            <span className="text-xs text-muted-foreground">{site.ville}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Selection */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                <Select
                  value={newRequest.department}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, department: value }))}
                  disabled={!newRequest.site}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!newRequest.site ? "Select a site first" : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept.department_id} value={dept.department_id}>
                        <div className="flex items-center space-x-2">
                          <Hospital className="w-4 h-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{dept.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Head: {dept.head_of_department}
                            </span>
                          </div>
                          {dept.is_emergency_department && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Site and Department Info */}
              {selectedSiteInfo && (
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-sm">
                  <div className="space-y-1">
                    <p><strong>Manager:</strong> {selectedSiteInfo.manager}</p>
                    <p><strong>Phone:</strong> {selectedSiteInfo.phone}</p>
                    {selectedDepartmentInfo && (
                      <p><strong>Department Head:</strong> {selectedDepartmentInfo.head_of_department}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Blood Type */}
                <div className="space-y-2">
                  <Label htmlFor="blood_type" className="text-sm font-medium">Blood Type *</Label>
                  <Select value={newRequest.blood_type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, blood_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
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

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="50"
                    value={newRequest.quantity}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Units"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                  <Select value={newRequest.priority} onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center space-x-2">
                            {priority === "Urgent" ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            <span>{priority}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expected Date */}
                <div className="space-y-2">
                  <Label htmlFor="expected_date" className="text-sm font-medium">Expected Date</Label>
                  <Input
                    id="expected_date"
                    type="date"
                    value={newRequest.expected_date}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, expected_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col md:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full md:w-auto">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCreateRequest} className="w-full md:w-auto bg-teal-600 hover:bg-teal-700">
                <Save className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {requestStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">{isMobile ? stat.label.split(' ')[0] : stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2 text-teal-600" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by request ID, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Routine">Routine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Requests Alert */}
      {urgentPendingRequests.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-600 flex items-center text-sm md:text-base">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {urgentPendingRequests.length} Urgent Request{urgentPendingRequests.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentPendingRequests.map((request) => (
                <div key={request.request_id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-red-800 dark:text-red-200 text-sm truncate">
                        {request.department_name} - {request.blood_type} ({request.quantity}u)
                      </p>
                      <p className="text-xs text-red-600 truncate">#{request.request_id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowProcessDialog(true)
                      }}
                    >
                      Process
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" />
            Blood Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            // Mobile Card Layout
            <div className="space-y-3 p-3">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <Card key={request.request_id} className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">#{request.request_id}</p>
                            <p className="text-xs text-muted-foreground">{request.department_name}</p>
                          </div>
                          <div className="flex gap-1">
                            {getStatusBadge(request.status)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="text-red-600">
                              <Droplets className="w-3 h-3 mr-1" />
                              {request.blood_type}
                            </Badge>
                            <span className="text-sm font-medium">{request.quantity} units</span>
                            {getPriorityBadge(request.priority)}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {new Date(request.request_date).toLocaleDateString()}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
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
                              className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
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
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No requests found matching your criteria</p>
                </div>
              )}
            </div>
          ) : (
            // Desktop Table Layout
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <TableRow key={request.request_id} className="hover:bg-teal-50 dark:hover:bg-teal-900/20">
                        <TableCell className="font-medium">{request.request_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Hospital className="w-4 h-4 text-muted-foreground" />
                            <span>{request.department_name}</span>
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
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(request.request_date).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
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
                                className="bg-green-600 hover:bg-green-700"
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
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No requests found matching your criteria</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="w-[95%] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Request Details
            </DialogTitle>
            <DialogDescription className="text-sm">
              Complete information about request #{selectedRequest?.request_id}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-teal-600" />
                      Request Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Priority:</span>
                      {getPriorityBadge(selectedRequest.priority)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Blood Type:</span>
                      <Badge variant="outline" className="text-red-600">
                        <Droplets className="w-3 h-3 mr-1" />
                        {selectedRequest.blood_type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Quantity:</span>
                      <span className="font-semibold">{selectedRequest.quantity} units</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-purple-600" />
                      Department Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Department:</span>
                      <span className="text-right">{selectedRequest.department_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Site:</span>
                      <span className="text-right">{selectedRequest.site_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Request Date:</span>
                      <span className="text-right">{new Date(selectedRequest.request_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reason:</span>
                      <span className="text-right text-xs">{selectedRequest.reason}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-orange-600" />
                    Request Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                      <div>
                        <p className="font-medium text-sm">Request Created</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedRequest.request_date).toLocaleString()}
                        </p>
                        <p className="text-xs">Initial blood request submitted</p>
                      </div>
                    </div>

                    {selectedRequest.status !== 'Pending' && (
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-2 shrink-0 ${
                          selectedRequest.status === 'Approved' ? 'bg-green-500' :
                          selectedRequest.status === 'Rejected' ? 'bg-red-500' :
                          selectedRequest.status === 'Fulfilled' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-sm">Status Updated</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleString()}
                          </p>
                          <p className="text-xs">Request {selectedRequest.status.toLowerCase()}</p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.status === 'Pending' && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 shrink-0"></div>
                        <div>
                          <p className="font-medium text-sm">Awaiting Processing</p>
                          <p className="text-xs text-muted-foreground">Current status</p>
                          <p className="text-xs">Request pending review and approval</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex-col md:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="w-full md:w-auto">
              Close
            </Button>
            {selectedRequest?.status === "Pending" && (
              <Button
                onClick={() => {
                  setShowViewDialog(false)
                  setShowProcessDialog(true)
                }}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700"
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
        <DialogContent className="w-[95%] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2 text-green-600" />
              Process Request
            </DialogTitle>
            <DialogDescription className="text-sm">
              Choose an action for request #{selectedRequest?.request_id}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Department:</span>
                    <span>{selectedRequest.department_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Blood Type:</span>
                    <span className="font-semibold text-red-600">{selectedRequest.blood_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Quantity:</span>
                    <span className="font-semibold">{selectedRequest.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <span className={selectedRequest.priority === 'Urgent' ? 'text-red-600 font-semibold' : ''}>
                      {selectedRequest.priority}
                    </span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This action will update the request status and notify the requesting department.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => handleProcessRequest('approve')}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Request
                </Button>

                <Button
                  onClick={() => handleProcessRequest('fulfill')}
                  className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Fulfill Request
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleProcessRequest('reject')}
                  className="w-full border-red-600 text-red-600 hover:bg-red-50 flex items-center justify-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions for Desktop */}
      {!isMobile && (
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
      )}
    </div>
  )
}