"use client"

import type React from "react"
// import { useLanguage } from "@/contexts/language-context"
import { usePatientAuth } from "@/components/patient-auth-context"
import { High5Logo } from "@/components/high5-logo"
// import { LanguageSelector } from "@/components/language-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { MessageSquare, Calendar } from "lucide-react"

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
                                <High5Logo size="md" />
                                <div>
                  <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    HIGH5
                  </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{("app.subtitle")}</p>
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
                  {("common.welcome")}, {patient?.first_name}
                </span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                                {/*<LanguageSelector />*/}
                                <ThemeToggle />
                                <Button variant="outline" size="sm" onClick={logout} className="bg-white/80 dark:bg-gray-800/80">
                                    {("common.logout")}
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={logout}
                                className="sm:hidden bg-white/80 dark:bg-gray-800/80 w-full"
                            >
                                {("common.logout")}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
                {/* Mobile-optimized hero section */}
                <div className="text-center mb-8 sm:mb-16">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 dark:from-blue-400 dark:via-green-400 dark:to-blue-200 bg-clip-text text-transparent mb-4 sm:mb-6 font-poppins leading-tight">
                        {("patient.welcome")}
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
                        {("patient.subtitle")}
                    </p>
                </div>

                {/* Mobile-first responsive cards - Only 2 cards for patients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
                    <PatientFeatureCard
                        icon={<MessageSquare className="h-6 w-6 text-white" />}
                        title={("home.patient_feedback")}
                        description={("home.patient_feedback_desc")}
                        href="/feedback"
                        gradient="from-blue-500 to-blue-600"
                        buttonText={("home.give_feedback")}
                        buttonClass="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    />

                    <PatientFeatureCard
                        icon={<Calendar className="h-6 w-6 text-white" />}
                        title={("home.reminders")}
                        description={("home.reminders_desc")}
                        href="/reminders"
                        gradient="from-green-500 to-green-600"
                        buttonText={("home.my_reminders")}
                        buttonClass="border-2 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20 bg-transparent"
                        buttonVariant="outline"
                    />
                </div>
            </div>
        </div>
    )
}

function PatientFeatureCard({
                                icon,
                                title,
                                description,
                                href,
                                gradient,
                                buttonText,
                                buttonClass,
                                buttonVariant = "default",
                                className = "",
                            }: {
    icon: React.ReactNode
    title: string
    description: string
    href: string
    gradient: string
    buttonText: string
    buttonClass: string
    buttonVariant?: "default" | "outline"
    className?: string
}) {
    return (
        <Card
            className={`group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:scale-105 ${className}`}
        >
            <CardHeader className="pb-4">
                <div
                    className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                    {icon}
                </div>
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-tight">
                    {title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href={href}>
                    <Button
                        variant={buttonVariant}
                        className={`w-full ${buttonClass} text-sm sm:text-base py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all`}
                    >
                        {buttonText}
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
