"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useConversations } from "@/lib/conversation-context"
import { Search, X, MessageSquare } from "lucide-react"

interface SearchPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const { searchConversations, selectConversation } = useConversations()

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchConversations(searchQuery)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, searchConversations])

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Rechercher dans les conversations</CardTitle>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {searchQuery.trim() === "" ? (
              <p className="text-center text-gray-500 py-8">Tapez pour rechercher dans vos conversations</p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun résultat trouvé</p>
            ) : (
              searchResults.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-4 w-4 text-teal-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {conv.updatedAt.toLocaleDateString()} • {conv.messages.length} messages
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
