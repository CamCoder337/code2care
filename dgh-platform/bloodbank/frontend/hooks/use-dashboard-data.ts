"use client"

import { useState, useEffect } from "react"
import { useApi, type DashboardOverview, type Alert } from "@/lib/api"

export function useDashboardData() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const api = useApi()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [overviewData, alertsData] = await Promise.all([api.getDashboardOverview(), api.getAlerts()])

      setOverview(overviewData)
      setAlerts(alertsData.alerts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
      console.error("Dashboard data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    overview,
    alerts,
    loading,
    error,
    refetch: fetchData,
  }
}
