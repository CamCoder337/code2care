// components/providers/query-provider.tsx
"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'
import { toast } from 'sonner'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuration globale pour les requêtes
            staleTime: 30000, // 30 secondes
            cacheTime: 300000, // 5 minutes
            retry: (failureCount, error: any) => {
              // Ne pas retry sur les erreurs d'authentification
              if (error?.response?.status === 401 || error?.response?.status === 403) {
                return false
              }
              // Retry jusqu'à 3 fois pour les autres erreurs
              return failureCount < 3
            },
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            onError: (error: any) => {
              // Gestion globale des erreurs de requête
              console.error('Query Error:', error)

              // Ne pas afficher de toast pour les erreurs d'authentification
              if (error?.response?.status === 401) {
                // Redirection vers la page de login gérée par l'interceptor axios
                return
              }

              // Afficher un toast d'erreur pour les autres cas
              if (error?.response?.status >= 500) {
                toast.error('Erreur serveur - Veuillez réessayer plus tard')
              } else if (error?.response?.status >= 400) {
                toast.error(error?.response?.data?.message || 'Erreur lors de la requête')
              } else if (error?.code === 'NETWORK_ERROR') {
                toast.error('Erreur de connexion - Vérifiez votre connexion internet')
              }
            },
          },
          mutations: {
            // Configuration globale pour les mutations
            onError: (error: any) => {
              console.error('Mutation Error:', error)

              // Les erreurs spécifiques sont gérées dans chaque hook
              // Ici on gère uniquement les erreurs génériques
              if (error?.code === 'NETWORK_ERROR') {
                toast.error('Erreur de connexion - Vérifiez votre connexion internet')
              }
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Afficher les devtools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.8)',
              transformOrigin: 'bottom right',
            },
          }}
        />
      )}
    </QueryClientProvider>
  )
}

// Hook pour accéder au QueryClient dans les composants
import { useQueryClient } from '@tanstack/react-query'

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    invalidateInventory: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    invalidateDonors: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
    },
    invalidatePatients: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
    invalidateRequests: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
    invalidateSites: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
    invalidateForecasting: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasting'] })
    },
  }
}

export default QueryProvider