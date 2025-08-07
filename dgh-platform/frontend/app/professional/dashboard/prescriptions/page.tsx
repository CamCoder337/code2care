"use client"

import {useState, useMemo} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {AddPrescriptionForm} from "@/components/forms/add-prescription-form"
import {
    AlertTriangle,
    Calendar,
    Edit,
    Eye,
    Loader2,
    Pill,
    Plus,
    Search,
    Trash2,
    User,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react"
import {format} from "date-fns"
import {type ProfessionalUser, useAuthStore} from "@/stores/auth-store"
import {usePrescriptionsWithPagination, useMedications, usePatients} from "@/hooks/use-api"
import {type Prescription} from "@/lib/config"

export default function Prescriptions() {
    const {user} = useAuthStore()
    const professional = user as ProfessionalUser
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Construction des paramètres de filtre pour l'API
    const params = useMemo(() => {
        const urlParams = new URLSearchParams()
        
        // Pagination
        urlParams.set("page", currentPage.toString())
        urlParams.set("page_size", pageSize.toString())
        
        // Filtres
        if (statusFilter !== "all") {
            urlParams.append("status", statusFilter)
        }
        if (searchTerm.trim()) {
            urlParams.set("search", searchTerm.trim())
        }
        
        return urlParams
    }, [currentPage, pageSize, statusFilter, searchTerm])

    // Réactiver le hook pour les prescriptions
    const {
        prescriptions,
        pagination,
        isLoading,
        error,
        createPrescription,
        updatePrescription,
        deletePrescription,
        refetch
    } = usePrescriptionsWithPagination(params)

    // Hook pour les médicaments (utile pour le formulaire d'ajout)
    const {data: medications} = useMedications()
    
    // Hook pour les patients (utile pour le formulaire d'ajout)  
    const {data: patients, isLoading: patientsLoading, error: patientsError} = usePatients()
    
    // Debug data
    console.log('💊 Prescriptions data:', prescriptions)
    console.log('💊 Prescriptions pagination:', pagination)
    console.log('💊 Prescriptions loading:', isLoading)
    console.log('💊 Prescriptions error:', error)
    console.log('🏥 Patients data:', patients)
    console.log('🏥 Patients loading:', patientsLoading)
    console.log('🏥 Patients error:', patientsError)
    console.log('📋 API params:', params.toString())

    // Gestionnaires de pagination (comme dans appointments)
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handleFirstPage = () => setCurrentPage(1)
    const handleLastPage = () => setCurrentPage(pagination.num_pages)
    const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1))
    const handleNextPage = () => setCurrentPage(Math.min(pagination.num_pages, currentPage + 1))

    const handleAddPrescription = async (newPrescription: any) => {
        try {
            await createPrescription(newPrescription)
            setIsAddDialogOpen(false)
            // Refresh automatique des données après création
            console.log('✅ Prescription créée avec succès, rafraîchissement...')
            await refetch()
        } catch (err) {
            console.error("Failed to create prescription:", err)
        }
    }

    const handleEditPrescription = async (prescriptionId: string, updatedData: any) => {
        try {
            await updatePrescription(prescriptionId, updatedData)
            console.log('✅ Prescription mise à jour avec succès, rafraîchissement...')
            await refetch()
        } catch (err) {
            console.error("Failed to update prescription:", err)
        }
    }

    const handleDeletePrescription = async (prescriptionId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette prescription ?")) return
        
        try {
            await deletePrescription(prescriptionId)
            console.log('✅ Prescription supprimée avec succès, rafraîchissement...')
            await refetch()
        } catch (err) {
            console.error("Failed to delete prescription:", err)
        }
    }

    const handleViewPrescription = (prescription: Prescription) => {
        setSelectedPrescription(prescription)
        setIsViewDialogOpen(true)
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

    // Plus de filtrage côté client - tout est fait côté serveur

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
                <div className="flex flex-col items-center justify-center p-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-500"/>
                    <p className="mt-2 text-yellow-600 dark:text-yellow-400 font-semibold">Prescriptions endpoint not available</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        L'endpoint <code>/api/v1/prescriptions/</code> n'est pas encore implémenté côté backend
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Erreur: {error}
                    </p>
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                            🔧 Pour implémenter l'endpoint prescriptions :
                        </p>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <li>1. Créer le modèle Prescription dans Django</li>
                            <li>2. Ajouter les vues API avec pagination</li>
                            <li>3. Configurer les URLs dans le backend</li>
                        </ul>
                    </div>
                </div>
            )
        }

        if (prescriptions.length === 0) {
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
            <div className="space-y-4">
                <div className="space-y-3 sm:space-y-4">
                    {prescriptions.map((prescription, index) => {
                    const prescribedDate = prescription.created_at ? new Date(prescription.created_at) : new Date()
                    const isValidDate = !isNaN(prescribedDate.getTime())
                    const patientName = `Appointment: ${prescription.appointment_id.substring(0, 8)}...`
                    const patientInitials = "P"

                    return (
                        <Card
                            key={prescription.prescription_id}
                            className="card-hover glass-effect border-0 shadow-lg animate-slide-up w-full"
                            style={{animationDelay: `${index * 0.1}s`}}
                        >
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                                    {/* Date Block */}
                                    <div className="flex-shrink-0">
                                        <div className="text-center p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-white min-w-20">
                                            <div className="text-lg font-bold">
                                                {isValidDate ? format(prescribedDate, "dd/MM") : "N/A"}
                                            </div>
                                            <div className="text-xs opacity-90">
                                                {isValidDate ? format(prescribedDate, "yyyy") : "N/A"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0 space-y-4">
                                        {/* Patient Info Row */}
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-12 h-12 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                                <AvatarImage src={`/placeholder.svg?height=48&width=48`}/>
                                                <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold">
                                                    {patientInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold truncate">
                                                        {patientName}
                                                    </h3>
                                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                                        {prescription.appointment_id.substring(0, 8)}...
                                                    </Badge>
                                                    <Badge className="bg-green-500 hover:bg-green-600 text-xs flex-shrink-0">
                                                        Active
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Pill className="w-4 h-4 flex-shrink-0"/>
                                                        <span>{prescription.medications?.length || 0} medications</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4 flex-shrink-0"/>
                                                        <span>{isValidDate ? format(prescribedDate, "dd/MM/yyyy") : "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Medications Preview */}
                                        <div className="space-y-1 px-3 py-2 bg-muted/20 rounded-lg">
                                            {prescription.medications?.slice(0, 2).map((med, idx) => (
                                                <p key={idx} className="text-sm text-muted-foreground">
                                                    <span className="font-medium text-foreground">{med?.medication_name || 'Unknown medication'}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{med?.dosage || 'N/A'}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{med?.frequency || 0}x/day</span>
                                                </p>
                                            )) || []}
                                            {(prescription.medications?.length || 0) > 2 && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    +{(prescription.medications?.length || 0) - 2} more medications...
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex lg:flex-col gap-2 lg:gap-1 flex-shrink-0">
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 flex-1 lg:flex-none lg:w-24"
                                            onClick={() => handleViewPrescription(prescription)}
                                        >
                                            <Eye className="w-4 h-4"/>
                                            <span className="hidden sm:inline">View</span>
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 flex-1 lg:flex-none lg:w-24"
                                            onClick={() => handleEditPrescription(prescription.prescription_id, {})}
                                        >
                                            <Edit className="w-4 h-4"/>
                                            <span className="hidden sm:inline">Edit</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 flex-1 lg:flex-none lg:w-24 text-red-500 hover:text-red-600"
                                            onClick={() => handleDeletePrescription(prescription.prescription_id)}
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                            <span className="hidden sm:inline">Delete</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
                </div>
                
                {/* Pagination Controls - Exactement comme dans appointments */}
                <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Informations sur les résultats */}
                        <div className="text-sm text-muted-foreground order-2 sm:order-1">
                            Showing {pagination.count === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to{" "}
                            {Math.min(currentPage * pageSize, pagination.count)} of {pagination.count} prescriptions
                        </div>
                        
                        {/* Contrôles de pagination */}
                        <div className="flex items-center gap-2 order-1 sm:order-2">
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
                                {pagination.num_pages > 1 ? (
                                    /* Numéros de pages multiples */
                                    Array.from({ length: Math.min(5, pagination.num_pages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.num_pages <= 5) {
                                            pageNum = i + 1;
                                        } else {
                                            const start = Math.max(1, currentPage - 2);
                                            const end = Math.min(pagination.num_pages, start + 4);
                                            const adjustedStart = Math.max(1, end - 4);
                                            pageNum = adjustedStart + i;
                                        }
                                        
                                        if (pageNum > pagination.num_pages) return null;
                                        
                                        return (
                                            <Button
                                                key={`page-${pageNum}`}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className="w-8 h-8 p-0"
                                                disabled={pagination.count === 0}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    }).filter(Boolean)
                                ) : (
                                    /* Affichage pour une seule page */
                                    <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded text-sm">
                                        <span className="font-medium">Page {currentPage}</span>
                                        <span className="text-muted-foreground">of {Math.max(1, pagination.num_pages)}</span>
                                    </div>
                                )}
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === pagination.num_pages || pagination.count === 0 || pagination.num_pages <= 1}
                                title="Page suivante"
                            >
                                <span className="hidden sm:inline mr-1">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLastPage}
                                disabled={currentPage === pagination.num_pages || pagination.count === 0 || pagination.num_pages <= 1}
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
                </div>
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
                            <AddPrescriptionForm
                                onSubmit={handleAddPrescription}
                                onCancel={() => setIsAddDialogOpen(false)}
                                patients={Array.isArray(patients?.patients) ? patients.patients : []}
                            />
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

            {/* View Prescription Modal */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                {selectedPrescription && (
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Eye className="w-5 h-5 text-primary-500"/>
                                Prescription Details
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Prescription ID</Label>
                                    <p className="font-mono text-sm break-all">{selectedPrescription.prescription_id}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Appointment ID</Label>
                                    <p className="font-mono text-sm break-all">{selectedPrescription.appointment_id}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                                    <p>{format(new Date(selectedPrescription.created_at), "PPpp")}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
                                    <p>{format(new Date(selectedPrescription.updated_at), "PPpp")}</p>
                                </div>
                            </div>

                            {/* General Notes */}
                            {selectedPrescription.general_notes && (
                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">General Notes</Label>
                                    <div className="p-4 bg-muted/20 rounded-lg">
                                        <p>{selectedPrescription.general_notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Medications */}
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">Medications ({selectedPrescription.medications?.length || 0})</Label>
                                <div className="grid gap-4">
                                    {selectedPrescription.medications?.length > 0 ? 
                                        selectedPrescription.medications.map((med, index) => (
                                        <Card key={med?.prescription_medication_id || index} className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Medication</Label>
                                                    <p className="font-semibold">{med.medication_name}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Dosage</Label>
                                                    <p>{med.dosage}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Frequency</Label>
                                                    <p>{med.frequency}x per day</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                                                    <p>{format(new Date(med.start_date), "PP")}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                                                    <p>{med.end_date ? format(new Date(med.end_date), "PP") : "Not specified"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Medication ID</Label>
                                                    <p className="font-mono text-xs break-all">{med.medication}</p>
                                                </div>
                                                {med.instructions && (
                                                    <div className="col-span-full">
                                                        <Label className="text-sm font-medium text-muted-foreground">Instructions</Label>
                                                        <p className="italic">{med.instructions}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    )) : (
                                        <div className="text-center p-4 text-muted-foreground">
                                            No medications found for this prescription
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsViewDialogOpen(false)}
                                className="w-full sm:w-auto"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
