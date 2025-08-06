"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Textarea} from "@/components/ui/textarea"
import {DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Calendar, Clock, FileText, Stethoscope, User} from "lucide-react"

interface AddAppointmentFormProps {
    onSubmit: (appointment: any) => void
    onCancel: () => void
    patients?: any[]
}

export function AddAppointmentForm({onSubmit, onCancel, patients = []}: AddAppointmentFormProps) {
    const [formData, setFormData] = useState({
        patientId: "",
        scheduledDate: "",
        scheduledTime: "",
        type: "",
        duration: "30",
        professionalId: "PROF001", // Default to current doctor
        department: "Cardiology",
        notes: "",
        status: "scheduled",
    })

    const appointmentTypes = [
        "Consultation",
        "Follow-up",
        "Routine Check",
        "Emergency",
        "Vaccination",
        "Lab Results Review",
        "Procedure",
        "Surgery Consultation",
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
        const selectedPatient = patients.find((p) => p.id === formData.patientId)

        const newAppointment = {
            id: `APT${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
            patient: selectedPatient || {
                name: "Unknown Patient",
                id: formData.patientId,
                phone: "+0000000000",
                avatar: "UP",
            },
            professional: {
                name: "Dr. Sarah Johnson",
                department: formData.department,
            },
            ...formData,
        }
        onSubmit(newAppointment)
    }

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
                            <User
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                            <Select
                                value={formData.patientId}
                                onValueChange={(value) => setFormData({...formData, patientId: value})}
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
                </div>

                {/* Appointment Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-600">Appointment Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledDate">Date *</Label>
                            <div className="relative">
                                <Calendar
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
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
                                <Clock
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Appointment Type *</Label>
                            <div className="relative">
                                <Stethoscope
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Select value={formData.type}
                                        onValueChange={(value) => setFormData({...formData, type: value})}>
                                    <SelectTrigger className="pl-10 h-12">
                                        <SelectValue placeholder="Select type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {appointmentTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Select
                                value={formData.duration}
                                onValueChange={(value) => setFormData({...formData, duration: value})}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select duration"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="90">1.5 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-accent-600">Additional Information</h3>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-muted-foreground w-4 h-4"/>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="Additional notes about the appointment..."
                                className="pl-10 min-h-[100px]"
                            />
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
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Schedule Appointment
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
