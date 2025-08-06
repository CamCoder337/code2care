"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Textarea} from "@/components/ui/textarea"
import {DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {AlertTriangle, Calendar, Pill, Plus, Trash2, User} from "lucide-react"

interface AddPrescriptionFormProps {
    onSubmit: (prescription: any) => void
    onCancel: () => void
    patients?: any[]
    appointments?: any[]
}

export function AddPrescriptionForm({
                                        onSubmit,
                                        onCancel,
                                        patients = [],
                                        appointments = [],
                                    }: AddPrescriptionFormProps) {
    const [formData, setFormData] = useState({
        patientId: "",
        appointmentId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        instructions: "",
        medications: [
            {
                name: "",
                dosage: "",
                frequency: "",
            },
        ],
    })

    const commonMedications = [
        "Lisinopril",
        "Metformin",
        "Amlodipine",
        "Atorvastatin",
        "Omeprazole",
        "Levothyroxine",
        "Albuterol",
        "Metoprolol",
        "Losartan",
        "Gabapentin",
        "Hydrochlorothiazide",
        "Sertraline",
        "Ibuprofen",
        "Prednisone",
        "Tramadol",
    ]

    const frequencies = [
        "Once daily",
        "Twice daily",
        "Three times daily",
        "Four times daily",
        "Every 4 hours",
        "Every 6 hours",
        "Every 8 hours",
        "Every 12 hours",
        "As needed",
        "Before meals",
        "After meals",
        "At bedtime",
    ]

    const addMedication = () => {
        setFormData({
            ...formData,
            medications: [...formData.medications, {name: "", dosage: "", frequency: ""}],
        })
    }

    const removeMedication = (index: number) => {
        const newMedications = formData.medications.filter((_, i) => i !== index)
        setFormData({...formData, medications: newMedications})
    }

    const updateMedication = (index: number, field: string, value: string) => {
        const newMedications = [...formData.medications]
        newMedications[index] = {...newMedications[index], [field]: value}
        setFormData({...formData, medications: newMedications})
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const selectedPatient = patients.find((p) => p.id === formData.patientId)

        const newPrescription = {
            id: `PRE${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
            patient: selectedPatient || {
                name: "Unknown Patient",
                id: formData.patientId,
                avatar: "UP",
                age: 0,
            },
            medications: formData.medications.map((med, index) => ({
                id: `MED${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
                ...med,
            })),
            ordonnance: {
                id: `ORD${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
                date: formData.startDate,
            },
            status: "active",
            ...formData,
        }
        onSubmit(newPrescription)
    }

    // Filter appointments for selected patient
    const patientAppointments = appointments.filter((apt) => apt.patient.id === formData.patientId)

    return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <Pill className="w-5 h-5 text-primary-500"/>
                    Create New Prescription
                </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-600">Patient Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patientId">Select Patient *</Label>
                            <div className="relative">
                                <User
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Select
                                    value={formData.patientId}
                                    onValueChange={(value) => setFormData({
                                        ...formData,
                                        patientId: value,
                                        appointmentId: ""
                                    })}
                                >
                                    <SelectTrigger className="pl-10 h-12">
                                        <SelectValue placeholder="Choose a patient"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((patient) => (
                                            <SelectItem key={patient.id} value={patient.id}>
                                                {patient.name} ({patient.id})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appointmentId">Related Appointment</Label>
                            <Select
                                value={formData.appointmentId}
                                onValueChange={(value) => setFormData({...formData, appointmentId: value})}
                                disabled={!formData.patientId}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select appointment (optional)"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {patientAppointments.map((appointment) => (
                                        <SelectItem key={appointment.id} value={appointment.id}>
                                            {appointment.scheduledDate} - {appointment.type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Prescription Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-600">Prescription Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <div className="relative">
                                <Calendar
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    required
                                    className="pl-10 h-12"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <div className="relative">
                                <Calendar
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    className="pl-10 h-12"
                                    min={formData.startDate}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructions">General Instructions</Label>
                        <div className="relative">
                            <AlertTriangle className="absolute left-3 top-3 text-muted-foreground w-4 h-4"/>
                            <Textarea
                                id="instructions"
                                value={formData.instructions}
                                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                                placeholder="General instructions for the patient (e.g., take with food, avoid alcohol, etc.)"
                                className="pl-10 min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Medications */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-accent-600">Medications</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addMedication}
                                className="gap-2 bg-transparent">
                            <Plus className="w-4 h-4"/>
                            Add Medication
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {formData.medications.map((medication, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-4 bg-background/50">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Medication {index + 1}</h4>
                                    {formData.medications.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeMedication(index)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Medication Name *</Label>
                                        <Select value={medication.name}
                                                onValueChange={(value) => updateMedication(index, "name", value)}>
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select medication"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {commonMedications.map((med) => (
                                                    <SelectItem key={med} value={med}>
                                                        {med}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Dosage *</Label>
                                        <Input
                                            value={medication.dosage}
                                            onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                                            placeholder="e.g., 10mg, 500mg"
                                            className="h-12"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Frequency *</Label>
                                        <Select
                                            value={medication.frequency}
                                            onValueChange={(value) => updateMedication(index, "frequency", value)}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select frequency"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {frequencies.map((freq) => (
                                                    <SelectItem key={freq} value={freq}>
                                                        {freq}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}
                            className="w-full sm:w-auto bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Create Prescription
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
