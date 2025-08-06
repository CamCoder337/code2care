"use client"

import {useState} from "react"
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
    CalendarIcon,
    CheckCircle,
    Clock,
    Edit,
    MapPin,
    Phone,
    Plus,
    Search,
    Trash2,
    XCircle,
} from "lucide-react"
import {format} from "date-fns"

export function Appointments() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [statusFilter, setStatusFilter] = useState("all")

    const [appointments, setAppointments] = useState([
        {
            id: "APT001",
            patient: {
                name: "John Smith",
                id: "PAT001",
                phone: "+1234567890",
                avatar: "JS",
            },
            professional: {
                name: "Dr. Sarah Johnson",
                department: "Cardiology",
            },
            scheduledDate: "2024-01-22",
            scheduledTime: "09:00",
            type: "Consultation",
            status: "scheduled",
            duration: 30,
            notes: "Regular checkup",
        },
        {
            id: "APT002",
            patient: {
                name: "Maria Garcia",
                id: "PAT002",
                phone: "+1234567891",
                avatar: "MG",
            },
            professional: {
                name: "Dr. Sarah Johnson",
                department: "Cardiology",
            },
            scheduledDate: "2024-01-22",
            scheduledTime: "10:30",
            type: "Follow-up",
            status: "completed",
            duration: 20,
            notes: "Post-surgery follow-up",
        },
        {
            id: "APT003",
            patient: {
                name: "David Johnson",
                id: "PAT003",
                phone: "+1234567892",
                avatar: "DJ",
            },
            professional: {
                name: "Dr. Sarah Johnson",
                department: "Cardiology",
            },
            scheduledDate: "2024-01-22",
            scheduledTime: "14:00",
            type: "Emergency",
            status: "cancelled",
            duration: 45,
            notes: "Chest pain evaluation",
        },
        {
            id: "APT004",
            patient: {
                name: "Sarah Wilson",
                id: "PAT004",
                phone: "+1234567893",
                avatar: "SW",
            },
            professional: {
                name: "Dr. Sarah Johnson",
                department: "Cardiology",
            },
            scheduledDate: "2024-01-22",
            scheduledTime: "15:30",
            type: "Routine Check",
            status: "scheduled",
            duration: 25,
            notes: "Annual physical",
        },
    ])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    const mockPatients = [
        {id: "PAT001", name: "John Smith"},
        {id: "PAT002", name: "Maria Garcia"},
        {id: "PAT003", name: "David Johnson"},
        {id: "PAT004", name: "Sarah Wilson"},
    ]

    const handleAddAppointment = (newAppointment: any) => {
        setAppointments([...appointments, newAppointment])
        setIsAddDialogOpen(false)
    }

    const getStatusColor = (status: string) => {
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

    const getStatusIcon = (status: string) => {
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

    const filteredAppointments = appointments.filter((appointment) => {
        const matchesSearch =
            appointment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.type.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || appointment.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="mobile-container">
                <div className="mobile-content space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
                    {/* Header */}
                    <div
                        className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
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
                                <Button
                                    className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 w-full sm:w-auto">
                                    <Plus className="icon-responsive-sm"/>
                                    <span className="truncate">New Appointment</span>
                                </Button>
                            </DialogTrigger>
                            <AddAppointmentForm
                                onSubmit={handleAddAppointment}
                                onCancel={() => setIsAddDialogOpen(false)}
                                patients={mockPatients}
                            />
                        </Dialog>
                    </div>

                    {/* Filters */}
                    <Card className="glass-effect border-0 shadow-lg floating-card w-full">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:flex-wrap">
                                <div className="relative flex-1 min-w-0 lg:min-w-64">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-responsive-sm"/>
                                    <Input
                                        placeholder="Search appointments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 sm:pl-10 btn-responsive bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 w-full"
                                    />
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline"
                                                className="btn-responsive gap-1 sm:gap-2 bg-transparent w-full sm:w-auto">
                                            <CalendarIcon className="icon-responsive-sm"/>
                                            <span
                                                className="truncate">{selectedDate ? format(selectedDate, "MMM dd") : "Select Date"}</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate}
                                                  initialFocus/>
                                    </PopoverContent>
                                </Popover>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="btn-responsive bg-transparent w-full sm:w-48">
                                        <SelectValue placeholder="Filter status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointments List */}
                    <div className="space-y-3 sm:space-y-4">
                        {filteredAppointments.map((appointment, index) => (
                            <Card
                                key={appointment.id}
                                className="card-hover glass-effect border-0 shadow-lg animate-slide-up w-full"
                                style={{animationDelay: `${index * 0.1}s`}}
                            >
                                <CardContent className="p-3 sm:p-4 lg:p-6">
                                    <div
                                        className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                                        <div
                                            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0">
                                            {/* Time & Date */}
                                            <div
                                                className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-white min-w-16 sm:min-w-20 lg:min-w-24 flex-shrink-0">
                                                <div
                                                    className="text-sm sm:text-lg lg:text-2xl font-bold">{appointment.scheduledTime}</div>
                                                <div className="text-xs opacity-90">{appointment.duration}min</div>
                                            </div>

                                            {/* Patient Info */}
                                            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                                                <Avatar
                                                    className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                                    <AvatarImage src={`/placeholder.svg?height=64&width=64`}/>
                                                    <AvatarFallback
                                                        className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-lg font-bold">
                                                        {appointment.patient.avatar}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                                            {appointment.patient.name}
                                                        </h3>
                                                        <Badge variant="outline"
                                                               className="text-xs flex-shrink-0 px-1 sm:px-2">
                                                            {appointment.patient.id}
                                                        </Badge>
                                                    </div>
                                                    <div
                                                        className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="icon-responsive-sm flex-shrink-0"/>
                                                            <span
                                                                className="truncate">{appointment.patient.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="icon-responsive-sm flex-shrink-0"/>
                                                            <span
                                                                className="truncate">{appointment.professional.department}</span>
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
                                                        {appointment.type}
                                                    </Badge>
                                                    <Badge
                                                        className={`${getStatusColor(appointment.status)} text-xs px-1 sm:px-2`}>
                                                        {getStatusIcon(appointment.status)}
                                                        <span className="ml-0.5 sm:ml-1">{appointment.status}</span>
                                                    </Badge>
                                                </div>
                                                <p className="text-xs sm:text-sm text-muted-foreground max-w-md truncate">
                                                    {appointment.notes}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="button-group-responsive">
                                            <Button variant="outline"
                                                    className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none">
                                                <Edit className="icon-responsive-sm"/>
                                                <span className="hidden sm:inline truncate">Edit</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="btn-responsive-sm gap-1 bg-transparent text-red-500 hover:text-red-600 flex-1 sm:flex-none"
                                            >
                                                <Trash2 className="icon-responsive-sm"/>
                                                <span className="hidden sm:inline truncate">Cancel</span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
