"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mic, StopCircle, Star, Send, Loader2, Type, Volume2, Languages, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context";
// This import must use curly braces to match the named export
import { useDepartments } from "@/hooks/use-departments";
import { apiService } from "@/lib/api-service";


// Le hook useDebounce reste inchangé
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

export function FeedbackForm() {
  const { t } = useLanguage()
  const { toast } = useToast()

  // --- États du formulaire ---
  const [department, setDepartment] = useState("")
  const [rating, setRating] = useState(0)
  const [originalText, setOriginalText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [activeTab, setActiveTab] = useState("text")

  // --- Logique de récupération des données via notre hook personnalisé ---
  const { departments, isLoading: isLoadingDepartments, error: departmentError } = useDepartments()

  // --- États de chargement et d'enregistrement ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const userStoppedRef = useRef(false)

  const debouncedOriginalText = useDebounce(originalText, 500)

  // --- Logique de traduction via notre API Route Next.js ---
  const handleTranslation = useCallback(
      async (textToTranslate: string) => {
        if (!textToTranslate.trim()) {
          setTranslatedText("")
          return
        }
        setIsTranslating(true)
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textToTranslate }),
          })
          if (!response.ok) throw new Error("La requête de traduction a échoué")
          const data = await response.json()
          setTranslatedText(data.translatedText)
        } catch (error) {
          console.error("Translation error:", error)
          toast({
            title: "Erreur de traduction",
            description: "Le service de traduction n'a pas pu être atteint.",
            variant: "destructive",
          })
        } finally {
          setIsTranslating(false)
        }
      },
      [toast],
  )

  // Traduire le texte tapé (avec un délai)
  useEffect(() => {
    if (activeTab === "text" && !isRecognizing) {
      handleTranslation(debouncedOriginalText)
    }
  }, [debouncedOriginalText, handleTranslation, activeTab, isRecognizing])

  // --- Logique de Reconnaissance Vocale ---
  const handleToggleRecording = () => {
    if (isRecognizing) {
      userStoppedRef.current = true // L'utilisateur a cliqué sur "Stop"
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast({
        title: "Navigateur non compatible",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      })
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = ""
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      userStoppedRef.current = false
      setIsRecognizing(true)
      setOriginalText("")
      setTranslatedText("")
    }

    recognition.onend = () => {
      // Redémarre automatiquement si l'arrêt n'est pas manuel
      if (!userStoppedRef.current) {
        recognitionRef.current?.start()
        return
      }
      setIsRecognizing(false)
      // Traduire le texte final une fois l'enregistrement VRAIMENT terminé
      handleTranslation(originalText)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      toast({
        title: "Erreur de reconnaissance",
        description: `Une erreur est survenue: ${event.error}. Veuillez vérifier les permissions de votre microphone.`,
        variant: "destructive",
      })
      setIsRecognizing(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Reconstruit la transcription complète à chaque événement pour plus de robustesse
      const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("")
      setOriginalText(transcript)
    }

    recognition.start()
  }

  // --- Logique de Soumission ---
  const handleSubmit = async () => {
    if (!department) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez sélectionner un département.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const payload = {
      departmentId: department,
      rating: rating,
      comment: translatedText,
    }

    try {
      // Appel propre à notre service API
      await apiService.submitFeedback(payload)

      toast({
        title: t("feedback.feedback_sent"),
        description: t("feedback.thank_you"),
      })

      // Réinitialisation du formulaire en cas de succès
      setDepartment("")
      setRating(0)
      setOriginalText("")
      setTranslatedText("")
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Erreur de soumission",
        description: "Votre feedback n'a pas pu être envoyé. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <div className="space-y-8">
        {/* Section du Département */}
        <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              {t("feedback.department")}
            </CardTitle>
            <CardDescription>{t("feedback.department_select")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
                onValueChange={setDepartment}
                value={department}
                disabled={isLoadingDepartments || !!departmentError}
            >
              <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                <SelectValue
                    placeholder={
                      isLoadingDepartments
                          ? "Chargement des départements..."
                          : departmentError
                              ? "Erreur de chargement"
                              : t("feedback.department_placeholder")
                    }
                />
              </SelectTrigger>
              <SelectContent>
                {!isLoadingDepartments &&
                    !departmentError &&
                    departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            {departmentError && <p className="text-sm text-red-500 mt-2">{departmentError}</p>}
          </CardContent>
        </Card>

        {/* Section d'évaluation (Rating) */}
        <Card className="border-0 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {t("feedback.general_rating")}
            </CardTitle>
            <CardDescription>{t("feedback.rate_experience")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                      key={star}
                      variant="ghost"
                      size="sm"
                      onClick={() => setRating(star)}
                      className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all hover:scale-110"
                  >
                    <Star
                        className={`h-8 w-8 transition-all ${
                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                        }`}
                    />
                  </Button>
              ))}
            </div>
            {rating > 0 && (
                <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                >
                  {rating} {rating > 1 ? t("feedback.stars") : t("feedback.star")}
                </Badge>
            )}
          </CardContent>
        </Card>

        {/* Section de saisie du feedback */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/60 dark:bg-gray-800/60">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Texte
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Voix
            </TabsTrigger>
          </TabsList>

          <Card className="mt-4 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {activeTab === "text" ? t("feedback.written_feedback") : t("feedback.voice_feedback")}
              </CardTitle>
              <CardDescription>
                {activeTab === "text" ? t("feedback.describe_experience") : t("feedback.record_message")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === "voice" && (
                  <div className="flex flex-col items-center justify-center gap-6 mb-6">
                    <Button
                        onClick={handleToggleRecording}
                        size="lg"
                        className={`h-20 w-20 rounded-full transition-all duration-300 ${
                            isRecognizing ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      <div className={isRecognizing ? "ripple-container" : ""}>
                        {isRecognizing ? <StopCircle className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                      </div>
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRecognizing ? "Appuyez pour arrêter l'enregistrement" : "Appuyez pour commencer à parler"}
                    </p>
                  </div>
              )}
              <Textarea
                  placeholder={
                    activeTab === "voice" ? "Votre message apparaîtra ici..." : t("feedback.placeholder")
                  }
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="min-h-[150px] bg-white/80 dark:bg-gray-900/80"
                  readOnly={activeTab === "voice"}
              />
            </CardContent>
          </Card>
        </Tabs>

        {/* Zone de Traduction */}
        {(translatedText || isTranslating) && (
            <Card className="border-0 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Languages className="h-5 w-5 text-green-600" />
                  Traduction en Anglais
                </CardTitle>
                <CardDescription>Ce texte sera envoyé avec votre évaluation.</CardDescription>
              </CardHeader>
              <CardContent>
                {isTranslating ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Traduction en cours...
                    </div>
                ) : (
                    <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{translatedText}</p>
                    </div>
                )}
              </CardContent>
            </Card>
        )}

        {/* Bouton de soumission */}
        <Button
            onClick={handleSubmit}
            disabled={
                isSubmitting || isTranslating || isRecognizing || !department || (rating === 0 && !translatedText)
            }
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg py-6 text-lg font-medium"
            size="lg"
        >
          {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t("feedback.sending")}
              </>
          ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                {t("feedback.send_feedback")}
              </>
          )}
        </Button>
      </div>
  )
}