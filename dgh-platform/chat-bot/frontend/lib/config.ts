export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  ENDPOINTS: {
    CHAT: process.env.NEXT_PUBLIC_CHAT_ENDPOINT || '/chat-groq/',
    CONVERSATIONS: process.env.NEXT_PUBLIC_CONVERSATIONS_ENDPOINT || '/conversations/',
  }
} as const

export const getApiUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS, suffix = '') => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}${suffix}`
}