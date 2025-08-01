// lib/api-config.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    chatGroq: '/api/chat-groq/',
    chat: '/api/chat/',
    health: '/api/health/',
  }
};

// Fonction utilitaire pour construire les URLs complètes
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Configuration par défaut pour les requêtes fetch
export const defaultFetchOptions = {
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
};

// Fonction fetch avec timeout et gestion d'erreur améliorée
export const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
      signal: options.signal || controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};