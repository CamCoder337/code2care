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
  Database,
  Cpu,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Server,
  Shield,
  Package,
  Timer,
  Gauge,
  Info
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Bar } from 'recharts'

// Configuration API pour les vraies données
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000, // Augmenté car les vrais modèles prennent plus de temps
  retryAttempts: 3,
  retryDelay: 2000
}

// Méthodes disponibles avec descriptions détaillées
const FORECASTING_METHODS = [
  {
    value: 'auto',
    label: '🤖 Auto-Sélection Intelligente',
    description: 'Analyse automatique des données pour choisir la meilleure méthode',
    recommended: true,
    complexity: 'Adaptative',
    accuracy: 'Optimale'
  },
  {
    value: 'stl_arima',
    label: '🔬 STL + ARIMA',
    description: 'Décomposition saisonnière + modèle statistique avancé',
    recommended: false,
    complexity: 'Élevée',
    accuracy: 'Très Haute',
    bestFor: 'Données avec forte saisonnalité'
  },
  {
    value: 'random_forest',
    label: '🌲 Random Forest',
    description: 'Apprentissage automatique robuste et stable',
    recommended: false,
    complexity: 'Moyenne',
    accuracy: 'Haute',
    bestFor: 'Données stables et générales'
  },
  {
    value: 'xgboost',
    label: '⚡ XGBoost',
    description: 'Gradient boosting haute performance',
    recommended: false,
    complexity: 'Élevée',
    accuracy: 'Très Haute',
    bestFor: 'Données complexes avec tendances'
  },
  {
    value: 'arima',
    label: '📈 ARIMA Classique',
    description: 'Modèle statistique de séries temporelles traditionnel',
    recommended: false,
    complexity: 'Moyenne',
    accuracy: 'Haute',
    bestFor: 'Tendances claires et linéaires'
  }
]

export default function RealDataForecastingSystem() {
  // États principaux
  const [timeRange, setTimeRange] = useState("7")
  const [bloodType, setBloodType] = useState("O+")
  const [method, setMethod] = useState("auto")
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

  const [systemMetrics, setSystemMetrics] = useState({
    dataFreshness: 'unknown',
    lastDataUpdate: null,
    availableDataPoints: 0,
    modelAccuracy: null,
    processingSpeed: null
  })

  // Fonction utilitaire pour les délais
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Vérification complète de l'API avec informations système
  const checkApiHealth = async (showLoading = true) => {
    if (showLoading) {
      setApiStatus(prev => ({ ...prev, isChecking: true, error: null }))
    }

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      const response = await fetch(`${API_CONFIG.baseUrl}/health/`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Use-AI-System': 'true'
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
          version: healthData.version || '2.0',
          databaseStatus: healthData.database || 'connected',
          modelsAvailable: {
            xgboost: healthData.xgboost_available || false,
            statsmodels: healthData.statsmodels_available || false
          }
        })

        // Récupérer les métriques système
        await fetchSystemMetrics()
        return true
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error('API Health Check failed:', error.message)

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
  }

  // Récupération des métriques système
  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/system/metrics/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const metrics = await response.json()
        setSystemMetrics(metrics)
      }
    } catch (error) {
      console.error('Erreur récupération métriques:', error)
    }
  }

  // Appel API pour génération de prévision avec vraies données
  const callRealDataForecastApi = async (config) => {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      const requestBody = {
        blood_type: config.bloodType,
        days_ahead: parseInt(config.timeRange),
        method: config.method,
        force_retrain: config.forceRetrain || false
      }

      console.log('📡 Envoi requête prévision (vraies données):', requestBody)

      const response = await fetch(`${API_CONFIG.baseUrl}/forecast/`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Use-AI-System': 'true', // IMPORTANT : Active le système IA
        },
        body: JSON.stringify(requestBody)
      })


      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API Error ${response.status}: ${errorData.message || errorData.detail || response.statusText}`)
      }

      const data = await response.json()
      const generationTime = Date.now() - startTime

      console.log('✅ Données de prévision reçues:', data)

      return {
        ...data,
        generation_time_ms: generationTime,
        generated_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Erreur appel API prévision:', error)
      throw error
    }
  }

  // Génération principale de prévision
  const handleGenerateForecast = async () => {
    if (!apiStatus.isConnected) {
      setError('❌ API non connectée. Vérifiez la connexion à la base de données.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setForecastData(null)

    try {
      const data = await callRealDataForecastApi({
        bloodType,
        timeRange,
        method,
        forceRetrain
      })

      if (data.error) {
        throw new Error(data.message || 'Erreur lors de la génération')
      }

      setForecastData(data)
      console.log('🎯 Prévision générée avec succès')

      // Réinitialiser le flag de réentraînement
      if (forceRetrain) {
        setForceRetrain(false)
      }

    } catch (error) {
      console.error('💥 Échec génération prévision:', error)
      setError(`Erreur génération: ${error.message}`)

      if (error.message.includes('insufficient')) {
        setError(`❌ Données insuffisantes pour ${bloodType}. Vérifiez que des transactions existent en base de données.`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Forcer le réentraînement
  const handleForceRetrain = () => {
    setForceRetrain(true)
    handleGenerateForecast()
  }

  // Vérification périodique de l'API
  useEffect(() => {
    checkApiHealth()

    const interval = setInterval(() => {
      if (!isGenerating) {
        checkApiHealth(false) // Sans loading pour les vérifications automatiques
      }
    }, 45000) // Vérifier toutes les 45 secondes

    return () => clearInterval(interval)
  }, [isGenerating])

  // Transformation des données pour le graphique
  const chartData = useMemo(() => {
    if (!forecastData?.predictions || !Array.isArray(forecastData.predictions)) {
      return []
    }

    return forecastData.predictions.map((pred, index) => ({
      date: new Date(pred.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      }),
      demand: pred.predicted_demand || 0,
      confidence: Math.round((pred.confidence || 0) * 100),
      lower: pred.lower_bound || (pred.predicted_demand * 0.8),
      upper: pred.upper_bound || (pred.predicted_demand * 1.2),
      day: `Jour ${index + 1}`
    }))
  }, [forecastData])

  // Métriques système enrichies
  const enrichedSystemMetrics = [
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
      value: forecastData?.model_performance ?
        `${(100 - (forecastData.model_performance[Object.keys(forecastData.model_performance)[0]]?.mape || 50)).toFixed(1)}%` :
        "N/A",
      icon: Target,
      color: "text-blue-600 dark:text-blue-400",
      trend: forecastData?.quality_metrics?.training_accuracy ?
        `MAPE: ${forecastData.quality_metrics.training_accuracy.toFixed(1)}%` : "N/A",
      description: "Précision calculée sur vraies données historiques"
    },
    {
      label: "Méthode IA Active",
      value: forecastData?.method_used?.toUpperCase().replace('_', ' ') || "N/A",
      icon: Brain,
      color: "text-purple-600 dark:text-purple-400",
      trend: forecastData?.data_source === 'real_database' ? "Données Réelles" : "N/A",
      description: "Algorithme sélectionné automatiquement"
    },
    {
      label: "Données Disponibles",
      value: systemMetrics.availableDataPoints ? `${systemMetrics.availableDataPoints} pts` : "N/A",
      icon: Activity,
      color: "text-teal-600 dark:text-teal-400",
      trend: systemMetrics.dataFreshness || "Inconnue",
      description: "Points de données historiques en base"
    }
  ]

  // Alertes critiques basées sur les vraies prédictions
  const criticalAlerts = useMemo(() => {
    if (!forecastData?.predictions || !Array.isArray(forecastData.predictions)) {
      return []
    }

    const alerts = []

    // Analyser les prédictions
    const highDemandDays = forecastData.predictions.filter(pred => pred.predicted_demand > 15)
    const lowConfidenceDays = forecastData.predictions.filter(pred => pred.confidence < 0.6)

    // Alertes demande élevée
    if (highDemandDays.length > 0) {
      alerts.push({
        type: 'high_demand',
        severity: 'critical',
        message: `${highDemandDays.length} jour(s) avec forte demande prédite`,
        details: highDemandDays.map(d => `${new Date(d.date).toLocaleDateString()}: ${d.predicted_demand} unités`),
        action: 'Prévoir stock supplémentaire'
      })
    }

    // Alertes confiance faible
    if (lowConfidenceDays.length > 2) {
      alerts.push({
        type: 'low_confidence',
        severity: 'warning',
        message: `Confiance réduite sur ${lowConfidenceDays.length} prédictions`,
        details: 'Surveiller de près les tendances réelles',
        action: 'Monitoring renforcé'
      })
    }

    // Alerte stock critique si disponible
    if (forecastData.contextual_insights?.stock_days_remaining < 3) {
      alerts.push({
        type: 'critical_stock',
        severity: 'critical',
        message: `Stock critique: ${forecastData.contextual_insights.stock_days_remaining} jours restants`,
        details: `Stock actuel: ${forecastData.contextual_insights.current_stock} unités`,
        action: 'Collecte urgente nécessaire'
      })
    }

    return alerts.slice(0, 3) // Limiter à 3 alertes max
  }, [forecastData])

  // Méthodes disponibles filtrées selon l'API
  const availableMethods = useMemo(() => {
    return FORECASTING_METHODS.filter(method => {
      if (method.value === 'auto' || method.value === 'random_forest') return true
      if (method.value === 'xgboost') return apiStatus.modelsAvailable.xgboost
      if (method.value === 'arima' || method.value === 'stl_arima') return apiStatus.modelsAvailable.statsmodels
      return false
    })
  }, [apiStatus.modelsAvailable])

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
                  forecastData?.data_source === 'real_database' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {forecastData?.data_source === 'real_database' ? '✅ Données Réelles' : '⏳ En Attente'}
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
              Paramètres de prédiction basés sur vos données réelles de transactions
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
                <label className="text-sm font-medium mb-2 block">
                  Algorithme IA
                  <Info className="w-3 h-3 inline ml-1 text-gray-400" />
                </label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{m.label}</span>
                          {m.recommended && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Recommandé
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {method !== 'auto' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {availableMethods.find(m => m.value === method)?.description}
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGenerateForecast}
                  disabled={isGenerating || !apiStatus.isConnected}
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  {isGenerating ? (
                    <>
                      <Timer className="w-4 h-4 mr-2 animate-pulse" />
                      Analyse en cours...
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

            {/* Informations sur la méthode sélectionnée */}
            {method !== 'auto' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                {(() => {
                  const selectedMethod = availableMethods.find(m => m.value === method)
                  return selectedMethod ? (
                    <div className="text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          {selectedMethod.label}
                        </span>
                        <div className="flex space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {selectedMethod.complexity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {selectedMethod.accuracy}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300 mb-1">
                        {selectedMethod.description}
                      </p>
                      {selectedMethod.bestFor && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Optimal pour:</strong> {selectedMethod.bestFor}
                        </p>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            )}
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
                    forecastData.data_source === 'real_database'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                  }`}>
                    {forecastData.method_used?.toUpperCase().replace('_', ' ') || 'UNKNOWN'}
                  </Badge>
                  {forecastData.quality_metrics?.prediction_confidence && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      Confiance: {Math.round(forecastData.quality_metrics.prediction_confidence * 100)}%
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>
                  Prédictions générées le {new Date(forecastData.generated_at).toLocaleString()}
                  {forecastData.data_source === 'real_database' && (
                    <span className="text-green-600 ml-2">• Basé sur vos vraies données</span>
                  )}
                </span>
                {forecastData.generation_time_ms && (
                  <span className="text-xs text-muted-foreground">
                    Généré en {(forecastData.generation_time_ms / 1000).toFixed(2)}s
                  </span>
                )}
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
                Cliquez sur "Générer Prévision" pour analyser vos données de transactions et obtenir des prédictions personnalisées.
              </p>
              <Button
                onClick={handleGenerateForecast}
                disabled={!apiStatus.isConnected}
                className="bg-gradient-to-r from-blue-500 to-teal-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Démarrer l'Analyse
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Détails des prédictions enrichis */}
        {forecastData?.predictions && Array.isArray(forecastData.predictions) && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
                  Analyse Détaillée des Prédictions
                </div>
                <div className="flex items-center space-x-2">
                  {forecastData.contextual_insights?.current_stock && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      <Package className="w-3 h-3 mr-1" />
                      Stock: {forecastData.contextual_insights.current_stock} unités
                    </Badge>
                  )}
                  {forecastData.contextual_insights?.stock_days_remaining && (
                    <Badge variant="outline" className={`${
                      forecastData.contextual_insights.stock_days_remaining < 3
                        ? 'border-red-300 text-red-700 bg-red-50'
                        : forecastData.contextual_insights.stock_days_remaining < 7
                        ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                        : 'border-green-300 text-green-700 bg-green-50'
                    }`}>
                      <Timer className="w-3 h-3 mr-1" />
                      {forecastData.contextual_insights.stock_days_remaining} jours restants
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                <div className="flex items-center justify-between">
                  <span>Prédictions détaillées avec analyse de confiance et recommandations</span>
                  {forecastData.model_performance && (
                    <span className="text-sm">
                      Précision modèle: {(100 - (Object.values(forecastData.model_performance)[0]?.mape || 50)).toFixed(1)}%
                    </span>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {forecastData.predictions.map((prediction, index) => {
                  const demand = prediction.predicted_demand || 0
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
                                  [{prediction.lower_bound}-{prediction.upper_bound}]
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

                          {/* Détails techniques de la méthode */}
                          {prediction.method_details && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                {prediction.seasonal_component !== undefined && (
                                  <div className="flex justify-between">
                                    <span>Composante saisonnière:</span>
                                    <span className="font-mono">{prediction.seasonal_component}</span>
                                  </div>
                                )}
                                {prediction.trend_component !== undefined && (
                                  <div className="flex justify-between">
                                    <span>Tendance:</span>
                                    <span className="font-mono">{prediction.trend_component}</span>
                                  </div>
                                )}
                                {prediction.method_details.features_used && (
                                  <div className="flex justify-between">
                                    <span>Features utilisées:</span>
                                    <span className="font-mono">{prediction.method_details.features_used}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

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
                  Analyse intelligente basée sur vos données réelles
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
                          <strong>{maxPred.predicted_demand} unités</strong>
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
                          {forecastData.contextual_insights?.recent_trend && (
                            <> • Tendance récente: {forecastData.contextual_insights.recent_trend.toFixed(1)} unités/jour</>
                          )}
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
                    {forecastData.model_performance && (
                      <div className="flex justify-between">
                        <span>Précision MAPE:</span>
                        <span className="font-semibold">
                          {Object.values(forecastData.model_performance)[0]?.mape?.toFixed(1) || 'N/A'}%
                        </span>
                      </div>
                    )}
                    {forecastData.quality_metrics?.data_freshness && (
                      <div className="flex justify-between">
                        <span>Fraîcheur des données:</span>
                        <span className="font-semibold">{forecastData.quality_metrics.data_freshness}</span>
                      </div>
                    )}
                  </div>
                </div>

                {forecastData.contextual_insights && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 rounded-lg">
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Contexte Stock
                    </h4>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Stock actuel:</span>
                        <span className="font-semibold">{forecastData.contextual_insights.current_stock} unités</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Durée estimée:</span>
                        <span className={`font-semibold ${
                          forecastData.contextual_insights.stock_days_remaining < 3 ? 'text-red-600' :
                          forecastData.contextual_insights.stock_days_remaining < 7 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {forecastData.contextual_insights.stock_days_remaining} jours
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
                  Actions suggérées basées sur l'analyse IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {forecastData.optimization_recommendations?.length > 0 ? (
                  forecastData.optimization_recommendations.map((rec, index) => (
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
                          rec.priority === 'critical' ? 'border-red-300 text-red-700 bg-red-100' :
                          rec.priority === 'high' ? 'border-orange-300 text-orange-700 bg-orange-100' :
                          rec.priority === 'medium' ? 'border-yellow-300 text-yellow-700 bg-yellow-100' :
                          'border-blue-300 text-blue-700 bg-blue-100'
                        }`}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{rec.message}</p>
                      {rec.action && (
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          👉 Action: {rec.action}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    {/* Recommandations générées automatiquement */}
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-lg">
                      <h5 className="font-medium text-teal-800 dark:text-teal-200 mb-2 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Recommandations Automatiques
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
                      </ul>
                    </div>

                    {/* Recommandations contextuelle basées sur le stock */}
                    {forecastData.contextual_insights?.current_stock !== undefined && (
                      <div className={`p-4 rounded-lg ${
                        forecastData.contextual_insights.stock_days_remaining < 3
                          ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                          : forecastData.contextual_insights.stock_days_remaining < 7
                          ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                      }`}>
                        <h5 className={`font-medium mb-2 flex items-center ${
                          forecastData.contextual_insights.stock_days_remaining < 3
                            ? 'text-red-800 dark:text-red-200'
                            : forecastData.contextual_insights.stock_days_remaining < 7
                            ? 'text-yellow-800 dark:text-yellow-200'
                            : 'text-green-800 dark:text-green-200'
                        }`}>
                          <Package className="w-4 h-4 mr-2" />
                          Gestion du Stock - {bloodType}
                        </h5>
                        <div className={`txt-sm ${
                          forecastData.contextual_insights.stock_days_remaining < 3
                            ? 'text-red-700 dark:text-red-300'
                            : forecastData.contextual_insights.stock_days_remaining < 7
                            ? 'text-yellow-700 dark:text-yellow-300'
                            : 'text-green-700 dark:text-green-300'
                        }`}>
                          {forecastData.contextual_insights.stock_days_remaining < 3 ? (
                            <>
                              <p className="font-medium mb-1">🚨 URGENT - Stock critique!</p>
                              <p>• Organiser une collecte d'urgence dans les 24h</p>
                              <p>• Contacter les donneurs réguliers</p>
                              <p>• Vérifier les stocks d'autres groupes compatibles</p>
                            </>
                          ) : forecastData.contextual_insights.stock_days_remaining < 7 ? (
                            <>
                              <p className="font-medium mb-1">⚠️ Stock à surveiller</p>
                              <p>• Programmer une collecte dans les 2-3 prochains jours</p>
                              <p>• Préparer la communication aux donneurs</p>
                              <p>• Optimiser l'utilisation des unités les plus anciennes</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium mb-1">✅ Stock optimal</p>
                              <p>• Maintenir le rythme de collecte actuel</p>
                              <p>• Surveiller les prévisions pour anticiper</p>
                              <p>• Optimiser la planification des donneurs</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recommandations basées sur la méthode utilisée */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg">
                      <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        Optimisation du Modèle - {forecastData.method_used?.toUpperCase().replace('_', ' ')}
                      </h5>
                      <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                        {forecastData.method_used === 'emergency_fallback_real_data' ? (
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
                            <p>• ✅ Modèle performant - confiance élevée</p>
                            <p>• 📊 Continuer l'enregistrement régulier des données</p>
                            <p>• 🎯 Utiliser les prédictions pour l'optimisation</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                    {forecastData?.generation_time_ms && (
                      <div className="flex items-center">
                        <Cpu className="w-3 h-3 mr-1" />
                        <span>Génération: {(forecastData.generation_time_ms / 1000).toFixed(1)}s</span>
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
                <div className="flex items-center space-x-2 text-xs">
                  {apiStatus.modelsAvailable.xgboost && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      XGBoost ✓
                    </Badge>
                  )}
                  {apiStatus.modelsAvailable.statsmodels && (
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                      ARIMA/STL ✓
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Métrique de santé du système */}
            {forecastData && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {forecastData.predictions?.length || 0}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Prédictions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {forecastData.model_performance ?
                        `${(100 - (Object.values(forecastData.model_performance)[0]?.mape || 50)).toFixed(0)}%` :
                        'N/A'}
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
                      {forecastData.data_source === 'real_database' ? '✅' : '⏳'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Données</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}