"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProfessionalLoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirection vers le login unifié
    router.replace("/login")
  }, [router])

  return null
}