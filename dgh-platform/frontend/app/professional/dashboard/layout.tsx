"use client"

import type {ReactNode} from "react"
import {useState} from "react"
import {type ProfessionalUser, useAuthStore} from "@/stores/auth-store"
import {ProfessionalGuard} from "@/components/auth-guard"
import {Sidebar} from "@/components/sidebar"

function DashboardLayoutContent({children}: { children: ReactNode }) {
    const {user, logout} = useAuthStore()
    const [collapsed, setCollapsed] = useState(false)

    const professional = user as ProfessionalUser

    const handleLogout = () => {
        logout()
    }

    const currentUser = {
        firstName: professional?.first_name || "Dr.",
        lastName: professional?.last_name || "Utilisateur",
        username: professional?.username || "professional",
        department: professional?.specialization || "Spécialité",
        avatarUrl: "",
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                onLogout={handleLogout}
                currentUser={currentUser}
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
            />
            <main
                className={`flex-1 overflow-y-auto transition-all duration-300 ${
                    collapsed ? "lg:ml-20" : "lg:ml-80"
                }`}
            >
                <div className="h-16 lg:hidden"/>
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    )
}

export default function DashboardLayout({children}: { children: ReactNode }) {
    return (
        <ProfessionalGuard>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </ProfessionalGuard>
    )
}