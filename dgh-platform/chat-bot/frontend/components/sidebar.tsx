"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { useConversations } from "@/lib/conversation-context"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { RenameModal } from "@/components/rename-modal"
import { SearchPopup } from "@/components/search-popup"
import { HistoryPopup } from "@/components/history-popup"
import { FilesPopup } from "@/components/files-popup"
import {
  Plus,
  Search,
  File,
  History,
  User,
  ChevronRight,
  MessageSquare,
  LogOut,
  Sun,
  Moon,
  MoreVertical,
  Trash2,
  Edit3,
  X,
} from "lucide-react"
import Image from "next/image"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onShowLogin: () => void
}

export function Sidebar({ isOpen, onToggle, onShowLogin }: SidebarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const {
    conversations,
    currentConversation,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    searchConversations,
  } = useConversations()

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState(conversations)
  const [showSearchPopup, setShowSearchPopup] = useState(false)
  const [showHistoryPopup, setShowHistoryPopup] = useState(false)
  const [showFilesPopup, setShowFilesPopup] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; conversationId: string; title: string }>({
    isOpen: false,
    conversationId: "",
    title: "",
  })
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; conversationId: string; title: string }>({
    isOpen: false,
    conversationId: "",
    title: "",
  })

  useEffect(() => {
    setFilteredConversations(searchConversations(searchQuery))
  }, [searchQuery, conversations, searchConversations])

  const handleNewChat = () => {
    createNewConversation()
    setSearchQuery("")
  }

  const handleDeleteClick = (conversationId: string, title: string) => {
    setDeleteModal({ isOpen: true, conversationId, title })
  }

  const handleDeleteConfirm = () => {
    deleteConversation(deleteModal.conversationId)
    setDeleteModal({ isOpen: false, conversationId: "", title: "" })
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, conversationId: "", title: "" })
  }

  const handleRenameClick = (conversationId: string, title: string) => {
    setRenameModal({ isOpen: true, conversationId, title })
  }

  const handleRenameConfirm = (newTitle: string) => {
    renameConversation(renameModal.conversationId, newTitle)
    setRenameModal({ isOpen: false, conversationId: "", title: "" })
  }

  const handleRenameCancel = () => {
    setRenameModal({ isOpen: false, conversationId: "", title: "" })
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return "À l'instant"
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Compact Sidebar */}
      <div className="fixed left-0 top-0 h-full w-12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 z-30">
        {/* Logo */}
        <div className="mb-6">
          <Image src="/logo.png" alt="Logo" width={24} height={24} className="opacity-80" />
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col gap-3 flex-1">
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
            title="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setShowSearchPopup(true)}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
            title="Rechercher"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setShowFilesPopup(true)}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
            title="Fichiers"
          >
            <File className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setShowHistoryPopup(true)}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
            title="Historique"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
            title={theme === "light" ? "Mode sombre" : "Mode clair"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 bg-teal-500 hover:bg-teal-600 text-white transition-all duration-200"
                  title={user.name}
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-48">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={onShowLogin}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
              title="Se connecter"
            >
              <User className="h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
            title="Développer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
              </div>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleNewChat}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle conversation
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "Aucune conversation trouvée" : "Aucune conversation"}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentConversation?.id === conv.id
                        ? "bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 text-teal-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(conv.updatedAt)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 text-gray-400 hover:text-gray-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRenameClick(conv.id, conv.title)
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(conv.id, conv.title)
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30" onClick={onToggle} />}

      {/* Popups */}
      <SearchPopup isOpen={showSearchPopup} onClose={() => setShowSearchPopup(false)} />
      <HistoryPopup isOpen={showHistoryPopup} onClose={() => setShowHistoryPopup(false)} />
      <FilesPopup isOpen={showFilesPopup} onClose={() => setShowFilesPopup(false)} />

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        conversationTitle={deleteModal.title}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <RenameModal
        isOpen={renameModal.isOpen}
        currentTitle={renameModal.title}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />
    </>
  )
}
