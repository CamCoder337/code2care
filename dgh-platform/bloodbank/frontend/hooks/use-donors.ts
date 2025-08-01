"use client"

import { useState, useEffect } from "react"
import { useApi, type Donor } from "@/lib/hooks/useApi"

export function useDonors() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  })

  const api = useApi()

  const fetchDonors = async (
    params: {
      search?: string
      blood_type?: string
      gender?: string
      status?: string
      page?: number
      page_size?: number
    } = {},
  ) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.getDonors(params)

      setDonors(response.results || [])
      setPagination({
        page: params.page || 1,
        totalPages: Math.ceil((response.count || 0) / (params.page_size || 20)),
        totalCount: response.count || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch donors")
      console.error("Donors fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const createDonor = async (data: any) => {
    try {
      setLoading(true)
      const newDonor = await api.createDonor(data)
      await fetchDonors() // Refresh the list
      return newDonor
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create donor")
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDonors()
  }, [])

  return {
    donors,
    loading,
    error,
    pagination,
    fetchDonors,
    createDonor,
    refetch: () => fetchDonors(),
  }
}
