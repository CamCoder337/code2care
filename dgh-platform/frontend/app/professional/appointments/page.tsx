"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { AddAppointmentForm } from "@/components/forms/add-appointment-form"
import {
    Search,
    Plus,
    CalendarIcon,
    Clock,
    Phone,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle,
    Edit,
    Trash2,
    Loader2,
    AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"

// 1. Interface adaptée à la réponse de l'API.
// NOTE: L'API devrait idéalement renvoyer des objets imbriqués pour `patient` et `professional`
// pour afficher toutes les informations nécessaires dans l'interface.
interface Appointment {
    appointment_id: string
    scheduled: string // Format ISO: "2025-08-04T09:00:00Z"
    type: string
    type_display: string
    status: "scheduled" | "completed" | "cancelled" // Supposons que l'API renvoie aussi un statut
    patient_id: string
    professional_id: string
    // Données enrichies que l'API devrait fournir pour une meilleure expérience utilisateur
    patient?: {
        first_name: string
        last_name: string
        patient_id: string
        phone_number: string
    }
    professional?: {
        first_name: string
        last_name: string
        specialization: string
    }
    notes?: string
    duration?: number
}

export default function Appointments() {
    const { professional } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [typeFilter, setTypeFilter] = useState("all")
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    // 2. Récupération des données depuis l'API
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!professional?.access_token) {
                setError("Authentication token not found.")
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)

            // Construction de l'URL avec les paramètres de filtre
            const params = new URLSearchParams()
            if (selectedDate) {
                // --- FIX: Format the date to YYYY-MM-DD as expected by the API ---
                const formattedDate = format(selectedDate, "yyyy-MM-dd")
                params.append("date_from", formattedDate)
                params.append("date_to", formattedDate)
            }
            if (typeFilter !== "all") {
                params.append("type", typeFilter)
            }

            try {
                const response = await fetch(`https://high5-gateway.onrender.com/api/v1/appointments/?${params.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${professional.access_token}`,
                        Accept: "application/json",
                    },
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch appointments: ${response.statusText}`)
                }

                const data = await response.json()
                // L'API renvoie directement un tableau de rendez-vous
                setAppointments(data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.")
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAppointments()
    }, [professional?.access_token, selectedDate, typeFilter])

    const handleAddAppointment = (newAppointment: any) => {
        // TODO: Implémenter l'appel API pour ajouter un rendez-vous
        setAppointments([newAppointment, ...appointments])
        setIsAddDialogOpen(false)
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
                return <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
            case "completed":
                return <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3" />
            case "cancelled":
                return <XCircle className="w-2 h-2 sm:w-3 sm:h-3" />
            default:
                return <AlertCircle className="w-2 h-2 sm:w-3 sm:h-3" />
        }
    }

    // 3. Le filtrage par recherche se fait côté client sur les données récupérées
    const filteredAppointments = appointments.filter((appointment) =>
        (appointment.patient?.first_name + " " + appointment.patient?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.appointment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.type_display.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center p-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
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
            <div className="space-y-3 sm:space-y-4">
                {filteredAppointments.map((appointment, index) => {
                    const scheduledDateTime = new Date(appointment.scheduled)
                    const patientName = appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : `Patient ID: ${appointment.patient_id.substring(0, 8)}...`
                    const patientInitials = appointment.patient ? `${appointment.patient.first_name[0]}${appointment.patient.last_name[0]}` : "P"

                    return (
                        <Card
                            key={appointment.appointment_id}
                            className="card-hover glass-effect border-0 shadow-lg animate-slide-up w-full"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <CardContent className="p-3 sm:p-4 lg:p-6">
                                <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0">
                                        {/* Time & Date */}
                                        <div className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-white min-w-16 sm:min-w-20 lg:min-w-24 flex-shrink-0">
                                            <div className="text-sm sm:text-lg lg:text-2xl font-bold">{format(scheduledDateTime, "HH:mm")}</div>
                                            <div className="text-xs opacity-90">{appointment.duration || 30}min</div>
                                        </div>

                                        {/* Patient Info */}
                                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                                            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                                <AvatarImage src={`/placeholder.svg?height=64&width=64`} />
                                                <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-lg font-bold">
                                                    {patientInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                                        {patientName}
                                                    </h3>
                                                    <Badge variant="outline" className="text-xs flex-shrink-0 px-1 sm:px-2">
                                                        {appointment.patient_id.substring(0, 8)}...
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="icon-responsive-sm flex-shrink-0" />
                                                        <span className="truncate">{appointment.patient?.phone_number || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="icon-responsive-sm flex-shrink-0" />
                                                        <span className="truncate">{appointment.professional?.specialization || "N/A"}</span>
                                                    </div>
                                                </div>
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
                                                    <span className="ml-0.5 sm:ml-1">{appointment.status || "Unknown"}</span>
                                                </Badge>
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md truncate">
                                                {appointment.notes || "No notes available."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="button-group-responsive">
                                        <Button variant="outline" className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none">
                                            <Edit className="icon-responsive-sm" />
                                            <span className="hidden sm:inline truncate">Edit</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="btn-responsive-sm gap-1 bg-transparent text-red-500 hover:text-red-600 flex-1 sm:flex-none"
                                        >
                                            <Trash2 className="icon-responsive-sm" />
                                            <span className="hidden sm:inline truncate">Cancel</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
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
                            </p>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 w-full sm:w-auto">
                                    <Plus className="icon-responsive-sm" />
                                    <span className="truncate">New Appointment</span>
                                </Button>
                            </DialogTrigger>
                            <AddAppointmentForm
                                onSubmit={handleAddAppointment}
                                onCancel={() => setIsAddDialogOpen(false)}
                                patients={[]} // Idéalement, charger les patients depuis l'API
                            />
                        </Dialog>
                    </div>

                    {/* Filters */}
                    <Card className="glass-effect border-0 shadow-lg floating-card w-full">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:flex-wrap">
                                <div className="relative flex-1 min-w-0 lg:min-w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-responsive-sm" />
                                    <Input
                                        placeholder="Search appointments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 sm:pl-10 btn-responsive bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 w-full"
                                    />
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="btn-responsive gap-1 sm:gap-2 bg-transparent w-full sm:w-auto">
                                            <CalendarIcon className="icon-responsive-sm" />
                                            <span className="truncate">{selectedDate ? format(selectedDate, "PPP") : "Select Date"}</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                                    </PopoverContent>
                                </Popover>

                                {/* 4. Filtre par type pour correspondre à l'API */}
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="btn-responsive bg-transparent w-full sm:w-48">
                                        <SelectValue placeholder="Filter type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="consultation">Consultation</SelectItem>
                                        <SelectItem value="follow_up">Follow-up</SelectItem>
                                        <SelectItem value="emergency">Emergency</SelectItem>
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