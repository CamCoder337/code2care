/**
 * Service API centralisé pour l'application HIGH5
 * Gère toutes les requêtes vers l'API Gateway
 */

import { API_BASE_URL, API_ENDPOINTS, type ApiResponse, type PaginatedResponse, type Appointment, type Patient, type PatientsPaginatedResponse, type Prescription, type PrescriptionsPaginatedResponse } from './config'

// Export des types pour usage externe
export type { ApiResponse, PaginatedResponse, Appointment, Patient, PatientsPaginatedResponse, Prescription, PrescriptionsPaginatedResponse }

// Classe principale pour les requêtes API
export class ApiService {
    private static instance: ApiService
    private baseUrl: string

    private constructor() {
        this.baseUrl = API_BASE_URL
    }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService()
        }
        return ApiService.instance
    }

    // Méthode pour obtenir les headers par défaut
    private getDefaultHeaders(token?: string): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return headers
    }

    // Méthode générique pour les requêtes
    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        token?: string
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const config: RequestInit = {
            ...options,
            headers: {
                ...this.getDefaultHeaders(token),
                ...options.headers,
            },
        }

        console.log('🌍 Making API Request:')
        console.log('  URL:', url)
        console.log('  Method:', config.method || 'GET')
        console.log('  Headers:', config.headers)

        try {
            const response = await fetch(url, config)
            console.log('📡 Response status:', response.status, response.statusText)
            
            if (!response.ok) {
                const errorText = await response.text()
                console.log('❌ Error response body:', errorText)
                throw new Error(`API Error: ${response.status} ${response.statusText}`)
            }

            const contentType = response.headers.get('content-type')
            console.log('📄 Content-Type:', contentType)
            
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await response.json()
                console.log('✅ JSON Response:', jsonData)
                return jsonData
            }
            
            const textData = response.text() as unknown as T
            console.log('📝 Text Response:', textData)
            return textData
        } catch (error) {
            console.error('💥 API Request failed:', error)
            throw error
        }
    }

    // Méthodes HTTP de base
    async get<T>(endpoint: string, token?: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' }, token)
    }

    async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
            token
        )
    }

    async put<T>(endpoint: string, data: any, token?: string): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            },
            token
        )
    }

    async patch<T>(endpoint: string, data: any, token?: string): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            },
            token
        )
    }

    async delete<T>(endpoint: string, token?: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' }, token)
    }

    // Méthodes spécialisées pour les différentes entités
    
    // Authentication
    async login(credentials: { username: string; password: string }) {
        return this.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    }

    async logout(refreshToken: string) {
        return this.post(API_ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken })
    }

    async refreshToken(refreshToken: string) {
        return this.post(API_ENDPOINTS.AUTH.REFRESH, { refresh: refreshToken })
    }

    // Patients
    async getPatients(token: string) {
        console.log('🔗 API Service - getPatients called')
        console.log('📍 Endpoint:', API_ENDPOINTS.PATIENTS.LIST)
        console.log('🌐 Full URL:', `${this.baseUrl}${API_ENDPOINTS.PATIENTS.LIST}`)
        return this.get(API_ENDPOINTS.PATIENTS.LIST, token)
    }

    async getPatientsWithPagination(token: string, params?: URLSearchParams): Promise<PatientsPaginatedResponse> {
        // Ajouter la pagination par défaut si pas spécifiée
        const searchParams = new URLSearchParams(params)
        if (!searchParams.has('page')) {
            searchParams.set('page', '1')
        }
        if (!searchParams.has('page_size')) {
            searchParams.set('page_size', '20')
        }
        
        const endpoint = `${API_ENDPOINTS.PATIENTS.LIST_ALL}?${searchParams.toString()}`
        
        console.log('🔗 API Service - getPatientsWithPagination called')
        console.log('📍 Endpoint:', endpoint)
        console.log('🌐 Full URL:', `${this.baseUrl}${endpoint}`)
        
        return this.get<PatientsPaginatedResponse>(endpoint, token)
    }

    async getPatientProfile(patientId: string, token?: string) {
        return this.get(API_ENDPOINTS.PATIENTS.PROFILE(patientId), token)
    }

    // Appointments
    async getAppointments(token: string, params?: URLSearchParams): Promise<PaginatedResponse<Appointment>> {
        // Ajouter la pagination par défaut si pas spécifiée
        const searchParams = new URLSearchParams(params)
        if (!searchParams.has('page')) {
            searchParams.set('page', '1')
        }
        if (!searchParams.has('page_size')) {
            searchParams.set('page_size', '20')
        }
        
        const endpoint = `${API_ENDPOINTS.APPOINTMENTS.LIST}?${searchParams.toString()}`
        
        console.log('🔗 API Service - getAppointments called')
        console.log('📍 Endpoint:', endpoint)
        console.log('🔑 Token:', token ? 'Present' : 'Missing')
        console.log('🌐 Full URL:', `${this.baseUrl}${endpoint}`)
        
        return this.get<PaginatedResponse<Appointment>>(endpoint, token)
    }

    async getAppointment(appointmentId: string, token: string) {
        return this.get(API_ENDPOINTS.APPOINTMENTS.DETAIL(appointmentId), token)
    }

    async createAppointment(appointmentData: any, token: string) {
        return this.post(API_ENDPOINTS.APPOINTMENTS.LIST, appointmentData, token)
    }

    async updateAppointment(appointmentId: string, appointmentData: any, token: string) {
        return this.patch(API_ENDPOINTS.APPOINTMENTS.DETAIL(appointmentId), appointmentData, token)
    }

    async deleteAppointment(appointmentId: string, token: string) {
        return this.delete(API_ENDPOINTS.APPOINTMENTS.DETAIL(appointmentId), token)
    }

    async getUpcomingAppointments(token: string) {
        return this.get(API_ENDPOINTS.APPOINTMENTS.UPCOMING, token)
    }

    async getTodayAppointments(token: string) {
        return this.get(API_ENDPOINTS.APPOINTMENTS.TODAY, token)
    }

    // Prescriptions
    async getPrescriptions(token: string, params?: URLSearchParams) {
        const endpoint = params 
            ? `${API_ENDPOINTS.PRESCRIPTIONS.LIST}?${params.toString()}`
            : API_ENDPOINTS.PRESCRIPTIONS.LIST
        return this.get(endpoint, token)
    }

    async getPrescriptionsWithPagination(token: string, params?: URLSearchParams): Promise<PrescriptionsPaginatedResponse> {
        // Ajouter la pagination par défaut si pas spécifiée
        const searchParams = new URLSearchParams(params)
        if (!searchParams.has('page')) {
            searchParams.set('page', '1')
        }
        if (!searchParams.has('page_size')) {
            searchParams.set('page_size', '20')
        }
        
        const endpoint = `${API_ENDPOINTS.PRESCRIPTIONS.LIST}?${searchParams.toString()}`
        
        console.log('🔗 API Service - getPrescriptionsWithPagination called')
        console.log('📍 Endpoint:', endpoint)
        console.log('🌐 Full URL:', `${this.baseUrl}${endpoint}`)
        
        return this.get<PrescriptionsPaginatedResponse>(endpoint, token)
    }

    async getPrescription(prescriptionId: string, token: string) {
        return this.get(API_ENDPOINTS.PRESCRIPTIONS.DETAIL(prescriptionId), token)
    }

    async createPrescription(prescriptionData: any, token: string) {
        return this.post(API_ENDPOINTS.PRESCRIPTIONS.LIST, prescriptionData, token)
    }

    async updatePrescription(prescriptionId: string, prescriptionData: any, token: string) {
        return this.patch(API_ENDPOINTS.PRESCRIPTIONS.DETAIL(prescriptionId), prescriptionData, token)
    }

    async deletePrescription(prescriptionId: string, token: string) {
        return this.delete(API_ENDPOINTS.PRESCRIPTIONS.DETAIL(prescriptionId), token)
    }

    // Medications
    async getMedications(token: string) {
        console.log('🔗 API Service - getMedications called')
        console.log('📍 Endpoint:', API_ENDPOINTS.MEDICATIONS.LIST)
        console.log('🌐 Full URL:', `${this.baseUrl}${API_ENDPOINTS.MEDICATIONS.LIST}`)
        console.log('🔑 Token:', token ? 'Present' : 'Missing')
        return this.get(API_ENDPOINTS.MEDICATIONS.LIST, token)
    }

    async getMedication(medicationId: string, token: string) {
        return this.get(API_ENDPOINTS.MEDICATIONS.DETAIL(medicationId), token)
    }

    // Departments
    async getDepartments(token?: string) {
        return this.get(API_ENDPOINTS.DEPARTMENTS.LIST, token)
    }

    // Feedback
    async createFeedback(feedbackData: any, token: string) {
        return this.post(API_ENDPOINTS.FEEDBACK.CREATE, feedbackData, token)
    }

    async getFeedbacks(token: string) {
        return this.get(API_ENDPOINTS.FEEDBACK.LIST, token)
    }

    async getFeedbackStatus(feedbackId: string, token: string) {
        return this.get(API_ENDPOINTS.FEEDBACK.STATUS(feedbackId), token)
    }
}

// Export de l'instance singleton
export const apiService = ApiService.getInstance()

// Export des constantes d'URL pour usage direct si nécessaire
export { API_BASE_URL, API_ENDPOINTS }