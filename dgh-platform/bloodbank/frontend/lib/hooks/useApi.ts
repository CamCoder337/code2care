// lib/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { apiService, handleApiError, DashboardOverview, Alert, BloodUnit, Donor, Patient, BloodRequest, Site, ForecastResult, SystemConfig, ImportResult, ValidationResult } from '../api'
import { toast } from 'sonner'
import React from 'react'


// ======================
// QUERY KEYS
// ======================
export const queryKeys = {
  dashboard: {
    overview: ['dashboard', 'overview'] as const,
    alerts: ['dashboard', 'alerts'] as const,
  },
  inventory: {
    units: (params?: any) => ['inventory', 'units', params] as const,
    analytics: (period?: number) => ['inventory', 'analytics', period] as const,
  },
  donors: {
    list: (params?: any) => ['donors', 'list', params] as const,
    detail: (id: string) => ['donors', 'detail', id] as const,
  },
  patients: {
    list: (params?: any) => ['patients', 'list', params] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
  },
  requests: {
    list: (params?: any) => ['requests', 'list', params] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
  },
  sites: {
    list: (params?: any) => ['sites', 'list', params] as const,
    detail: (id: string) => ['sites', 'detail', id] as const,
  },
  forecasting: {
    demand: (params?: any) => ['forecasting', 'demand', params] as const,
    recommendations: ['forecasting', 'recommendations'] as const,
  },
  config: {
    system: ['config', 'system'] as const,
    compatibility: ['config', 'compatibility'] as const,
  },
  dataImport: {
    history: (params?: any) => ['data-import', 'history', params] as const,
    validation: (fileId: string) => ['data-import', 'validation', fileId] as const,
  },
  health: ['health'] as const,
}

// ======================
// DASHBOARD HOOKS
// ======================

export const useDashboardOverview = (options?: UseQueryOptions<DashboardOverview>) => {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: () => apiService.getDashboardOverview(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Data is fresh for 10 seconds
    ...options,
  })
}

export const useAlerts = (options?: UseQueryOptions<{ alerts: Alert[]; count: number; last_updated: string }>) => {
  return useQuery({
    queryKey: queryKeys.dashboard.alerts,
    queryFn: () => apiService.getAlerts(),
    refetchInterval: 10000, // Refresh every 10 seconds for critical alerts
    staleTime: 5000,
    ...options,
  })
}

// Fixed function name to match the expected import
export const useAcknowledgeAllAlerts = (
  options?: UseMutationOptions<any, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiService.acknowledgeAllAlerts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.alerts })
      toast.success('Toutes les alertes ont été marquées comme vues')
    },
    onError: (error) => {
      toast.error(`Erreur: ${handleApiError(error)}`)
    },
    ...options,
  })
}

export const useResolveAlert = (
  options?: UseMutationOptions<any, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => apiService.resolveAlert(alertId),
    onSuccess: (_, alertId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.alerts })
      toast.success(`Alerte ${alertId} résolue`)
    },
    onError: (error) => {
      toast.error(`Erreur: ${handleApiError(error)}`)
    },
    ...options,
  })
}

// ======================
// INVENTORY HOOKS
// ======================

export const useBloodUnits = (
  params?: {
    blood_type?: string
    status?: string
    expiring_days?: number
    page?: number
    page_size?: number
  },
  options?: UseQueryOptions<{
    results: BloodUnit[]
    count: number
    next: string | null
    previous: string | null
  }>
) => {
  return useQuery({
    queryKey: queryKeys.inventory.units(params),
    queryFn: () => apiService.getBloodUnits(params),
    keepPreviousData: true,
    staleTime: 30000,
    ...options,
  })
}

export const useInventoryAnalytics = (
  period: number = 30,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.inventory.analytics(period),
    queryFn: () => apiService.getInventoryAnalytics(period),
    staleTime: 60000, // Analytics data is fresh for 1 minute
    ...options,
  })
}

// ======================
// DONORS HOOKS
// ======================

export const useDonors = (
  params?: {
    search?: string
    blood_type?: string
    page?: number
    page_size?: number
  },
  options?: UseQueryOptions<{
    results: Donor[]
    count: number
    next: string | null
    previous: string | null
  }>
) => {
  return useQuery({
    queryKey: queryKeys.donors.list(params),
    queryFn: () => apiService.getDonors(params),
    keepPreviousData: true,
    staleTime: 60000,
    ...options,
  })
}

export const useCreateDonor = (
  options?: UseMutationOptions<Donor, Error, Omit<Donor, 'age'>>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (donor: Omit<Donor, 'age'>) => apiService.createDonor(donor),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview })
      toast.success(`Donneur ${data.first_name} ${data.last_name} créé avec succès`)
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${handleApiError(error)}`)
    },
    ...options,
  })
}

export const useUpdateDonor = (
  options?: UseMutationOptions<Donor, Error, { donorId: string; donor: Partial<Donor> }>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ donorId, donor }) => apiService.updateDonor(donorId, donor),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
      queryClient.setQueryData(queryKeys.donors.detail(data.donor_id), data)
      toast.success(`Donneur ${data.first_name} ${data.last_name} mis à jour`)
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${handleApiError(error)}`)
    },
    ...options,
  })
}

export const useDeleteDonor = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (donorId: string) => apiService.deleteDonor(donorId),
    onSuccess: (_, donorId) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
      queryClient.removeQueries({ queryKey: queryKeys.donors.detail(donorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview })
      toast.success('Donneur supprimé avec succès')
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${handleApiError(error)}`)
    },
    ...options,
  })
}

// ======================
// PATIENTS HOOKS
// ======================

// ✅ Hook usePatients avec gestion d'erreur robuste
export const usePatients = (
  params?: {
    search?: string
    blood_type?: string
    page?: number
    page_size?: number
  },
  options?: any
) => {
  return useQuery({
    queryKey: ['patients', 'list', params],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching patients with params:', params)
        const data = await apiService.getPatients(params)
        console.log('✅ Patients loaded successfully:', data)
        return data
      } catch (error: any) {
        console.error('❌ Failed to load patients:', error)

        // ✅ En cas d'erreur réseau, retourner des données de fallback
        if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          console.warn('🔄 Using fallback patients data due to network error')

          const getFallbackPatientsData = () => {
            return {
              results: [
                {
                  patient_id: "P001",
                  first_name: "Jean",
                  last_name: "Dupont",
                  date_of_birth: "1980-05-15",
                  gender: "M" as const,
                  blood_type: "O+",
                  patient_history: "Historique médical standard",
                  age: 44
                }
              ],
              count: 1,
              next: null,
              previous: null
            }
          }

          // Appliquer les filtres localement si possible
          let filteredResults = fallbackData.results

          if (params?.search) {
            const searchTerm = params.search.toLowerCase()
            filteredResults = filteredResults.filter(patient =>
              patient.first_name.toLowerCase().includes(searchTerm) ||
              patient.last_name.toLowerCase().includes(searchTerm) ||
              patient.patient_id.toLowerCase().includes(searchTerm) ||
              patient.blood_type.toLowerCase().includes(searchTerm)
            )
          }

          if (params?.blood_type) {
            filteredResults = filteredResults.filter(patient =>
              patient.blood_type === params.blood_type
            )
          }

          return {
            ...fallbackData,
            results: filteredResults,
            count: filteredResults.length,
            fallback: true // Indicateur de données de fallback
          }
        }

        // Pour les autres erreurs, les laisser remonter
        throw error
      }
    },
    keepPreviousData: true,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
      // Ne pas retry si c'est une erreur 4xx (client)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return false
      }
      // Retry jusqu'à 3 fois pour les erreurs réseau et 5xx
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => {
      // Délai progressif: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    onError: (error: any) => {
      // Ne pas afficher de toast pour les erreurs réseau (on utilise le fallback)
      if (error.response || (!error.code?.includes('ECONNABORTED') && !error.code?.includes('ERR_NETWORK'))) {
        console.error('❌ Patients query error:', handleApiError(error))
      }
    },
    // ✅ Données de placeholder pour éviter les erreurs undefined
    placeholderData: {
      results: [],
      count: 0,
      next: null,
      previous: null
    },
    ...options,
  })
}

// ✅ Hook useCreatePatient amélioré
export const useCreatePatient = (options?: any) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patient: any) => {
      try {
        console.log('🔄 Creating patient:', patient)
        const data = await apiService.createPatient(patient)
        console.log('✅ Patient created successfully:', data)
        return data
      } catch (error: any) {
        console.error('❌ Failed to create patient:', error)

        // ✅ En mode hors ligne, simuler la création
        if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          console.warn('🔄 Simulating patient creation (offline mode)')

          // Calculer l'âge
          const birthDate = new Date(patient.date_of_birth)
          const today = new Date()
          const age = today.getFullYear() - birthDate.getFullYear()

          const simulatedPatient = {
            ...patient,
            age,
            patient_id: patient.patient_id || `P${Date.now()}`,
            offline: true // Marquer comme créé hors ligne
          }

          // Stocker en local storage pour synchronisation ultérieure
          try {
            const offlinePatients = JSON.parse(localStorage.getItem('offline_patients') || '[]')
            offlinePatients.push(simulatedPatient)
            localStorage.setItem('offline_patients', JSON.stringify(offlinePatients))

            toast.success('Patient créé en mode hors ligne. Sera synchronisé lors de la reconnexion.')
          } catch (storageError) {
            console.warn('⚠️ Cannot store offline patient:', storageError)
            toast.warning('Patient créé en mode hors ligne (non persistant)')
          }

          return simulatedPatient
        }

        throw error
      }
    },
    onSuccess: (data) => {
      // Invalider les requêtes patients
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })

      if (!data.offline) {
        toast.success(`Patient ${data.first_name} ${data.last_name} créé avec succès`)
      }
    },
    onError: (error: any) => {
      // Ne montrer l'erreur que si ce n'est pas un problème réseau (géré dans mutationFn)
      if (error.response) {
        toast.error(`Erreur lors de la création: ${handleApiError(error)}`)
      }
    },
    ...options,
  })
}

// ✅ Hook useUpdatePatient amélioré
export const useUpdatePatient = (options?: any) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ patientId, patient }: { patientId: string; patient: any }) => {
      try {
        console.log('🔄 Updating patient:', patientId, patient)
        const data = await apiService.updatePatient(patientId, patient)
        console.log('✅ Patient updated successfully:', data)
        return data
      } catch (error: any) {
        console.error('❌ Failed to update patient:', error)

        // ✅ En mode hors ligne, simuler la mise à jour
        if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          console.warn('🔄 Simulating patient update (offline mode)')

          // Récupérer les données actuelles du cache
          const currentData = queryClient.getQueriesData({ queryKey: ['patients'] })
          let updatedPatient = null

          // Chercher le patient dans le cache
          for (const [key, data] of currentData) {
            if (data && typeof data === 'object' && 'results' in data) {
              const patientsData = data as any
              updatedPatient = patientsData.results?.find((p: any) => p.patient_id === patientId)
              if (updatedPatient) {
                updatedPatient = { ...updatedPatient, ...patient, offline_updated: true }
                break
              }
            }
          }

          if (!updatedPatient) {
            // Si pas trouvé dans le cache, créer un objet minimal
            updatedPatient = {
              patient_id: patientId,
              ...patient,
              offline_updated: true
            }
          }

          // Stocker la mise à jour hors ligne
          try {
            const offlineUpdates = JSON.parse(localStorage.getItem('offline_patient_updates') || '[]')
            offlineUpdates.push({ patientId, patient, timestamp: Date.now() })
            localStorage.setItem('offline_patient_updates', JSON.stringify(offlineUpdates))

            toast.success('Modification sauvegardée en mode hors ligne. Sera synchronisée lors de la reconnexion.')
          } catch (storageError) {
            console.warn('⚠️ Cannot store offline update:', storageError)
            toast.warning('Modification effectuée en mode hors ligne (non persistant)')
          }

          return updatedPatient
        }

        throw error
      }
    },
    onSuccess: (data) => {
      // Invalider les requêtes patients
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.setQueryData(['patients', 'detail', data.patient_id], data)

      if (!data.offline_updated) {
        toast.success(`Historique de ${data.first_name} ${data.last_name} mis à jour`)
      }
    },
    onError: (error: any) => {
      // Ne montrer l'erreur que si ce n'est pas un problème réseau
      if (error.response) {
        toast.error(`Erreur lors de la mise à jour: ${handleApiError(error)}`)
      }
    },
    ...options,
  })
}



// ======================
// SITES HOOKS
// ======================

export const useSites = (
  params?: {
    search?: string
    page?: number
    page_size?: number
  },
  options?: UseQueryOptions<{
    results: Site[]
    count: number
    next: string | null
    previous: string | null
  }>
) => {
  return useQuery({
    queryKey: queryKeys.sites.list(params),
    queryFn: () => apiService.getSites(params),
    keepPreviousData: true,
    staleTime: 300000, // Sites change less frequently - 5 minutes
    ...options,
  })
}

export const useCreateSite = (
  options?: UseMutationOptions<Site, Error, Site>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (site: Site) => apiService.createSite(site),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success(`Site ${data.nom} créé avec succès`)
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${handleApiError(error)}`)
    },
    ...options,
  })
}

export const useUpdateSite = (
  options?: UseMutationOptions<Site, Error, { siteId: string; site: Partial<Site> }>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, site }) => apiService.updateSite(siteId, site),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.setQueryData(queryKeys.sites.detail(data.site_id), data)
      toast.success(`Site ${data.nom} mis à jour`)
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${handleApiError(error)}`)
    },
    ...options,
  })
}

export const useDeleteSite = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (siteId: string) => apiService.deleteSite(siteId),
    onSuccess: (_, siteId) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.removeQueries({ queryKey: queryKeys.sites.detail(siteId) })
      toast.success('Site supprimé avec succès')
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${handleApiError(error)}`)
    },
    ...options,
  })
}

// ======================
// BLOOD REQUESTS HOOKS
// ======================

export const useBloodRequests = (
  params?: {
    status?: string
    priority?: string
    blood_type?: string
    department?: string
    page?: number
    page_size?: number
  },
  options?: UseQueryOptions<{
    results: BloodRequest[]
    count: number
    next: string | null
    previous: string | null
  }>
) => {
  return useQuery({
    queryKey: queryKeys.requests.list(params),
    queryFn: () => apiService.getBloodRequests(params),
    keepPreviousData: true,
    staleTime: 30000,
    ...options,
  })
}

export const useCreateBloodRequest = (
  options?: UseMutationOptions<BloodRequest, Error, Omit<BloodRequest, 'department_name' | 'site_name'>>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: Omit<BloodRequest, 'department_name' | 'site_name'>) =>
      apiService.createBloodRequest(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview })
      toast.success(`Demande ${data.request_id} créée avec succès`)
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${handleApiError(error)}`)
    },
    ...options,
  })
}

// ======================
// FORECASTING HOOKS
// ======================

export const useForecastMethods = (options = {}) => {
  return useQuery({
    queryKey: ['forecasting', 'methods'],
    queryFn: () => apiService.getAvailableForecastMethods(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry jusqu'à 3 fois, mais pas pour les erreurs 404
      if (error?.response?.status === 404) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  })
}

export const useTestMethodsConnection = () => {
  return useQuery({
    queryKey: ['forecasting', 'methods', 'test'],
    queryFn: () => apiService.testMethodsEndpoint(),
    enabled: false, // Ne s'exécute que manuellement
    retry: 1,
  })
}

export const useDemandForecast = (
  params?: {
    blood_type?: string
    days?: number
    method?: string
    lightweight?: boolean
  },
  options = {}
) => {
  return useQuery({
    queryKey: ['forecasting', 'demand', params],
    queryFn: () => apiService.getDemandForecast(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!params?.blood_type, // Only run if blood_type is provided
    retry: 2,
    ...options,
  })
}

export const useOptimizationRecommendations = (
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.forecasting.recommendations,
    queryFn: () => apiService.getOptimizationRecommendations(),
    staleTime: 300000, // Recommendations valid for 5 minutes
    ...options,
  })
}

// ======================
// SYSTEM CONFIG HOOKS
// ======================

export const useSystemConfig = (
  options?: UseQueryOptions<SystemConfig>
) => {
  return useQuery({
    queryKey: queryKeys.config.system,
    queryFn: () => apiService.getSystemConfig(),
    staleTime: 3600000, // Config is valid for 1 hour
    ...options,
  })
}

export const useBloodCompatibility = (
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.config.compatibility,
    queryFn: () => apiService.getBloodCompatibility(),
    staleTime: 3600000, // Compatibility matrix rarely changes
    ...options,
  })
}

// ======================
// DATA IMPORT HOOKS
// ======================

export const useImportCSV = (
  options?: UseMutationOptions<ImportResult, Error, File>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => {
      console.log('🚀 Starting CSV import for file:', file.name)
      return apiService.importCSVData(file)
    },
    onMutate: (file) => {
      // Affichage immédiat du début d'import
      toast.loading(`Import en cours: ${file.name}`, {
        id: 'csv-import'
      })
    },
    onSuccess: (data, file) => {
      // Vider le toast de loading
      toast.dismiss('csv-import')

      // Invalider toutes les données pertinentes
      queryClient.invalidateQueries({ queryKey: ['donors'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview })
      queryClient.invalidateQueries({ queryKey: queryKeys.dataImport.history() })

      if (data.success) {
        const message = `Import réussi: ${data.imported_records} enregistrements importés`
        toast.success(message, {
          duration: 5000,
          action: {
            label: 'Voir détails',
            onClick: () => {
              console.log('📊 Import details:', data)
            }
          }
        })

        if (data.errors && data.errors.length > 0) {
          toast.warning(`${data.total_errors} avertissements détectés`, {
            duration: 4000
          })
        }
      } else {
        toast.error(`Échec de l'import: ${data.error}`)
      }
    },
    onError: (error, file) => {
      toast.dismiss('csv-import')
      const errorMessage = `Erreur lors de l'import de ${file.name}: ${handleApiError(error)}`
      toast.error(errorMessage, {
        duration: 8000
      })
      console.error('❌ CSV Import error:', error)
    },
    ...options,
  })
}

export const useValidateCSV = (
  options?: UseMutationOptions<ValidationResult, Error, File>
) => {
  return useMutation({
    mutationFn: (file: File) => {
      console.log('🔍 Validating CSV file:', file.name)
      return apiService.validateCSVData(file)
    },
    onSuccess: (data, file) => {
      if (data.valid) {
        toast.success(`Fichier ${file.name} validé avec succès`, {
          description: `${data.valid_rows}/${data.total_rows} lignes valides`
        })
      } else {
        toast.warning(`Validation échouée pour ${file.name}`, {
          description: `${data.errors.length} erreurs détectées`
        })
      }
    },
    onError: (error, file) => {
      toast.error(`Erreur de validation: ${handleApiError(error)}`)
      console.error('❌ CSV Validation error:', error)
    },
    ...options,
  })
}

export const useDownloadTemplate = (
  options?: UseMutationOptions<void, Error, void>
) => {
  return useMutation({
    mutationFn: () => apiService.downloadCSVTemplate(),
    onSuccess: () => {
      toast.success('Template CSV téléchargé avec succès')
    },
    onError: (error) => {
      toast.error(`Erreur lors du téléchargement: ${handleApiError(error)}`)
      console.error('❌ Template download error:', error)
    },
    ...options,
  })
}

export const useImportHistory = (
  params?: {
    page?: number
    page_size?: number
    date_from?: string
    date_to?: string
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.dataImport.history(params),
    queryFn: () => apiService.getImportHistory(params),
    keepPreviousData: true,
    staleTime: 60000, // 1 minute
    ...options,
  })
}

// ======================
// EXPORT HOOKS
// ======================

export const useExportReport = (
  options?: UseMutationOptions<any, Error, {
    type: 'inventory' | 'consumption' | 'waste' | 'donors'
    format: 'csv'
  }>
) => {
  return useMutation({
    mutationFn: (params: { type: 'inventory' | 'consumption' | 'waste' | 'donors'; format: 'csv' }) =>
      apiService.exportReport(params),
    onSuccess: (_, variables) => {
      toast.success(`Rapport ${variables.type} exporté avec succès`)
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'export: ${handleApiError(error)}`)
    },
    ...options,
  })
}

// ======================
// HEALTH CHECK HOOK
// ======================

export const useHealthCheck = (
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiService.healthCheck(),
    refetchInterval: 60000, // Check health every minute
    staleTime: 30000,
    ...options,
  })
}

// ======================
// UTILITY HOOKS
// ======================

export const useRefreshAll = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries()
    toast.success('Toutes les données ont été actualisées')
  }
}

export const useClearCache = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.clear()
    toast.success('Cache vidé')
  }
}


export const useFileValidation = () => {
  return {
    validateFileSize: (file: File, maxSizeMB: number = 10) => {
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        throw new Error(`Fichier trop volumineux. Taille max: ${maxSizeMB}MB`)
      }
      return true
    },

    validateFileType: (file: File, allowedTypes: string[] = ['text/csv']) => {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        throw new Error('Format de fichier non supporté. Utilisez uniquement des fichiers CSV.')
      }
      return true
    },

    validateFileName: (file: File) => {
      const nameRegex = /^[a-zA-Z0-9._-]+\.csv$/
      if (!nameRegex.test(file.name)) {
        throw new Error('Nom de fichier invalide. Utilisez uniquement des lettres, chiffres, points, tirets et underscores.')
      }
      return true
    },

    validateFile: (file: File) => {
      try {
        this.validateFileType(file)
        this.validateFileSize(file)
        this.validateFileName(file)
        return { valid: true, errors: [] }
      } catch (error) {
        return {
          valid: false,
          errors: [error instanceof Error ? error.message : 'Erreur de validation']
        }
      }
    }
  }
}
// Export types for use in other files
export type { ForecastResult }

// ======================
// MAIN API HOOK (for backward compatibility)
// ======================

export const useApi = () => {
  return {
    // Direct API service access
    getDemandForecast: apiService.getDemandForecast,

    // Dashboard
    useDashboardOverview,
    useAlerts,
    useAcknowledgeAllAlerts,
    useResolveAlert,

    // Inventory
    useBloodUnits,
    useInventoryAnalytics,

    // Donors
    useDonors,
    useCreateDonor,
    useUpdateDonor,
    useDeleteDonor,

    // Patients
    usePatients,
    useCreatePatient,
    useUpdatePatient,

    // Sites
    useSites,
    useCreateSite,
    useUpdateSite,
    useDeleteSite,

    // Requests
    useBloodRequests,
    useCreateBloodRequest,

    // Forecasting
    useDemandForecast,
    useOptimizationRecommendations,

    // Config
    useSystemConfig,
    useBloodCompatibility,

    // Import/Export
    useImportCSV,
    useValidateCSV,
    useDownloadTemplate,
    useImportHistory,
    useFileValidation,
    useExportReport,

    // Health
    useHealthCheck,

    // Utils
    useRefreshAll,
    useClearCache,

    // Méthodes directes pour compatibilité
    importCSVData: apiService.importCSVData,
    validateCSVData: apiService.validateCSVData,
    downloadCSVTemplate: apiService.downloadCSVTemplate,
  }
}



// ✅ Hook pour la synchronisation des données hors ligne
export const useSyncOfflineData = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Starting offline data synchronization')

      const results = {
        patients_created: 0,
        patients_updated: 0,
        errors: [] as string[]
      }

      try {
        // Synchroniser les patients créés hors ligne
        const offlinePatients = JSON.parse(localStorage.getItem('offline_patients') || '[]')
        for (const patient of offlinePatients) {
          try {
            await apiService.createPatient(patient)
            results.patients_created++
          } catch (error) {
            results.errors.push(`Échec création patient ${patient.patient_id}: ${handleApiError(error)}`)
          }
        }

        // Synchroniser les mises à jour hors ligne
        const offlineUpdates = JSON.parse(localStorage.getItem('offline_patient_updates') || '[]')
        for (const update of offlineUpdates) {
          try {
            await apiService.updatePatient(update.patientId, update.patient)
            results.patients_updated++
          } catch (error) {
            results.errors.push(`Échec mise à jour patient ${update.patientId}: ${handleApiError(error)}`)
          }
        }

        // Nettoyer le stockage local si tout s'est bien passé
        if (results.errors.length === 0) {
          localStorage.removeItem('offline_patients')
          localStorage.removeItem('offline_patient_updates')
        }

        return results
      } catch (error) {
        console.error('❌ Offline sync failed:', error)
        throw error
      }
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })

      if (results.patients_created > 0 || results.patients_updated > 0) {
        toast.success(
          `Synchronisation terminée: ${results.patients_created} créés, ${results.patients_updated} mis à jour`
        )
      }

      if (results.errors.length > 0) {
        toast.warning(`${results.errors.length} erreurs lors de la synchronisation`)
      }
    },
    onError: (error) => {
      toast.error(`Erreur de synchronisation: ${handleApiError(error)}`)
    }
  })
}

// ✅ Hook pour détecter le retour en ligne
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const syncMutation = useSyncOfflineData()

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 Connection restored')

      // Tenter la synchronisation automatique
      const hasOfflineData =
        localStorage.getItem('offline_patients') ||
        localStorage.getItem('offline_patient_updates')

      if (hasOfflineData) {
        setTimeout(() => {
          syncMutation.mutate()
        }, 2000) // Délai de 2s pour laisser la connexion se stabiliser
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('📴 Connection lost')
      toast.warning('Connexion perdue. Mode hors ligne activé.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncMutation])

  return { isOnline, syncOfflineData: syncMutation.mutate }
}

// Default export for backward compatibility
export default useApi