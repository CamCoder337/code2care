"use client"

import { useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { ConversationProvider } from "@/lib/conversation-context"
import { FilesProvider } from "@/lib/files-context"
import { LanguageProvider } from "@/lib/language-context"

import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSpinner } from "@/components/loading-spinner"


// Lazy loading des composants pour réduire le bundle initial
const Sidebar = dynamic(() => import("@/components/sidebar").then(mod => ({ default: mod.Sidebar })), {
  loading: () => <div className="w-12 h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />,
  ssr: false
})

const ChatInterface = dynamic(() => import("@/components/chat-interface").then(mod => ({ default: mod.ChatInterface })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const LoginForm = dynamic(() => import("@/components/login-form").then(mod => ({ default: mod.LoginForm })), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><LoadingSpinner /></div>,
  ssr: false
})

function ChatApp(): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [showLogin, setShowLogin] = useState<boolean>(false)

  const handleSidebarToggle = (): void => {
    setSidebarOpen(prev => !prev)
  }

  const handleShowLogin = (): void => {
    setShowLogin(true)
  }

  const handleCloseLogin = (): void => {
    setShowLogin(false)
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 overflow-hidden">
        <Suspense fallback={<div className="w-12 h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={handleSidebarToggle}
            onShowLogin={handleShowLogin}
          />
        </Suspense>

        <Suspense fallback={<LoadingSpinner />}>
          <ChatInterface sidebarOpen={sidebarOpen} />
        </Suspense>

        {showLogin && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><LoadingSpinner /></div>}>
            <LoginForm onClose={handleCloseLogin} />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default function Page(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <ConversationProvider>
              <FilesProvider>
                <ChatApp />
              </FilesProvider>
            </ConversationProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}