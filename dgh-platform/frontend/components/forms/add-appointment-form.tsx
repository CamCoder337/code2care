"use client"

import type React from "react"
import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Calendar, Clock, Stethoscope, User, Loader2} from "lucide-react"
import {usePatients} from "@/hooks/use-api"
import {useAuthStore} from "@/stores/auth-store"

interface AddAppointmentFormProps {
    onSubmit: (appointment: any) => void
    onCancel: () => void
}

interface Patient {
    patient_id: string
    first_name: string
    last_name: string
    user: {
        id: string
        phone_number: string
    }
}

export function AddAppointmentForm({onSubmit, onCancel}: AddAppointmentFormProps) {
    const {user} = useAuthStore()
    const [formData, setFormData] = useState({
        patientId: "",
        scheduledDate: "",
        scheduledTime: "",
        type: "",
    })

    // Fetch patients using the API hook
    const {data: patientsResponse, isLoading: loadingPatients, error: patientsError} = usePatients()
    const patients = patientsResponse?.patients || []

    const appointmentTypes = [
        { value: "consultation", label: "Consultation" },
        { value: "suivi", label: "Suivi" },
        { value: "examen", label: "Examen" },
    ]

    const timeSlots = [
        "08:00",
        "08:30", 
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Combine date and time into ISO format
        const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}:00Z`
        
        // Create appointment data in the required format
        const appointmentData = {
            scheduled: scheduledDateTime,
            type: formData.type,
            patient_id: formData.patientId,
            professional_id: user?.professional_id || user?.id // Use professional ID from current user
        }

        console.log('📝 Creating appointment with data:', appointmentData)
        onSubmit(appointmentData)
    }

    const isFormValid = formData.patientId && formData.scheduledDate && formData.scheduledTime && formData.type

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="w-5 h-5 text-primary-500"/>
                    Schedule New Appointment
                </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-600">Patient Information</h3>
                    <div className="space-y-2">
                        <Label htmlFor="patientId">Select Patient *</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                            {loadingPatients ? (
                                <div className="flex items-center justify-center h-12 border rounded-md">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="ml-2 text-sm text-muted-foreground">Loading patients...</span>
                                </div>
                            ) : patientsError ? (
                                <div className="flex items-center justify-center h-12 border rounded-md bg-red-50">
                                    <span className="text-sm text-red-600">Error loading patients</span>
                                </div>
                            ) : (
                                <Select
                                    value={formData.patientId}
                                    onValueChange={(value) => setFormData({...formData, patientId: value})}
                                >
                                    <SelectTrigger className="pl-10 h-12">
                                        <SelectValue placeholder="Choose a patient"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((patient: Patient) => (
                                            <SelectItem key={patient.patient_id} value={patient.patient_id}>
                                                {patient.first_name} {patient.last_name} ({patient.patient_id.substring(0, 8)}...)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-600">Appointment Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledDate">Date *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Input
                                    id="scheduledDate"
                                    type="date"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                                    required
                                    className="pl-10 h-12"
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scheduledTime">Time *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Select
                                    value={formData.scheduledTime}
                                    onValueChange={(value) => setFormData({...formData, scheduledTime: value})}
                                >
                                    <SelectTrigger className="pl-10 h-12">
                                        <SelectValue placeholder="Select time"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Appointment Type *</Label>
                        <div className="relative">
                            <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                            <Select 
                                value={formData.type}
                                onValueChange={(value) => setFormData({...formData, type: value})}
                            >
                                <SelectTrigger className="pl-10 h-12">
                                    <SelectValue placeholder="Select type"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {appointmentTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}
                            className="w-full sm:w-auto bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!isFormValid}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Schedule Appointment
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}