"use client"

import {Button} from "@/components/ui/button"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Calendar, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, Users, X} from "lucide-react"
import {useAuth} from "@/contexts/auth-context"
import {ThemeToggle} from "@/components/theme-toggle"
import {High5Logo} from "@/components/high5-logo"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {useEffect, useState} from "react"

interface AdminSidebarProps {
    activeView: string
    setActiveView: (view: "overview" | "patients" | "appointments" | "prescriptions" | "feedback") => void
}

export function AdminSidebar({activeView, setActiveView}: AdminSidebarProps) {
    const {professional, logout} = useAuth()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth >= 768) {
                setIsOpen(false)
            }
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const menuItems = [
        {id: "overview", label: "Dashboard", icon: LayoutDashboard, href: "/admin"},
        {id: "patients", label: "Patients", icon: Users, href: "/admin/patients"},
        {id: "appointments", label: "Appointments", icon: Calendar, href: "/admin/appointments"},
        {id: "prescriptions", label: "Prescriptions", icon: FileText, href: "/admin/prescriptions"},
        {id: "feedback", label: "Patient Feedback", icon: MessageSquare, href: "/admin/feedback"},
    ]

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    const toggleSidebar = () => {
        setIsOpen(!isOpen)
    }

    const closeSidebar = () => {
        if (isMobile) {
            setIsOpen(false)
        }
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            {isMobile && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="fixed top-4 left-4 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl"
                >
                    {isOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                </Button>
            )}

            {/* Mobile Overlay */}
            {isMobile && isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={closeSidebar}/>}

            {/* Sidebar */}
            <div
                className={`
        fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-50 to-green-50 dark:from-gray-900 dark:to-blue-900 
        backdrop-blur-sm border-r border-blue-200/50 dark:border-blue-800/50 flex flex-col z-50 transition-transform duration-300
        ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
      `}
            >
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-3 mb-4">
                        <High5Logo size="md"/>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                                HIGH5
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Professional Dashboard</p>
                        </div>
                    </div>

                    {/* Professional Info */}
                    <div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40"/>
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                                {professional?.first_name[0]}
                                {professional?.last_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {professional?.first_name} {professional?.last_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{professional?.specialization}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeView === item.id

                        return (
                            <Link key={item.id} href={item.href} onClick={closeSidebar}>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={`w-full justify-start gap-3 h-12 text-sm sm:text-base ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg hover:from-blue-700 hover:to-green-700"
                                            : "hover:bg-gradient-to-r hover:from-blue-100 hover:to-green-100 dark:hover:from-blue-900/30 dark:hover:to-green-900/30"
                                    }`}
                                    onClick={() => setActiveView(item.id as any)}
                                >
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5"/>
                                    {item.label}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-blue-200/50 dark:border-blue-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" className="gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                            <Settings className="h-4 w-4"/>
                            <span className="text-sm">Settings</span>
                        </Button>
                        <ThemeToggle/>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 bg-transparent"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4"/>
                        Sign Out
                    </Button>
                </div>
            </div>
        </>
    )
}
