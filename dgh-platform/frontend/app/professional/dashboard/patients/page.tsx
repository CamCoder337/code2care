"use client"

import {useEffect, useState} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious} from "@/components/ui/pagination"
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

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
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div
                                className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                                <div
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    <Avatar
                                        className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                        <AvatarImage src={`/placeholder.svg?height=64&width=64`}/>
                                        <AvatarFallback
                                            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-lg font-bold">
                                            {`${patient.first_name[0] || ""}${patient.last_name[0] || ""}`}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2 min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <h3 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                                {`${patient.first_name} ${patient.last_name}`}
                                            </h3>
                                            <Badge variant="outline" className="text-xs flex-shrink-0 px-1 sm:px-2">
                                                {patient.patient_id.substring(0, 12)}...
                                            </Badge>
                                        </div>
                                        <div
                                            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="icon-responsive-sm flex-shrink-0"/>
                                                <span className="truncate">{patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'} years</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Phone className="icon-responsive-sm flex-shrink-0"/>
                                                <span className="truncate">{patient.user.phone_number}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Mail className="icon-responsive-sm flex-shrink-0"/>
                                                <span className="truncate">{patient.user.email || 'No email'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="text-left sm:text-right space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Globe className="icon-responsive-sm text-muted-foreground flex-shrink-0"/>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs px-1 sm:px-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                            >
                                                {patient.preferred_language.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Joined: {new Date(patient.user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="button-group-responsive">
                                        <Button
                                            variant="outline"
                                            className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none"
                                        >
                                            <MessageSquare className="icon-responsive-sm"/>
                                            <span className="hidden sm:inline truncate">SMS</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none"
                                        >
                                            <Phone className="icon-responsive-sm"/>
                                            <span className="hidden sm:inline truncate">Call</span>
                                        </Button>
                                        <Button variant="outline" className="btn-responsive-icon-sm bg-transparent">
                                            <MoreHorizontal className="icon-responsive-sm"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </div>
                
                {/* Pagination */}
                {pagination.num_pages > 1 && (
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.count)} of {pagination.count} patients
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        onClick={() => pagination.has_previous && handlePageChange(currentPage - 1)}
                                        className={!pagination.has_previous ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                
                                {Array.from({ length: Math.min(5, pagination.num_pages) }, (_, i) => {
                                    let pageNumber;
                                    if (pagination.num_pages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage >= pagination.num_pages - 2) {
                                        pageNumber = pagination.num_pages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <PaginationItem key={pageNumber}>
                                            <PaginationLink
                                                onClick={() => handlePageChange(pageNumber)}
                                                isActive={currentPage === pageNumber}
                                                className="cursor-pointer"
                                            >
                                                {pageNumber}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                                
                                {pagination.num_pages > 5 && currentPage < pagination.num_pages - 2 && (
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}
                                
                                <PaginationItem>
                                    <PaginationNext 
                                        onClick={() => pagination.has_next && handlePageChange(currentPage + 1)}
                                        className={!pagination.has_next ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
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