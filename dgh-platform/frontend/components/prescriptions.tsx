"use client"

import {useState} from "react"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {AlertTriangle, Calendar, Edit, FileText, Pill, Plus, Printer, Search, Send, User} from "lucide-react"
import {Dialog, DialogTrigger} from "@/components/ui/dialog"
import {AddPrescriptionForm} from "@/components/forms/add-prescription-form"

export function Prescriptions() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const [prescriptions, setPrescriptions] = useState([
        {
            id: "PRE001",
            patient: {
                name: "John Smith",
                id: "PAT001",
                avatar: "JS",
                age: 40,
            },
            startDate: "2024-01-20",
            endDate: "2024-02-20",
            instructions: "Take with food, twice daily",
            status: "active",
            medications: [
                {
                    id: "MED001",
                    name: "Lisinopril",
                    dosage: "10mg",
                    frequency: "Once daily",
                },
                {
                    id: "MED002",
                    name: "Metformin",
                    dosage: "500mg",
                    frequency: "Twice daily",
                },
            ],
            ordonnance: {
                id: "ORD001",
                date: "2024-01-20",
            },
        },
        {
            id: "PRE002",
            patient: {
                name: "Maria Garcia",
                id: "PAT002",
                avatar: "MG",
                age: 35,
            },
            startDate: "2024-01-19",
            endDate: "2024-01-26",
            instructions: "Complete the full course",
            status: "completed",
            medications: [
                {
                    id: "MED003",
                    name: "Amoxicillin",
                    dosage: "500mg",
                    frequency: "Three times daily",
                },
            ],
            ordonnance: {
                id: "ORD002",
                date: "2024-01-19",
            },
        },
        {
            id: "PRE003",
            patient: {
                name: "David Johnson",
                id: "PAT003",
                avatar: "DJ",
                age: 46,
            },
            startDate: "2024-01-18",
            endDate: "2024-03-18",
            instructions: "Monitor blood pressure regularly",
            status: "active",
            medications: [
                {
                    id: "MED004",
                    name: "Amlodipine",
                    dosage: "5mg",
                    frequency: "Once daily",
                },
                {
                    id: "MED005",
                    name: "Atorvastatin",
                    dosage: "20mg",
                    frequency: "Once daily at bedtime",
                },
            ],
            ordonnance: {
                id: "ORD003",
                date: "2024-01-18",
            },
        },
    ])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    const mockPatients = [
        {id: "PAT001", name: "John Smith"},
        {id: "PAT002", name: "Maria Garcia"},
        {id: "PAT003", name: "David Johnson"},
        {id: "PAT004", name: "Sarah Wilson"},
    ]

    const mockAppointments = [
        {id: "APT001", patient: {id: "PAT001"}, scheduledDate: "2024-01-22", type: "Consultation"},
        {id: "APT002", patient: {id: "PAT002"}, scheduledDate: "2024-01-21", type: "Follow-up"},
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500 hover:bg-green-600"
            case "completed":
                return "bg-blue-500 hover:bg-blue-600"
            case "expired":
                return "bg-red-500 hover:bg-red-600"
            default:
                return "bg-gray-500 hover:bg-gray-600"
        }
    }

    const filteredPrescriptions = prescriptions.filter((prescription) => {
        const matchesSearch =
            prescription.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.medications.some((med) => med.name.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === "all" || prescription.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const handleAddPrescription = (newPrescription: any) => {
        setPrescriptions([...prescriptions, newPrescription])
        setIsAddDialogOpen(false)
    }

    return (
        <div className="container-adaptive animate-fade-in">
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
                {/* Header avec système adaptatif */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center spacing-adaptive">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-adaptive-title font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            Prescription Management
                        </h1>
                        <p className="text-adaptive-body text-muted-foreground mt-2">
                            Manage patient prescriptions and medications
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="btn-adaptive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 spacing-adaptive-sm">
                                <Plus className="icon-adaptive-sm"/>
                                <span className="truncate">New Prescription</span>
                            </Button>
                        </DialogTrigger>
                        <AddPrescriptionForm
                            onSubmit={handleAddPrescription}
                            onCancel={() => setIsAddDialogOpen(false)}
                            patients={mockPatients}
                            appointments={mockAppointments}
                        />
                    </Dialog>
                </div>

                {/* Filtres avec système adaptatif */}
                <Card className="glass-effect border-0 shadow-lg floating-card">
                    <CardContent className="padding-adaptive">
                        <div className="flex flex-col md:flex-row spacing-adaptive">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-adaptive-sm"/>
                                <Input
                                    placeholder="Search prescriptions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-adaptive pl-10 bg-background/50 border-0 focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="btn-adaptive bg-transparent w-full md:w-48">
                                    <SelectValue placeholder="Filter by status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Liste des prescriptions avec système adaptatif */}
                <div className="space-y-4 md:space-y-6">
                    {filteredPrescriptions.map((prescription, index) => (
                        <Card
                            key={prescription.id}
                            className="card-hover glass-effect border-0 shadow-lg animate-slide-up"
                            style={{animationDelay: `${index * 0.1}s`}}
                        >
                            {/* En-tête patient avec système adaptatif */}
                            <CardHeader className="padding-adaptive-sm">
                                <div
                                    className="flex flex-col xl:flex-row xl:items-center xl:justify-between spacing-adaptive">
                                    <div className="flex-adaptive items-center min-w-0 flex-1">
                                        <Avatar
                                            className="avatar-adaptive ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                                            <AvatarImage src={`/placeholder.svg?height=64&width=64`}/>
                                            <AvatarFallback
                                                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-adaptive-body font-bold">
                                                {prescription.patient.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-2 min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center spacing-adaptive-sm">
                                                <h3 className="text-adaptive-subtitle font-semibold truncate">{prescription.patient.name}</h3>
                                                <Badge variant="outline" className="badge-adaptive flex-shrink-0">
                                                    {prescription.patient.id}
                                                </Badge>
                                                <Badge
                                                    className={`${getStatusColor(prescription.status)} badge-adaptive`}>
                                                    {prescription.status}
                                                </Badge>
                                            </div>
                                            <div
                                                className="flex flex-col lg:flex-row lg:items-center spacing-adaptive-sm text-adaptive-small text-muted-foreground">
                                                <div className="flex items-center spacing-adaptive-sm">
                                                    <User className="icon-adaptive-sm flex-shrink-0"/>
                                                    <span
                                                        className="truncate">{prescription.patient.age} years old</span>
                                                </div>
                                                <div className="flex items-center spacing-adaptive-sm">
                                                    <Calendar className="icon-adaptive-sm flex-shrink-0"/>
                                                    <span className="truncate">
                            {prescription.startDate} - {prescription.endDate}
                          </span>
                                                </div>
                                                <div className="flex items-center spacing-adaptive-sm">
                                                    <FileText className="icon-adaptive-sm flex-shrink-0"/>
                                                    <span className="truncate">{prescription.ordonnance.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Boutons d'action avec système adaptatif */}
                                    <div className="button-group-adaptive">
                                        <Button variant="outline"
                                                className="btn-adaptive-sm spacing-adaptive-sm bg-transparent">
                                            <Edit className="icon-adaptive-sm"/>
                                            <span className="hidden lg:inline truncate">Edit</span>
                                        </Button>
                                        <Button variant="outline"
                                                className="btn-adaptive-sm spacing-adaptive-sm bg-transparent">
                                            <Printer className="icon-adaptive-sm"/>
                                            <span className="hidden lg:inline truncate">Print</span>
                                        </Button>
                                        <Button variant="outline"
                                                className="btn-adaptive-sm spacing-adaptive-sm bg-transparent">
                                            <Send className="icon-adaptive-sm"/>
                                            <span className="hidden lg:inline truncate">Send</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 md:space-y-6">
                                {/* Instructions avec système adaptatif */}
                                <div className="padding-adaptive bg-background/50 rounded-lg">
                                    <div className="flex items-center spacing-adaptive-sm mb-2">
                                        <AlertTriangle className="icon-adaptive-sm text-orange-500 flex-shrink-0"/>
                                        <span className="text-adaptive-body font-medium">Instructions</span>
                                    </div>
                                    <p className="text-adaptive-small text-muted-foreground leading-relaxed">
                                        {prescription.instructions}
                                    </p>
                                </div>

                                {/* Médicaments avec système adaptatif */}
                                <div className="space-y-3 md:space-y-4">
                                    <h4 className="text-adaptive-body font-medium flex-adaptive items-center">
                                        <Pill className="icon-adaptive-sm text-primary-500 flex-shrink-0"/>
                                        <span>Medications ({prescription.medications.length})</span>
                                    </h4>
                                    <div className="space-y-3 md:space-y-4">
                                        {prescription.medications.map((medication, medIndex) => (
                                            <div
                                                key={medication.id}
                                                className="flex flex-col lg:flex-row lg:items-center lg:justify-between spacing-adaptive padding-adaptive bg-background/30 rounded-lg hover:bg-background/50 transition-colors animate-fade-in"
                                                style={{animationDelay: `${index * 0.1 + medIndex * 0.05}s`}}
                                            >
                                                <div className="flex-adaptive items-center min-w-0 flex-1">
                                                    <div
                                                        className="btn-adaptive-icon bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Pill className="icon-adaptive text-white"/>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="text-adaptive-body font-medium truncate">{medication.name}</h5>
                                                        <div
                                                            className="flex flex-col lg:flex-row lg:items-center spacing-adaptive-sm text-adaptive-small text-muted-foreground">
                                                            <span
                                                                className="truncate">Dosage: {medication.dosage}</span>
                                                            <span className="hidden lg:inline">•</span>
                                                            <span
                                                                className="truncate">Frequency: {medication.frequency}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline"
                                                       className="badge-adaptive flex-shrink-0 self-start lg:self-center">
                                                    {medication.id}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
