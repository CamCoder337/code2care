"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mic, Star, Send, Loader2, Type, Volume2, Languages, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"

// Hook personnalisé pour "débattre" une valeur (attendre que l'utilisateur arrête de taper)
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
  const [translatedText, setTranslatedText] = useState("") // Pour la traduction finale
  const [activeTab, setActiveTab] = useState("text")

  // --- États de chargement et d'enregistrement ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)

  // Utilise la valeur "débattue" pour ne pas traduire à chaque frappe
  const debouncedOriginalText = useDebounce(originalText, 500)

  // --- Logique de Traduction via notre API Backend ---
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
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: textToTranslate }),
          })

          if (!response.ok) {
            throw new Error("La requête de traduction a échoué")
          }

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

  // --- Effet pour traduire le texte tapé ---
  useEffect(() => {
    if (activeTab === "text") {
      handleTranslation(debouncedOriginalText)
    }
  }, [debouncedOriginalText, handleTranslation, activeTab])

  // --- Logique de Reconnaissance Vocale ---
  const handleVoiceRecording = () => {
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
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "" // Détection automatique de la langue

    recognition.onstart = () => {
      setIsRecognizing(true)
      setOriginalText("")
      setTranslatedText("")
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setOriginalText(transcript) // Affiche le texte reconnu
      handleTranslation(transcript) // Et le traduit via notre API
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

    recognition.onend = () => {
      setIsRecognizing(false)
    }

    recognition.start()
  }

  // --- Logique de Soumission ---
  const handleSubmit = async () => {
    setIsSubmitting(true)
    const finalFeedback = translatedText // On envoie toujours le texte traduit

    console.log("Submitting feedback:", { department, rating, feedback: finalFeedback })

    // Simulation de la soumission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: t("feedback.feedback_sent"),
      description: t("feedback.thank_you"),
    })

    // Réinitialisation du formulaire
    setDepartment("")
    setRating(0)
    setOriginalText("")
    setTranslatedText("")
    setIsSubmitting(false)
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
            <Select onValueChange={setDepartment} value={department}>
              <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                <SelectValue placeholder={t("feedback.department_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cardiology">Cardiologie</SelectItem>
                <SelectItem value="neurology">Neurologie</SelectItem>
                <SelectItem value="orthopedics">Orthopédie</SelectItem>
                <SelectItem value="pediatrics">Pédiatrie</SelectItem>
                <SelectItem value="general">Médecine Générale</SelectItem>
              </SelectContent>
            </Select>
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
                        className={`h-8 w-8 transition-all ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
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
        <Tabs defaultValue="text" onValueChange={setActiveTab} className="w-full">
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

          {/* Onglet Texte */}
          <TabsContent value="text" className="space-y-4">
            <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">{t("feedback.written_feedback")}</CardTitle>
                <CardDescription>{t("feedback.describe_experience")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                    placeholder={t("feedback.placeholder")}
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    className="min-h-[150px] bg-white/80 dark:bg-gray-900/80"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Voix */}
          <TabsContent value="voice" className="space-y-4">
            <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">{t("feedback.voice_feedback")}</CardTitle>
                <CardDescription>{t("feedback.record_message")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  <Button onClick={handleVoiceRecording} disabled={isRecognizing} size="lg" className="gap-2 px-8 py-4 text-lg">
                    <Mic className="h-6 w-6" />
                    {isRecognizing ? t("feedback.recording_in_progress") : t("feedback.start_recording")}
                  </Button>
                </div>
                {isRecognizing && (
                    <div className="text-center flex flex-col items-center justify-center gap-3 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Reconnaissance en cours...
                      </div>
                    </div>
                )}
                {originalText && activeTab === "voice" && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                      <Label>Texte reconnu :</Label>
                      <p className="text-gray-700 dark:text-gray-300 italic">"{originalText}"</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Zone de Traduction (commune) */}
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
            disabled={isSubmitting || isTranslating || isRecognizing || !department || (rating === 0 && !translatedText)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg py-6 text-lg font-medium"
            size="lg"
        >
          {isSubmitting ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{t("feedback.sending")}</>
          ) : (
              <><Send className="h-5 w-5 mr-2" />{t("feedback.send_feedback")}</>
          )}
        </Button>
      </div>
  )
}