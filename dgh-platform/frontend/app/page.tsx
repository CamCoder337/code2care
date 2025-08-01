"use client"

import type React from "react"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Stethoscope, User } from "lucide-react"

// The homepage no longer needs useAuth or usePatientAuth.
// It becomes a simple presentation page.
export default function HomePage() {
  return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border/40 backdrop-blur-sm bg-background/95 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* Replaced High5Logo with Image component for consistency */}
                <Image src="/high5-logo.png" alt="HIGH5 Logo" width={40} height={40} className="rounded-lg" />
                <div>
                                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                                    HIGH5
                                </span>
                  <p className="text-xs text-muted-foreground">
                    Medical Platform
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 dark:from-blue-400 dark:via-green-400 dark:to-blue-200 bg-clip-text text-transparent mb-6">
              Welcome to the HIGH5 Platform
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Your connected health solution. Access your personalized space by choosing your profile below.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/professional/login" passHref>
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Professional Space
                </Button>
              </Link>
              <Link href="/patient/login" passHref>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <User className="mr-2 h-5 w-5" />
                  Patient Space
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
  )
}