"use client"

import { useState } from "react"
import { useApi, type ForecastResponse } from "@/lib/hooks/useApi"

export function useForecasting() {
  const [forecasts, setForecasts] = useState<Record<string, ForecastResponse>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const api = useApi()

  const generateForecast = async (
    params: {
      blood_type?: string
      days?: number
      method?: string
      lightweight?: boolean
    } = {},
  ) => {
    try {
      setLoading(true)
      setError(null)

      const forecast = await api.getDemandForecast(params)
      const key = `${params.blood_type || "O+"}_${params.days || 7}`

      setForecasts((prev) => ({
        ...prev,
        [key]: forecast,
      }))

      return forecast
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate forecast")
      console.error("Forecast generation error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getForecast = (bloodType = "O+", days = 7) => {
    const key = `${bloodType}_${days}`
    return forecasts[key]
  }

  return {
    forecasts,
    loading,
    error,
    generateForecast,
    getForecast,
  }
}
