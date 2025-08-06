"use client"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {ThemeToggle} from "@/components/theme-toggle"
import {ArrowRight, Stethoscope, User} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function WelcomePage() {
    return (
        <div
            className="relative min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-gray-950 dark:via-blue-950 dark:to-green-950 overflow-hidden">

            {/* Decorative blobs */}
            <Image src="/blob-blue.svg" alt="" width={250} height={250}
                   className="absolute -top-20 -left-20 opacity-20 pointer-events-none"/>
            <Image src="/blob-green.svg" alt="" width={250} height={250}
                   className="absolute bottom-0 right-0 opacity-20 pointer-events-none"/>

            {/* Header controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <ThemeToggle/>
            </div>

            {/* Main framed card */}
            <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn">
                <Card
                    className="w-full max-w-6xl bg-white/40 dark:bg-gray-800/40 border border-white/10 backdrop-blur-lg shadow-xl rounded-xl p-6">
                    <CardContent>

                        {/* Logo and title */}
                        <div className="text-center mb-12">
                            <div
                                className="flex justify-center mb-6 scale-100 hover:scale-110 transition-transform duration-300">
                                <Image src="/high5-logo.png" alt="HIGH5 Logo" width={80} height={80}
                                       className="rounded-2xl"/>
                            </div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-500 to-green-600 bg-clip-text text-transparent mb-4 font-poppins animate-gradient">
                                HIGH5
                            </h1>
                            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                                Welcome to our medical platform. Log in to begin your health journey.
                            </p>
                        </div>

                        {/* Login options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Patient Login Card */}
                            <Card
                                className="group transition-all duration-300 border border-white/10 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl hover:scale-105 hover:shadow-xl">
                                <CardHeader className="text-center pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <User className="h-8 w-8 text-white"/>
                                    </div>
                                    <CardTitle
                                        className="text-2xl font-bold text-gray-900 dark:text-white">Patient</CardTitle>
                                    <CardDescription className="text-gray-600 dark:text-gray-300">Access for patients
                                        only.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/patient/login">
                                        <Button
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 text-lg font-medium group transition-transform hover:scale-105">
                                            Continue as Patient
                                            <ArrowRight
                                                className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"/>
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Professional Login Card */}
                            <Card
                                className="group transition-all duration-300 border border-white/10 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl hover:scale-105 hover:shadow-xl">
                                <CardHeader className="text-center pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Stethoscope className="h-8 w-8 text-white"/>
                                    </div>
                                    <CardTitle
                                        className="text-2xl font-bold text-gray-900 dark:text-white">Professional</CardTitle>
                                    <CardDescription className="text-gray-600 dark:text-gray-300">Restricted to medical
                                        staff.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/professional/login">
                                        <Button
                                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 text-lg font-medium group transition-transform hover:scale-105">
                                            Continue as Professional
                                            <ArrowRight
                                                className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"/>
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
