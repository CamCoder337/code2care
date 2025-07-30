"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit3 } from "lucide-react"

interface RenameModalProps {
  isOpen: boolean
  currentTitle: string
  onConfirm: (newTitle: string) => void
  onCancel: () => void
}

export function RenameModal({ isOpen, currentTitle, onConfirm, onCancel }: RenameModalProps) {
  const [newTitle, setNewTitle] = useState(currentTitle)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTitle.trim()) {
      onConfirm(newTitle.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
              <Edit3 className="h-6 w-6 text-teal-500" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Rename Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title..."
              className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-teal-200 text-teal-600 hover:bg-teal-50 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
              >
                Rename
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
