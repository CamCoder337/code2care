/**
 * Hook personnalisé pour utiliser l'API de manière simple et cohérente
 * Fournit des états de chargement, d'erreur et de données
 */

import { useState, useEffect, useCallback } from 'react'
import { apiService, type PaginatedResponse, type Appointment, type Patient, type PatientsPaginatedResponse, type Prescription, type PrescriptionsPaginatedResponse } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

interface UseApiState<T> {
    data: T | null
    isLoading: boolean
    error: string | null
}

interface UseApiOptions {
    immediate?: boolean // Exécuter immédiatement ou attendre un appel manuel
    dependencies?: any[] // Dépendances pour refetch automatiquement
}

/**
 * Hook pour les requêtes GET simples
 */
export function useApiGet<T>(
    endpoint: string,
    options: UseApiOptions = { immediate: true }
): UseApiState<T> & { refetch: () => Promise<void> } {
    const { user } = useAuthStore()
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        isLoading: options.immediate ?? true,
        error: null,
    })

    const fetchData = useCallback(async () => {
        if (!user?.accessToken) {
            setState(prev => ({
                ...prev,
                error: 'Authentication token not found',
                isLoading: false,
            }))
            return
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            const data = await apiService.get<T>(endpoint, user.accessToken)
            setState({ data, isLoading: false, error: null })
        } catch (error) {
            setState({
                data: null,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            })
        }
    }, [endpoint, user?.accessToken])

    useEffect(() => {
        if (options.immediate && user?.accessToken) {
            fetchData()
        }
    }, [fetchData, options.immediate, ...(options.dependencies || [])])

    return {
        ...state,
        refetch: fetchData,
    }
}

/**
 * Hook pour les mutations (POST, PUT, DELETE)
 */
export function useApiMutation<T, TVariables = any>() {
    const { user } = useAuthStore()
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        isLoading: false,
        error: null,
    })

    const mutate = useCallback(async (
        method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        endpoint: string,
        variables?: TVariables
    ) => {
        if (!user?.accessToken) {
            setState(prev => ({
                ...prev,
                error: 'Authentication token not found',
            }))
            return null
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            let data: T
            switch (method) {
                case 'POST':
                    data = await apiService.post<T>(endpoint, variables, user.accessToken)
                    break
                case 'PUT':
                    data = await apiService.put<T>(endpoint, variables, user.accessToken)
                    break
                case 'PATCH':
                    data = await apiService.patch<T>(endpoint, variables, user.accessToken)
                    break
                case 'DELETE':
                    data = await apiService.delete<T>(endpoint, user.accessToken)
                    break
                default:
                    throw new Error('Unsupported method')
            }

            setState({ data, isLoading: false, error: null })
            return data
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            setState({
                data: null,
                isLoading: false,
                error: errorMessage,
            })
            throw error
        }
    }, [hasHydrated, accessToken])

    return {
        ...state,
        mutate,
        post: (endpoint: string, variables?: TVariables) => mutate('POST', endpoint, variables),
        put: (endpoint: string, variables?: TVariables) => mutate('PUT', endpoint, variables),
        patch: (endpoint: string, variables?: TVariables) => mutate('PATCH', endpoint, variables),
        delete: (endpoint: string) => mutate('DELETE', endpoint),
    }
}

/**
 * Hooks spécialisés pour les entités communes
 */

// Appointments
export function useAppointments(params?: URLSearchParams) {
    const { user, hasHydrated, accessToken } = useAuthStore()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [paginationData, setPaginationData] = useState<{
        count: number;
        next: string | null;
        previous: string | null;
        currentPage: number;
        totalPages: number;
    }>({ count: 0, next: null, previous: null, currentPage: 1, totalPages: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAppointments = useCallback(async () => {
        console.log('🔍 useAppointments - fetchAppointments called')
        console.log('👤 User:', user)
        console.log('🔑 AccessToken (from store root):', accessToken)
        console.log('🔄 HasHydrated:', hasHydrated)
        console.log('📋 Params:', params?.toString())

        // Attendre que la rehydratation soit terminée
        if (!hasHydrated) {
            console.log('⏳ Waiting for rehydration to complete...')
            setIsLoading(true)
            return
        }

        if (!accessToken) {
            console.log('❌ No access token found after rehydration')
            setError('Authentication token not found')
            setIsLoading(false)
            return
        }

        console.log('🚀 Starting API call...')
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiService.getAppointments(accessToken, params)
            console.log('✅ API Response:', response)
            
            if (response && response.results) {
                setAppointments(response.results)
                
                // Calculer les informations de pagination
                const pageSize = parseInt(params?.get('page_size') || '20')
                const currentPage = parseInt(params?.get('page') || '1')
                const totalPages = Math.ceil(response.count / pageSize)
                
                setPaginationData({
                    count: response.count,
                    next: response.next,
                    previous: response.previous,
                    currentPage,
                    totalPages
                })
            } else {
                // Fallback pour les anciennes réponses sans pagination
                const appointmentList = Array.isArray(response) ? response : []
                setAppointments(appointmentList)
                setPaginationData({
                    count: appointmentList.length,
                    next: null,
                    previous: null,
                    currentPage: 1,
                    totalPages: 1
                })
            }
        } catch (err) {
            console.error('💥 API Error:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, params?.toString(), hasHydrated])

    useEffect(() => {
        fetchAppointments()
    }, [fetchAppointments])

    const createAppointment = useCallback(async (appointmentData: any) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        const newAppointment = await apiService.createAppointment(appointmentData, accessToken)
        setAppointments(prev => [newAppointment, ...prev])
        return newAppointment
    }, [hasHydrated, accessToken])

    const updateAppointment = useCallback(async (appointmentId: string, appointmentData: any) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        const updatedAppointment = await apiService.updateAppointment(appointmentId, appointmentData, accessToken)
        setAppointments(prev => prev.map(app => app.appointment_id === appointmentId ? updatedAppointment : app))
        return updatedAppointment
    }, [hasHydrated, accessToken])

    const deleteAppointment = useCallback(async (appointmentId: string) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        await apiService.deleteAppointment(appointmentId, accessToken)
        setAppointments(prev => prev.filter(app => app.appointment_id !== appointmentId))
    }, [hasHydrated, accessToken])

    return {
        appointments,
        pagination: paginationData,
        isLoading,
        error,
        refetch: fetchAppointments,
        createAppointment,
        updateAppointment,
        deleteAppointment,
    }
}

// Prescriptions
export function usePrescriptions(params?: URLSearchParams) {
    const { user, hasHydrated, accessToken } = useAuthStore()
    const [prescriptions, setPrescriptions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPrescriptions = useCallback(async () => {
        if (!hasHydrated) {
            return
        }
        
        if (!accessToken) {
            setError('Authentication token not found')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const data = await apiService.getPrescriptions(accessToken, params)
            setPrescriptions(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions')
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, params, hasHydrated])

    useEffect(() => {
        fetchPrescriptions()
    }, [fetchPrescriptions])

    const createPrescription = useCallback(async (prescriptionData: any) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        const newPrescription = await apiService.createPrescription(prescriptionData, accessToken)
        setPrescriptions(prev => [newPrescription, ...prev])
        return newPrescription
    }, [hasHydrated, accessToken])

    const updatePrescription = useCallback(async (prescriptionId: string, prescriptionData: any) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        const updatedPrescription = await apiService.updatePrescription(prescriptionId, prescriptionData, accessToken)
        setPrescriptions(prev => prev.map(pres => pres.prescription_id === prescriptionId ? updatedPrescription : pres))
        return updatedPrescription
    }, [hasHydrated, accessToken])

    const deletePrescription = useCallback(async (prescriptionId: string) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        await apiService.deletePrescription(prescriptionId, accessToken)
        setPrescriptions(prev => prev.filter(pres => pres.prescription_id !== prescriptionId))
    }, [hasHydrated, accessToken])

    return {
        prescriptions,
        isLoading,
        error,
        refetch: fetchPrescriptions,
        createPrescription,
        updatePrescription,
        deletePrescription,
    }
}

// Patients
export function usePatients() {
    const { user, hasHydrated, accessToken } = useAuthStore()
    const [patients, setPatients] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPatients = useCallback(async () => {
        if (!hasHydrated) {
            return
        }
        
        if (!accessToken) {
            setError('Authentication token not found')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            console.log('🔍 Fetching patients...')
            const data = await apiService.getPatients(accessToken)
            console.log('✅ Patients data received:', data)
            setPatients(data?.patients || data || [])
        } catch (err) {
            console.error('❌ Error fetching patients:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch patients')
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, hasHydrated])

    useEffect(() => {
        if (hasHydrated) {
            fetchPatients()
        }
    }, [fetchPatients])

    return {
        data: { patients },
        isLoading,
        error,
        refetch: fetchPatients,
    }
}

// Medications
export function useMedications() {
    const { user, hasHydrated, accessToken } = useAuthStore()
    const [medications, setMedications] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMedications = useCallback(async () => {
        // Attendre que la rehydratation soit terminée
        if (!hasHydrated) {
            setIsLoading(true)
            return
        }

        if (!accessToken) {
            setError('Authentication token not found')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const data = await apiService.getMedications(accessToken)
            setMedications(data || [])
        } catch (err) {
            console.error('❌ Error fetching medications:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch medications')
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, hasHydrated])

    useEffect(() => {
        fetchMedications()
    }, [fetchMedications])

    return {
        data: medications,
        isLoading,
        error,
        refetch: fetchMedications,
    }
}

// Departments
export function useDepartments() {
    return useApiGet<any[]>('/departments/')
}

// Patients avec pagination (pour la page patients)
export function usePatientsWithPagination(params?: URLSearchParams) {
    const { user, hasHydrated, accessToken } = useAuthStore()
    const [patients, setPatients] = useState<Patient[]>([])
    const [paginationData, setPaginationData] = useState<{
        count: number;
        num_pages: number;
        current_page: number;
        page_size: number;
        has_next: boolean;
        has_previous: boolean;
        next_page: number | null;
        previous_page: number | null;
    }>({ 
        count: 0, 
        num_pages: 0, 
        current_page: 1, 
        page_size: 20, 
        has_next: false, 
        has_previous: false, 
        next_page: null, 
        previous_page: null 
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPatients = useCallback(async () => {
        console.log('🔍 usePatients - fetchPatients called')
        console.log('👤 User:', user)
        console.log('🔑 AccessToken:', accessToken ? 'Present' : 'Missing')
        console.log('🔄 HasHydrated:', hasHydrated)
        console.log('📋 Params:', params?.toString())

        // Attendre que la rehydratation soit terminée
        if (!hasHydrated) {
            console.log('⏳ Waiting for rehydration to complete...')
            setIsLoading(true)
            return
        }

        if (!accessToken) {
            console.log('❌ No access token found after rehydration')
            setError('Authentication token not found')
            setIsLoading(false)
            return
        }

        console.log('🚀 Starting API call...')
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiService.getPatientsWithPagination(accessToken, params)
            console.log('✅ API Response:', response)
            
            setPatients(response.results || [])
            setPaginationData({
                count: response.count,
                num_pages: response.num_pages,
                current_page: response.current_page,
                page_size: response.page_size,
                has_next: response.has_next,
                has_previous: response.has_previous,
                next_page: response.next_page,
                previous_page: response.previous_page
            })
        } catch (err) {
            console.error('💥 API Error:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch patients')
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, params?.toString(), hasHydrated])

    useEffect(() => {
        fetchPatients()
    }, [fetchPatients])

    return {
        patients,
        pagination: paginationData,
        isLoading,
        error,
        refetch: fetchPatients,
    }
}

// Prescriptions avec pagination (pour la page prescriptions)
export function usePrescriptionsWithPagination(params?: URLSearchParams) {
    const { user, hasHydrated, accessToken } = useAuthStore()
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [paginationData, setPaginationData] = useState<{
        count: number;
        num_pages: number;
        current_page: number;
        page_size: number;
        has_next: boolean;
        has_previous: boolean;
        next_page: number | null;
        previous_page: number | null;
    }>({ 
        count: 0, 
        num_pages: 0, 
        current_page: 1, 
        page_size: 20, 
        has_next: false, 
        has_previous: false, 
        next_page: null, 
        previous_page: null 
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPrescriptions = useCallback(async () => {
        console.log('🔍 usePrescriptions - fetchPrescriptions called')
        console.log('👤 User:', user)
        console.log('🔑 AccessToken:', accessToken ? 'Present' : 'Missing')
        console.log('🔄 HasHydrated:', hasHydrated)
        console.log('📋 Params:', params?.toString())

        // Attendre que la rehydratation soit terminée
        if (!hasHydrated) {
            console.log('⏳ Waiting for rehydration to complete...')
            setIsLoading(true)
            return
        }

        if (!accessToken) {
            console.log('❌ No access token found after rehydration')
            setError('Authentication token not found')
            setIsLoading(false)
            return
        }

        console.log('🚀 Starting API call...')
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiService.getPrescriptionsWithPagination(accessToken, params)
            console.log('✅ API Response:', response)
            
            setPrescriptions(response.results || [])
            
            // Calculer les informations de pagination basées sur next/previous
            const pageSize = parseInt(params?.get('page_size') || '20')
            const currentPage = parseInt(params?.get('page') || '1')
            const totalPages = Math.ceil(response.count / pageSize)
            
            setPaginationData({
                count: response.count,
                num_pages: totalPages,
                current_page: currentPage,
                page_size: pageSize,
                has_next: !!response.next,
                has_previous: !!response.previous,
                next_page: response.next ? currentPage + 1 : null,
                previous_page: response.previous ? currentPage - 1 : null
            })
        } catch (err) {
            console.error('💥 API Error:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions')
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, params?.toString(), hasHydrated])

    useEffect(() => {
        fetchPrescriptions()
    }, [fetchPrescriptions])

    const createPrescription = useCallback(async (prescriptionData: any) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        const newPrescription = await apiService.createPrescription(prescriptionData, accessToken)
        setPrescriptions(prev => [newPrescription, ...prev])
        return newPrescription
    }, [hasHydrated, accessToken])

    const updatePrescription = useCallback(async (prescriptionId: string, prescriptionData: any) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        const updatedPrescription = await apiService.updatePrescription(prescriptionId, prescriptionData, accessToken)
        setPrescriptions(prev => prev.map(pres => pres.prescription_id === prescriptionId ? updatedPrescription : pres))
        return updatedPrescription
    }, [hasHydrated, accessToken])

    const deletePrescription = useCallback(async (prescriptionId: string) => {
        if (!hasHydrated || !accessToken) {
            throw new Error('Authentication token not found')
        }

        await apiService.deletePrescription(prescriptionId, accessToken)
        setPrescriptions(prev => prev.filter(pres => pres.prescription_id !== prescriptionId))
    }, [hasHydrated, accessToken])

    return {
        prescriptions,
        pagination: paginationData,
        isLoading,
        error,
        refetch: fetchPrescriptions,
        createPrescription,
        updatePrescription,
        deletePrescription,
    }
}