"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useConversations } from "@/lib/conversation-context"
import { X, MessageSquare, Calendar } from "lucide-react"

interface HistoryPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function HistoryPopup({ isOpen, onClose }: HistoryPopupProps) {
  const { conversations, selectConversation } = useConversations()

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId)
    onClose()
  }

  const groupConversationsByDate = () => {
    const groups: { [key: string]: any[] } = {}

    conversations.forEach((conv) => {
      const date = conv.updatedAt.toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(conv)
    })

    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }

  if (!isOpen) return null

  const groupedConversations = groupConversationsByDate()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Historique des conversations</CardTitle>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-4">
            {groupedConversations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune conversation dans l'historique</p>
            ) : (
              groupedConversations.map(([date, convs]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    {new Date(date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="space-y-1 ml-6">
                    {convs.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-4 w-4 text-teal-500 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {conv.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {conv.updatedAt.toLocaleTimeString("fr-FR")} • {conv.messages.length} messages
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
