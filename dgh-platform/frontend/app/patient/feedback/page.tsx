// Fichier : app/feedback/page.tsx

"use client"

import { FeedbackForm } from "@/components/feedback-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { ThemeToggle } from "@/components/theme-toggle"

export default function FeedbackPage() {
  // const { t } = useLanguage()
  // 2. Initialiser le routeur
  const router = useRouter()
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
        {/* Header */}
        <header className="border-b border-white/20 backdrop-blur-sm bg-white/10 dark:bg-gray-900/10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* 3. Remplacer le <Link> par un <Button> avec un événement onClick */}
              <Button
                  variant="ghost"
                  className="gap-2 hover:bg-white/20 dark:hover:bg-gray-800/20"
                  onClick={() => router.back()} // Cette fonction dit au navigateur de revenir en arrière
              >
                <ArrowLeft className="h-4 w-4" />
                {("common.back")}
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">MedFeedback</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-3xl mx-auto border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                {("feedback.title")}
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {("feedback.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackForm />
            </CardContent>
          </Card>
        </div>
      </div>
  )
}