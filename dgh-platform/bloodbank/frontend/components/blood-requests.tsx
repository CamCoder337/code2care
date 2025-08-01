"use client"

import { useState, useMemo } from "react"
import { useBloodRequests } from "@/lib/hooks/useApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "lucide-react"

export function BloodRequests() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")


  const { data: requestsData, isLoading, error, refetch } = useBloodRequests({
    status: filterStatus !== "all" ? filterStatus : undefined,
    priority: filterPriority !== "all" ? filterPriority : undefined,
    page: 1,
    page_size: 50
  })

  const requests = requestsData?.results || []
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
        <Button className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 transition-all duration-200 hover:scale-105">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
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
      <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Urgent Requests Requiring Immediate Attention
          </CardTitle>
          <CardDescription>Critical blood requests that need immediate processing</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-3">
            {urgentPendingRequests.length > 0 ? (
              urgentPendingRequests.map((request, index) => (
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
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-600 text-red-600 bg-transparent">
                      Review
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No urgent requests requiring immediate attention
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <TableHead>Patient Case</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Time Needed</TableHead>
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
                        <span className="text-sm font-medium text-gray-600">
                          {request.status === "Fulfilled" ? "Completed" : "Pending"}
                        </span>
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
                          >
                            View
                          </Button>
                          {request.status === "Pending" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all">
                              Process
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No blood requests found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
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
            <CardDescription>Fast-track urgent requests</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <FileText className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Request History</CardTitle>
            <CardDescription>View detailed request logs</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
