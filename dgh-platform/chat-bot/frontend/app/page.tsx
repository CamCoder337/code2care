"use client"

import { ChatInterface } from "@/components/chat-interface"
import { ConversationProvider } from "@/lib/conversation-context"

// Minimal Error Boundary
function SimpleErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// Minimal Theme Provider
function SimpleThemeProvider({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// Minimal Auth Provider
function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// Minimal Files Provider
function SimpleFilesProvider({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export default function Page(): React.JSX.Element {
  return (
    <SimpleErrorBoundary>
      <SimpleThemeProvider>
        <SimpleAuthProvider>
          <ConversationProvider>
            <SimpleFilesProvider>
              <div className="h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 overflow-hidden">
                <ChatInterface sidebarOpen={false} />
              </div>
            </SimpleFilesProvider>
          </ConversationProvider>
        </SimpleAuthProvider>
      </SimpleThemeProvider>
    </SimpleErrorBoundary>
  )
}