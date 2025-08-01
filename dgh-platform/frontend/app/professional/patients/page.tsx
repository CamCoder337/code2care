"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Plus, Phone, Mail, MessageSquare, MoreHorizontal, User, Globe } from "lucide-react"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { AddPatientForm } from "@/components/forms/add-patient-form"

export default function Patients() {
    const [searchTerm, setSearchTerm] = useState("")

    const [patients, setPatients] = useState([
        {
            id: "PAT001",
            name: "John Smith",
            age: 40,
            phone: "+1234567890",
            email: "john.smith@email.com",
            language: "English",
            avatar: "JS",
            lastVisit: "2024-01-20",
            status: "active",
        },
        {
            id: "PAT002",
            name: "Maria Garcia",
            age: 35,
            phone: "+1234567891",
            email: "maria.garcia@email.com",
            language: "Français",
            avatar: "MG",
            lastVisit: "2024-01-19",
            status: "active",
        },
        {
            id: "PAT003",
            name: "David Johnson",
            age: 46,
            phone: "+1234567892",
            email: "david.johnson@email.com",
            language: "English",
            avatar: "DJ",
            lastVisit: "2024-01-18",
            status: "active",
        },
        {
            id: "PAT004",
            name: "Sarah Wilson",
            age: 29,
            phone: "+1234567893",
            email: "sarah.wilson@email.com",
            language: "Duala",
            avatar: "SW",
            lastVisit: "2024-01-17",
            status: "active",
        },
    ])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    const filteredPatients = patients.filter(
        (patient) =>
            patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.id.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const handleAddPatient = (newPatient: any) => {
        setPatients([...patients, newPatient])
        setIsAddDialogOpen(false)
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
                                Manage patient records
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
                                        placeholder="Search patients..."
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
                    <div className="space-y-3 sm:space-y-4">
                        {filteredPatients.map((patient, index) => (
                            <Card
                                key={patient.id}
                                className="card-hover glass-effect border-0 shadow-lg animate-scale-in w-full"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <CardContent className="p-3 sm:p-4 lg:p-6">
                                    <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                                <AvatarImage src={`/placeholder.svg?height=64&width=64`} />
                                                <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-lg font-bold">
                                                    {patient.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-2 min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold truncate">{patient.name}</h3>
                                                    <Badge variant="outline" className="text-xs flex-shrink-0 px-1 sm:px-2">
                                                        {patient.id}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <User className="icon-responsive-sm flex-shrink-0" />
                                                        <span className="truncate">{patient.age} years</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="icon-responsive-sm flex-shrink-0" />
                                                        <span className="truncate">{patient.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="icon-responsive-sm flex-shrink-0" />
                                                        <span className="truncate">{patient.email}</span>
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
                                                        className={`text-xs px-1 sm:px-2 ${
                                                            patient.language === "English"
                                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                                                : patient.language === "Français"
                                                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                                                    : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                                        }`}
                                                    >
                                                        {patient.language}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs sm:text-sm text-muted-foreground">Last: {patient.lastVisit}</p>
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
                </div>
            </div>
        </div>
    )
}
