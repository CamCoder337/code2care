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
        LIST: '/auth/patients/',
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
        LIST: '/medications/',
        DETAIL: (medicationId: string) => `/medications/${medicationId}/`,
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