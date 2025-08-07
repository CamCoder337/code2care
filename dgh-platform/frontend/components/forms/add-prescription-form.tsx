"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Textarea} from "@/components/ui/textarea"
import {DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {AlertTriangle, Calendar, Pill, Plus, Trash2, User, Loader2} from "lucide-react"
import {useMedications} from "@/hooks/use-api"

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
    // Hook pour récupérer les médicaments depuis l'API
    const {data: medications, isLoading: medicationsLoading, error: medicationsError} = useMedications()
    
    const [formData, setFormData] = useState({
        appointmentId: "",
        general_notes: "",
        medications: [
            {
                medication_id: "", // Utiliser string vide au lieu de null
                medication_name: "",
                dosage: "",
                frequency: 1,
                start_date: new Date().toISOString().split("T")[0],
                end_date: "",
                instructions: "",
            },
        ],
    })

    // Debug logs
    console.log('🏥 Medications from API:', medications)
    console.log('🏥 Form data:', formData)

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
            medications: [...formData.medications, {
                medication_id: "", // Utiliser string vide au lieu de null
                medication_name: "",
                dosage: "",
                frequency: 1,
                start_date: new Date().toISOString().split("T")[0],
                end_date: "",
                instructions: "",
            }],
        })
    }

    const removeMedication = (index: number) => {
        const newMedications = formData.medications.filter((_, i) => i !== index)
        setFormData({...formData, medications: newMedications})
    }

    const updateMedication = (index: number, field: string, value: string | number) => {
        console.log('🔄 Updating medication:', { index, field, value })
        const newMedications = [...formData.medications]
        newMedications[index] = {...newMedications[index], [field]: value}
        console.log('🔄 Updated medication:', newMedications[index])
        setFormData({...formData, medications: newMedications})
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validation
        if (!formData.appointmentId.trim()) {
            alert("Veuillez entrer un ID d'appointment valide")
            return
        }
        
        const validMedications = formData.medications.filter(med => 
            med.medication_id && med.frequency && med.start_date
        )
        
        if (validMedications.length === 0) {
            alert("Veuillez sélectionner au moins un médicament avec tous les champs requis")
            return
        }
        
        // Adapter au format attendu par l'API
        const newPrescription = {
            appointment_id: formData.appointmentId,
            general_notes: formData.general_notes || "Prescription créée depuis le formulaire",
            medications: validMedications.map((med) => ({
                medication_id: med.medication_id,
                frequency: parseInt(med.frequency.toString()) || 1,
                start_date: med.start_date,
                end_date: med.end_date || null,
                instructions: med.instructions || "",
            })),
        }
        
        console.log('🚀 Submitting prescription:', newPrescription)
        onSubmit(newPrescription)
    }

    // Tous les appointments disponibles
    const availableAppointments = appointments || []

    return (
        <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(event) => {
                // Empêcher le focus automatique sur le premier élément qui pourrait causer des conflits
                event.preventDefault()
            }}
            onPointerDownOutside={(event) => {
                // Empêcher la fermeture accidentelle
                event.preventDefault()
            }}
        >
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <Pill className="w-5 h-5 text-primary-500"/>
                    Create New Prescription
                </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Appointment Selection */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-600">Appointment Information</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="appointmentId">Appointment ID *</Label>
                            <div className="relative">
                                <Calendar
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Input
                                    id="appointmentId"
                                    value={formData.appointmentId}
                                    onChange={(e) => setFormData({...formData, appointmentId: e.target.value})}
                                    placeholder="Paste or enter appointment ID (e.g., b48373ff-1afe-4adf-9c56-11372645cab3)"
                                    required
                                    className="pl-10 h-12 font-mono text-sm"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                💡 Tip: Copy the appointment ID from the Appointments page using the "Copy ID" button
                            </p>
                        </div>
                        
                        {availableAppointments.length > 0 && (
                            <div className="space-y-2">
                                <Label>Or select from recent appointments:</Label>
                                <Select
                                    value=""
                                    onValueChange={(value) => setFormData({...formData, appointmentId: value})}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select from recent appointments (optional)"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableAppointments
                                            .filter(appointment => appointment.appointment_id) // Filtrer les appointments sans ID
                                            .slice(0, 10)
                                            .map((appointment) => (
                                            <SelectItem key={appointment.appointment_id} value={appointment.appointment_id}>
                                                <div className="flex flex-col">
                                                    <span>{appointment.patient_name} - {new Date(appointment.scheduled).toLocaleDateString()}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{appointment.appointment_id}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prescription Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-600">Prescription Details</h3>
                    <div className="space-y-2">
                        <Label htmlFor="general_notes">General Notes</Label>
                        <div className="relative">
                            <AlertTriangle className="absolute left-3 top-3 text-muted-foreground w-4 h-4"/>
                            <Textarea
                                id="general_notes"
                                value={formData.general_notes}
                                onChange={(e) => setFormData({...formData, general_notes: e.target.value})}
                                placeholder="General notes about the prescription (e.g., follow-up needed, special instructions, etc.)"
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
                                        <Select 
                                            value={medication.medication_id}
                                            onValueChange={(value) => {
                                                console.log('💊 Medication selected:', value)
                                                // Trouver le médicament sélectionné par son ID
                                                const selectedMed = medications?.find(med => 
                                                    med.medication_id === value
                                                )
                                                console.log('💊 Found medication:', selectedMed)
                                                if (selectedMed) {
                                                    // Mettre à jour les deux champs en une seule fois pour éviter les conflits
                                                    const newMedications = [...formData.medications]
                                                    newMedications[index] = {
                                                        ...newMedications[index], 
                                                        medication_id: value,
                                                        medication_name: selectedMed.name
                                                    }
                                                    setFormData({...formData, medications: newMedications})
                                                    console.log('💊 Updated medication in one go:', newMedications[index])
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue 
                                                    placeholder={
                                                        medicationsLoading ? "Loading medications..." : 
                                                        medicationsError ? "Error loading medications" :
                                                        "Select medication"
                                                    }
                                                />
                                                {medicationsLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                            </SelectTrigger>
                                            <SelectContent 
                                                position="popper"
                                                className="max-h-[200px] overflow-y-auto"
                                            >
                                                {medications && Array.isArray(medications) && medications
                                                    .filter(med => med.name && med.medication_id) // Filtrer les meds sans nom ou ID
                                                    .map((med) => {
                                                        return (
                                                            <SelectItem key={med.medication_id} value={med.medication_id}>
                                                                {med.name}
                                                            </SelectItem>
                                                        )
                                                    })}
                                                {(!medications || medications.length === 0) && !medicationsLoading && (
                                                    <SelectItem value="no-medications" disabled>
                                                        No medications available
                                                    </SelectItem>
                                                )}
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
                                        <Label>Frequency (times per day) *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={medication.frequency}
                                            onChange={(e) => updateMedication(index, "frequency", parseInt(e.target.value) || 1)}
                                            placeholder="e.g., 2"
                                            className="h-12"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Start Date *</Label>
                                        <Input
                                            type="date"
                                            value={medication.start_date}
                                            onChange={(e) => updateMedication(index, "start_date", e.target.value)}
                                            className="h-12"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={medication.end_date}
                                            onChange={(e) => {
                                                const endDate = e.target.value
                                                const startDate = medication.start_date
                                                
                                                // Vérifier que end_date > start_date
                                                if (endDate && startDate && endDate <= startDate) {
                                                    alert("La date de fin doit être après la date de début")
                                                    return
                                                }
                                                
                                                updateMedication(index, "end_date", endDate)
                                            }}
                                            className="h-12"
                                            min={medication.start_date ? 
                                                new Date(new Date(medication.start_date).getTime() + 24 * 60 * 60 * 1000)
                                                    .toISOString().split('T')[0] : undefined
                                            }
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mt-4">
                                    <Label>Instructions for this medication</Label>
                                    <Textarea
                                        value={medication.instructions}
                                        onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                                        placeholder="Specific instructions for this medication (e.g., take with food, before bed, etc.)"
                                        className="min-h-[60px]"
                                    />
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
