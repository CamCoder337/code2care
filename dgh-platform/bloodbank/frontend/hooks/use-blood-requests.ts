"use client"

import { useBloodRequests as useBloodRequestsAPI } from "@/lib/hooks/useApi"

export function useBloodRequests(params?: {
  status?: string
  priority?: string
  blood_type?: string
  department?: string
  page?: number
  page_size?: number
}) {
  return useBloodRequestsAPI(params)
}