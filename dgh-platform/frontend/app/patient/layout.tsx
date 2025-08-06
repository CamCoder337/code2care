"use client"

import type {ReactNode} from "react"
import {PatientGuard} from "@/components/auth-guard"

export default function PatientLayout({children}: { children: ReactNode }) {
    return (
        <PatientGuard>
            {children}
        </PatientGuard>
    )
}