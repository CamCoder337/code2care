/**
 * Hook personnalisé pour utiliser l'API de manière simple et cohérente
 * Fournit des états de chargement, d'erreur et de données
 */

import { useState, useEffect, useCallback } from 'react'
import { apiService } from '@/lib/api'
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
    }, [user?.accessToken])

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
    const [appointments, setAppointments] = useState<any[]>([])
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
            const data = await apiService.getAppointments(accessToken, params)
            console.log('✅ API Response:', data)
            setAppointments(data || [])
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
    const { user } = useAuthStore()
    const [prescriptions, setPrescriptions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPrescriptions = useCallback(async () => {
        if (!user?.accessToken) {
            setError('Authentication token not found')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const data = await apiService.getPrescriptions(user.accessToken, params)
            setPrescriptions(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions')
        } finally {
            setIsLoading(false)
        }
    }, [user?.accessToken, params])

    useEffect(() => {
        fetchPrescriptions()
    }, [fetchPrescriptions])

    const createPrescription = useCallback(async (prescriptionData: any) => {
        if (!user?.accessToken) {
            throw new Error('Authentication token not found')
        }

        const newPrescription = await apiService.createPrescription(prescriptionData, user.accessToken)
        setPrescriptions(prev => [newPrescription, ...prev])
        return newPrescription
    }, [user?.accessToken])

    const updatePrescription = useCallback(async (prescriptionId: string, prescriptionData: any) => {
        if (!user?.accessToken) {
            throw new Error('Authentication token not found')
        }

        const updatedPrescription = await apiService.updatePrescription(prescriptionId, prescriptionData, user.accessToken)
        setPrescriptions(prev => prev.map(pres => pres.prescription_id === prescriptionId ? updatedPrescription : pres))
        return updatedPrescription
    }, [user?.accessToken])

    const deletePrescription = useCallback(async (prescriptionId: string) => {
        if (!user?.accessToken) {
            throw new Error('Authentication token not found')
        }

        await apiService.deletePrescription(prescriptionId, user.accessToken)
        setPrescriptions(prev => prev.filter(pres => pres.prescription_id !== prescriptionId))
    }, [user?.accessToken])

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
    return useApiGet<any[]>('/auth/patients/')
}

// Medications
export function useMedications() {
    return useApiGet<any[]>('/medications/')
}

// Departments
export function useDepartments() {
    return useApiGet<any[]>('/departments/')
}