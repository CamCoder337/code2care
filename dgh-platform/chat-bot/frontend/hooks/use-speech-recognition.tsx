"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface SpeechRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  isSupported: boolean
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const recognitionRef = useRef<any>(null)

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Ne s'exécute que côté client après le montage
    if (!isMounted) return

    try {
      // Vérification plus robuste de l'API
      if (typeof window === "undefined") return

      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition

      if (!SpeechRecognitionConstructor) {
        console.warn('Speech Recognition API not supported in this browser')
        setIsSupported(false)
        return
      }

      setIsSupported(true)

      // Créer l'instance de reconnaissance vocale
      const recognition = new SpeechRecognitionConstructor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "fr-FR"
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
      }

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)

        // Gestion spécifique des erreurs
        switch (event.error) {
          case 'no-speech':
            console.warn('No speech detected')
            break
          case 'network':
            console.warn('Network error occurred')
            break
          case 'not-allowed':
            console.warn('Microphone access denied')
            break
          default:
            console.warn('Unknown error:', event.error)
        }
      }

      recognitionRef.current = recognition

    } catch (error) {
      console.error('Error initializing speech recognition:', error)
      setIsSupported(false)
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.warn('Error stopping speech recognition:', error)
        }
      }
    }
  }, [isMounted])

  const startListening = useCallback((): void => {
    if (!isMounted || !isSupported || !recognitionRef.current || isListening) {
      return
    }

    try {
      setTranscript("")
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setIsListening(false)
    }
  }, [isMounted, isSupported, isListening])

  const stopListening = useCallback((): void => {
    if (!recognitionRef.current || !isListening) {
      return
    }

    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.error('Error stopping speech recognition:', error)
    }
  }, [isListening])

  const resetTranscript = useCallback((): void => {
    setTranscript("")
  }, [])

  // Retourner des valeurs par défaut jusqu'à ce que le composant soit monté
  if (!isMounted) {
    return {
      isListening: false,
      transcript: "",
      startListening: () => {},
      stopListening: () => {},
      resetTranscript: () => {},
      isSupported: false,
    }
  }

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  }
}