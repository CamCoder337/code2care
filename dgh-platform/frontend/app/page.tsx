// "use client"
//
// import { useState } from "react"
// import { Sidebar } from "@/components/sidebar"
// import { Dashboard } from "@/components/dashboard"
// import { Patients } from "@/components/patients"
// import { Appointments } from "@/components/appointments"
// import { Prescriptions } from "@/components/prescriptions"
// import { PatientFeedback } from "@/components/patient-feedback"
// import { Login } from "@/components/login"
// import { Settings } from "@/components/settings"
//
// // Define a User type for consistency
// interface User {
//   firstName: string
//   lastName: string
//   email: string
//   phone: string
//   address: string
//   department: string
//   bio: string
//   matricule: string
//   gender: string
//   dateOfBirth: string
//   emergencyContact: string
//   avatarUrl?: string
// }
//
// export default function Home() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false)
//   const [activeTab, setActiveTab] = useState("dashboard")
//   // Default user data for demonstration, will be updated on login
//   const [currentUser, setCurrentUser] = useState<User>({
//     firstName: "Sarah",
//     lastName: "Johnson",
//     email: "sarah.johnson@medadmin.com",
//     phone: "+1 (555) 123-4567",
//     address: "123 Medical Center Dr, Suite 400, City, State 12345",
//     department: "Cardiology",
//     bio: "Experienced cardiologist with a passion for patient care and a focus on preventive medicine.",
//     matricule: "MJ001",
//     gender: "Female",
//     dateOfBirth: "1980-05-15",
//     emergencyContact: "John Johnson (Husband) - +1 (555) 987-6543",
//   })
//
//   const handleLogin = (userData: User) => {
//     setCurrentUser(userData)
//     setIsLoggedIn(true)
//   }
//
//   const handleLogout = () => {
//     setIsLoggedIn(false)
//     setActiveTab("dashboard")
//     // Reset user data to default or empty on logout if needed
//     setCurrentUser({
//       firstName: "Sarah",
//       lastName: "Johnson",
//       email: "sarah.johnson@medadmin.com",
//       phone: "+1 (555) 123-4567",
//       address: "123 Medical Center Dr, Suite 400, City, State 12345",
//       department: "Cardiology",
//       bio: "Experienced cardiologist with a passion for patient care and a focus on preventive medicine.",
//       matricule: "MJ001",
//       gender: "Female",
//       dateOfBirth: "1980-05-15",
//       emergencyContact: "John Johnson (Husband) - +1 (555) 987-6543",
//     })
//   }
//
//   const renderContent = () => {
//     switch (activeTab) {
//       case "dashboard":
//         return <Dashboard />
//       case "patients":
//         return <Patients />
//       case "appointments":
//         return <Appointments />
//       case "prescriptions":
//         return <Prescriptions />
//       case "feedback":
//         return <PatientFeedback />
//       case "settings":
//         return <Settings user={currentUser} onUserUpdate={setCurrentUser} />
//       default:
//         return <Dashboard />
//     }
//   }
//
//   if (!isLoggedIn) {
//     return <Login onLogin={handleLogin} />
//   }
//
//   return (
//     <div className="flex h-screen bg-background overflow-hidden w-full max-w-full">
//       <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} currentUser={currentUser} />
//       <main className="flex-1 overflow-auto w-full max-w-full">
//         <div className="lg:hidden h-16 w-full"></div> {/* Spacer for mobile menu button */}
//         <div className="w-full max-w-full overflow-x-hidden">{renderContent()}</div>
//       </main>
//     </div>
//   )
// }
"use client"

import type React from "react"
import { High5Logo } from "@/components/high5-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Stethoscope, User } from "lucide-react"

// La page d'accueil n'a plus besoin de useAuth ou usePatientAuth.
// Elle devient une simple page de présentation.
export default function HomePage() {
  return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border/40 backdrop-blur-sm bg-background/95 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <High5Logo size="md" />
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
              Bienvenue sur la plateforme HIGH5
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Votre solution de santé connectée. Accédez à votre espace personnalisé en choisissant votre profil ci-dessous.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/professional/login" passHref>
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Espace Professionnel
                </Button>
              </Link>
              <Link href="/patient/login" passHref>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <User className="mr-2 h-5 w-5" />
                  Espace Patient
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
  )
}