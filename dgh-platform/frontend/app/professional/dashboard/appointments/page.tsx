"use client"

import {useEffect, useState, useMemo} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Calendar} from "@/components/ui/calendar"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Dialog, DialogTrigger} from "@/components/ui/dialog"
import {AddAppointmentForm} from "@/components/forms/add-appointment-form"
import {
    AlertCircle,
    AlertTriangle,
    CalendarIcon,
    CheckCircle,
    Clock,
    Copy,
    Loader2,
    Plus,
    Search,
    XCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react"
import {format} from "date-fns"
import {type ProfessionalUser, useAuthStore} from "@/stores/auth-store"
import {useAppointments} from "@/hooks/use-api"
import {type Appointment} from "@/lib/config"

// L'interface Appointment est maintenant importée depuis @/lib/config

export default function Appointments() {
    const {user, accessToken} = useAuthStore()
    const professional = user as ProfessionalUser
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined) // Pas de date par défaut = toutes les dates
    const [typeFilter, setTypeFilter] = useState("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Construction des paramètres de filtre pour l'API
    const params = useMemo(() => {
        const urlParams = new URLSearchParams()
        
        // Pagination
        urlParams.set("page", currentPage.toString())
        urlParams.set("page_size", pageSize.toString())
        
        // Filtres
        if (selectedDate) {
            const formattedDate = format(selectedDate, "yyyy-MM-dd")
            urlParams.append("date_from", formattedDate)
            urlParams.append("date_to", formattedDate)
        }
        if (typeFilter !== "all") {
            urlParams.append("type", typeFilter)
        }
        
        return urlParams
    }, [selectedDate, typeFilter, currentPage, pageSize])

    // Debug temporaire
    console.log('🔍 Appointments Debug - AccessToken:', accessToken ? 'Present' : 'Missing')

    // Utilisation du hook personnalisé pour les appointments
    const {
        appointments,
        pagination,
        isLoading,
        error,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        refetch
    } = useAppointments(params)

    const handleAddAppointment = async (newAppointment: any) => {
        try {
            await createAppointment(newAppointment)
            setIsAddDialogOpen(false)
        } catch (err) {
            console.error("Failed to create appointment:", err)
        }
    }

    const copyAppointmentId = async (appointmentId: string) => {
        try {
            await navigator.clipboard.writeText(appointmentId)
            // Optionnel: afficher une notification toast ici
            console.log('📋 Appointment ID copied:', appointmentId)
        } catch (err) {
            console.error('Failed to copy appointment ID:', err)
        }
    }

    // Edit and delete handlers removed

    // Test manual de l'API
    const testApiCall = async () => {
        console.log('🧪 Testing API call manually...')
        if (!accessToken) {
            console.log('❌ No access token for manual test')
            return
        }
        
        try {
            const testUrl = 'http://localhost:8000/api/v1/appointments/'
            console.log('📞 Manual fetch to:', testUrl)
            
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            
            console.log('📡 Manual fetch response status:', response.status)
            
            if (response.ok) {
                const data = await response.json()
                console.log('✅ Manual fetch success:', data)
            } else {
                const errorText = await response.text()
                console.log('❌ Manual fetch error:', errorText)
            }
        } catch (error) {
            console.error('💥 Manual fetch failed:', error)
        }
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "scheduled":
                return "bg-blue-500 hover:bg-blue-600"
            case "completed":
                return "bg-green-500 hover:bg-green-600"
            case "cancelled":
                return "bg-red-500 hover:bg-red-600"
            default:
                return "bg-gray-500 hover:bg-gray-600"
        }
    }

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case "scheduled":
                return <Clock className="w-2 h-2 sm:w-3 sm:h-3"/>
            case "completed":
                return <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3"/>
            case "cancelled":
                return <XCircle className="w-2 h-2 sm:w-3 sm:h-3"/>
            default:
                return <AlertCircle className="w-2 h-2 sm:w-3 sm:h-3"/>
        }
    }

    // Filtrage par recherche côté client (sur les données de la page actuelle)
    const filteredAppointments = appointments.filter((appointment) => {
        if (!searchTerm.trim()) return true
        
        const search = searchTerm.toLowerCase()
        return (
            appointment.patient_name?.toLowerCase().includes(search) ||
            appointment.appointment_id?.toLowerCase().includes(search) ||
            appointment.type_display?.toLowerCase().includes(search)
        )
    })

    // Gestionnaires de pagination
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handleFirstPage = () => setCurrentPage(1)
    const handleLastPage = () => setCurrentPage(pagination.totalPages)
    const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1))
    const handleNextPage = () => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500"/>
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center p-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-500"/>
                    <p className="mt-2 text-red-600 dark:text-red-400 font-semibold">Failed to load appointments</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            )
        }

        if (filteredAppointments.length === 0) {
            return (
                <div className="text-center p-10 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
                    <p className="font-semibold">No appointments found</p>
                    <p className="text-sm text-muted-foreground">
                        {searchTerm ? "Try adjusting your search or filters." : "No appointments for the selected criteria."}
                    </p>
                </div>
            )
        }

        return (
            <div className="space-y-6">
                <div className="space-y-3 sm:space-y-4">
                    {filteredAppointments.map((appointment, index) => {
                        const scheduledDateTime = appointment.scheduled ? new Date(appointment.scheduled) : new Date()
                        const isValidDate = !isNaN(scheduledDateTime.getTime())
                        const patientName = appointment.patient_name || `Patient ${appointment.patient_id?.substring(0, 8) || 'Unknown'}...`
                        const patientInitials = appointment.patient_name 
                            ? appointment.patient_name
                                .split(' ')
                                .map(name => name.charAt(0))
                                .join('')
                                .substring(0, 2)
                            : "P"

                        return (
                            <Card
                                key={appointment.appointment_id}
                                className="card-hover glass-effect border-0 shadow-lg animate-slide-up w-full"
                                style={{animationDelay: `${index * 0.1}s`}}
                            >
                                <CardContent className="p-3 sm:p-4 lg:p-6">
                                    <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0">
                                            {/* Date & Time */}
                                            <div className="text-center p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-white min-w-20 flex-shrink-0">
                                                <div className="text-xs opacity-90 uppercase tracking-wide mb-1">
                                                    {isValidDate ? format(scheduledDateTime, "EEE") : "N/A"}
                                                </div>
                                                <div className="text-lg font-bold">
                                                    {isValidDate ? format(scheduledDateTime, "dd/MM") : "??/??"}
                                                </div>
                                                <div className="text-sm font-semibold">
                                                    {isValidDate ? format(scheduledDateTime, "HH:mm") : "--:--"}
                                                </div>
                                                <div className="text-xs opacity-75 mt-1">
                                                    {appointment.duration || 30}min
                                                </div>
                                            </div>

                                            {/* Patient Info */}
                                            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                                                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                                    <AvatarImage src={`/placeholder.svg?height=64&width=64`}/>
                                                    <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-lg font-bold">
                                                        {patientInitials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                                            {appointment.patient_name}
                                                        </h3>
                                                        <Badge variant="outline" className="text-xs flex-shrink-0 px-1 sm:px-2">
                                                            {appointment.patient_id.substring(0, 8)}...
                                                        </Badge>
                                                    </div>
                                                    {/* Patient contact info removed */}
                                                </div>
                                            </div>

                                            {/* Appointment Details */}
                                            <div className="space-y-2 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300 text-xs px-1 sm:px-2"
                                                    >
                                                        {appointment.type_display}
                                                    </Badge>
                                                    <Badge className={`${getStatusColor(appointment.status)} text-xs px-1 sm:px-2`}>
                                                        {getStatusIcon(appointment.status)}
                                                        <span className="ml-0.5 sm:ml-1">{appointment.status || "scheduled"}</span>
                                                    </Badge>
                                                </div>
                                                {/* Notes section removed */}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyAppointmentId(appointment.appointment_id)}
                                                className="gap-2 bg-transparent hover:bg-primary-50"
                                                title="Copy appointment ID"
                                            >
                                                <Copy className="w-4 h-4"/>
                                                <span className="hidden sm:inline">Copy ID</span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
                
                {/* Pagination - Toujours visible avec contrôles actifs */}
                <Card className="glass-effect border-0 shadow-lg w-full">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Pagination Info */}
                            <div className="text-sm text-muted-foreground">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <span className="font-medium">
                                        {pagination.count > 0 ? (
                                            <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.count)} of {pagination.count} appointments</>
                                        ) : (
                                            "No appointments found"
                                        )}
                                    </span>
                                    {selectedDate && (
                                        <span className="text-primary-600 font-medium">
                                            • Filtered by {format(selectedDate, "PP")}
                                        </span>
                                    )}
                                    {!selectedDate && pagination.count > 0 && (
                                        <span className="text-green-600 font-medium">
                                            • All dates
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Pagination Controls - Toujours visibles */}
                            <div className="flex items-center gap-2">
                                {/* Contrôles de navigation */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFirstPage}
                                    disabled={currentPage === 1 || pagination.count === 0}
                                    className="hidden sm:flex"
                                    title="Première page"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1 || pagination.count === 0}
                                    title="Page précédente"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline ml-1">Previous</span>
                                </Button>
                                
                                {/* Informations de page courante */}
                                <div className="flex items-center gap-1">
                                    {pagination.totalPages > 1 ? (
                                        /* Numéros de pages multiples */
                                        Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else {
                                                const start = Math.max(1, currentPage - 2);
                                                const end = Math.min(pagination.totalPages, start + 4);
                                                const adjustedStart = Math.max(1, end - 4);
                                                pageNum = adjustedStart + i;
                                            }
                                            
                                            if (pageNum > pagination.totalPages) return null;
                                            
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className="w-8 h-8 p-0"
                                                    disabled={pagination.count === 0}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })
                                    ) : (
                                        /* Affichage pour une seule page */
                                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded text-sm">
                                            <span className="font-medium">Page {currentPage}</span>
                                            <span className="text-muted-foreground">of {Math.max(1, pagination.totalPages)}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === pagination.totalPages || pagination.count === 0 || pagination.totalPages <= 1}
                                    title="Page suivante"
                                >
                                    <span className="hidden sm:inline mr-1">Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLastPage}
                                    disabled={currentPage === pagination.totalPages || pagination.count === 0 || pagination.totalPages <= 1}
                                    className="hidden sm:flex"
                                    title="Dernière page"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </Button>
                                
                                {/* Sélecteur de taille de page */}
                                <div className="hidden md:flex items-center gap-2 ml-4">
                                    <span className="text-xs text-muted-foreground">Items per page:</span>
                                    <Select 
                                        value={pageSize.toString()} 
                                        onValueChange={(value) => {
                                            setPageSize(parseInt(value))
                                            setCurrentPage(1) // Reset à la page 1 quand on change la taille
                                        }}
                                    >
                                        <SelectTrigger className="w-16 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="mobile-container">
                <div className="mobile-content space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                Appointment Management
                            </h1>
                            <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base xl:text-lg">
                                Schedule and manage appointments
                                {!isLoading && (
                                    <span className="block mt-1 text-xs flex items-center gap-2">
                                        <span>{pagination.count || 0} total appointments</span>
                                        {pagination.totalPages > 1 && (
                                            <>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="font-medium text-primary-600">Page {currentPage} of {pagination.totalPages}</span>
                                                <span className="text-muted-foreground">•</span>
                                                <span>{pageSize} per page</span>
                                            </>
                                        )}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={testApiCall}
                                variant="outline"
                                className="btn-responsive gap-1 sm:gap-2"
                            >
                                🧪 Test API
                            </Button>
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 w-full sm:w-auto">
                                        <Plus className="icon-responsive-sm"/>
                                        <span className="truncate">New Appointment</span>
                                    </Button>
                                </DialogTrigger>
                                <AddAppointmentForm
                                    onSubmit={handleAddAppointment}
                                    onCancel={() => setIsAddDialogOpen(false)}
                                />
                            </Dialog>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="glass-effect border-0 shadow-lg floating-card w-full">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:flex-wrap">
                                <div className="relative flex-1 min-w-0 lg:min-w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-responsive-sm"/>
                                    <Input
                                        placeholder="Search appointments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 sm:pl-10 btn-responsive bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 w-full"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="btn-responsive gap-1 sm:gap-2 bg-transparent flex-1 sm:flex-none">
                                                <CalendarIcon className="icon-responsive-sm"/>
                                                <span className="truncate">
                                                    {selectedDate ? format(selectedDate, "PPP") : "Toutes les dates"}
                                                </span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <div className="p-3">
                                                <div className="flex gap-2 mb-3">
                                                    <Button
                                                        variant={selectedDate ? "outline" : "default"}
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedDate(undefined)
                                                            setCurrentPage(1) // Reset pagination
                                                        }}
                                                        className="text-xs"
                                                    >
                                                        Toutes les dates
                                                    </Button>
                                                    <Button
                                                        variant={selectedDate && format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedDate(new Date())
                                                            setCurrentPage(1) // Reset pagination
                                                        }}
                                                        className="text-xs"
                                                    >
                                                        Aujourd'hui
                                                    </Button>
                                                </div>
                                                <Calendar 
                                                    mode="single" 
                                                    selected={selectedDate} 
                                                    onSelect={(date) => {
                                                        setSelectedDate(date)
                                                        setCurrentPage(1) // Reset pagination
                                                    }}
                                                    initialFocus
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* 4. Filtre par type pour correspondre à l'API */}
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="btn-responsive bg-transparent w-full sm:w-48">
                                        <SelectValue placeholder="Filter type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="consultation">Consultation</SelectItem>
                                        <SelectItem value="suivi">Suivi</SelectItem>
                                        <SelectItem value="examen">Examen</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointments List */}
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}