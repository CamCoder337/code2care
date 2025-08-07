"use client"

import {useEffect, useState} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    AlertTriangle,
    Filter,
    Globe,
    Loader2,
    Mail,
    MessageSquare,
    MoreHorizontal,
    Phone,
    Plus,
    Search,
    User,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react"
import {Dialog, DialogTrigger} from "@/components/ui/dialog"
import {AddPatientForm} from "@/components/forms/add-patient-form"
import {type ProfessionalUser, useAuthStore} from "@/stores/auth-store"
import {usePatientsWithPagination} from "@/hooks/use-api"
import {useMemo} from "react"

export default function Patients() {
    const {user} = useAuthStore()
    const professional = user as ProfessionalUser
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Construction des paramètres de filtre pour l'API
    const params = useMemo(() => {
        const urlParams = new URLSearchParams()
        
        // Pagination
        urlParams.set("page", currentPage.toString())
        urlParams.set("page_size", pageSize.toString())
        
        // Search
        if (searchTerm.trim()) {
            urlParams.set("search", searchTerm.trim())
        }
        
        return urlParams
    }, [currentPage, pageSize, searchTerm])

    // Utiliser le hook comme dans appointments
    const {
        patients,
        pagination,
        isLoading,
        error,
        refetch
    } = usePatientsWithPagination(params)

    const handleAddPatient = (newPatient: any) => {
        // TODO: This should be an API call to POST the new patient data
        // For now, refresh the patient list
        refetch()
        setIsAddDialogOpen(false)
    }

    // Gestionnaires de pagination (comme dans appointments)
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handleFirstPage = () => setCurrentPage(1)
    const handleLastPage = () => setCurrentPage(pagination.num_pages)
    const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1))
    const handleNextPage = () => setCurrentPage(Math.min(pagination.num_pages, currentPage + 1))

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
                    <p className="mt-2 text-red-600 dark:text-red-400 font-semibold">Failed to load patients</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            )
        }

        if (!patients || patients.length === 0) {
            return (
                <div className="text-center p-10 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
                    <p className="font-semibold">No patients found</p>
                    <p className="text-sm text-muted-foreground">
                        {searchTerm ? "Try adjusting your search." : "Add a new patient to get started."}
                    </p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                <div className="space-y-3 sm:space-y-4">
                    {patients.map((patient, index) => (
                    <Card
                        key={patient.patient_id}
                        className="card-hover glass-effect border-0 shadow-lg animate-scale-in w-full"
                        style={{animationDelay: `${index * 0.1}s`}}
                    >
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                                {/* Patient Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <Avatar className="w-16 h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                        <AvatarImage src={`/placeholder.svg?height=64&width=64`}/>
                                        <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-lg font-bold">
                                            {`${patient.first_name[0] || ""}${patient.last_name[0] || ""}`}
                                        </AvatarFallback>
                                    </Avatar>
                                    
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-xl font-semibold truncate">
                                                {`${patient.first_name} ${patient.last_name}`}
                                            </h3>
                                            <Badge variant="outline" className="text-xs flex-shrink-0">
                                                ID: {patient.patient_id.substring(0, 8)}...
                                            </Badge>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="w-4 h-4 flex-shrink-0"/>
                                                <span>{patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'} ans</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-4 h-4 flex-shrink-0"/>
                                                <span>{patient.user.phone_number}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-4 h-4 flex-shrink-0"/>
                                                <span className="truncate">{patient.user.email || 'No email'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata & Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-shrink-0">
                                    {/* Patient Metadata */}
                                    <div className="text-center sm:text-right space-y-2">
                                        <div className="flex items-center justify-center sm:justify-end gap-2">
                                            <Globe className="w-4 h-4 text-muted-foreground"/>
                                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                {patient.preferred_language.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Joined: {new Date(patient.user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="gap-1 flex-1 sm:flex-none">
                                            <MessageSquare className="w-4 h-4"/>
                                            <span className="hidden sm:inline">SMS</span>
                                        </Button>
                                        <Button variant="outline" size="sm" className="gap-1 flex-1 sm:flex-none">
                                            <Phone className="w-4 h-4"/>
                                            <span className="hidden sm:inline">Call</span>
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MoreHorizontal className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </div>
                
                {/* Pagination Controls - Exactement comme dans appointments */}
                <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Informations sur les résultats */}
                        <div className="text-sm text-muted-foreground order-2 sm:order-1">
                            Showing {pagination.count === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to{" "}
                            {Math.min(currentPage * pageSize, pagination.count)} of {pagination.count} patients
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
                                                key={`patient-page-${pageNum}`}
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
                    <div
                        className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                Patient Management
                            </h1>
                            <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base xl:text-lg">
                                View and manage patient records
                            </p>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 w-full sm:w-auto">
                                    <Plus className="icon-responsive-sm"/>
                                    <span className="truncate">Add Patient</span>
                                </Button>
                            </DialogTrigger>
                            <AddPatientForm onSubmit={handleAddPatient} onCancel={() => setIsAddDialogOpen(false)}/>
                        </Dialog>
                    </div>

                    {/* Search and Filters */}
                    <Card className="glass-effect border-0 shadow-lg w-full">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-responsive-sm"/>
                                    <Input
                                        placeholder="Search by name, ID, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 sm:pl-10 btn-responsive bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 w-full"
                                    />
                                </div>
                                <Button variant="outline"
                                        className="btn-responsive-sm gap-1 sm:gap-2 bg-transparent w-full sm:w-auto">
                                    <Filter className="icon-responsive-sm"/>
                                    <span className="truncate">Filters</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patients List */}
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}