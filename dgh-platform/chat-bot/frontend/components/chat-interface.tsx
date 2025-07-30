"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConversations } from "@/lib/conversation-context"
import { useFiles } from "@/lib/files-context"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import {
  Send,
  Bot,
  User,
  Paperclip,
  Mic,
  MicOff,
  Download,
  ImageIcon,
  FileText,
  File,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import Image from "next/image"
import ReactMarkdown from 'react-markdown'
import { getApiUrl } from '@/lib/config'

interface ChatInterfaceProps {
  sidebarOpen: boolean
}

export function ChatInterface({ sidebarOpen }: ChatInterfaceProps) {
  const {
    currentConversation,
    addMessageToCurrentConversation,
    createNewConversation,
    syncConversationWithBackend,
    getCurrentConversationBackendId,
    isLoading: contextLoading
  } = useConversations()

  const { addFile, getFilesByConversation, downloadFile } = useFiles()
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition()

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  // Focus sur l'input quand la conversation change
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus()
    }
  }, [currentConversation, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || contextLoading) return

    const message = input.trim()
    setInput("")
    setIsLoading(true)
    setLastSyncError(null)

    try {
      let conversationToUse = currentConversation

      // Si pas de conversation courante, en créer une
      if (!conversationToUse) {
        conversationToUse = createNewConversation()
        // Attendre un petit délai pour que la conversation soit bien créée
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Ajouter le message utilisateur immédiatement au frontend pour UX fluide
      addMessageToCurrentConversation(message, "user")

      // Préparer les données pour le backend
      const backendConvId = getCurrentConversationBackendId()
      const requestBody = {
        message,
        conversationId: backendConvId
      }

      console.log("Envoi vers backend:", requestBody)

      // Envoyer la requête au backend
      const response = await fetch(getApiUrl('CHAT'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Réponse backend:", data)

      // SYNCHRONISATION CRITIQUE : Remplacer tout l'historique frontend
      // par celui renvoyé par le backend (source de vérité unique)
      if (data?.messages && Array.isArray(data.messages) && data.conversationId) {
        setIsSyncing(true)

        try {
          // Synchroniser avec les données backend complètes
          syncConversationWithBackend(data.messages, data.conversationId.toString())

          console.log("Synchronisation réussie avec", data.messages.length, "messages")
        } catch (syncError) {
          console.error("Erreur de synchronisation:", syncError)
          setLastSyncError("Erreur de synchronisation des messages")

          // Fallback : ajouter seulement la réponse
          if (data?.answer) {
            addMessageToCurrentConversation(data.answer, "assistant")
          }
        } finally {
          setIsSyncing(false)
        }
      } else {
        // Fallback si pas de messages complets retournés
        console.warn("Pas d'historique complet reçu, utilisation du fallback")
        const answer = data?.answer || "Erreur : pas de réponse reçue"
        addMessageToCurrentConversation(answer, "assistant")
      }

      // Réinitialiser le transcript vocal si utilisé
      if (transcript) {
        resetTranscript()
      }

    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)

      setLastSyncError(error instanceof Error ? error.message : "Erreur inconnue")

      // Ajouter un message d'erreur dans le chat
      const errorMessage = error instanceof Error
        ? `Erreur de connexion: ${error.message}`
        : "Erreur de connexion à l'API. Veuillez réessayer."

      addMessageToCurrentConversation(errorMessage, "assistant")

    } finally {
      setIsLoading(false)

      // Re-focus sur l'input après envoi
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && currentConversation) {
      setIsLoading(true)

      try {
        for (const file of Array.from(files)) {
          const uploadedFile = await addFile(file, currentConversation.id)
          addMessageToCurrentConversation(`📎 Fichier uploadé: ${uploadedFile.name}`, "user")
        }
      } catch (error) {
        console.error("Erreur lors de l'upload:", error)
        addMessageToCurrentConversation("❌ Erreur lors de l'upload du fichier", "assistant")
      } finally {
        setIsLoading(false)
        setShowFileUpload(false)
      }
    }
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Fonction pour gérer les touches du clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.includes("text") || type.includes("document")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getSyncStatusIcon = (message: any) => {
    if (message.synced) {
      return (
        <div title="Synchronisé">
          <CheckCircle className="h-3 w-3 text-green-500" />
        </div>
      )
    } else if (isLoading || isSyncing) {
      return (
        <div title="Synchronisation en cours">
          <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
        </div>
      )
    } else {
      return (
        <div title="En attente de synchronisation">
          <AlertCircle className="h-3 w-3 text-yellow-500" />
        </div>
      )
    }
  }

  const messages = currentConversation?.messages || []
  const conversationFiles = currentConversation ? getFilesByConversation(currentConversation.id) : []

  const suggestions = [
    "Quelles sont les idées de petit-déjeuner sain ?",
    "Comment puis-je améliorer la qualité de mon sommeil ?",
    "Quels exercices sont bons pour les maux de dos ?",
    "Parlez-moi des techniques de gestion du stress",
    "Comment maintenir une alimentation équilibrée ?",
    "Quels sont les bienfaits de la méditation ?",
  ]

  return (
    <div className={`flex flex-col h-screen transition-all duration-300 ${sidebarOpen ? "ml-80" : "ml-12"}`}>
      {/* Header avec indicateurs de synchronisation */}
      {messages.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Logo" width={24} height={24} />
            <h2 className="text-lg font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {currentConversation?.title || "Assistant"}
            </h2>

            {/* Indicateurs de statut */}
            <div className="flex items-center gap-2">
              {isSyncing && (
                <div title="Synchronisation en cours">
                  <RefreshCw className="h-4 w-4 text-teal-500 animate-spin" />
                </div>
              )}

              {currentConversation?.synced ? (
                <div title="Conversation synchronisée">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              ) : (
                <div title="Synchronisation en attente">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </div>
              )}

              {lastSyncError && (
                <div title={`Erreur: ${lastSyncError}`}>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
          </div>

          {/* Barre d'erreur */}
          {lastSyncError && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 text-center">
                ⚠️ {lastSyncError}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Messages ou écran d'accueil */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-full max-w-3xl mx-auto text-center space-y-8">
              {/* Logo */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={150}
                    height={150}
                    className="animate-pulse"
                  />
                </div>
              </div>

              {/* Input Area */}
              <div className="w-full max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Que voulez-vous savoir ?"
                      className="w-full px-6 py-4 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none rounded-2xl"
                      disabled={isLoading || contextLoading}
                    />
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFileUpload(!showFileUpload)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            disabled={isLoading}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          {showFileUpload && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-48">
                              <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload-input"
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                disabled={isLoading}
                              />
                              <Button asChild variant="ghost" size="sm" className="w-full justify-start text-sm">
                                <label htmlFor="file-upload-input" className="cursor-pointer">
                                  Télécharger des fichiers
                                </label>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSupported && (
                          <Button
                            type="button"
                            onClick={handleVoiceToggle}
                            disabled={isLoading}
                            className={`rounded-full w-8 h-8 p-0 transition-all duration-200 ${
                              isListening
                                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                            }`}
                          >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={!input.trim() || isLoading || contextLoading}
                          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full w-8 h-8 p-0"
                        >
                          {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Suggestions */}
              <div className="w-full max-w-2xl mx-auto space-y-3">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="p-4 space-y-4">
            {/* Fichiers uploadés */}
            {conversationFiles.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fichiers de cette conversation:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {conversationFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border">
                      <div className="text-teal-500">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        onClick={() => downloadFile(file)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-teal-500 hover:text-teal-600"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-in slide-in-from-bottom-2 duration-300`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-4 rounded-lg relative ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  <div className="flex items-center justify-between mt-2">
                    <p
                      className={`text-xs ${
                        message.role === "user" ? "text-teal-100" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {/* Indicateur de synchronisation du message */}
                    <div className="ml-2">
                      {getSyncStatusIcon(message)}
                    </div>
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="flex gap-4 justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input - seulement si il y a des messages */}
      {messages.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                className="w-full px-6 py-4 border-0 bg-transparent focus:ring-0 focus:outline-none rounded-2xl"
                disabled={isLoading || contextLoading}
              />
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      disabled={isLoading}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    {showFileUpload && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-48">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload-input-bottom"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          disabled={isLoading}
                        />
                        <Button asChild variant="ghost" size="sm" className="w-full justify-start text-sm">
                          <label htmlFor="file-upload-input-bottom" className="cursor-pointer">
                            Télécharger des fichiers
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSupported && (
                    <Button
                      type="button"
                      onClick={handleVoiceToggle}
                      disabled={isLoading}
                      className={`rounded-full w-8 h-8 p-0 transition-all duration-200 ${
                        isListening
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading || contextLoading}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full w-8 h-8 p-0"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}