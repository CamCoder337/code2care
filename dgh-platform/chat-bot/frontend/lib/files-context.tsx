// File: lib/files-context.tsx
"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface FileData {
  id: string
  name: string
  size: number
  type: string
  url?: string
  conversationId: string
  uploadedAt: Date
}

interface FilesContextType {
  files: FileData[]
  addFile: (file: File, conversationId: string) => Promise<FileData>
  getFilesByConversation: (conversationId: string) => FileData[]
  downloadFile: (file: FileData) => void
  deleteFile: (fileId: string) => void
}

const FilesContext = createContext<FilesContextType | undefined>(undefined)

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileData[]>([])

  const addFile = useCallback(async (file: File, conversationId: string): Promise<FileData> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const fileData: FileData = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target?.result as string,
          conversationId,
          uploadedAt: new Date(),
        }

        setFiles(prev => [...prev, fileData])
        resolve(fileData)
      }

      reader.onerror = () => {
        // On error, still resolve with basic file info
        const fileData: FileData = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          conversationId,
          uploadedAt: new Date(),
        }

        setFiles(prev => [...prev, fileData])
        resolve(fileData)
      }

      reader.readAsDataURL(file)
    })
  }, [])

  const getFilesByConversation = useCallback((conversationId: string): FileData[] => {
    return files.filter(file => file.conversationId === conversationId)
  }, [files])

  const downloadFile = useCallback((file: FileData) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      console.warn('File URL not available for download')
    }
  }, [])

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const value: FilesContextType = {
    files,
    addFile,
    getFilesByConversation,
    downloadFile,
    deleteFile,
  }

  return (
    <FilesContext.Provider value={value}>
      {children}
    </FilesContext.Provider>
  )
}

export function useFiles(): FilesContextType {
  const context = useContext(FilesContext)
  if (context === undefined) {
    throw new Error('useFiles must be used within a FilesProvider')
  }
  return context
}

// File: lib/theme-context.tsx
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const root = window.document.documentElement
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    
    root.classList.remove("light", "dark")
    
    if (theme === "system") {
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// File: lib/auth-context.tsx
"use client"

import React, { createContext, useContext, useState } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock successful login
    if (email && password) {
      setUser({
        id: "1",
        email,
        name: email.split("@")[0],
      })
      setIsLoading(false)
      return true
    }
    
    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}