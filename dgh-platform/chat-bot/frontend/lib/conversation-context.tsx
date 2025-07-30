"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { getApiUrl } from "./config"
import { generateUniqueId } from "./utils/id-generator"
import { useHydrationSafe } from "@/hooks/use-hydration-safe"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  // Nouveaux champs pour synchronisation
  backendId?: string
  synced?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  // Nouveau : ID backend pour synchronisation
  backendId?: string
  synced?: boolean
}

interface ConversationContextType {
  conversations: Conversation[]
  currentConversation: Conversation | null
  isLoading: boolean
  createNewConversation: () => Conversation
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, newTitle: string) => void
  addMessageToCurrentConversation: (content: string, role: "user" | "assistant") => void
  searchConversations: (query: string) => Conversation[]
  // Nouvelles méthodes pour synchronisation
  syncConversationWithBackend: (backendMessages: any[], backendConvId: string) => void
  loadConversationFromBackend: (backendConvId: string) => Promise<void>
  loadAllConversationsFromBackend: () => Promise<void>
  getCurrentConversationBackendId: () => string | null
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isClient = useHydrationSafe()

  // Load conversations from localStorage on mount
  useEffect(() => {
    if (!isClient) return
    
    const loadConversations = () => {
      try {
        const saved = localStorage.getItem("high5-conversations")
        if (saved) {
          const parsedConversations = JSON.parse(saved).map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages?.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })) || [],
          }))
          setConversations(parsedConversations)

          // Set the most recent conversation as current
          if (parsedConversations.length > 0) {
            const mostRecent = parsedConversations.sort(
              (a: Conversation, b: Conversation) => b.updatedAt.getTime() - a.updatedAt.getTime(),
            )[0]
            setCurrentConversation(mostRecent)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des conversations:", error)
        // En cas d'erreur, nettoyer le localStorage
        localStorage.removeItem("high5-conversations")
      }
    }

    loadConversations()
  }, [isClient])

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return
    
    try {
      if (conversations.length > 0) {
        localStorage.setItem("high5-conversations", JSON.stringify(conversations))
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }, [conversations, isClient])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateUniqueId(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false, // Pas encore synchronisé avec le backend
    }

    setConversations((prev) => [newConversation, ...prev])
    setCurrentConversation(newConversation)

    return newConversation
  }

  const selectConversation = (id: string) => {
    const conversation = conversations.find((conv) => conv.id === id)
    if (conversation) {
      setCurrentConversation(conversation)
    }
  }

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id))

    // If deleting current conversation, set to null or first available
    if (currentConversation?.id === id) {
      const remaining = conversations.filter((conv) => conv.id !== id)
      setCurrentConversation(remaining.length > 0 ? remaining[0] : null)
    }
  }

  const renameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id
          ? { ...conv, title: newTitle, updatedAt: new Date() }
          : conv
      )
    )

    if (currentConversation?.id === id) {
      setCurrentConversation((prev) =>
        prev ? { ...prev, title: newTitle, updatedAt: new Date() } : null
      )
    }
  }

  const addMessageToCurrentConversation = (content: string, role: "user" | "assistant") => {
    if (!currentConversation) return

    const newMessage: Message = {
      id: generateUniqueId(),
      content,
      role,
      timestamp: new Date(),
      synced: false, // Pas encore synchronisé
    }

    // Auto-update title based on first user message
    let newTitle = currentConversation.title
    if (currentConversation.messages.length === 0 && role === "user") {
      newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "")
    }

    const updatedConversation: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: new Date(),
      title: newTitle,
      synced: false, // Marquer comme non synchronisé
    }

    setCurrentConversation(updatedConversation)
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    )
  }

  // NOUVELLE MÉTHODE : Synchroniser avec les données du backend
  const syncConversationWithBackend = (backendMessages: any[], backendConvId: string) => {
    if (!currentConversation) return

    // Convertir les messages backend en format frontend
    const syncedMessages: Message[] = (backendMessages || []).map((msg, index) => ({
      id: msg.id ? `backend-${msg.id}` : `backend-${backendConvId}-${index}`,
      content: msg.content || '',
      role: msg.role === "user" ? "user" : "assistant" as "user" | "assistant",
      timestamp: new Date(msg.timestamp || Date.now()),
      backendId: msg.id ? msg.id.toString() : `${backendConvId}-${index}`,
      synced: true,
    }))

    const updatedConversation: Conversation = {
      ...currentConversation,
      messages: syncedMessages,
      backendId: backendConvId,
      synced: true,
      updatedAt: new Date(),
    }

    setCurrentConversation(updatedConversation)
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    )
  }

  // NOUVELLE MÉTHODE : Charger une conversation depuis le backend
  const loadConversationFromBackend = async (backendConvId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl('CONVERSATIONS', `${backendConvId}/`), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()

        // Vérifier si la conversation existe déjà
        const existingConv = conversations.find(c => c.backendId === backendConvId)

        if (existingConv) {
          // Mettre à jour la conversation existante
          syncConversationWithBackend(data.messages, backendConvId)
        } else {
          // Créer une nouvelle conversation
          const newConversation: Conversation = {
            id: `frontend-${Date.now()}`,
            title: data.title || "Conversation récupérée",
            messages: (data.messages || []).map((msg: any, index: number) => ({
              id: msg.id ? `backend-${msg.id}` : `backend-${backendConvId}-${index}`,
              content: msg.content || '',
              role: msg.role === "user" ? "user" : "assistant" as "user" | "assistant",
              timestamp: new Date(msg.timestamp || Date.now()),
              backendId: msg.id ? msg.id.toString() : `${backendConvId}-${index}`,
              synced: true,
            })),
            createdAt: new Date(data.created_at || Date.now()),
            updatedAt: new Date(data.updated_at || Date.now()),
            backendId: backendConvId,
            synced: true,
          }

          setConversations(prev => [newConversation, ...prev])
          setCurrentConversation(newConversation)
        }
      } else {
        console.error("Erreur lors du chargement de la conversation:", response.status)
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NOUVELLE MÉTHODE : Charger toutes les conversations depuis le backend
  const loadAllConversationsFromBackend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl('CONVERSATIONS'), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()

        if (data.conversations && Array.isArray(data.conversations)) {
          const backendConversations: Conversation[] = data.conversations.map((conv: any) => ({
            id: `backend-${conv.id}`,
            title: conv.title || `Conversation ${conv.id}`,
            messages: [], // On chargera les messages à la demande
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
            backendId: conv.id.toString(),
            synced: true,
          }))

          // Fusionner avec les conversations locales existantes
          setConversations(prev => {
            const merged = [...prev]

            backendConversations.forEach(backendConv => {
              const existingIndex = merged.findIndex(conv => conv.backendId === backendConv.backendId)
              if (existingIndex >= 0) {
                // Mettre à jour la conversation existante
                merged[existingIndex] = { ...merged[existingIndex], ...backendConv }
              } else {
                // Ajouter la nouvelle conversation
                merged.push(backendConv)
              }
            })

            return merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          })
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NOUVELLE MÉTHODE : Obtenir l'ID backend de la conversation courante
  const getCurrentConversationBackendId = (): string | null => {
    return currentConversation?.backendId || null
  }

  const searchConversations = (query: string): Conversation[] => {
    if (!query.trim()) return conversations

    const lowercaseQuery = query.toLowerCase()
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(lowercaseQuery) ||
        conv.messages.some((msg) => msg.content.toLowerCase().includes(lowercaseQuery)),
    )
  }

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversation,
        isLoading,
        createNewConversation,
        selectConversation,
        deleteConversation,
        renameConversation,
        addMessageToCurrentConversation,
        searchConversations,
        syncConversationWithBackend,
        loadConversationFromBackend,
        loadAllConversationsFromBackend,
        getCurrentConversationBackendId,
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversations() {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error("useConversations must be used within ConversationProvider")
  }
  return context
}

// Hook utilitaire pour la synchronisation automatique
export function useAutoSync() {
  const { loadAllConversationsFromBackend } = useConversations()

  useEffect(() => {
    // Charger les conversations au démarrage
    loadAllConversationsFromBackend()

    // Optionnel : Synchronisation périodique (toutes les 5 minutes)
    const interval = setInterval(() => {
      loadAllConversationsFromBackend()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [loadAllConversationsFromBackend])
}