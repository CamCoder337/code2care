"use client"

import { useState, useEffect, useRef } from "react"

// Complete type declarations for Web Speech API
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly [index: number]: SpeechRecognitionAlternative
  readonly length: number
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult
  readonly length: number
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  grammars: any
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string

  start(): void
  stop(): void
  abort(): void

  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

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
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognitionConstructor) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognitionConstructor()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "fr-FR"

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript)
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = (): void => {
    if (recognitionRef.current && !isListening) {
      setTranscript("")
      setIsListening(true)
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
      }
    }
  }

  const stopListening = (): void => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const resetTranscript = (): void => {
    setTranscript("")
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