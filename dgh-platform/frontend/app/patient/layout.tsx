"use client"

import type { ReactNode } from "react"
import { PatientGuard } from "@/components/role-guard"

export default function PatientLayout({ children }: { children: ReactNode }) {
    return (
        <PatientGuard>
            {children}
        </PatientGuard>
    )
}