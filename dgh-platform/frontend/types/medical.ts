export interface Patient {
    patient_id: string
    first_name: string
    last_name: string
    phone_number: string
    preferred_language: "en" | "fr" | "duala" | "bassa" | "ewondo"
    preferred_contact_method: "sms" | "call" | "email"
    gender: "male" | "female" | "other"
    date_of_birth: string
    email?: string
    address?: string
}

// types/medical.ts
export interface Professional {
    professional_id: string
    first_name: string
    last_name: string
    date_of_birth: string
    gender: "male" | "female" | "other"
    specialization: string
    department_id: string
    email: string
    phone: string
    username?: string // Ajout optionnel
    access_token?: string // Pour le JWT
    refresh_token?: string // Pour le refresh token
}

export interface Appointment {
    appointment_id: string
    patient_id: string
    professional_id: string
    scheduled_date: string
    scheduled_time: string
    status: "scheduled" | "completed" | "cancelled" | "no_show"
    type: "consultation" | "follow_up" | "emergency" | "routine_check"
    notes?: string
    duration: number // in minutes
}

export interface Medication {
    medication_id: string
    name: string
    dosage: string
    frequency: number
    unit: "mg" | "ml" | "tablets" | "capsules"
    instructions: string
}

export interface Prescription {
    prescription_id: string
    ordonnance_id: string
    medication_id: string
    start_date: string
    end_date: string
    instructions: string
    dosage: string
    frequency: string
}

export interface Ordonnance {
    ordonnance_id: string
    appointment_id: string
    patient_id: string
    professional_id: string
    date: string
    prescriptions: Prescription[]
    notes?: string
}

export interface Department {
    department_id: string
    name: string
    description: string
}

export interface Feedback {
    feedback_id: string
    patient_id: string
    appointment_id: string
    created_at: string
    input_type: "text" | "voice" | "rating"
    rating: number
    content: string
    status: "pending" | "reviewed" | "resolved"
    language: string
}
