"use client"

import { useState } from "react"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { ConversationProvider } from "@/lib/conversation-context"
import { FilesProvider } from "@/lib/files-context"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { LoginForm } from "@/components/login-form"
import { ClientOnly } from "@/components/client-only"

function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200" suppressHydrationWarning>
      <ClientOnly>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onShowLogin={() => setShowLogin(true)}
        />
        <ChatInterface sidebarOpen={sidebarOpen} />
        {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
      </ClientOnly>
    </div>
  )
}

export default function Page() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConversationProvider>
          <FilesProvider>
            <ChatApp />
          </FilesProvider>
        </ConversationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
