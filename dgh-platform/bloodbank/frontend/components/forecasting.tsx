import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Brain, BarChart3, Calendar, Target, AlertCircle, Sparkles, Activity, Clock,
  Lightbulb, Settings, Database, Cpu, CheckCircle, AlertTriangle, RefreshCw,
  Zap, TrendingUp, TrendingDown, WifiOff, Server, Shield, Package, Timer,
  Gauge, Info, PlayCircle, Wifi, Download
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Bar } from 'recharts'

// ==================== CONFIGURATION ET CONSTANTES ====================
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  timeout: 25000,
  retryAttempts: 3,
  retryDelay: 2000
}

const ERROR_TYPES = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
}

// ==================== API CLIENT INTÉGRÉ CORRIGÉ ====================
class EnhancedBloodForecastAPI {
  constructor(config = {}) {
    this.baseURL = config.baseURL || API_CONFIG.baseUrl
    this.timeout = config.timeout || API_CONFIG.timeout
    this.retryAttempts = config.retryAttempts || API_CONFIG.retryAttempts
    this.retryDelay = config.retryDelay || API_CONFIG.retryDelay

    this.methodsCache = null
    this.methodsCacheExpiry = null
    this.cacheValidityMs = 5 * 60 * 1000
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  isMethodsCacheValid() {
    return this.methodsCache &&
           this.methodsCacheExpiry &&
           Date.now() < this.methodsCacheExpiry
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    }

    let lastError = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url, {
          ...defaultOptions,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`HTTP ${response.status}: ${errorData.message || errorData.detail || response.statusText}`)
        }

        const data = await response.json()
        return data

      } catch (error) {
        lastError = error

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt)
        }
      }
    }

    throw lastError
  }

  async checkHealth() {
    try {
      const data = await this.makeRequest('/health/')
      return {
        status: 'healthy',
        isConnected: true,
        version: data.version || '2.0',
        database_status: data.database_status || data.database || 'connected',
        models_available: {
          xgboost: data.xgboost_available || false,
          statsmodels: data.statsmodels_available || false,
          prophet: data.prophet_available || false,
          sklearn: data.sklearn_available || true
        },
        ...data
      }
    } catch (error) {
      return {
        status: 'error',
        isConnected: false,
        error: error.message,
        models_available: {}
      }
    }
  }

  async getAvailableMethods(forceRefresh = false) {
    try {
      if (!forceRefresh && this.isMethodsCacheValid()) {
        return this.methodsCache
      }

      // 🔥 CORRECTION: Utiliser le bon endpoint pour récupérer les méthodes
      const data = await this.makeRequest('/methods/')

      // Adapter les données du backend au format attendu par le frontend
      const structuredData = this.adaptBackendMethodsToFrontend(data)

      this.methodsCache = structuredData
      this.methodsCacheExpiry = Date.now() + this.cacheValidityMs

      return structuredData

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des méthodes:', error)

      // 🔥 CORRECTION: Fallback amélioré avec toutes les méthodes possibles
      const enhancedFallbackData = {
        available_methods: [
          {
            value: 'auto',
            label: '🤖 Auto-Sélection Intelligente',
            description: 'Sélection automatique du meilleur modèle',
            recommended: true,
            available: true,
            confidence_expected: '75-90%',
            tier: 'standard'
          },
          {
            value: 'random_forest',
            label: '🌲 Random Forest',
            description: 'Apprentissage automatique robuste',
            available: true,
            confidence_expected: '70-85%',
            tier: 'standard'
          },
          {
            value: 'linear_regression',
            label: '📈 Régression Linéaire',
            description: 'Modèle simple et rapide',
            available: true,
            confidence_expected: '60-75%',
            tier: 'basic'
          },
          // 🔥 AJOUT: Méthodes manquantes avec fallback intelligent
          {
            value: 'xgboost',
            label: '🚀 XGBoost',
            description: 'Gradient boosting avancé pour données complexes',
            available: true, // On assume qu'il est disponible en production
            confidence_expected: '80-95%',
            tier: 'premium',
            good_for: 'Données complexes avec patterns non-linéaires'
          },
          {
            value: 'arima',
            label: '📊 ARIMA',
            description: 'Modèle de série temporelle classique',
            available: true, // On assume qu'il est disponible en production
            confidence_expected: '70-85%',
            tier: 'professional',
            good_for: 'Données avec tendances claires'
          },
          {
            value: 'stl_arima',
            label: '🔄 STL + ARIMA',
            description: 'Décomposition saisonnière + ARIMA',
            available: true, // On assume qu'il est disponible en production
            confidence_expected: '75-90%',
            tier: 'professional',
            good_for: 'Données avec saisonnalité marquée'
          }
        ],
        system_capabilities: {
          xgboost_available: true,
          statsmodels_available: true,
          max_forecast_days: 30,
          supported_blood_types: ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
        },
        recommended_method: 'auto',
        method_details: {},
        performance_tiers: {
          premium: ['xgboost'],
          professional: ['arima', 'stl_arima'],
          standard: ['auto', 'random_forest'],
          basic: ['linear_regression']
        },
        total_methods: 6,
        error: error.message,
        fallback_used: true
      }

      return enhancedFallbackData
    }
  }

  /**
   * 🔥 NOUVELLE MÉTHODE: Adapter les données du backend au format frontend
   */
  adaptBackendMethodsToFrontend(backendData) {
    try {
      // Si les données sont déjà au bon format
      if (backendData.available_methods && Array.isArray(backendData.available_methods)) {
        return backendData
      }

      // Si les données viennent du nouveau format backend
      if (backendData.available_methods && typeof backendData.available_methods === 'object') {
        const methodsArray = Object.entries(backendData.available_methods).map(([key, method]) => ({
          value: key,
          label: this.getMethodLabel(key, method.name),
          description: method.description || `Méthode ${method.name}`,
          available: method.available !== false,
          recommended: method.recommended || key === 'auto',
          confidence_expected: this.getExpectedConfidence(key),
          tier: this.getMethodTier(key),
          good_for: method.good_for || method.description
        }))

        return {
          available_methods: methodsArray,
          system_capabilities: backendData.system_capabilities || {
            xgboost_available: true,
            statsmodels_available: true,
            max_forecast_days: 30,
            supported_blood_types: ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
          },
          recommended_method: 'auto',
          method_details: {},
          performance_tiers: {
            premium: ['xgboost'],
            professional: ['arima', 'stl_arima'],
            standard: ['auto', 'random_forest'],
            basic: ['linear_regression']
          },
          total_methods: methodsArray.length
        }
      }

      throw new Error('Format de données backend non reconnu')

    } catch (error) {
      console.error('❌ Erreur adaptation des méthodes:', error)
      throw error
    }
  }

  /**
   * Générer le label avec emoji pour une méthode
   */
  getMethodLabel(key, name) {
    const labels = {
      'auto': '🤖 Auto-Sélection Intelligente',
      'random_forest': '🌲 Random Forest',
      'linear_regression': '📈 Régression Linéaire',
      'xgboost': '🚀 XGBoost',
      'arima': '📊 ARIMA',
      'stl_arima': '🔄 STL + ARIMA'
    }
    return labels[key] || `🔧 ${name || key.toUpperCase()}`
  }

  /**
   * Obtenir la confiance attendue pour une méthode
   */
  getExpectedConfidence(key) {
    const confidence = {
      'auto': '75-90%',
      'xgboost': '80-95%',
      'stl_arima': '75-90%',
      'arima': '70-85%',
      'random_forest': '70-85%',
      'linear_regression': '60-75%'
    }
    return confidence[key] || '70-85%'
  }

  /**
   * Obtenir le tier d'une méthode
   */
  getMethodTier(key) {
    const tiers = {
      'xgboost': 'premium',
      'arima': 'professional',
      'stl_arima': 'professional',
      'auto': 'standard',
      'random_forest': 'standard',
      'linear_regression': 'basic'
    }
    return tiers[key] || 'standard'
  }

  async generateForecast(params) {
    try {
      const requestData = {
        blood_type: params.bloodType || 'O+',
        days_ahead: parseInt(params.timeRange) || 7,
        method: params.method || 'auto',
        force_retrain: params.forceRetrain || false,
        include_confidence_intervals: true,
        include_feature_importance: true,
        include_model_metrics: true
      }

      const data = await this.makeRequest('/forecast/', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })

      const enrichedData = {
        ...data,
        generated_at: new Date().toISOString(),
        request_params: requestData,

        predictions: (data.predictions || []).map((pred, index) => ({
          ...pred,
          predicted_demand: Math.round(pred.predicted_demand || 0),
          confidence: pred.confidence || 0,
          date: pred.date,
          lower_bound: pred.lower_bound || (pred.predicted_demand * 0.8),
          upper_bound: pred.upper_bound || (pred.predicted_demand * 1.2),
          day_index: index + 1
        })),

        summary_metrics: this.calculateSummaryMetrics(data.predictions || [])
      }

      return enrichedData

    } catch (error) {
      throw new Error(`Erreur génération prévision: ${error.message}`)
    }
  }

  calculateSummaryMetrics(predictions) {
    if (!predictions || predictions.length === 0) {
      return {
        total_demand: 0,
        average_confidence: 0,
        high_demand_days: 0,
        max_demand: 0,
        trend: 'stable'
      }
    }

    const totalDemand = predictions.reduce((sum, p) => sum + (p.predicted_demand || 0), 0)
    const avgConfidence = predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length
    const highDemandDays = predictions.filter(p => (p.predicted_demand || 0) > 15).length
    const maxDemand = Math.max(...predictions.map(p => p.predicted_demand || 0))

    const firstWeek = predictions.slice(0, Math.min(3, predictions.length))
    const lastWeek = predictions.slice(-Math.min(3, predictions.length))
    const firstAvg = firstWeek.reduce((sum, p) => sum + (p.predicted_demand || 0), 0) / firstWeek.length
    const lastAvg = lastWeek.reduce((sum, p) => sum + (p.predicted_demand || 0), 0) / lastWeek.length

    let trend = 'stable'
    if (lastAvg > firstAvg * 1.1) trend = 'croissante'
    else if (lastAvg < firstAvg * 0.9) trend = 'décroissante'

    return {
      total_demand: Math.round(totalDemand),
      average_confidence: Math.round(avgConfidence * 100),
      high_demand_days: highDemandDays,
      max_demand: Math.round(maxDemand),
      trend
    }
  }

  async getSystemMetrics() {
    try {
      const data = await this.makeRequest('/system/metrics/')
      return {
        dataFreshness: data.data_freshness || 'unknown',
        lastDataUpdate: data.last_data_update,
        availableDataPoints: data.available_data_points || 0,
        modelAccuracy: data.model_accuracy,
        processingSpeed: data.processing_speed,
        ...data
      }
    } catch (error) {
      return {
        dataFreshness: 'unknown',
        availableDataPoints: 0,
        error: error.message
      }
    }
  }

  clearCache() {
    this.methodsCache = null
    this.methodsCacheExpiry = null
  }

  /**
   * 🔥 NOUVELLE MÉTHODE: Forcer le refresh des méthodes depuis le backend
   */
  async refreshMethodsFromBackend() {
    try {
      console.log('🔄 Refreshing methods from backend...')
      const methods = await this.getAvailableMethods(true)
      console.log('✅ Methods refreshed:', methods)
      return methods
    } catch (error) {
      console.error('❌ Failed to refresh methods:', error)
      throw error
    }
  }
}

// ==================== GESTIONNAIRE D'ERREURS ====================
class ForecastingErrorHandler {
  static handleAPIError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      original_error: error.message
    }

    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return {
        ...errorInfo,
        type: ERROR_TYPES.TIMEOUT,
        user_message: 'La requête prend trop de temps. Vérifiez votre connexion.',
        retry_recommended: true
      }
    }

    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return {
        ...errorInfo,
        type: ERROR_TYPES.SERVER_ERROR,
        user_message: 'Erreur serveur. Vérifiez que tous les services sont démarrés.',
        retry_recommended: true
      }
    }

    if (error.message.includes('insufficient') || error.message.includes('data')) {
      return {
        ...errorInfo,
        type: ERROR_TYPES.INSUFFICIENT_DATA,
        user_message: 'Données insuffisantes pour générer une prévision fiable.',
        retry_recommended: false
      }
    }

    return {
      ...errorInfo,
      type: ERROR_TYPES.CONNECTION_FAILED,
      user_message: 'Impossible de se connecter au serveur.',
      retry_recommended: true
    }
  }

  static getErrorRecommendations(errorType) {
    const recommendations = {
      [ERROR_TYPES.CONNECTION_FAILED]: [
        'Vérifiez que le serveur Django est démarré',
        'Contrôlez l\'URL de l\'API dans la configuration',
        'Vérifiez votre connexion réseau'
      ],
      [ERROR_TYPES.TIMEOUT]: [
        'Le modèle IA prend du temps - c\'est normal pour les premières prévisions',
        'Essayez avec un horizon temporel plus court',
        'Vérifiez les performances du serveur'
      ],
      [ERROR_TYPES.SERVER_ERROR]: [
        'Consultez les logs Django pour plus de détails',
        'Vérifiez que toutes les dépendances IA sont installées',
        'Redémarrez le serveur Django si nécessaire'
      ],
      [ERROR_TYPES.INSUFFICIENT_DATA]: [
        'Ajoutez plus de transactions dans la base de données',
        'Essayez avec un autre groupe sanguin',
        'Utilisez la méthode "auto" qui gère mieux les données limitées'
      ]
    }

    return recommendations[errorType] || ['Contactez le support technique']
  }
}

// ==================== COMPOSANT PRINCIPAL ====================
export default function EnhancedForecastingSystem() {
  // États principaux
  const [timeRange, setTimeRange] = useState("7")
  const [bloodType, setBloodType] = useState("O+")
  const [selectedMethod, setSelectedMethod] = useState("auto")
  const [isGenerating, setIsGenerating] = useState(false)
  const [forecastData, setForecastData] = useState(null)
  const [error, setError] = useState(null)
  const [forceRetrain, setForceRetrain] = useState(false)

  // États système et API
  const [apiStatus, setApiStatus] = useState({
    isConnected: false,
    isChecking: true,
    lastCheck: null,
    responseTime: null,
    error: null,
    version: null,
    databaseStatus: 'unknown',
    modelsAvailable: {}
  })

  const [availableMethods, setAvailableMethods] = useState([])
  const [isLoadingMethods, setIsLoadingMethods] = useState(true)
  const [systemCapabilities, setSystemCapabilities] = useState({})
  const [systemMetrics, setSystemMetrics] = useState({
    dataFreshness: 'unknown',
    lastDataUpdate: null,
    availableDataPoints: 0,
    modelAccuracy: null,
    processingSpeed: null
  })

  // Instance API
  const api = useMemo(() => new EnhancedBloodForecastAPI(), [])

  // Récupération des méthodes disponibles
  const fetchAvailableMethods = useCallback(async () => {
    setIsLoadingMethods(true)
    try {
      const data = await api.getAvailableMethods()

      setAvailableMethods(data.available_methods || [])
      setSystemCapabilities(data.system_capabilities || {})

      setApiStatus(prev => ({
        ...prev,
        modelsAvailable: {
          xgboost: data.system_capabilities?.xgboost_available || false,
          statsmodels: data.system_capabilities?.statsmodels_available || false,
          prophet: data.system_capabilities?.prophet_available || false,
          sklearn: data.system_capabilities?.sklearn_available || false
        }
      }))

      if (data.recommended_method && data.recommended_method !== selectedMethod) {
        setSelectedMethod(data.recommended_method)
      }

      return data
    } catch (error) {
      console.error('❌ Erreur récupération méthodes:', error)
      setAvailableMethods([
        {
          value: 'auto',
          label: '🤖 Auto-Sélection',
          description: 'Sélection automatique du meilleur modèle',
          recommended: true,
          available: true,
          confidence_expected: '75-90%',
          tier: 'standard'
        },
        {
          value: 'linear_regression',
          label: '📈 Régression Linéaire',
          description: 'Modèle simple et rapide',
          available: true,
          confidence_expected: '60-75%',
          tier: 'basic'
        }
      ])
      return null
    } finally {
      setIsLoadingMethods(false)
    }
  }, [api, selectedMethod])

  // Vérification de l'API
  const checkApiHealth = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setApiStatus(prev => ({ ...prev, isChecking: true, error: null }))
    }

    const startTime = Date.now()

    try {
      const healthData = await api.checkHealth()
      const responseTime = Date.now() - startTime

      setApiStatus({
        isConnected: healthData.isConnected,
        isChecking: false,
        lastCheck: new Date(),
        responseTime,
        error: healthData.error || null,
        version: healthData.version || '2.0',
        databaseStatus: healthData.database_status || 'unknown',
        modelsAvailable: healthData.models_available || {}
      })

      if (healthData.isConnected) {
        await fetchAvailableMethods()
        const metrics = await api.getSystemMetrics()
        setSystemMetrics(metrics)
      }

      return healthData.isConnected
    } catch (error) {
      const responseTime = Date.now() - startTime

      setApiStatus({
        isConnected: false,
        isChecking: false,
        lastCheck: new Date(),
        responseTime,
        error: error.message,
        version: null,
        databaseStatus: 'disconnected',
        modelsAvailable: {}
      })
      return false
    }
  }, [api, fetchAvailableMethods])

  // Génération de prévision
  const handleGenerateForecast = async () => {
    if (!apiStatus.isConnected) {
      setError('❌ API non connectée. Vérifiez la connexion à la base de données.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setForecastData(null)

    try {
      const data = await api.generateForecast({
        bloodType,
        timeRange,
        method: selectedMethod,
        forceRetrain
      })

      if (data.error) {
        throw new Error(data.message || 'Erreur lors de la génération')
      }

      setForecastData(data)

      if (forceRetrain) {
        setForceRetrain(false)
      }

    } catch (error) {
      const errorInfo = ForecastingErrorHandler.handleAPIError(error)
      setError(errorInfo.user_message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Forcer réentraînement
  const handleForceRetrain = () => {
    setForceRetrain(true)
    handleGenerateForecast()
  }

  // Calcul de précision
  const calculatePrecision = useMemo(() => {
    if (!forecastData) return null

    if (forecastData.quality_metrics?.prediction_confidence) {
      return Math.round(forecastData.quality_metrics.prediction_confidence * 100)
    }

    if (forecastData.model_performance) {
      const mapeValues = Object.values(forecastData.model_performance)
      if (mapeValues.length > 0 && mapeValues[0]?.mape !== undefined) {
        const mape = mapeValues[0].mape
        return Math.max(0, Math.round(100 - mape))
      }
    }

    if (forecastData.predictions && Array.isArray(forecastData.predictions)) {
      const avgConfidence = forecastData.predictions.reduce((acc, pred) =>
        acc + (pred.confidence || 0), 0) / forecastData.predictions.length
      return Math.round(avgConfidence * 100)
    }

    return null
  }, [forecastData])

  // Initialisation
  useEffect(() => {
    checkApiHealth()

    const interval = setInterval(() => {
      if (!isGenerating) {
        checkApiHealth(false)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [checkApiHealth, isGenerating])

  // Données pour graphique
  const chartData = useMemo(() => {
    if (!forecastData?.predictions || !Array.isArray(forecastData.predictions)) {
      return []
    }

    return forecastData.predictions.map((pred, index) => ({
      date: new Date(pred.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      }),
      demand: Math.round(pred.predicted_demand || 0),
      confidence: Math.round((pred.confidence || 0) * 100),
      lower: Math.round(pred.lower_bound || (pred.predicted_demand * 0.8)),
      upper: Math.round(pred.upper_bound || (pred.predicted_demand * 1.2)),
      day: `Jour ${index + 1}`
    }))
  }, [forecastData])

  // Métriques système enrichies
  const enrichedSystemMetrics = useMemo(() => [
    {
      label: "Base de Données",
      value: apiStatus.databaseStatus === 'connected' ? "Connectée" : "Déconnectée",
      icon: apiStatus.databaseStatus === 'connected' ? Database : AlertTriangle,
      color: apiStatus.databaseStatus === 'connected' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      trend: apiStatus.responseTime ? `${apiStatus.responseTime}ms` : "N/A",
      description: "Accès aux données réelles de transactions"
    },
    {
      label: "Précision du Modèle",
      value: calculatePrecision ? `${calculatePrecision}%` : "N/A",
      icon: Target,
      color: calculatePrecision > 80 ? "text-green-600 dark:text-green-400" :
             calculatePrecision > 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400",
      trend: forecastData?.model_performance ?
        `MAPE: ${Object.values(forecastData.model_performance)[0]?.mape?.toFixed(1) || 'N/A'}%` : "N/A",
      description: "Précision calculée sur données historiques réelles"
    },
    {
      label: "Méthode IA Active",
      value: (() => {
        if (!forecastData?.method_used) return "N/A"
        const method = availableMethods.find(m => m.value === forecastData.method_used)
        return method && method.name ? method.name.replace(/[🤖🔬🌲⚡📈]/g, '').trim() :
               forecastData.method_used.toUpperCase().replace('_', ' ')
      })(),
      icon: Brain,
      color: "text-purple-600 dark:text-purple-400",
      trend: forecastData?.data_source === 'real_database' ? "Données Réelles" :
             forecastData?.data_source === 'enhanced_real_database' ? "Données Enrichies" : "N/A",
      description: "Algorithme sélectionné automatiquement"
    },
    {
      label: "Données Disponibles",
      value: forecastData?.data_points_used ? `${forecastData.data_points_used} pts` :
             systemMetrics.availableDataPoints ? `${systemMetrics.availableDataPoints} pts` : "N/A",
      icon: Activity,
      color: "text-teal-600 dark:text-teal-400",
      trend: forecastData?.quality_metrics?.data_freshness || systemMetrics.dataFreshness || "Inconnue",
      description: "Points de données historiques utilisés"
    }
  ], [apiStatus, calculatePrecision, forecastData, availableMethods, systemMetrics])

  // Méthodes organisées
  const organizedMethods = useMemo(() => {
    const categories = {
      premium: { label: "Premium", methods: [], icon: "⭐" },
      professional: { label: "Professionnel", methods: [], icon: "🚀" },
      standard: { label: "Standard", methods: [], icon: "✅" },
      basic: { label: "Basique", methods: [], icon: "📊" }
    }

    availableMethods.forEach(method => {
      const tier = method.tier || 'standard'
      if (categories[tier]) {
        categories[tier].methods.push(method)
      }
    })

    return categories
  }, [availableMethods])

  // Alertes critiques
  const criticalAlerts = useMemo(() => {
    if (!forecastData?.predictions || !Array.isArray(forecastData.predictions)) {
      return []
    }

    const alerts = []
    const highDemandDays = forecastData.predictions.filter(pred => pred.predicted_demand > 15)
    const lowConfidenceDays = forecastData.predictions.filter(pred => pred.confidence < 0.6)

    if (highDemandDays.length > 0) {
      alerts.push({
        type: 'high_demand',
        severity: 'critical',
        message: `${highDemandDays.length} jour(s) avec forte demande prédite`,
        details: highDemandDays.map(d => `${new Date(d.date).toLocaleDateString()}: ${Math.round(d.predicted_demand)} unités`),
        action: 'Prévoir stock supplémentaire'
      })
    }

    if (lowConfidenceDays.length > 2) {
      alerts.push({
        type: 'low_confidence',
        severity: 'warning',
        message: `Confiance réduite sur ${lowConfidenceDays.length} prédictions`,
        details: 'Surveiller de près les tendances réelles',
        action: 'Monitoring renforcé'
      })
    }

    if (forecastData.contextual_insights?.stock_days_remaining < 3) {
      alerts.push({
        type: 'critical_stock',
        severity: 'critical',
        message: `Stock critique: ${forecastData.contextual_insights.stock_days_remaining} jours restants`,
        details: `Stock actuel: ${forecastData.contextual_insights.current_stock} unités`,
        action: 'Collecte urgente nécessaire'
      })
    }

    return alerts.slice(0, 3)
  }, [forecastData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 sm:p-6 space-y-6">

        {/* En-tête avec statut système */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                🧠 Système de Prévision IA
              </h1>
              <div className="flex items-center space-x-2">
                {apiStatus.isConnected ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                )}
                {apiStatus.isChecking && (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                )}
              </div>
            </div>
            <p className="text-base lg:text-lg text-muted-foreground mt-2 flex items-center">
              <Database className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Prédictions alimentées par vos vraies données de transactions</span>
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Server className="w-4 h-4 mr-1" />
                <span>API v{apiStatus.version || '2.0'}</span>
              </div>
              {apiStatus.lastCheck && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Dernière vérif: {apiStatus.lastCheck.toLocaleTimeString()}</span>
                </div>
              )}
              <div className="flex items-center">
                <Badge variant="outline" className={`${
                  forecastData?.data_source?.includes('real') 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {forecastData?.data_source?.includes('real') ? '✅ Données Réelles' : '⏳ En Attente'}
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="border-purple-200 text-purple-700">
                  <Brain className="w-3 h-3 mr-1" />
                  {availableMethods.length} Méthodes IA
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => checkApiHealth()}
              disabled={apiStatus.isChecking}
              className="hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${apiStatus.isChecking ? 'animate-spin' : ''}`} />
              Vérifier Système
            </Button>
            <Button
              variant="outline"
              onClick={handleForceRetrain}
              disabled={isGenerating || !apiStatus.isConnected}
              className="hover:scale-105 transition-all duration-200 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Zap className="w-4 h-4 mr-2" />
              Réentraîner
            </Button>
            <Button
              onClick={handleGenerateForecast}
              disabled={isGenerating || !apiStatus.isConnected}
              className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 transition-all duration-300 hover:scale-105"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer Prévision
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Alertes système */}
        {!apiStatus.isConnected && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50/80 dark:bg-red-950/50">
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-red-800 dark:text-red-200">
                  🔌 Système Déconnecté
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {apiStatus.error || "Impossible d'accéder à la base de données des transactions"}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Vérifiez que votre serveur Django est démarré et que la base de données contient des transactions.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-l-4 border-l-orange-500 bg-orange-50/80 dark:bg-orange-950/50">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription>
              <p className="font-medium text-orange-800 dark:text-orange-200">⚠️ Erreur de Prévision</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Métriques système */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {enrichedSystemMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {metric.label}
                  </CardTitle>
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-xl sm:text-2xl font-bold ${metric.color} mb-1`}>
                    {metric.value}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex-1">{metric.description}</p>
                    <Badge variant="outline" className="text-xs ml-2">
                      {metric.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Configuration avancée */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
              <Settings className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Configuration des Prévisions IA
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Paramètres de prédiction avec {availableMethods.length} méthodes IA disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Horizon Temporel</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 jours</SelectItem>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="14">14 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Groupe Sanguin</label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="O+">O+ (Universel+)</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="O-">O- (Universel-)</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center">
                  Algorithme IA
                  <Info className="w-3 h-3 ml-1 text-gray-400" />
                  {isLoadingMethods && (
                    <RefreshCw className="w-3 h-3 ml-2 animate-spin text-blue-500" />
                  )}
                </label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chargement des méthodes..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(organizedMethods).map(([tier, category]) => {
                      if (category.methods.length === 0) return null
                      return (
                        <div key={tier}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                            {category.icon} {category.label} ({category.methods.length})
                          </div>
                          {category.methods.map((method) => (
                            <SelectItem
                              key={method.value}
                              value={method.value}
                              className={`${!method.available ? 'opacity-50' : ''}`}
                              disabled={!method.available}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="flex-1">{method.name}</span>
                                <div className="flex items-center space-x-1 ml-2">
                                  {method.recommended && (
                                    <Badge variant="secondary" className="text-xs">
                                      Recommandé
                                    </Badge>
                                  )}
                                  {method.confidence_expected && (
                                    <Badge variant="outline" className="text-xs">
                                      {method.confidence_expected}
                                    </Badge>
                                  )}
                                  {!method.available && (
                                    <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                                      Indisponible
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGenerateForecast}
                  disabled={isGenerating || !apiStatus.isConnected || isLoadingMethods}
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  {isGenerating ? (
                    <>
                      <Timer className="w-4 h-4 mr-2 animate-pulse" />
                      Analyse en cours...
                    </>
                  ) : isLoadingMethods ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Exécuter IA
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Indicateurs de capacités système */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                <Server className="w-4 h-4 mr-2" />
                Capacités du Système IA
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    apiStatus.modelsAvailable.xgboost ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={apiStatus.modelsAvailable.xgboost ? 'text-green-700' : 'text-red-700'}>
                    XGBoost
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    apiStatus.modelsAvailable.statsmodels ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={apiStatus.modelsAvailable.statsmodels ? 'text-green-700' : 'text-red-700'}>
                    ARIMA/STL
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    apiStatus.modelsAvailable.prophet ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={apiStatus.modelsAvailable.prophet ? 'text-green-700' : 'text-red-700'}>
                    Prophet
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    apiStatus.modelsAvailable.sklearn ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={apiStatus.modelsAvailable.sklearn ? 'text-green-700' : 'text-red-700'}>
                    Scikit-Learn
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertes critiques */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-3">
            {criticalAlerts.map((alert, index) => (
              <Alert key={index} className={`border-l-4 ${
                alert.severity === 'critical' 
                  ? 'border-l-red-500 bg-red-50/80 dark:bg-red-950/50' 
                  : 'border-l-yellow-500 bg-yellow-50/80 dark:bg-yellow-950/50'
              }`}>
                <AlertCircle className={`h-4 w-4 ${
                  alert.severity === 'critical' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className={`font-medium ${
                      alert.severity === 'critical' 
                        ? 'text-red-800 dark:text-red-200' 
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {alert.severity === 'critical' ? '🚨' : '⚠️'} {alert.message}
                    </p>
                    {typeof alert.details === 'string' ? (
                      <p className={`text-sm ${
                        alert.severity === 'critical' 
                          ? 'text-red-700 dark:text-red-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {alert.details}
                      </p>
                    ) : (
                      <div className={`text-sm ${
                        alert.severity === 'critical' 
                          ? 'text-red-700 dark:text-red-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {alert.details?.map((detail, i) => (
                          <p key={i}>• {detail}</p>
                        ))}
                      </div>
                    )}
                    <div className={`text-xs font-medium ${
                      alert.severity === 'critical' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      👉 Action: {alert.action}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Graphique principal */}
        {forecastData && chartData.length > 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Prévision de Demande - {bloodType}
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={`${
                    forecastData.data_source?.includes('real')
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                  }`}>
                    {(() => {
                      const method = availableMethods.find(m => m.value === forecastData.method_used)
                      return method && method.name ? method.name.replace(/[🤖🔬🌲⚡📈]/g, '').trim() :
                             forecastData.method_used?.toUpperCase().replace('_', ' ') || 'UNKNOWN'
                    })()}
                  </Badge>
                  {calculatePrecision && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      Précision: {calculatePrecision}%
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>
                  Prédictions générées le {new Date(forecastData.generated_at).toLocaleString()}
                  {forecastData.data_source?.includes('real') && (
                    <span className="text-green-600 ml-2">• Basé sur vos vraies données</span>
                  )}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                    label={{ value: 'Unités', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'demand') return [`${value} unités`, 'Demande Prédite']
                      if (name === 'confidence') return [`${value}%`, 'Confiance']
                      if (name === 'lower') return [`${value} unités`, 'Borne Inférieure']
                      if (name === 'upper') return [`${value} unités`, 'Borne Supérieure']
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />

                  {/* Zone de confiance */}
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stackId="1"
                    stroke="none"
                    fill="rgba(59, 130, 246, 0.1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stackId="1"
                    stroke="none"
                    fill="#ffffff"
                  />

                  {/* Barres de confiance */}
                  <Bar
                    dataKey="confidence"
                    fill="url(#confidenceGradient)"
                    opacity={0.6}
                    radius={[2, 2, 0, 0]}
                  />

                  {/* Ligne principale de demande */}
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#1D4ED8' }}
                  />

                  {/* Ligne de seuil critique */}
                  <ReferenceLine
                    y={15}
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    label={{ value: "Seuil Critique", position: "topRight" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Légende enrichie */}
              <div className="mt-4 flex flex-wrap items-center justify-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
                  <span>Demande Prédite</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-2 bg-blue-200 mr-2 rounded"></div>
                  <span>Zone de Confiance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-2 bg-green-200 mr-2 rounded"></div>
                  <span>Niveau de Confiance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-0.5 bg-red-500 border-dashed mr-2"></div>
                  <span>Seuil Critique</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !apiStatus.isConnected ? (
          <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="w-16 h-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Base de Données Déconnectée
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-4">
                Impossible d'accéder aux données de transactions. Vérifiez la connexion à votre base de données.
              </p>
              <Button
                onClick={() => checkApiHealth()}
                variant="outline"
                disabled={apiStatus.isChecking}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${apiStatus.isChecking ? 'animate-spin' : ''}`} />
                Reconnecter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="w-16 h-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Prêt pour l'Analyse IA
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-4">
                {availableMethods.length} méthodes IA disponibles. Cliquez sur "Générer Prévision" pour analyser vos données.
              </p>
              <Button
                onClick={handleGenerateForecast}
                disabled={!apiStatus.isConnected || isLoadingMethods}
                className="bg-gradient-to-r from-blue-500 to-teal-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Démarrer l'Analyse
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Détails des prédictions */}
        {forecastData?.predictions && Array.isArray(forecastData.predictions) && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
                  Analyse Détaillée des Prédictions
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    <Target className="w-3 h-3 mr-1" />
                    Précision: {calculatePrecision || 'N/A'}%
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Prédictions détaillées avec analyse de confiance et recommandations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {forecastData.predictions.map((prediction, index) => {
                  const demand = Math.round(prediction.predicted_demand || 0)
                  const confidence = prediction.confidence || 0
                  const isHighDemand = demand > 15
                  const isMediumDemand = demand > 8 && demand <= 15
                  const isLowConfidence = confidence < 0.6

                  return (
                    <Card
                      key={`${prediction.date}-${index}`}
                      className={`transition-all duration-200 hover:scale-105 ${
                        isHighDemand 
                          ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20' 
                          : isMediumDemand 
                          ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
                          : 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
                      } ${isLowConfidence ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              {new Date(prediction.date).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                              Jour {index + 1}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge
                              className={`text-xs ${
                                isHighDemand ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                                isMediumDemand ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                                'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              }`}
                            >
                              {isHighDemand ? 'Élevé' : isMediumDemand ? 'Moyen' : 'Normal'}
                            </Badge>
                            {isLowConfidence && (
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                Confiance faible
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Demande</span>
                            <div className="flex items-center space-x-2">
                              {(prediction.lower_bound !== undefined && prediction.upper_bound !== undefined) && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  [{Math.round(prediction.lower_bound)}-{Math.round(prediction.upper_bound)}]
                                </span>
                              )}
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {demand} unités
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Confiance</span>
                              <span className={`font-semibold ${
                                confidence > 0.8 ? 'text-green-600 dark:text-green-400' :
                                confidence > 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-orange-600 dark:text-orange-400'
                              }`}>
                                {Math.round(confidence * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={confidence * 100}
                              className={`h-2 ${
                                confidence > 0.8 ? 'bg-green-100' :
                                confidence > 0.6 ? 'bg-yellow-100' :
                                'bg-orange-100'
                              }`}
                            />

                            {/* Indicateur de fiabilité visuel */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400">Fiabilité</span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <div
                                    key={star}
                                    className={`w-2 h-2 rounded-full ${
                                      star <= Math.ceil(confidence * 5) 
                                        ? confidence > 0.8 ? 'bg-green-400' :
                                          confidence > 0.6 ? 'bg-yellow-400' : 'bg-orange-400'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Analyse contextuelle du jour */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-slate-600 dark:text-slate-400">Analyse du jour</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className={`text-xs px-1 py-0 ${
                                  new Date(prediction.date).getDay() === 0 || new Date(prediction.date).getDay() === 6
                                    ? 'border-blue-300 text-blue-700 bg-blue-50'
                                    : new Date(prediction.date).getDay() === 1 || new Date(prediction.date).getDay() === 2
                                    ? 'border-purple-300 text-purple-700 bg-purple-50'
                                    : 'border-gray-300 text-gray-700 bg-gray-50'
                                }`}>
                                  {new Date(prediction.date).getDay() === 0 || new Date(prediction.date).getDay() === 6 ? 'Weekend' :
                                   new Date(prediction.date).getDay() === 1 || new Date(prediction.date).getDay() === 2 ? 'Pic' : 'Normal'}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center text-xs">
                              {isHighDemand ? (
                                <>
                                  <Zap className="w-3 h-3 mr-1 text-red-500" />
                                  <span className="text-red-600 dark:text-red-400 font-medium">Action urgente requise</span>
                                </>
                              ) : isMediumDemand ? (
                                <>
                                  <Clock className="w-3 h-3 mr-1 text-yellow-500" />
                                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Surveillance recommandée</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                  <span className="text-green-600 dark:text-green-400 font-medium">Demande normale</span>
                                </>
                              )}
                            </div>

                            {/* Recommandation spécifique */}
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                              {isHighDemand ?
                                `📈 Prévoir +${Math.ceil(demand * 0.3)} unités de sécurité` :
                                isMediumDemand ?
                                `⚖️ Stock optimal: ${Math.ceil(demand * 1.1)} unités` :
                                `✅ Gestion standard suffisante`
                              }
                            </div>

                            {isLowConfidence && (
                              <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                                ⚠️ Surveiller de près - confiance réduite
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Résumé des prédictions */}
              <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Résumé de la Période
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(forecastData.predictions.reduce((acc, p) => acc + (p.predicted_demand || 0), 0))}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Total Demande</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(forecastData.predictions.reduce((acc, p) => acc + (p.confidence || 0), 0) / forecastData.predictions.length * 100)}%
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Confiance Moyenne</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {forecastData.predictions.filter(p => p.predicted_demand > 15).length}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Jours Critiques</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(Math.max(...forecastData.predictions.map(p => p.predicted_demand || 0)))}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Pic Maximum</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights IA et Recommandations */}
        {forecastData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights IA */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Insights IA Avancés
                </CardTitle>
                <CardDescription>
                  Analyse intelligente basée sur {forecastData.data_points_used || 'vos'} points de données réelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/50 dark:to-teal-950/50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Pic de Demande Prévu
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {(() => {
                      const maxPred = forecastData.predictions?.reduce((max, p) =>
                        (p.predicted_demand || 0) > (max.predicted_demand || 0) ? p : max
                      )
                      return maxPred ? (
                        <>
                          Le {new Date(maxPred.date).toLocaleDateString('fr-FR')} avec{' '}
                          <strong>{Math.round(maxPred.predicted_demand)} unités</strong>
                          {' '}(confiance: {Math.round(maxPred.confidence * 100)}%)
                        </>
                      ) : 'Aucun pic significatif détecté'
                    })()}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Analyse de Tendance
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(() => {
                      if (!forecastData.predictions || forecastData.predictions.length < 2) return 'Données insuffisantes'

                      const firstDemand = forecastData.predictions[0].predicted_demand || 0
                      const lastDemand = forecastData.predictions[forecastData.predictions.length - 1].predicted_demand || 0
                      const trend = lastDemand > firstDemand ? 'croissante' : lastDemand < firstDemand ? 'décroissante' : 'stable'
                      const change = Math.abs(lastDemand - firstDemand)

                      return (
                        <>
                          Tendance <strong>{trend}</strong>
                          {change > 0 && ` (${change > firstDemand * 0.1 ? 'significative' : 'légère'})`}
                        </>
                      )
                    })()}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                    <Gauge className="w-4 h-4 mr-2" />
                    Qualité du Modèle
                  </h4>
                  <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Confiance moyenne:</span>
                      <span className="font-semibold">
                        {Math.round((forecastData.predictions?.reduce((acc, p) => acc + (p.confidence || 0), 0) || 0) /
                        (forecastData.predictions?.length || 1) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Précision calculée:</span>
                      <span className="font-semibold">
                        {calculatePrecision || 'N/A'}%
                      </span>
                    </div>
                    {forecastData.model_performance && (
                      <div className="flex justify-between">
                        <span>Erreur MAPE:</span>
                        <span className="font-semibold">
                          {Object.values(forecastData.model_performance)[0]?.mape?.toFixed(1) || 'N/A'}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Méthode IA Utilisée
                  </h4>
                  <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Algorithme:</span>
                      <span className="font-semibold">
                        {(() => {
                          const method = availableMethods.find(m => m.value === forecastData.method_used)
                          return method && method.name ? method.name.replace(/[🤖🔬🌲⚡📈]/g, '').trim() :
                                 forecastData.method_used?.toUpperCase().replace('_', ' ') || 'N/A'
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source des données:</span>
                      <span className="font-semibold">
                        {forecastData.data_source?.includes('real') ? 'Base de données réelle' :
                         forecastData.data_source?.includes('enhanced') ? 'Données enrichies' : 'N/A'}
                      </span>
                    </div>
                    {forecastData.data_points_used && (
                      <div className="flex justify-between">
                        <span>Points utilisés:</span>
                        <span className="font-semibold">{forecastData.data_points_used} points</span>
                      </div>
                    )}
                    {forecastData.generation_time_ms && (
                      <div className="flex justify-between">
                        <span>Temps de génération:</span>
                        <span className="font-semibold">{(forecastData.generation_time_ms / 1000).toFixed(2)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommandations */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Recommandations Intelligentes
                </CardTitle>
                <CardDescription>
                  Actions suggérées basées sur l'analyse IA ({forecastData.method_used || 'méthode avancée'})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-lg">
                  <h5 className="font-medium text-teal-800 dark:text-teal-200 mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Recommandations Automatiques IA
                  </h5>
                  <ul className="text-sm text-teal-700 dark:text-teal-300 space-y-1">
                    <li>• Surveiller les niveaux de stock pour {bloodType}</li>
                    <li>• Planifier les collectes selon la demande prédite</li>
                    <li>• Optimiser la rotation des stocks</li>
                    {forecastData.predictions?.some(p => p.predicted_demand > 15) && (
                      <li className="font-medium">• ⚠️ Préparer du stock supplémentaire pour les pics prévus</li>
                    )}
                    {forecastData.predictions?.some(p => p.confidence < 0.6) && (
                      <li className="font-medium">• 👁️ Surveillance renforcée requise (confiance variable)</li>
                    )}
                    <li>• 📊 Modèle utilisé: {(() => {
                      const method = availableMethods.find(m => m.value === forecastData.method_used)
                      return method && method.name ? method.name.replace(/[🤖🔬🌲⚡📈]/g, '').trim() :
                             forecastData.method_used?.replace('_', ' ') || 'Méthode avancée'
                    })()} - Précision {calculatePrecision || 'N/A'}%</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg">
                  <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Optimisation du Modèle
                  </h5>
                  <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    {forecastData.method_used?.includes('fallback') ? (
                      <>
                        <p>• ⚠️ Données insuffisantes détectées</p>
                        <p>• 📊 Augmenter la fréquence d'enregistrement des transactions</p>
                        <p>• 🔄 Réentraîner le modèle dès que plus de données sont disponibles</p>
                      </>
                    ) : forecastData.model_performance && Object.values(forecastData.model_performance)[0]?.mape > 25 ? (
                      <>
                        <p>• 📈 Précision du modèle à améliorer</p>
                        <p>• 🔄 Réentraînement recommandé avec plus de données</p>
                        <p>• 👁️ Validation manuelle des prédictions conseillée</p>
                      </>
                    ) : (
                      <>
                        <p>• ✅ Modèle performant - confiance élevée ({calculatePrecision || 'N/A'}%)</p>
                        <p>• 📊 Continuer l'enregistrement régulier des données</p>
                        <p>• 🎯 Utiliser les prédictions pour l'optimisation</p>
                        <p>• 🚀 Méthode {(() => {
                          const method = availableMethods.find(m => m.value === forecastData.method_used)
                          return method?.tier || 'standard'
                        })()} active avec {forecastData.data_points_used || 'N/A'} points</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informations système détaillées */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    Système de Prévision IA - Production avec Vraies Données
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {forecastData?.generated_at ?
                      `Dernière prévision: ${new Date(forecastData.generated_at).toLocaleString()}` :
                      'Aucune prévision générée'
                    }
                  </p>
                  <div className="flex items-center mt-1 space-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center">
                      <Database className="w-3 h-3 mr-1" />
                      <span>DB: {apiStatus.databaseStatus}</span>
                    </div>
                    {apiStatus.responseTime && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Latence: {apiStatus.responseTime}ms</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Brain className="w-3 h-3 mr-1" />
                      <span>{availableMethods.length} méthodes IA</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge
                  variant="outline"
                  className={`${
                    apiStatus.isConnected 
                      ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                  }`}
                >
                  <Server className="w-3 h-3 mr-1" />
                  {apiStatus.isConnected ? 'Système Opérationnel' : 'Système Déconnecté'}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  <Database className="w-3 h-3 mr-1" />
                  Données Réelles - Base de Production
                </Badge>
                {apiStatus.version && (
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    API v{apiStatus.version}
                  </Badge>
                )}
              </div>
            </div>

            {/* Métrique de santé du système */}
            {forecastData && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {forecastData.predictions?.length || 0}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Prédictions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {calculatePrecision || 'N/A'}%
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Précision</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {Math.round((forecastData.predictions?.reduce((acc, p) => acc + (p.confidence || 0), 0) || 0) /
                      (forecastData.predictions?.length || 1) * 100)}%
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Confiance</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      {forecastData.data_source?.includes('real') ? '✅' : '⏳'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Données</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {(() => {
                        const method = availableMethods.find(m => m.value === forecastData.method_used)
                        return method?.tier?.charAt(0).toUpperCase() || '?'
                      })()}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Tier IA</div>
                  </div>
                </div>
              </div>
            )}

            {/* Statut des dépendances */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Statut des Dépendances IA
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-2 rounded text-center ${
                  apiStatus.modelsAvailable.xgboost 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className={`text-xs font-medium ${
                    apiStatus.modelsAvailable.xgboost ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    XGBoost
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {apiStatus.modelsAvailable.xgboost ? 'Installé' : 'Manquant'}
                  </div>
                </div>
                <div className={`p-2 rounded text-center ${
                  apiStatus.modelsAvailable.statsmodels 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className={`text-xs font-medium ${
                    apiStatus.modelsAvailable.statsmodels ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    StatsModels
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {apiStatus.modelsAvailable.statsmodels ? 'Installé' : 'Manquant'}
                  </div>
                </div>
                <div className={`p-2 rounded text-center ${
                  apiStatus.modelsAvailable.prophet 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className={`text-xs font-medium ${
                    apiStatus.modelsAvailable.prophet ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    Prophet
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {apiStatus.modelsAvailable.prophet ? 'Installé' : 'Manquant'}
                  </div>
                </div>
                <div className={`p-2 rounded text-center ${
                  apiStatus.modelsAvailable.sklearn 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className={`text-xs font-medium ${
                    apiStatus.modelsAvailable.sklearn ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    Scikit-Learn
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {apiStatus.modelsAvailable.sklearn ? 'Installé' : 'Manquant'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section d'export et actions avancées */}
        {forecastData && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Download className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Actions et Export
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  Données Disponibles
                </Badge>
              </CardTitle>
              <CardDescription>
                Exportez vos prédictions et gérez les analyses pour une utilisation externe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const exportData = {
                      metadata: {
                        generated_at: forecastData.generated_at,
                        blood_type: bloodType,
                        time_range: timeRange,
                        method_used: forecastData.method_used,
                        precision: calculatePrecision,
                        data_points_used: forecastData.data_points_used
                      },
                      predictions: forecastData.predictions,
                      summary: forecastData.summary_metrics,
                      model_performance: forecastData.model_performance
                    }

                    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                      type: 'application/json'
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `forecast_${bloodType}_${new Date().toISOString().split('T')[0]}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const csvContent = [
                      ['Date', 'Demande Prédite', 'Confiance (%)', 'Borne Inf', 'Borne Sup'],
                      ...forecastData.predictions.map(pred => [
                        pred.date,
                        Math.round(pred.predicted_demand || 0),
                        Math.round((pred.confidence || 0) * 100),
                        Math.round(pred.lower_bound || 0),
                        Math.round(pred.upper_bound || 0)
                      ])
                    ].map(row => row.join(',')).join('\n')

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `forecast_${bloodType}_${new Date().toISOString().split('T')[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(forecastData.predictions, null, 2))
                      .then(() => {
                        alert('Données copiées dans le presse-papiers!')
                      })
                      .catch(err => {
                        console.error('Erreur copie:', err)
                      })
                  }}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Copier JSON
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const reportContent = `
RAPPORT DE PRÉVISION IA - ${bloodType}
=====================================

Généré le: ${new Date(forecastData.generated_at).toLocaleString()}
Méthode utilisée: ${forecastData.method_used}
Précision du modèle: ${calculatePrecision || 'N/A'}%
Points de données: ${forecastData.data_points_used || 'N/A'}

RÉSUMÉ EXÉCUTIF:
- Demande totale prédite: ${forecastData.summary_metrics?.total_demand || 'N/A'} unités
- Confiance moyenne: ${forecastData.summary_metrics?.average_confidence || 'N/A'}%
- Jours à forte demande: ${forecastData.summary_metrics?.high_demand_days || 0}
- Pic maximum: ${forecastData.summary_metrics?.max_demand || 'N/A'} unités
- Tendance: ${forecastData.summary_metrics?.trend || 'N/A'}

PRÉDICTIONS DÉTAILLÉES:
${forecastData.predictions?.map((pred, i) => 
  `Jour ${i+1} (${pred.date}): ${Math.round(pred.predicted_demand || 0)} unités (${Math.round((pred.confidence || 0) * 100)}% confiance)`
).join('\n') || 'Aucune prédiction disponible'}

RECOMMANDATIONS:
- Surveiller les niveaux de stock pour ${bloodType}
- Planifier les collectes selon la demande prédite
${forecastData.predictions?.some(p => p.predicted_demand > 15) ? '- ⚠️ ATTENTION: Pics de demande détectés - prévoir stock supplémentaire' : ''}
${forecastData.predictions?.some(p => p.confidence < 0.6) ? '- 👁️ Surveillance renforcée requise (confiance variable sur certains jours)' : ''}

Ce rapport a été généré automatiquement par le Système de Prévision IA.
                    `

                    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `rapport_forecast_${bloodType}_${new Date().toISOString().split('T')[0]}.txt`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Rapport Complet
                </Button>
              </div>

              {/* Statistiques d'export */}
              <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg">
                <h5 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">
                  📊 Statistiques de l'Export
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {forecastData.predictions?.length || 0}
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400">Points de données</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {forecastData.generation_time_ms ? `${(forecastData.generation_time_ms / 1000).toFixed(1)}s` : 'N/A'}
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400">Temps génération</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {new Date(forecastData.generated_at).toLocaleDateString()}
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400">Date création</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {forecastData.data_source?.includes('real') ? 'Production' : 'Test'}
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400">Environnement</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer avec informations techniques */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-1" />
                <span>Système de Prévision IA v2.0</span>
              </div>
              <div className="flex items-center">
                <Database className="w-4 h-4 mr-1" />
                <span>Données Réelles en Production</span>
              </div>
              <div className="flex items-center">
                <Server className="w-4 h-4 mr-1" />
                <span>API Django Backend</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {availableMethods.length} Algorithmes IA
              </Badge>
              <Badge variant="outline" className="text-xs">
                React Frontend
              </Badge>
              <Badge variant="outline" className="text-xs">
                Recharts Visualisation
              </Badge>
              {forecastData && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Prévision Active
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              🧬 Système professionnel de gestion des stocks sanguins avec intelligence artificielle
              • Prédictions basées sur vos vraies données de transactions
              • Algorithmes d'apprentissage automatique adaptatifs
              • Interface moderne et intuitive pour la prise de décision
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}