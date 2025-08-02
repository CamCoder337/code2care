import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendingUp,
  Brain,
  BarChart3,
  Calendar,
  Target,
  AlertCircle,
  RefreshCw,
  Download,
  Zap,
  Sparkles,
  TrendingDown,
  Activity,
  Clock,
  Lightbulb,
  Settings,
  ChevronRight,
  Globe,
  Cpu,
  Menu,
  X
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'

// Données mock basées sur votre API
const mockForecastData = {
  blood_type: "O+",
  forecast_period_days: 7,
  method_used: "stl_arima",
  predictions: [
    { date: "2025-08-02", predicted_demand: 12, confidence: 0.89 },
    { date: "2025-08-03", predicted_demand: 15, confidence: 0.91 },
    { date: "2025-08-04", predicted_demand: 18, confidence: 0.87 },
    { date: "2025-08-05", predicted_demand: 8, confidence: 0.93 },
    { date: "2025-08-06", predicted_demand: 6, confidence: 0.88 },
    { date: "2025-08-07", predicted_demand: 14, confidence: 0.90 },
    { date: "2025-08-08", predicted_demand: 16, confidence: 0.85 }
  ],
  confidence_intervals: {
    lower: [9, 11, 14, 6, 4, 11, 13],
    upper: [15, 19, 22, 10, 8, 17, 19]
  },
  model_accuracy: { accuracy: "94.2%", samples: 156 },
  enhanced_forecasting_available: true,
  generated_at: "2025-08-01T10:30:00Z"
}

const mockOptimizationData = {
  blood_type_recommendations: [
    {
      blood_type: "O+",
      current_stock: 8,
      recommended_stock: 20,
      stock_deficit: 12,
      avg_daily_consumption: 2.1,
      days_of_supply: 3.8,
      priority: "critical",
      actions: [
        { type: "urgent_collection", message: "Collection urgente nécessaire", priority: "critical" }
      ]
    },
    {
      blood_type: "A+",
      current_stock: 15,
      recommended_stock: 18,
      stock_deficit: 3,
      avg_daily_consumption: 1.8,
      days_of_supply: 8.3,
      priority: "medium",
      actions: []
    }
  ],
  general_recommendations: [
    {
      type: "waste_reduction",
      message: "23 unités expirées le mois dernier. Optimiser la rotation des stocks.",
      priority: "high"
    }
  ]
}

// Traductions selon la langue
const translations = {
  fr: {
    title: "Suite de Prévisions IA",
    subtitle: "Prédictions de demande alimentées par l'apprentissage automatique avancé",
    settings: "Paramètres",
    exportReport: "Exporter Rapport",
    generateForecast: "Générer Prévision IA",
    generating: "Génération...",
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
    criticalAlerts: "Alertes Critiques Détectées",
    demandForecast: "Prévision de Demande",
    aiInsights: "Insights IA",
    peakDemand: "Pic de Demande",
    trendAnalysis: "Analyse de Tendance",
    modelConfidence: "Confiance du Modèle",
    recommendations: "Recommandations",
    detailedForecast: "Détail des Prévisions",
    dayByDay: "Prédictions jour par jour avec intervalles de confiance et recommandations",
    high: "Élevé",
    medium: "Moyen",
    low: "Faible",
    demand: "Demande",
    confidence: "Confiance",
    prepareStock: "Préparer stock supplémentaire",
    monitorLevels: "Surveiller les niveaux",
    standardDemand: "Demande standard",
    units: "unités",
    days: "jours",
    increasing: "Croissante",
    decreasing: "Décroissante",
    ensureStock: "Assurer un stock adéquat",
    monitorWeekend: "Surveiller les tendances du week-end",
    emergencyProtocols: "Considérer les protocoles d'urgence"
  },
  en: {
    title: "AI Forecasting Suite",
    subtitle: "Advanced machine learning powered demand predictions",
    settings: "Settings",
    exportReport: "Export Report",
    generateForecast: "Generate AI Forecast",
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
    criticalAlerts: "Critical Demand Alerts Detected",
    demandForecast: "Demand Forecast",
    aiInsights: "AI Insights",
    peakDemand: "Peak Demand",
    trendAnalysis: "Trend Analysis",
    modelConfidence: "Model Confidence",
    recommendations: "Recommendations",
    detailedForecast: "Detailed Forecast Breakdown",
    dayByDay: "Day-by-day predictions with confidence intervals and recommendations",
    high: "High",
    medium: "Medium",
    low: "Low",
    demand: "Demand",
    confidence: "Confidence",
    prepareStock: "Prepare additional stock",
    monitorLevels: "Monitor levels",
    standardDemand: "Standard demand",
    units: "units",
    days: "days",
    increasing: "Increasing",
    decreasing: "Decreasing",
    ensureStock: "Ensure adequate stock",
    monitorWeekend: "Monitor weekend patterns",
    emergencyProtocols: "Consider emergency protocols"
  }
}

export default function EnhancedForecasting() {
  // États de base
  const [timeRange, setTimeRange] = useState("7")
  const [bloodType, setBloodType] = useState("O+")
  const [method, setMethod] = useState("auto")
  const [isGenerating, setIsGenerating] = useState(false)
  const [forecastData, setForecastData] = useState(mockForecastData)
  const [optimizationData, setOptimizationData] = useState(mockOptimizationData)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Détection automatique de la langue et du thème
  const [language, setLanguage] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.language.startsWith('fr') ? 'fr' : 'en'
    }
    return 'fr'
  })

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Écouter les changements de thème système
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e) => setIsDarkMode(e.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const t = translations[language]

  // Simulation d'appel API améliorée
  const handleGenerateForecast = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newPredictions = Array.from({ length: parseInt(timeRange) }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_demand: Math.floor(Math.random() * 20) + 5,
        confidence: 0.8 + Math.random() * 0.15
      }))

      setForecastData({
        ...mockForecastData,
        blood_type: bloodType,
        forecast_period_days: parseInt(timeRange),
        method_used: method === "auto" ? "stl_arima" : method,
        predictions: newPredictions,
        generated_at: new Date().toISOString()
      })
    } catch (err) {
      setError("Échec de génération des prévisions. Utilisation des données mock.")
      console.error("Erreur de génération de prévision:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  // Transformation des données pour le graphique avec vérifications null
  const chartData = useMemo(() => {
    if (!forecastData?.predictions) return []

    return forecastData.predictions.map((pred, index) => ({
      date: new Date(pred.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit',
        month: '2-digit'
      }),
      demand: pred.predicted_demand || 0,
      confidence: Math.round((pred.confidence || 0) * 100),
      lower: forecastData.confidence_intervals?.lower?.[index] || pred.predicted_demand * 0.8,
      upper: forecastData.confidence_intervals?.upper?.[index] || pred.predicted_demand * 1.2,
      trend: index > 0 ?
        ((pred.predicted_demand || 0) > (forecastData.predictions[index - 1].predicted_demand || 0) ? 'up' : 'down') :
        'stable'
    }))
  }, [forecastData, language])

  const aiMetrics = [
    {
      label: t.modelAccuracy,
      value: forecastData?.model_accuracy?.accuracy || "N/A",
      icon: Target,
      color: "text-green-600 dark:text-green-400",
      trend: "+2.1%",
      description: `Basé sur ${forecastData?.model_accuracy?.samples || 0} échantillons`
    },
    {
      label: t.aiMethod,
      value: forecastData?.method_used?.toUpperCase() || "N/A",
      icon: Brain,
      color: "text-blue-600 dark:text-blue-400",
      trend: "Enhanced",
      description: "Approche ML hybride"
    },
    {
      label: t.confidenceScore,
      value: forecastData?.predictions ?
        `${Math.round(forecastData.predictions.reduce((acc, p) => acc + (p.confidence || 0), 0) / forecastData.predictions.length * 100)}%` :
        "N/A",
      icon: BarChart3,
      color: "text-teal-600 dark:text-teal-400",
      trend: "+5.2%",
      description: "Confiance moyenne des prédictions"
    },
    {
      label: t.processingSpeed,
      value: "2.3s",
      icon: Cpu,
      color: "text-purple-600 dark:text-purple-400",
      trend: "-0.8s",
      description: "Temps de génération précédent"
    }
  ]

  const criticalAlerts = useMemo(() => {
    if (!forecastData?.predictions) return []

    return forecastData.predictions
      .filter(pred => (pred.predicted_demand || 0) > 15)
      .slice(0, 3)
      .map(pred => ({
        ...pred,
        severity: (pred.predicted_demand || 0) > 18 ? 'critical' : 'high',
        message: `Forte demande prédite: ${pred.predicted_demand || 0} unités`
      }))
  }, [forecastData])

  const safeForecastData = forecastData || mockForecastData
  const safeOptimizationData = optimizationData || mockOptimizationData

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* En-tête amélioré - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2 flex items-center">
              <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-2">{t.subtitle}</span>
            </p>
          </div>

          {/* Boutons d'action - Mobile responsive */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="hidden sm:flex space-x-3">
              <Button variant="outline" className="hover:scale-105 transition-all duration-200">
                <Settings className="w-4 h-4 mr-2" />
                {t.settings}
              </Button>
              <Button variant="outline" className="hover:scale-105 transition-all duration-200">
                <Download className="w-4 h-4 mr-2" />
                {t.exportReport}
              </Button>
            </div>

            <Button
              onClick={handleGenerateForecast}
              disabled={isGenerating}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 transition-all duration-300 hover:scale-105 relative overflow-hidden shadow-lg"
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
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-teal-400/20 to-green-400/20 animate-pulse" />
              )}
            </Button>

            {/* Menu mobile */}
            <Button
              variant="outline"
              className="sm:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              {t.settings}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              {t.exportReport}
            </Button>
            <div className="flex space-x-2 pt-2">
              <Button
                variant={language === 'fr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('fr')}
                className="flex-1"
              >
                FR
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="flex-1"
              >
                EN
              </Button>
            </div>
          </div>
        )}

        {/* Alerte d'erreur */}
        {error && (
          <Alert className="border-l-4 border-l-orange-500 bg-orange-50/80 dark:bg-orange-950/50 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription>
              <p className="font-medium text-orange-800 dark:text-orange-200">⚠️ Problème de connexion API</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Tableau de bord des métriques IA - Grid responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {aiMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card
                key={metric.label}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-slate-100/60 dark:from-slate-700/60 dark:to-slate-800/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-1">{metric.label}</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex-shrink-0">
                    <Icon className={`h-4 w-4 ${metric.color} transition-transform group-hover:scale-110 duration-200`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className={`text-xl sm:text-2xl font-bold ${metric.color} mb-1 line-clamp-1`}>{metric.value}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{metric.description}</p>
                    <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 ml-2 flex-shrink-0">
                      {metric.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Panneau de contrôle - Responsive */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
              <Brain className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              {t.forecastConfig}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Configurer les paramètres du modèle IA et les réglages de prédiction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">{t.timeHorizon}</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="bg-white/50 dark:bg-slate-700/50">
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
                <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">{t.bloodType}</label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger className="bg-white/50 dark:bg-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les Types</SelectItem>
                    <SelectItem value="O+">O+ (Donneur Universel)</SelectItem>
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
                <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">{t.aiAlgorithm}</label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="bg-white/50 dark:bg-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Auto-Sélection (Meilleur)</SelectItem>
                    <SelectItem value="stl_arima">📈 STL+ARIMA (Saisonnier)</SelectItem>
                    <SelectItem value="arima">📊 ARIMA (Classique)</SelectItem>
                    <SelectItem value="random_forest">🌲 Random Forest</SelectItem>
                    <SelectItem value="xgboost">⚡ XGBoost (Avancé)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerateForecast}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  {isGenerating ? t.processing : t.runForecast}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertes critiques */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50/80 dark:bg-red-950/50 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-red-800 dark:text-red-200">⚠️ {t.criticalAlerts}</p>
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className="text-sm text-red-700 dark:text-red-300">
                    • {new Date(alert.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')} - {alert.message} (Confiance: {Math.round((alert.confidence || 0) * 100)}%)
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Visualisation principale des prévisions - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Graphique */}
          <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center text-slate-900 dark:text-slate-100">
                  <Activity className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="line-clamp-1">{t.demandForecast} - {bloodType}</span>
                </div>
                <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 self-start sm:self-auto">
                  {(safeForecastData.method_used || "UNKNOWN").toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Prédictions alimentées par l'IA avec intervalles de confiance pour les {timeRange} prochains jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                <AreaChart data={chartData}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#E5E7EB"} />
                  <XAxis
                    dataKey="date"
                    stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#F1F5F9' : '#1E293B'
                    }}
                    formatter={(value, name) => [
                      `${value} ${name === 'demand' ? t.units : '%'}`,
                      name === 'demand' ? 'Demande Prédite' : 'Confiance'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stackId="1"
                    stroke="none"
                    fill="url(#confidenceGradient)"
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
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                  <ReferenceLine y={15} stroke="#EF4444" strokeDasharray="5 5" label="Seuil Critique" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Panneau d'insights */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                {t.aiInsights}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/50 dark:to-teal-950/50 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{t.peakDemand}</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Demande la plus élevée prévue le {safeForecastData.predictions && safeForecastData.predictions.length > 0 ?
                    new Date(safeForecastData.predictions.reduce((max, p) =>
                      (p.predicted_demand || 0) > (max.predicted_demand || 0) ? p : max
                    ).date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : 'N/A'} avec {safeForecastData.predictions ?
                    Math.max(...safeForecastData.predictions.map(p => p.predicted_demand || 0)) : 0} unités
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{t.trendAnalysis}</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Tendance générale : {safeForecastData.predictions && safeForecastData.predictions.length > 1 ?
                    ((safeForecastData.predictions[safeForecastData.predictions.length - 1].predicted_demand || 0) >
                     (safeForecastData.predictions[0].predicted_demand || 0)) ? t.increasing : t.decreasing : 'Stable'} détectée
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">{t.modelConfidence}</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Prédictions haute confiance ({safeForecastData.predictions ?
                    Math.round(safeForecastData.predictions.filter(p => (p.confidence || 0) > 0.85).length / safeForecastData.predictions.length * 100) : 0}% au-dessus de 85%)
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 rounded-lg">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">{t.recommendations}</h4>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  <li>• {t.ensureStock} {bloodType}</li>
                  <li>• {t.monitorWeekend}</li>
                  <li>• {t.emergencyProtocols}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau détaillé des prédictions - Responsive */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
              <Calendar className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
              {t.detailedForecast}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {t.dayByDay}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {safeForecastData?.predictions?.map((prediction, index) => {
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
                    <CardContent className="p-3 sm:p-4">
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
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{demand} {t.units}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{t.confidence}</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{Math.round(confidence * 100)}%</span>
                          </div>
                          <Progress value={confidence * 100} className="h-2" />
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                          <div className="flex items-center text-xs">
                            {isHighDemand ? (
                              <><Zap className="w-3 h-3 mr-1 text-red-500" />
                              <span className="text-red-600 dark:text-red-400">{t.prepareStock}</span></>
                            ) : isMediumDemand ? (
                              <><Clock className="w-3 h-3 mr-1 text-yellow-500" />
                              <span className="text-yellow-600 dark:text-yellow-400">{t.monitorLevels}</span></>
                            ) : (
                              <><TrendingDown className="w-3 h-3 mr-1 text-green-500" />
                              <span className="text-green-600 dark:text-green-400">{t.standardDemand}</span></>
                            )}
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

        {/* Recommandations d'optimisation */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
              <Target className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Recommandations d'Optimisation IA
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Suggestions intelligentes basées sur l'analyse des prévisions et de l'inventaire actuel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recommandations par type sanguin */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyse par Groupe Sanguin
                </h4>
                {safeOptimizationData?.blood_type_recommendations?.slice(0, 3).map((rec, index) => (
                  <div
                    key={`${rec.blood_type}-${index}`}
                    className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                      rec.priority === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
                      rec.priority === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                      rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                      'border-l-green-500 bg-green-50 dark:bg-green-950/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
                      <h5 className="font-medium text-slate-800 dark:text-slate-200">{rec.blood_type}</h5>
                      <Badge className={`self-start ${
                        rec.priority === 'critical' ? 'bg-red-600 text-white' :
                        rec.priority === 'high' ? 'bg-orange-600 text-white' :
                        rec.priority === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Stock Actuel:</span>
                        <span className="font-medium ml-2 text-slate-800 dark:text-slate-200">{rec.current_stock} unités</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Jours d'Approvisionnement:</span>
                        <span className="font-medium ml-2 text-slate-800 dark:text-slate-200">{rec.days_of_supply} jours</span>
                      </div>
                    </div>
                    {rec.actions && rec.actions.length > 0 && (
                      <div className="mt-3 p-2 bg-white/70 dark:bg-slate-700/50 rounded">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {rec.actions[0].message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Recommandations générales */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Recommandations Système
                </h4>
                {safeOptimizationData?.general_recommendations?.map((rec, index) => (
                  <div
                    key={`${rec.type}-${index}`}
                    className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                      rec.priority === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
                      rec.priority === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                      rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                      'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">
                        {rec.type?.replace('_', ' ') || 'Général'}
                      </span>
                      <Badge variant="outline" className={`self-start ${
                        rec.priority === 'critical' ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-300' :
                        rec.priority === 'high' ? 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300' :
                        rec.priority === 'medium' ? 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300' :
                        'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300'
                      }`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{rec.message}</p>
                  </div>
                ))}

                {/* Insights IA supplémentaires */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Insights Stratégiques IA
                  </h5>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• Demande week-end typiquement 30% plus faible</li>
                    <li>• Pic du lundi détecté</li>
                    <li>• Ajustements saisonniers recommandés</li>
                    <li>• Tampon d'urgence : minimum 3 jours d'approvisionnement</li>
                  </ul>
                </div>

                <div className="p-3 sm:p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                  <h5 className="font-medium text-teal-800 dark:text-teal-200 mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Métriques de Performance
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                    <div>
                      <span className="text-teal-600 dark:text-teal-400">Précision Prévision:</span>
                      <span className="font-medium ml-1 text-teal-800 dark:text-teal-200">{safeForecastData.model_accuracy?.accuracy || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-teal-600 dark:text-teal-400">Temps de Réponse:</span>
                      <span className="font-medium ml-1 text-teal-800 dark:text-teal-200">2.3s</span>
                    </div>
                    <div>
                      <span className="text-teal-600 dark:text-teal-400">Mises à Jour Modèle:</span>
                      <span className="font-medium ml-1 text-teal-800 dark:text-teal-200">Quotidien</span>
                    </div>
                    <div>
                      <span className="text-teal-600 dark:text-teal-400">Points de Données:</span>
                      <span className="font-medium ml-1 text-teal-800 dark:text-teal-200">10,000+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations pied de page */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Système de Prévision IA</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Dernière mise à jour: {safeForecastData?.generated_at ?
                      new Date(safeForecastData.generated_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') :
                      'N/A'
                    }
                  </p>
                  <div className="flex items-center mt-1">
                    <Globe className="w-4 h-4 mr-2" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      IA Avancée: {safeForecastData?.enhanced_forecasting_available ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  Système Opérationnel
                </Badge>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  Mode Données Mock
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}