"use client"

import { useHydrationSafe } from "@/hooks/use-hydration-safe"
import { ReactNode } from "react"

interface HydrationSafeProps {
  children: ReactNode
  fallback?: ReactNode
}

export function HydrationSafe({ children, fallback = <div>Loading...</div> }: HydrationSafeProps) {
  const isClient = useHydrationSafe()
  
  if (!isClient) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}