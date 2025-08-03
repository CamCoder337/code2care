import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Brain,
  BarChart3,
  Calendar,
  Target,
  AlertCircle,
  Download,
  Sparkles,
  Activity,
  Clock,
  Lightbulb,
  Settings,
  Globe,
  Cpu,
  Menu,
  X,
  Shield,
  Database,
  Wifi,
  WifiOff,
  Server,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'

// Configuration API
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
}

// Traductions
const translations = {
  fr: {
    title: "Système de Prévision IA",
    subtitle: "Prédictions de demande en temps réel alimentées par l'apprentissage automatique",
    settings: "Paramètres",
    exportReport: "Exporter Rapport",
    generateForecast: "Générer Prévision",
    generating: "Génération en cours...",
    modelAccuracy: "Précision du Modèle",
    aiMethod: "Méthode IA",
    confidenceScore: "Score de Confiance",
    processingSpeed: "Vitesse de Traitement",
    forecastConfig: "Configuration des Prévisions",
    timeHorizon: "Horizon Temporel",
    bloodType: "Groupe Sanguin",
    aiAlgorithm: "Algorithme IA",
    runForecast: "Exécuter Prévision",
    processing: "Traitement...",
    criticalAlerts: "Alertes Critiques",
    demandForecast: "Prévision de Demande",
    aiInsights: "Insights IA",
    peakDemand: "Pic de Demande",
    trendAnalysis: "Analyse de Tendance",
    modelConfidence: "Confiance du Modèle",
    recommendations: "Recommandations",
    detailedForecast: "Détail des Prévisions",
    dayByDay: "Prédictions détaillées avec intervalles de confiance",
    high: "Élevé",
    medium: "Moyen",
    low: "Faible",
    demand: "Demande",
    confidence: "Confiance",
    units: "unités",
    days: "jours",
    increasing: "Croissante",
    decreasing: "Décroissante",
    apiConnected: "API Connectée",
    apiDisconnected: "API Déconnectée",
    noData: "Aucune donnée disponible",
    connectingToApi: "Connexion à l'API...",
    apiError: "Erreur API",
    retrying: "Nouvelle tentative...",
    dataFresh: "Données fraîches",
    dataStale: "Données obsolètes"
  },
  en: {
    title: "AI Forecasting System",
    subtitle: "Real-time demand predictions powered by machine learning",
    settings: "Settings",
    exportReport: "Export Report",
    generateForecast: "Generate Forecast",
    generating: "Generating...",
    modelAccuracy: "Model Accuracy",
    aiMethod: "AI Method",
    confidenceScore: "Confidence Score",
    processingSpeed: "Processing Speed",
    forecastConfig: "Forecast Configuration",
    timeHorizon: "Time Horizon",
    bloodType: "Blood Type",
    aiAlgorithm: "AI Algorithm",
    runForecast: "Run Forecast",
    processing: "Processing...",
    criticalAlerts: "Critical Alerts",
    demandForecast: "Demand Forecast",
    aiInsights: "AI Insights",
    peakDemand: "Peak Demand",
    trendAnalysis: "Trend Analysis",
    modelConfidence: "Model Confidence",
    recommendations: "Recommendations",
    detailedForecast: "Detailed Forecast",
    dayByDay: "Detailed predictions with confidence intervals",
    high: "High",
    medium: "Medium",
    low: "Low",
    demand: "Demand",
    confidence: "Confidence",
    units: "units",
    days: "days",
    increasing: "Increasing",
    decreasing: "Decreasing",
    apiConnected: "API Connected",
    apiDisconnected: "API Disconnected",
    noData: "No data available",
    connectingToApi: "Connecting to API...",
    apiError: "API Error",
    retrying: "Retrying...",
    dataFresh: "Data Fresh",
    dataStale: "Data Stale"
  }
}

export default function EnhancedForecastingSystem() {
  // États principaux
  const [timeRange, setTimeRange] = useState("7")
  const [bloodType, setBloodType] = useState("O+")
  const [method, setMethod] = useState("auto")
  const [isGenerating, setIsGenerating] = useState(false)
  const [forecastData, setForecastData] = useState(null)
  const [error, setError] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // États de connectivité et API
  const [apiStatus, setApiStatus] = useState({
    isConnected: false,
    isChecking: true,
    lastCheck: null,
    responseTime: null,
    error: null,
    version: null
  })

  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  // Configuration langue
  const [language, setLanguage] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.language.startsWith('fr') ? 'fr' : 'en'
    }
    return 'en'
  })

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const t = translations[language]

  // Fonction utilitaire pour les délais
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Fonction de vérification de l'API avec retry
  const checkApiHealth = async (attempt = 1) => {
    const startTime = Date.now()

    try {
      setApiStatus(prev => ({ ...prev, isChecking: true, error: null }))

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        const healthData = await response.json()
        setApiStatus({
          isConnected: true,
          isChecking: false,
          lastCheck: new Date(),
          responseTime,
          error: null,
          version: healthData.version || 'Unknown'
        })
        setRetryCount(0)
        return true
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error(`API Health Check failed (attempt ${attempt}):`, error.message)

      if (attempt < API_CONFIG.retryAttempts) {
        setIsRetrying(true)
        await delay(API_CONFIG.retryDelay * attempt)
        setRetryCount(attempt)
        return await checkApiHealth(attempt + 1)
      }

      setApiStatus({
        isConnected: false,
        isChecking: false,
        lastCheck: new Date(),
        responseTime,
        error: error.message,
        version: null
      })
      setIsRetrying(false)
      return false
    }
  }

  // Fonction pour appeler l'API de prévision
  const callForecastApi = async (config) => {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      const requestBody = {
        blood_type: config.bloodType,
        forecast_period_days: parseInt(config.timeRange),
        method: config.method === 'auto' ? null : config.method,
        include_confidence_intervals: true,
        include_optimization: true
      }

      console.log('📡 Sending forecast request:', requestBody)

      const response = await fetch(`${API_CONFIG.baseUrl}/forecast/`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API Error ${response.status}: ${errorData.detail || response.statusText}`)
      }

      const data = await response.json()
      const generationTime = Date.now() - startTime

      console.log('✅ Forecast data received:', data)

      return {
        ...data,
        generation_time_ms: generationTime,
        generated_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Forecast API call failed:', error)
      throw error
    }
  }

  // Fonction principale de génération de prévision
  const handleGenerateForecast = async () => {
    if (!apiStatus.isConnected) {
      setError('API non connectée. Veuillez vérifier la connexion.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setForecastData(null)

    try {
      const data = await callForecastApi({ bloodType, timeRange, method })
      setForecastData(data)
      console.log('🎯 Forecast generated successfully')

    } catch (error) {
      console.error('💥 Forecast generation failed:', error)
      setError(`Erreur lors de la génération: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Vérification périodique de l'API
  useEffect(() => {
    checkApiHealth()

    const interval = setInterval(() => {
      if (!isGenerating) {
        checkApiHealth()
      }
    }, 30000) // Vérifier toutes les 30 secondes

    return () => clearInterval(interval)
  }, [isGenerating])

  // Transformation des données pour le graphique
  const chartData = useMemo(() => {
    if (!forecastData?.predictions || !Array.isArray(forecastData.predictions)) {
      return []
    }

    return forecastData.predictions.map((pred, index) => ({
      date: new Date(pred.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit',
        month: '2-digit'
      }),
      demand: pred.predicted_demand || 0,
      confidence: Math.round((pred.confidence || 0) * 100),
      lower: forecastData.confidence_intervals?.lower?.[index] || pred.predicted_demand * 0.8,
      upper: forecastData.confidence_intervals?.upper?.[index] || pred.predicted_demand * 1.2
    }))
  }, [forecastData, language])

  // Métriques système
  const systemMetrics = [
    {
      label: "Statut API",
      value: apiStatus.isConnected ? "Connectée" : "Déconnectée",
      icon: apiStatus.isConnected ? Wifi : WifiOff,
      color: apiStatus.isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      trend: apiStatus.responseTime ? `${apiStatus.responseTime}ms` : "N/A",
      description: apiStatus.error || (apiStatus.isConnected ? "Opérationnelle" : "Vérification...")
    },
    {
      label: t.modelAccuracy,
      value: forecastData?.model_accuracy?.accuracy || "N/A",
      icon: Target,
      color: "text-blue-600 dark:text-blue-400",
      trend: forecastData?.model_accuracy?.samples ? `${forecastData.model_accuracy.samples} échantillons` : "N/A",
      description: forecastData?.model_accuracy?.last_training ?
        `Entraîné le ${new Date(forecastData.model_accuracy.last_training).toLocaleDateString()}` :
        "En attente de données"
    },
    {
      label: t.aiMethod,
      value: forecastData?.method_used?.toUpperCase() || "N/A",
      icon: Brain,
      color: "text-purple-600 dark:text-purple-400",
      trend: forecastData?.enhanced_forecasting_available ? "Avancé" : "Standard",
      description: "Algorithme sélectionné automatiquement"
    },
    {
      label: t.processingSpeed,
      value: forecastData?.generation_time_ms ? `${(forecastData.generation_time_ms / 1000).toFixed(2)}s` : "N/A",
      icon: Cpu,
      color: "text-teal-600 dark:text-teal-400",
      trend: forecastData?.generation_time_ms < 5000 ? "Rapide" : "Standard",
      description: "Temps de génération dernière prévision"
    }
  ]

  // Alertes critiques basées sur les données réelles
  const criticalAlerts = useMemo(() => {
    if (!forecastData?.predictions || !Array.isArray(forecastData.predictions)) {
      return []
    }

    return forecastData.predictions
      .filter(pred => pred.predicted_demand > 15)
      .slice(0, 3)
      .map(pred => ({
        ...pred,
        severity: pred.predicted_demand > 20 ? 'critical' : 'high',
        message: `Forte demande prédite: ${pred.predicted_demand} unités`
      }))
  }, [forecastData])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

        {/* En-tête avec statut API */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                {t.title}
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
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2 flex items-center">
              <Database className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{t.subtitle}</span>
            </p>
            {apiStatus.lastCheck && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernière vérification: {apiStatus.lastCheck.toLocaleTimeString()}
                {apiStatus.version && ` | API v${apiStatus.version}`}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => checkApiHealth()}
              disabled={apiStatus.isChecking}
              className="hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${apiStatus.isChecking ? 'animate-spin' : ''}`} />
              Vérifier API
            </Button>
            <Button
              onClick={handleGenerateForecast}
              disabled={isGenerating || !apiStatus.isConnected}
              className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 transition-all duration-300 hover:scale-105"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t.generating}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.generateForecast}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Alerte de statut API */}
        {!apiStatus.isConnected && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50/80 dark:bg-red-950/50">
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-red-800 dark:text-red-200">
                  🔌 API Déconnectée
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {apiStatus.error || "Impossible de se connecter au serveur de prévisions"}
                </p>
                {isRetrying && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    🔄 Tentative de reconnexion... ({retryCount}/{API_CONFIG.retryAttempts})
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Erreurs de génération */}
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
          {systemMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card
                key={metric.label}
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

        {/* Configuration des prévisions */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
              <Settings className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              {t.forecastConfig}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Configurer les paramètres de prédiction IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t.timeHorizon}</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 {t.days}</SelectItem>
                    <SelectItem value="7">7 {t.days}</SelectItem>
                    <SelectItem value="14">14 {t.days}</SelectItem>
                    <SelectItem value="30">30 {t.days}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t.bloodType}</label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les Types</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t.aiAlgorithm}</label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Auto-Sélection</SelectItem>
                    <SelectItem value="stl_arima">📈 STL+ARIMA</SelectItem>
                    <SelectItem value="arima">📊 ARIMA</SelectItem>
                    <SelectItem value="random_forest">🌲 Random Forest</SelectItem>
                    <SelectItem value="xgboost">⚡ XGBoost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerateForecast}
                  disabled={isGenerating || !apiStatus.isConnected}
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  {isGenerating ? t.processing : t.runForecast}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertes critiques - Seulement si données disponibles */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50/80 dark:bg-red-950/50">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-red-800 dark:text-red-200">⚠️ {t.criticalAlerts}</p>
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className="text-sm text-red-700 dark:text-red-300">
                    • {new Date(alert.date).toLocaleDateString()} - {alert.message}
                    (Confiance: {Math.round(alert.confidence * 100)}%)
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Graphique principal - Seulement si données disponibles */}
        {forecastData && chartData.length > 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  {t.demandForecast} - {bloodType}
                </div>
                <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  {forecastData.method_used?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Prédictions générées le {new Date(forecastData.generated_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#E5E7EB"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                  <YAxis stroke={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
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
                    fill={isDarkMode ? "#1E293B" : "#ffffff"}
                  />
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <ReferenceLine y={15} stroke="#EF4444" strokeDasharray="5 5" label="Seuil Critique" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : !apiStatus.isConnected ? (
          <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <WifiOff className="w-16 h-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                {t.apiDisconnected}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
                {t.connectingToApi}
              </p>
              <Button
                onClick={() => checkApiHealth()}
                variant="outline"
                className="mt-4"
                disabled={apiStatus.isChecking}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${apiStatus.isChecking ? 'animate-spin' : ''}`} />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-16 h-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                {t.noData}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-4">
                Cliquez sur "{t.generateForecast}" pour obtenir des prédictions de demande
              </p>
              <Button
                onClick={handleGenerateForecast}
                disabled={!apiStatus.isConnected}
                className="bg-gradient-to-r from-blue-500 to-teal-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t.generateForecast}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Détails des prédictions - Version améliorée avec plus d'informations techniques */}
        {forecastData?.predictions && Array.isArray(forecastData.predictions) && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
                {t.detailedForecast}
              </CardTitle>
              <CardDescription>
                {t.dayByDay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {forecastData.predictions.map((prediction, index) => {
                  const demand = prediction.predicted_demand || 0
                  const confidence = prediction.confidence || 0
                  const isHighDemand = demand > 15
                  const isMediumDemand = demand > 8 && demand <= 15

                  return (
                    <Card
                      key={`${prediction.date}-${index}`}
                      className={`transition-all duration-200 hover:scale-105 ${
                        isHighDemand 
                          ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20' 
                          : isMediumDemand 
                          ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
                          : 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              {new Date(prediction.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                              Jour {index + 1}
                            </div>
                          </div>
                          <Badge
                            className={`text-xs ${
                              isHighDemand ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                              isMediumDemand ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                              'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            }`}
                          >
                            {isHighDemand ? t.high : isMediumDemand ? t.medium : t.low}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{t.demand}</span>
                            <div className="flex items-center space-x-2">
                              {prediction.lower_bound && prediction.upper_bound && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  [{prediction.lower_bound}-{prediction.upper_bound}]
                                </span>
                              )}
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {demand} {t.units}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">{t.confidence}</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {Math.round(confidence * 100)}%
                              </span>
                            </div>
                            <Progress value={confidence * 100} className="h-2" />

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

                          {/* Détails techniques supplémentaires */}
                          {prediction.seasonal_component !== undefined && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <div className="flex justify-between">
                                  <span>Composante saisonnière:</span>
                                  <span className="font-mono">{prediction.seasonal_component}</span>
                                </div>
                                {prediction.trend_component !== undefined && (
                                  <div className="flex justify-between">
                                    <span>Tendance:</span>
                                    <span className="font-mono">{prediction.trend_component}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Analyse du jour spécifique */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Analyse du jour</span>
                              <div className="flex items-center space-x-2">
                                {/* Indicateur de jour de semaine */}
                                <Badge variant="outline" className={`text-xs px-1 py-0 ${
                                  new Date(prediction.date).getDay() === 0 || new Date(prediction.date).getDay() === 6
                                    ? 'border-blue-300 text-blue-700 bg-blue-50'
                                    : new Date(prediction.date).getDay() === 1 || new Date(prediction.date).getDay() === 2
                                    ? 'border-red-300 text-red-700 bg-red-50'
                                    : 'border-gray-300 text-gray-700 bg-gray-50'
                                }`}>
                                  {new Date(prediction.date).getDay() === 0 || new Date(prediction.date).getDay() === 6 ? 'Weekend' :
                                   new Date(prediction.date).getDay() === 1 || new Date(prediction.date).getDay() === 2 ? 'Pic' : 'Normal'}
                                </Badge>

                                {/* Indicateur de variabilité */}
                                <Badge variant="outline" className={`text-xs px-1 py-0 ${
                                  confidence > 0.8 ? 'border-green-300 text-green-700 bg-green-50' :
                                  confidence > 0.6 ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                                  'border-orange-300 text-orange-700 bg-orange-50'
                                }`}>
                                  {confidence > 0.8 ? 'Stable' : confidence > 0.6 ? 'Variable' : 'Incertain'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
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

                            {/* Recommandation spécifique au jour */}
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                              {isHighDemand ?
                                `📈 Prévoir +${Math.ceil(demand * 0.3)} unités de sécurité` :
                                isMediumDemand ?
                                `⚖️ Stock optimal: ${Math.ceil(demand * 1.1)} unités` :
                                `✅ Gestion standard suffisante`
                              }
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights IA - Seulement si données disponibles */}
        {forecastData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  {t.aiInsights}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/50 dark:to-teal-950/50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{t.peakDemand}</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Pic prévu le {forecastData.predictions?.reduce((max, p) =>
                      (p.predicted_demand || 0) > (max.predicted_demand || 0) ? p : max
                    )?.date ? new Date(forecastData.predictions.reduce((max, p) =>
                      (p.predicted_demand || 0) > (max.predicted_demand || 0) ? p : max
                    ).date).toLocaleDateString() : 'N/A'} avec {
                      Math.max(...(forecastData.predictions?.map(p => p.predicted_demand || 0) || [0]))
                    } unités
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{t.trendAnalysis}</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Tendance générale : {
                      forecastData.predictions?.length > 1 ?
                        ((forecastData.predictions[forecastData.predictions.length - 1].predicted_demand || 0) >
                         (forecastData.predictions[0].predicted_demand || 0)) ? t.increasing : t.decreasing :
                        'Stable'
                    }
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">{t.modelConfidence}</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Confiance moyenne: {
                      Math.round((forecastData.predictions?.reduce((acc, p) => acc + (p.confidence || 0), 0) || 0) /
                      (forecastData.predictions?.length || 1) * 100)
                    }%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  {t.recommendations}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {forecastData.optimization_recommendations?.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
                      rec.priority === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                      rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                      'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {rec.type?.replace('_', ' ') || 'Recommandation'}
                      </span>
                      <Badge variant="outline" className={`${
                        rec.priority === 'critical' ? 'border-red-300 text-red-700' :
                        rec.priority === 'high' ? 'border-orange-300 text-orange-700' :
                        rec.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-blue-300 text-blue-700'
                      }`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{rec.message}</p>
                  </div>
                )) || (
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-lg">
                    <h5 className="font-medium text-teal-800 dark:text-teal-200 mb-2">
                      Recommandations Automatiques
                    </h5>
                    <ul className="text-sm text-teal-700 dark:text-teal-300 space-y-1">
                      <li>• Surveiller les niveaux de stock pour {bloodType}</li>
                      <li>• Planifier les collectes selon la demande prédite</li>
                      <li>• Optimiser la rotation des stocks</li>
                      <li>• Maintenir un tampon de sécurité approprié</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informations système */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    Système de Prévision IA - Mode Production
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {forecastData?.generated_at ?
                      `Dernière prévision: ${new Date(forecastData.generated_at).toLocaleString()}` :
                      'Aucune prévision générée'
                    }
                  </p>
                  <div className="flex items-center mt-1 space-x-4">
                    <div className="flex items-center">
                      <Server className="w-4 h-4 mr-1" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        API: {apiStatus.isConnected ? 'Connectée' : 'Déconnectée'}
                      </span>
                    </div>
                    {apiStatus.responseTime && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Latence: {apiStatus.responseTime}ms
                        </span>
                      </div>
                    )}
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
                  {apiStatus.isConnected ? 'Système Opérationnel' : 'Système Déconnecté'}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  Mode Production - API Réelle
                </Badge>
                {apiStatus.version && (
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    API v{apiStatus.version}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}