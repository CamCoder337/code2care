"use client"

import {useState, useMemo} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Dialog, DialogTrigger} from "@/components/ui/dialog"
import {
    AlertTriangle,
    Calendar,
    Edit,
    Loader2,
    Pill,
    Plus,
    Search,
    Trash2,
    User,
} from "lucide-react"
import {format} from "date-fns"
import {type ProfessionalUser, useAuthStore} from "@/stores/auth-store"
import {usePrescriptions, useMedications, usePatients} from "@/hooks/use-api"

// Interface pour une prescription
interface Prescription {
    prescription_id: string
    patient_id: string
    professional_id: string
    medications: {
        medication_id: string
        name: string
        dosage: string
        frequency: string
        duration: number
        instructions?: string
    }[]
    prescribed_date: string
    notes?: string
    status: "active" | "completed" | "cancelled"
    // Données enrichies
    patient?: {
        first_name: string
        last_name: string
        patient_id: string
    }
    professional?: {
        first_name: string
        last_name: string
        specialization: string
    }
}

export default function Prescriptions() {
    const {user} = useAuthStore()
    const professional = user as ProfessionalUser
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    // Construction des paramètres de filtre pour l'API
    const params = useMemo(() => {
        const urlParams = new URLSearchParams()
        if (statusFilter !== "all") {
            urlParams.append("status", statusFilter)
        }
        return urlParams
    }, [statusFilter])

    // Utilisation du hook personnalisé pour les prescriptions
    const {
        prescriptions,
        isLoading,
        error,
        createPrescription,
        updatePrescription,
        deletePrescription,
        refetch
    } = usePrescriptions(params)

    // Hook pour les médicaments (utile pour le formulaire d'ajout)
    const {data: medications} = useMedications()
    
    // Hook pour les patients (utile pour le formulaire d'ajout)
    const {data: patients} = usePatients()

    const handleAddPrescription = async (newPrescription: any) => {
        try {
            await createPrescription(newPrescription)
            setIsAddDialogOpen(false)
        } catch (err) {
            console.error("Failed to create prescription:", err)
        }
    }

    const handleEditPrescription = async (prescriptionId: string, updatedData: any) => {
        try {
            await updatePrescription(prescriptionId, updatedData)
        } catch (err) {
            console.error("Failed to update prescription:", err)
        }
    }

    const handleDeletePrescription = async (prescriptionId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette prescription ?")) return
        
        try {
            await deletePrescription(prescriptionId)
        } catch (err) {
            console.error("Failed to delete prescription:", err)
        }
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "active":
                return "bg-green-500 hover:bg-green-600"
            case "completed":
                return "bg-blue-500 hover:bg-blue-600"
            case "cancelled":
                return "bg-red-500 hover:bg-red-600"
            default:
                return "bg-gray-500 hover:bg-gray-600"
        }
    }

    // Filtrage par recherche côté client
    const filteredPrescriptions = prescriptions.filter((prescription) =>
        (prescription.patient?.first_name + " " + prescription.patient?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.prescription_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medications.some(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

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
                    <p className="mt-2 text-red-600 dark:text-red-400 font-semibold">Failed to load prescriptions</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            )
        }

        if (filteredPrescriptions.length === 0) {
            return (
                <div className="text-center p-10 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
                    <p className="font-semibold">No prescriptions found</p>
                    <p className="text-sm text-muted-foreground">
                        {searchTerm ? "Try adjusting your search or filters." : "No prescriptions for the selected criteria."}
                    </p>
                </div>
            )
        }

        return (
            <div className="space-y-3 sm:space-y-4">
                {filteredPrescriptions.map((prescription, index) => {
                    const prescribedDate = new Date(prescription.prescribed_date)
                    const patientName = prescription.patient ? `${prescription.patient.first_name} ${prescription.patient.last_name}` : `Patient ID: ${prescription.patient_id.substring(0, 8)}...`
                    const patientInitials = prescription.patient ? `${prescription.patient.first_name[0]}${prescription.patient.last_name[0]}` : "P"

                    return (
                        <Card
                            key={prescription.prescription_id}
                            className="card-hover glass-effect border-0 shadow-lg animate-slide-up w-full"
                            style={{animationDelay: `${index * 0.1}s`}}
                        >
                            <CardContent className="p-3 sm:p-4 lg:p-6">
                                <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0">
                                        {/* Date & Status */}
                                        <div className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-white min-w-16 sm:min-w-20 lg:min-w-24 flex-shrink-0">
                                            <div className="text-sm sm:text-lg lg:text-xl font-bold">
                                                {format(prescribedDate, "dd/MM")}
                                            </div>
                                            <div className="text-xs opacity-90">
                                                {format(prescribedDate, "yyyy")}
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
                                                        {patientName}
                                                    </h3>
                                                    <Badge variant="outline" className="text-xs flex-shrink-0 px-1 sm:px-2">
                                                        {prescription.patient_id.substring(0, 8)}...
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Pill className="icon-responsive-sm flex-shrink-0"/>
                                                        <span className="truncate">
                                                            {prescription.medications.length} médicament(s)
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="icon-responsive-sm flex-shrink-0"/>
                                                        <span className="truncate">
                                                            {format(prescribedDate, "dd/MM/yyyy")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Prescription Details */}
                                        <div className="space-y-2 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    className={`${getStatusColor(prescription.status)} text-xs px-1 sm:px-2`}>
                                                    {prescription.status || "Unknown"}
                                                </Badge>
                                            </div>
                                            
                                            {/* Medications list */}
                                            <div className="space-y-1">
                                                {prescription.medications.slice(0, 2).map((med, idx) => (
                                                    <p key={idx} className="text-xs sm:text-sm text-muted-foreground truncate">
                                                        <span className="font-medium">{med.name}</span> - {med.dosage} ({med.frequency})
                                                    </p>
                                                ))}
                                                {prescription.medications.length > 2 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        +{prescription.medications.length - 2} autres...
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md truncate">
                                                {prescription.notes || "Aucune note disponible."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="button-group-responsive">
                                        <Button 
                                            variant="outline"
                                            className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none"
                                            onClick={() => handleEditPrescription(prescription.prescription_id, {})}
                                        >
                                            <Edit className="icon-responsive-sm"/>
                                            <span className="hidden sm:inline truncate">Edit</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="btn-responsive-sm gap-1 bg-transparent text-red-500 hover:text-red-600 flex-1 sm:flex-none"
                                            onClick={() => handleDeletePrescription(prescription.prescription_id)}
                                        >
                                            <Trash2 className="icon-responsive-sm"/>
                                            <span className="hidden sm:inline truncate">Delete</span>
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
                                Prescription Management
                            </h1>
                            <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base xl:text-lg">
                                Manage and track patient prescriptions
                            </p>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 w-full sm:w-auto">
                                    <Plus className="icon-responsive-sm"/>
                                    <span className="truncate">New Prescription</span>
                                </Button>
                            </DialogTrigger>
                            {/* TODO: Implement AddPrescriptionForm component */}
                        </Dialog>
                    </div>

                    {/* Filters */}
                    <Card className="glass-effect border-0 shadow-lg floating-card w-full">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:flex-wrap">
                                <div className="relative flex-1 min-w-0 lg:min-w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-responsive-sm"/>
                                    <Input
                                        placeholder="Search prescriptions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 sm:pl-10 btn-responsive bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 w-full"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="btn-responsive bg-transparent w-full sm:w-48">
                                        <SelectValue placeholder="Filter status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prescriptions List */}
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}
