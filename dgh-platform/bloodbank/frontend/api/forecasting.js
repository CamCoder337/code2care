// frontend/api/forecasting.js
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  retryAttempts: 3
}

export class ForecastingAPIClient {

  async generateForecast(params) {
    const response = await fetch(`${API_CONFIG.baseUrl}/forecast/real-data/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Use-AI-System': 'true', // Déclenche le système IA
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  }

  async checkHealth() {
    const response = await fetch(`${API_CONFIG.baseUrl}/health/`)
    return await response.json()
  }

  async getAvailableMethods() {
    const response = await fetch(`${API_CONFIG.baseUrl}/methods/`)
    return await response.json()
  }
}

export const apiClient = new ForecastingAPIClient()