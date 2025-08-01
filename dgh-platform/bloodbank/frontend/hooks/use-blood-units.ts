"use client"

import { useState, useEffect } from "react"
import { useApi, type BloodUnit } from "@/lib/api"

export function useBloodUnits() {
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  })

  const api = useApi()

  const fetchUnits = async (
    params: {
      blood_type?: string
      status?: string
      expiring_days?: number
      page?: number
      page_size?: number
    } = {},
  ) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.getBloodUnits(params)

      setUnits(response.results || [])
      setPagination({
        page: params.page || 1,
        totalPages: Math.ceil((response.count || 0) / (params.page_size || 20)),
        totalCount: response.count || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch blood units")
      console.error("Blood units fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  return {
    units,
    loading,
    error,
    pagination,
    fetchUnits,
    refetch: () => fetchUnits(),
  }
}
