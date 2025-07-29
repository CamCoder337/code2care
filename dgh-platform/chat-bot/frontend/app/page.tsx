"use client"

import { useState } from "react"

export default function Page() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Array<{ id: string, content: string, role: "user" | "assistant" }>>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Ajouter le message utilisateur
    const userMsg = { id: Date.now().toString(), content: message, role: "user" as const }
    setMessages(prev => [...prev, userMsg])

    // Simuler une réponse
    setTimeout(() => {
      const botMsg = { id: (Date.now() + 1).toString(), content: "Merci pour votre message !", role: "assistant" as const }
      setMessages(prev => [...prev, botMsg])
    }, 1000)

    setMessage("")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Chat2Care</h1>

        {/* Messages */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-800 border'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}