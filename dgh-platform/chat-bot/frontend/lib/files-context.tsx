"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { generateUniqueId } from "./utils/id-generator"
import { useHydrationSafe } from "@/hooks/use-hydration-safe"

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  url: string
  conversationId?: string
}

interface FilesContextType {
  files: UploadedFile[]
  addFile: (file: File, conversationId?: string) => Promise<UploadedFile>
  deleteFile: (fileId: string) => void
  getFilesByConversation: (conversationId: string) => UploadedFile[]
  downloadFile: (file: UploadedFile) => void
}

const FilesContext = createContext<FilesContextType | undefined>(undefined)

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const isClient = useHydrationSafe()

  // Load files from localStorage on mount
  useEffect(() => {
    if (!isClient) return
    const saved = localStorage.getItem("high5-files")
    if (saved) {
      const parsedFiles = JSON.parse(saved).map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate),
      }))
      setFiles(parsedFiles)
    }
  }, [isClient])

  // Save files to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return
    
    if (files.length >= 0) {
      localStorage.setItem("high5-files", JSON.stringify(files))
    }
  }, [files, isClient])

  const addFile = async (file: File, conversationId?: string): Promise<UploadedFile> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const newFile: UploadedFile = {
          id: generateUniqueId(),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date(),
          url: reader.result as string,
          conversationId,
        }
        setFiles((prev) => [...prev, newFile])
        resolve(newFile)
      }
      reader.readAsDataURL(file)
    })
  }

  const deleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const getFilesByConversation = (conversationId: string) => {
    return files.filter((file) => file.conversationId === conversationId)
  }

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <FilesContext.Provider
      value={{
        files,
        addFile,
        deleteFile,
        getFilesByConversation,
        downloadFile,
      }}
    >
      {children}
    </FilesContext.Provider>
  )
}

export function useFiles() {
  const context = useContext(FilesContext)
  if (!context) {
    throw new Error("useFiles must be used within FilesProvider")
  }
  return context
}
