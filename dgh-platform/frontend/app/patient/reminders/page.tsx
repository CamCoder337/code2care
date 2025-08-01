"use client"

import { RemindersList } from "@/components/reminders-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
// import { useLanguage } from "@/contexts/language-context"
import { ThemeToggle } from "@/components/theme-toggle"
// import { LanguageSelector } from "@/components/language-selector"

export default function RemindersPage() {
  // const { t } = useLanguage()
  const router = useRouter()

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
        {/* Mobile-responsive header */}
        <header className="border-b border-white/20 backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 sticky top-0 z-10">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                      variant="ghost"
                      className="gap-2 hover:bg-white/20 dark:hover:bg-gray-800/20 p-2 sm:px-4"
                      onClick={() => router.back()}
                      aria-label="Retour"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Retour</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-md flex items-center justify-center">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 dark:from-white dark:to-green-200 bg-clip-text text-transparent">
                      Mes Rappels
                    </h1>
                  </div>
                </div>
                <div className="sm:hidden flex items-center gap-2">
                  {/*<LanguageSelector />*/}
                  <ThemeToggle />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <Button className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm sm:text-base">Nouveau Rappel</span>
                </Button>
                <div className="hidden sm:flex items-center gap-2">
                  {/*<LanguageSelector />*/}
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CORRECTION : Le contenu est maintenant dans un conteneur centré avec une largeur maximale */}
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
          <div className="max-w-5xl mx-auto">
            <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold">Rendez-vous et Médicaments</CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Gérez ici vos rappels personnalisés pour ne rien oublier.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <RemindersList />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
  )
}