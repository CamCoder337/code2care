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
  Check,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import {
  useBloodRequests,
  useCreateBloodRequest,
  useSites,
  useOnlineStatus
} from "@/lib/hooks/useApi"

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const priorityOptions = ['Urgent', 'Routine']
const statusOptions = ['Pending', 'Approved', 'Fulfilled', 'Rejected']

export default function BloodRequestsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterBloodType, setFilterBloodType] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Online status
  const { isOnline } = useOnlineStatus()

  // Form state
  const [newRequest, setNewRequest] = useState({
    site: "",
    department: "",
    blood_type: "",
    quantity: "",
    priority: "Routine",
    expected_date: "",
    reason: ""
  })

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // API Hooks
  const requestParams = useMemo(() => ({
    status: filterStatus === "all" ? undefined : filterStatus,
    priority: filterPriority === "all" ? undefined : filterPriority,
    blood_type: filterBloodType === "all" ? undefined : filterBloodType,
    page: currentPage,
    page_size: pageSize
  }), [filterStatus, filterPriority, filterBloodType, currentPage, pageSize])

  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useBloodRequests(requestParams, {
    enabled: true,
    retry: 2,
    staleTime: 30000
  })

  const {
    data: sitesData,
    isLoading: sitesLoading
  } = useSites({}, {
    enabled: true,
    staleTime: 300000
  })

  const createRequestMutation = useCreateBloodRequest({
    onSuccess: () => {
      setShowCreateDialog(false)
      setNewRequest({
        site: "",
        department: "",
        blood_type: "",
        quantity: "",
        priority: "Routine",
        expected_date: "",
        reason: ""
      })
      refetchRequests()
    }
  })

  // Process local search filtering (for client-side search)
  const filteredRequests = useMemo(() => {
    if (!requestsData?.results) return []

    return requestsData.results.filter(request => {
      const matchesSearch = !searchTerm ||
        request.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.blood_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.site_name?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [requestsData?.results, searchTerm])

  // Get departments for selected site
  const availableDepartments = useMemo(() => {
    if (!sitesData?.results || !newRequest.site) return []
    const site = sitesData.results.find(s => s.site_id === newRequest.site)
    return site?.departments || []
  }, [sitesData?.results, newRequest.site])

  // Get site info for selected site
  const selectedSiteInfo = useMemo(() => {
    if (!sitesData?.results || !newRequest.site) return null
    return sitesData.results.find(s => s.site_id === newRequest.site)
  }, [sitesData?.results, newRequest.site])

  // Get department info
  const selectedDepartmentInfo = useMemo(() => {
    return availableDepartments.find(d => d.department_id === newRequest.department)
  }, [availableDepartments, newRequest.department])

  // Calculate statistics
  const requestStats = useMemo(() => {
    const requests = requestsData?.results || []
    const total = requestsData?.count || 0
    const pending = requests.filter(r => r.status === "Pending").length
    const urgent = requests.filter(r => r.priority === "Urgent").length
    const fulfilled = requests.filter(r => r.status === "Fulfilled").length

    return [
      { label: "Total Requests", value: total, icon: FileText, color: "text-blue-600" },
      { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600" },
      { label: "Urgent", value: urgent, icon: AlertTriangle, color: "text-red-600" },
      { label: "Fulfilled", value: fulfilled, icon: CheckCircle, color: "text-green-600" },
    ]
  }, [requestsData])

  const urgentPendingRequests = useMemo(() => {
    if (!requestsData?.results) return []
    return requestsData.results.filter(r => r.priority === "Urgent" && r.status === "Pending")
  }, [requestsData?.results])

  // Handle create request
  const handleCreateRequest = useCallback(async () => {
    if (!newRequest.site || !newRequest.department || !newRequest.blood_type || !newRequest.quantity) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (parseInt(newRequest.quantity) <= 0) {
      toast.error("La quantité doit être supérieure à 0")
      return
    }

    if (!isOnline) {
      toast.warning("Fonction non disponible hors ligne")
      return
    }

    const requestData = {
      site: newRequest.site,
      department: newRequest.department,
      blood_type: newRequest.blood_type,
      quantity: parseInt(newRequest.quantity),
      priority: newRequest.priority,
      expected_date: newRequest.expected_date || new Date().toISOString().split('T')[0],
      reason: newRequest.reason || "Medical procedure requiring blood transfusion",
      status: "Pending"
    }

    createRequestMutation.mutate(requestData)
  }, [newRequest, isOnline, createRequestMutation])

  // Handle process request (would need additional API endpoint)
  const handleProcessRequest = useCallback((action) => {
    if (!selectedRequest) return

    // This would need an API endpoint for updating request status
    toast.info(`Fonctionnalité de traitement des demandes en cours de développement`)
    setShowProcessDialog(false)
  }, [selectedRequest])

  // Refresh data
  const handleRefresh = useCallback(() => {
    refetchRequests()
    toast.success("Données actualisées")
  }, [refetchRequests])

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

  // Loading state
  if (requestsLoading && !requestsData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des demandes...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (requestsError && !requestsData) {
    return (
      <div className="p-6 space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des demandes.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => refetchRequests()}
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
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
            {!isOnline && (
              <span className="inline-flex items-center ml-2 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
                Offline
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={requestsLoading}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${requestsLoading ? 'animate-spin' : ''}`} />
            {isMobile ? "Refresh" : "Actualiser"}
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
                disabled={!isOnline}
              >
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
                  <Select
                    value={newRequest.site}
                    onValueChange={(value) => {
                      setNewRequest(prev => ({ ...prev, site: value, department: "" }))
                    }}
                    disabled={sitesLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={sitesLoading ? "Loading..." : "Select hospital/site"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sitesData?.results?.map((site) => (
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

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">Reason</Label>
                  <Input
                    id="reason"
                    placeholder="Reason for blood request"
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col md:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="w-full md:w-auto"
                  disabled={createRequestMutation.isLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  className="w-full md:w-auto bg-teal-600 hover:bg-teal-700"
                  disabled={createRequestMutation.isLoading}
                >
                  {createRequestMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Create Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {requestStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">
                  {isMobile ? stat.label.split(' ')[0] : stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>
                  {requestsLoading ? (
                    <div className="w-8 h-6 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    stat.value
                  )}
                </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {priorityOptions.map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterBloodType} onValueChange={setFilterBloodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Blood Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {bloodTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
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
              {urgentPendingRequests.slice(0, 3).map((request) => (
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
              {urgentPendingRequests.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{urgentPendingRequests.length - 3} more urgent requests
                </p>
              )}
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
              {requestsLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border border-gray-200">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-gray-200 animate-pulse rounded" />
                          <div className="w-24 h-3 bg-gray-200 animate-pulse rounded" />
                          <div className="flex gap-2">
                            <div className="w-16 h-6 bg-gray-200 animate-pulse rounded" />
                            <div className="w-12 h-6 bg-gray-200 animate-pulse rounded" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

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
                    <TableHead>Site</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="w-24 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-32 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-28 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-12 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-8 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-16 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-20 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-16 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-20 h-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <TableRow key={request.request_id} className="hover:bg-teal-50 dark:hover:bg-teal-900/20">
                        <TableCell className="font-medium">{request.request_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Hospital className="w-4 h-4 text-muted-foreground" />
                            <span>{request.department_name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[120px]">
                              {request.site_name || 'N/A'}
                            </span>
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
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No requests found matching your criteria</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {requestsData && Math.ceil((requestsData.count || 0) / pageSize) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, requestsData.count || 0)} of {requestsData.count || 0} requests
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || requestsLoading}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {Math.ceil((requestsData.count || 0) / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!requestsData.next || requestsLoading}
                >
                  Next
                </Button>
              </div>
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
                {/* Request Summary */}
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
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Request Date:</span>
                      <span>{new Date(selectedRequest.request_date).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Department Info */}
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
                      <span className="text-right">{selectedRequest.department_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Site:</span>
                      <span className="text-right">{selectedRequest.site_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Department ID:</span>
                      <span className="text-right font-mono text-xs">{selectedRequest.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Site ID:</span>
                      <span className="text-right font-mono text-xs">{selectedRequest.site}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              {selectedRequest.reason && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-orange-600" />
                      Request Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
                  </CardContent>
                </Card>
              )}

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
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 shrink-0 animate-pulse"></div>
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
                  This functionality is currently under development. Processing actions will be available in the next update.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => handleProcessRequest('approve')}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                  disabled
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Request
                </Button>

                <Button
                  onClick={() => handleProcessRequest('fulfill')}
                  className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                  disabled
                >
                  <Target className="w-4 h-4 mr-2" />
                  Fulfill Request
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleProcessRequest('reject')}
                  className="w-full border-red-600 text-red-600 hover:bg-red-50 flex items-center justify-center"
                  disabled
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
              <CardDescription>
                Fast-track urgent requests ({urgentPendingRequests.length})
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
            <CardHeader className="text-center">
              <FileText className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-lg">Request History</CardTitle>
              <CardDescription>
                View detailed request logs ({requestsData?.count || 0} total)
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  )
}