"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Optionnel: Envoyer l'erreur à un service de monitoring
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Exemple avec Sentry
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Oops ! Une erreur s'est produite
            </h2>

            <p className="text-gray-600 dark:text-gray-400">
              Nous sommes désolés, quelque chose s'est mal passé. Veuillez réessayer.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded border">
                <summary className="cursor-pointer font-medium text-red-600 dark:text-red-400">
                  Détails de l'erreur (développement)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Recharger la page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook pour une utilisation fonctionnelle
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)

    if (typeof window !== 'undefined') {
      // Optionnel: Envoyer à un service de monitoring
    }
  }
}