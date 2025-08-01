"use client"

import type React from "react"
// import { useLanguage } from "@/contexts/language-context"
import { usePatientAuth } from "@/components/patient-auth-context"
import Image from "next/image"
// import { LanguageSelector } from "@/components/language-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { MessageSquare, Calendar, ChevronRight } from "lucide-react"

export default function PatientHomePage() {
    // const { t } = useLanguage()
    const { patient, logout } = usePatientAuth()

    return (
        <div className="min-h-screen">
            {/* Mobile-first responsive header */}
            <header className="border-b border-white/20 backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 sticky top-0 z-50">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image src="/logo.png" alt="HIGH5 Logo" width={32} height={32} className="rounded-md" />
                                <div>
                  <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    HIGH5
                  </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Your health, our priority</p>
                                </div>
                            </div>
                            <div className="sm:hidden flex items-center gap-2">
                                {/*<LanguageSelector />*/}
                                <ThemeToggle />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                  Welcome, {patient?.username}
                                </span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                                {/*<LanguageSelector />*/}
                                <ThemeToggle />
                                <Button variant="outline" size="sm" onClick={logout} className="bg-white/80 dark:bg-gray-800/80" aria-label="Logout">
                                    Logout
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={logout}
                                className="sm:hidden bg-white/80 dark:bg-gray-800/80 w-full" aria-label="Logout"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
                {/* Mobile-optimized hero section */}
                <div className="text-center mb-8 sm:mb-16">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 dark:from-blue-400 dark:via-green-400 dark:to-blue-200 bg-clip-text text-transparent mb-4 sm:mb-6 font-poppins leading-tight">
                        Your Health Space
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
                        Manage your appointments and share your feedback with ease. We are here to support you.
                    </p>
                </div>

                {/* Mobile-first responsive cards - Only 2 cards for patients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
                    <PatientFeatureCard
                        icon={<MessageSquare className="h-6 w-6 text-white" />}
                        title="Give Feedback"
                        description="Your opinion is valuable. Help us improve our services by sharing your experience."
                        href="/patient/feedback"
                        gradient="from-blue-500 to-blue-600"
                        buttonText="Share my feedback"
                    />

                    <PatientFeatureCard
                        icon={<Calendar className="h-6 w-6 text-white" />}
                        title="My Reminders"
                        description="Check your upcoming appointments and medication reminders."
                        href="/patient/reminders"
                        gradient="from-green-500 to-green-600"
                        buttonText="View my reminders"
                    />
                </div>
            </div>
        </div>
    )
}

function PatientFeatureCard(
    {
        icon,
        title,
        description,
        href,
        gradient,
        buttonText,
    }: {
        icon: React.ReactNode
        title: string
        description: string
        href: string
        gradient: string
        buttonText: string
    }) {
    return (
        <Link href={href} className="group block">
            <Card
                className={`h-full overflow-hidden relative transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm group-hover:shadow-2xl group-hover:-translate-y-2`}
            >
                {/* Decorative gradient flare */}
                <div className={`absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-r ${gradient} rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-500`} />

                <div className="p-6 flex flex-col h-full">
                    <div
                        className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                        {icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600 dark:text-gray-300 leading-relaxed flex-grow mb-6">
                        {description}
                    </CardDescription>
                    <div className="mt-auto">
                        <div className={`inline-flex items-center gap-2 font-semibold text-sm ${gradient.includes("blue") ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>
                            {buttonText}
                            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}