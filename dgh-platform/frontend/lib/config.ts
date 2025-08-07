/**
 * Configuration centralisée pour l'application HIGH5
 * URLs API et constantes globales
 */

// URL de base de l'API - UNE SEULE SOURCE DE VÉRITÉ
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://high5-gateway.onrender.com/api/v1' 
    : 'http://localhost:8000/api/v1'

// Configuration des endpoints
export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login/',
        LOGOUT: '/auth/logout/',
        REFRESH: '/auth/token/refresh/',
        REGISTER_PATIENT: '/auth/register/patient/',
        REGISTER_PROFESSIONAL: '/auth/register/professional/',
    },
    // Patients
    PATIENTS: {
        LIST: '/auth/patients/', // Endpoint: GET /api/v1/auth/patients/ (pour création appointments)
        LIST_ALL: '/patients/', // Endpoint: GET /api/v1/patients/ (liste complète avec pagination)
        PROFILE: (patientId: string) => `/patient/${patientId}/profile/`,
    },
    // Appointments
    APPOINTMENTS: {
        LIST: '/appointments/',
        DETAIL: (appointmentId: string) => `/appointments/${appointmentId}/`,
        UPCOMING: '/appointments/upcoming/',
        TODAY: '/appointments/today/',
    },
    // Prescriptions
    PRESCRIPTIONS: {
        LIST: '/prescriptions/',
        DETAIL: (prescriptionId: string) => `/prescriptions/${prescriptionId}/`,
    },
    // Medications
    MEDICATIONS: {
        LIST: '/medications',
        DETAIL: (medicationId: string) => `/medications/${medicationId}`,
    },
    // Departments
    DEPARTMENTS: {
        LIST: '/departments/',
    },
    // Feedback
    FEEDBACK: {
        CREATE: '/patient/feedback/',
        LIST: '/patient/feedbacks/',
        STATUS: (feedbackId: string) => `/patient/feedback/${feedbackId}/status/`,
        TEST: '/patient/feedback/test/',
    },
} as const

// Types pour les réponses API
export interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

// Interface pour les appointments avec les nouvelles données
export interface Appointment {
    appointment_id: string
    scheduled: string // Format ISO: "2025-08-06T16:30:00+01:00"
    type: string
    type_display: string
    patient_id: string
    professional_id: string
    created_at: string
    updated_at: string
    patient_name: string // Enrichi par le backend
    status?: "scheduled" | "completed" | "cancelled"
    notes?: string
    duration?: number
}

// Interface pour les patients
export interface Patient {
    patient_id: string
    first_name: string
    last_name: string
    date_of_birth: string | null
    gender: 'M' | 'F' | 'O'
    preferred_language: string
    preferred_contact_method: 'email' | 'sms' | 'call'
    user: {
        id: string
        phone_number: string
        email: string
        is_verified: boolean
        created_at: string
    }
}

// Interface pour une prescription selon le schéma API réel
export interface Prescription {
    prescription_id: string
    medications: {
        prescription_medication_id: string
        medication_name: string
        dosage: string
        frequency: number
        start_date: string
        end_date: string
        instructions: string
        prescription: string
        medication: string
    }[]
    general_notes: string
    appointment_id: string
    created_at: string
    updated_at: string
}

// Interface pour la réponse paginée des patients
export interface PatientsPaginatedResponse {
    count: number
    num_pages: number
    current_page: number
    page_size: number
    has_next: boolean
    has_previous: boolean
    next_page: number | null
    previous_page: number | null
    results: Patient[]
}

// Interface pour la réponse paginée des prescriptions
export interface PrescriptionsPaginatedResponse {
    count: number
    next: string | null
    previous: string | null
    results: Prescription[]
}