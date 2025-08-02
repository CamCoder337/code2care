"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Search,
    Filter,
    Plus,
    Phone,
    Mail,
    MessageSquare,
    MoreHorizontal,
    User,
    Globe,
    Loader2,
    AlertTriangle,
} from "lucide-react"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { AddPatientForm } from "@/components/forms/add-patient-form"
import { useAuth } from "@/contexts/auth-context"

// 1. Define a TypeScript interface that matches the API's patient structure
interface Patient {
    patient_id: string
    first_name: string
    last_name: string
    date_of_birth: string
    gender: string
    preferred_language: string
    preferred_contact_method: string
    user: {
        id: string
        username: string // This field is used as the email
        phone_number: string
        user_type: string
        is_verified: boolean
        created_at: string
    }
    age: number
}

export default function Patients() {
    const { professional } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [patients, setPatients] = useState<Patient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    // 2. Fetch data from the API when the component mounts
    useEffect(() => {
        const fetchPatients = async () => {
            if (!professional?.access_token) {
                setError("Authentication token not found.")
                setIsLoading(false)
                return
            }

            try {
                const response = await fetch("https://high5-gateway.onrender.com/api/v1/auth/patients/", {
                    headers: {
                        Authorization: `Bearer ${professional.access_token}`,
                    },
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch patients: ${response.statusText}`)
                }

                const data = await response.json()
                setPatients(data.patients || []) // The API returns data in a `patients` array
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.")
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPatients()
    }, [professional?.access_token])

    // 3. Adapt the search filter to the new data structure
    const filteredPatients = patients.filter(
        (patient) =>
            `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.user.phone_number.includes(searchTerm),
    )

    const handleAddPatient = (newPatient: any) => {
        // TODO: This should be an API call to POST the new patient data
        // For now, we just add it to the local state for demonstration
        const optimisticPatient: Patient = {
            ...newPatient,
            patient_id: `PAT${Math.random().toString(36).substring(2, 9)}`,
            user: {
                ...newPatient.user,
                id: `USR${Math.random().toString(36).substring(2, 9)}`,
            },
        }
        setPatients([optimisticPatient, ...patients])
        setIsAddDialogOpen(false)
    }

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
                    <p className="mt-2 text-red-600 dark:text-red-400 font-semibold">Failed to load patients</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            )
        }

        if (filteredPatients.length === 0) {
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
            <div className="space-y-3 sm:space-y-4">
                {filteredPatients.map((patient, index) => (
                    <Card
                        key={patient.patient_id}
                        className="card-hover glass-effect border-0 shadow-lg animate-scale-in w-full"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                        <AvatarImage src={`/placeholder.svg?height=64&width=64`} />
                                        <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-lg font-bold">
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
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="icon-responsive-sm flex-shrink-0" />
                                                <span className="truncate">{patient.age} years</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Phone className="icon-responsive-sm flex-shrink-0" />
                                                <span className="truncate">{patient.user.phone_number}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Mail className="icon-responsive-sm flex-shrink-0" />
                                                <span className="truncate">{patient.user.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="text-left sm:text-right space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Globe className="icon-responsive-sm text-muted-foreground flex-shrink-0" />
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
                                            <MessageSquare className="icon-responsive-sm" />
                                            <span className="hidden sm:inline truncate">SMS</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none"
                                        >
                                            <Phone className="icon-responsive-sm" />
                                            <span className="hidden sm:inline truncate">Call</span>
                                        </Button>
                                        <Button variant="outline" className="btn-responsive-icon-sm bg-transparent">
                                            <MoreHorizontal className="icon-responsive-sm" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
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
                                Patient Management
                            </h1>
                            <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base xl:text-lg">
                                View and manage patient records
                            </p>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 w-full sm:w-auto">
                                    <Plus className="icon-responsive-sm" />
                                    <span className="truncate">Add Patient</span>
                                </Button>
                            </DialogTrigger>
                            <AddPatientForm onSubmit={handleAddPatient} onCancel={() => setIsAddDialogOpen(false)} />
                        </Dialog>
                    </div>

                    {/* Search and Filters */}
                    <Card className="glass-effect border-0 shadow-lg w-full">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-responsive-sm" />
                                    <Input
                                        placeholder="Search by name, ID, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 sm:pl-10 btn-responsive bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 w-full"
                                    />
                                </div>
                                <Button variant="outline" className="btn-responsive-sm gap-1 sm:gap-2 bg-transparent w-full sm:w-auto">
                                    <Filter className="icon-responsive-sm" />
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