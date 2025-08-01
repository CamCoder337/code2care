import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDemandForecast, useOptimizationRecommendations } from '@/lib/hooks/useApi'
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
  Cpu
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'

// Mock data structure based on your API
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

export default function EnhancedForecasting() {
  const [timeRange, setTimeRange] = useState("7")
  const [bloodType, setBloodType] = useState("O+")
  const [method, setMethod] = useState("auto")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedView, setSelectedView] = useState("overview")
    // Utiliser les vrais hooks API
  const { data: forecastData, isLoading: forecastLoading, refetch: refetchForecast } = useDemandForecast({
    blood_type: bloodType,
    days: parseInt(timeRange),
    method: method
  })

  const { data: optimizationData, isLoading: optimizationLoading } = useOptimizationRecommendations()

  // Transform predictions for chart


  const handleGenerateForecast = async () => {
    setIsGenerating(true)
    try {
      await refetchForecast()
    } catch (error) {
      console.error('Error generating forecast:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  const chartData = useMemo(() => {
    if (!forecastData?.predictions) return []

    return forecastData.predictions.map((pred, index) => ({
      date: new Date(pred.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      }),
      demand: pred.predicted_demand,
      confidence: Math.round(pred.confidence * 100),
      lower: forecastData.confidence_intervals?.lower[index] || pred.predicted_demand * 0.8,
      upper: forecastData.confidence_intervals?.upper[index] || pred.predicted_demand * 1.2,
      trend: index > 0 ?
        (pred.predicted_demand > forecastData.predictions[index - 1].predicted_demand ? 'up' : 'down') :
        'stable'
    }))
  }, [forecastData])

  const aiMetrics = [
    {
      label: "Model Accuracy",
      value: forecastData?.model_accuracy?.accuracy || "N/A",
      icon: Target,
      color: "text-green-600",
      trend: "+2.1%",
      description: `Based on ${forecastData?.model_accuracy?.samples || 0} samples`
    },
    {
      label: "AI Method",
      value: forecastData?.method_used?.toUpperCase() || "N/A",
      icon: Brain,
      color: "text-blue-600",
      trend: "Enhanced",
      description: "Hybrid ML approach"
    },
    {
      label: "Confidence Score",
      value: forecastData?.predictions ?
        `${Math.round(forecastData.predictions.reduce((acc, p) => acc + p.confidence, 0) / forecastData.predictions.length * 100)}%` :
        "N/A",
      icon: BarChart3,
      color: "text-teal-600",
      trend: "+5.2%",
      description: "Average prediction confidence"
    },
    {
      label: "Processing Speed",
      value: "2.3s",
      icon: Cpu,
      color: "text-purple-600",
      trend: "-0.8s",
      description: "Last generation time"
    }
  ]

const criticalAlerts = useMemo(() => {
    if (!forecastData?.predictions) return []

    return forecastData.predictions
      .filter(pred => pred.predicted_demand > 15)
      .slice(0, 3)
      .map(pred => ({
        ...pred,
        severity: pred.predicted_demand > 18 ? 'critical' : 'high',
        message: `High demand predicted: ${pred.predicted_demand} units`
      }))
  }, [forecastData])

    if (forecastLoading || optimizationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading forecasting data...</p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
              AI Forecasting Suite
            </h1>
            <p className="text-lg text-muted-foreground mt-2 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Advanced machine learning powered demand predictions
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="hover:scale-105 transition-all duration-200">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" className="hover:scale-105 transition-all duration-200">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button
              onClick={handleGenerateForecast}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 transition-all duration-300 hover:scale-105 relative overflow-hidden shadow-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Forecast
                </>
              )}
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-teal-400/20 to-green-400/20 animate-pulse" />
              )}
            </Button>
          </div>
        </div>

        {/* AI Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aiMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card
                key={metric.label}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group bg-white/80 backdrop-blur-sm border-0 shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-slate-100/60 dark:from-slate-700/60 dark:to-slate-800/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-slate-600">{metric.label}</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg">
                    <Icon className={`h-4 w-4 ${metric.color} transition-transform group-hover:scale-110 duration-200`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className={`text-2xl font-bold ${metric.color} mb-1`}>{metric.value}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {metric.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Control Panel */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-blue-600" />
              Forecast Configuration
            </CardTitle>
            <CardDescription>Configure AI model parameters and prediction settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Time Horizon</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days Ahead</SelectItem>
                    <SelectItem value="7">7 Days Ahead</SelectItem>
                    <SelectItem value="14">14 Days Ahead</SelectItem>
                    <SelectItem value="30">30 Days Ahead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Blood Type</label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="O+">O+ (Universal Donor)</SelectItem>
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
                <label className="text-sm font-medium mb-2 block">AI Algorithm</label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Auto-Select (Best)</SelectItem>
                    <SelectItem value="stl_arima">📈 STL+ARIMA (Seasonal)</SelectItem>
                    <SelectItem value="arima">📊 ARIMA (Classic)</SelectItem>
                    <SelectItem value="random_forest">🌲 Random Forest</SelectItem>
                    <SelectItem value="xgboost">⚡ XGBoost (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerateForecast}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  {isGenerating ? "Processing..." : "Run Forecast"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50/80 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-red-800">⚠️ Critical Demand Alerts Detected</p>
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className="text-sm text-red-700">
                    • {new Date(alert.date).toLocaleDateString('fr-FR')} - {alert.message} (Confidence: {Math.round(alert.confidence * 100)}%)
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Forecast Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Demand Forecast - {bloodType}
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {forecastData.method_used.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                AI-powered predictions with confidence intervals for next {timeRange} days
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
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [
                      `${value} ${name === 'demand' ? 'units' : '%'}`,
                      name === 'demand' ? 'Predicted Demand' : 'Confidence'
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
                    fill="#ffffff"
                  />
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                  <ReferenceLine y={15} stroke="#EF4444" strokeDasharray="5 5" label="Critical Threshold" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights Panel */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Peak Demand</h4>
                <p className="text-sm text-blue-700">
                  Highest demand expected on {new Date(forecastData.predictions.reduce((max, p) =>
                    p.predicted_demand > max.predicted_demand ? p : max
                  ).date).toLocaleDateString('fr-FR')} with {Math.max(...forecastData.predictions.map(p => p.predicted_demand))} units
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Trend Analysis</h4>
                <p className="text-sm text-green-700">
                  Overall trend: {forecastData.predictions[forecastData.predictions.length - 1].predicted_demand > forecastData.predictions[0].predicted_demand ? 'Increasing' : 'Decreasing'} demand pattern detected
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Model Confidence</h4>
                <p className="text-sm text-purple-700">
                  High confidence predictions ({Math.round(forecastData.predictions.filter(p => p.confidence > 0.85).length / forecastData.predictions.length * 100)}% above 85%)
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">Recommendations</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Ensure adequate {bloodType} stock</li>
                  <li>• Monitor weekend patterns</li>
                  <li>• Consider emergency protocols</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Predictions Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-teal-600" />
              Detailed Forecast Breakdown
            </CardTitle>
            <CardDescription>Day-by-day predictions with confidence intervals and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {forecastData?.predictions?.map((prediction, index) => {
                const demand = prediction.predicted_demand
                const confidence = prediction.confidence
                const isHighDemand = demand > 15
                const isMediumDemand = demand > 8 && demand <= 15

                return (
                  <Card
                    key={`${prediction.date}-${index}`} // Ajout de la key
                    className={`transition-all duration-200 hover:scale-105 ${
                      isHighDemand 
                        ? 'border-l-4 border-l-red-500 bg-red-50/50' 
                        : isMediumDemand 
                        ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50'
                        : 'border-l-4 border-l-green-500 bg-green-50/50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm font-medium text-slate-600">
                            {new Date(prediction.date).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </div>
                          <div className="text-lg font-bold text-slate-800">
                            Day {index + 1}
                          </div>
                        </div>
                        <Badge
                          className={`${
                            isHighDemand ? 'bg-red-100 text-red-700' :
                            isMediumDemand ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}
                        >
                          {isHighDemand ? 'High' : isMediumDemand ? 'Medium' : 'Low'}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Demand</span>
                          <span className="font-semibold text-blue-600">{demand} units</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Confidence</span>
                            <span className="font-semibold text-green-600">{Math.round(confidence * 100)}%</span>
                          </div>
                          <Progress value={confidence * 100} className="h-2" />
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <div className="flex items-center text-xs">
                            {isHighDemand ? (
                              <><Zap className="w-3 h-3 mr-1 text-red-500" />
                              <span className="text-red-600">Prepare additional stock</span></>
                            ) : isMediumDemand ? (
                              <><Clock className="w-3 h-3 mr-1 text-yellow-500" />
                              <span className="text-yellow-600">Monitor levels</span></>
                            ) : (
                              <><TrendingDown className="w-3 h-3 mr-1 text-green-500" />
                              <span className="text-green-600">Standard demand</span></>
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

        {/* Optimization Recommendations */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              AI-Powered Optimization Recommendations
            </CardTitle>
            <CardDescription>Intelligent suggestions based on forecast analysis and current inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blood Type Specific Recommendations */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Blood Type Analysis
                </h4>
                {optimizationData?.blood_type_recommendations?.slice(0, 3).map((rec, index) => (
                  <div
                    key={`${rec.blood_type}-${index}`} // Ajout de la key
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'critical' ? 'border-l-red-500 bg-red-50' :
                      rec.priority === 'high' ? 'border-l-orange-500 bg-orange-50' :
                      rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                      'border-l-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-slate-800">{rec.blood_type}</h5>
                      <Badge className={`${
                        rec.priority === 'critical' ? 'bg-red-600 text-white' :
                        rec.priority === 'high' ? 'bg-orange-600 text-white' :
                        rec.priority === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Current Stock:</span>
                        <span className="font-medium ml-2">{rec.current_stock} units</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Days Supply:</span>
                        <span className="font-medium ml-2">{rec.days_of_supply} days</span>
                      </div>
                    </div>
                    {rec.actions.length > 0 && (
                      <div className="mt-3 p-2 bg-white/70 rounded">
                        <p className="text-sm font-medium text-slate-700">
                          {rec.actions[0].message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* General Recommendations */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  System Recommendations
                </h4>
                {optimizationData?.general_recommendations?.map((rec, index) => (
                  <div
                    key={`${rec.type}-${index}`} // Ajout de la key
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'critical' ? 'border-l-red-500 bg-red-50' :
                      rec.priority === 'high' ? 'border-l-orange-500 bg-orange-50' :
                      rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-slate-600 capitalize">
                        {rec.type.replace('_', ' ')}
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
                    <p className="text-sm text-slate-700">{rec.message}</p>
                  </div>
                ))}

                {/* Additional AI Insights */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <h5 className="font-medium text-purple-800 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Strategic Insights
                  </h5>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Weekend demand typically 30% lower</li>
                    <li>• Monday spike pattern detected</li>
                    <li>• Seasonal adjustments recommended</li>
                    <li>• Emergency buffer: 3-day supply minimum</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                  <h5 className="font-medium text-teal-800 mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Performance Metrics
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-teal-600">Forecast Accuracy:</span>
                      <span className="font-medium ml-1">94.2%</span>
                    </div>
                    <div>
                      <span className="text-teal-600">Response Time:</span>
                      <span className="font-medium ml-1">2.3s</span>
                    </div>
                    <div>
                      <span className="text-teal-600">Model Updates:</span>
                      <span className="font-medium ml-1">Daily</span>
                    </div>
                    <div>
                      <span className="text-teal-600">Data Points:</span>
                      <span className="font-medium ml-1">10,000+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Model Performance
              </CardTitle>
              <CardDescription>AI model accuracy and performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Accuracy</span>
                  <span className="font-semibold text-green-600">{forecastData.model_accuracy.accuracy}</span>
                </div>
                <Progress value={94.2} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Based on {forecastData.model_accuracy.samples} historical predictions
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Method Effectiveness</span>
                  <span className="font-semibold text-blue-600">
                    {forecastData.method_used.charAt(0).toUpperCase() + forecastData.method_used.slice(1)}
                  </span>
                </div>
                <Progress value={91.8} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Current algorithm performance rating
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Prediction Confidence</span>
                  <span className="font-semibold text-teal-600">
                    {Math.round(forecastData.predictions.reduce((acc, p) => acc + p.confidence, 0) / forecastData.predictions.length * 100)}%
                  </span>
                </div>
                <Progress value={89.5} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Average confidence across all predictions
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enhanced AI:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {forecastData.enhanced_forecasting_available ? "Available" : "Basic Mode"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Forecast Timeline & Milestones
              </CardTitle>
              <CardDescription>Key predictions and important dates to monitor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecastData?.predictions?.slice(0, 5).map((prediction, index) => {
                  const labels = ["Tomorrow", "Day After", "This Weekend", "Next Week", "Week 2"]
                  const demand = prediction.predicted_demand
                  const demandLevel = demand > 15 ? "High" : demand > 8 ? "Medium" : "Low"
                  const colorClass = demandLevel === "High" ? "red" : demandLevel === "Medium" ? "yellow" : "green"

                  return (
                    <div
                      key={`timeline-${prediction.date}-${index}`} // Ajout de la key
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-all hover:scale-102 ${
                        colorClass === "red"
                          ? "bg-red-50 hover:bg-red-100 border border-red-200"
                          : colorClass === "yellow"
                          ? "bg-yellow-50 hover:bg-yellow-100 border border-yellow-200"
                          : "bg-green-50 hover:bg-green-100 border border-green-200"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            colorClass === "red" ? "bg-red-500" : 
                            colorClass === "yellow" ? "bg-yellow-500" : "bg-green-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${
                          colorClass === "red" ? "text-red-800" : 
                          colorClass === "yellow" ? "text-yellow-800" : "text-green-800"
                        }`}>
                          {labels[index] || `Day ${index + 1}`}
                        </p>
                        <p className={`text-xs ${
                          colorClass === "red" ? "text-red-600" : 
                          colorClass === "yellow" ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {demandLevel} demand: {demand} units expected
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(prediction.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            colorClass === "red" ? "border-red-300 text-red-700" : 
                            colorClass === "yellow" ? "border-yellow-300 text-yellow-700" : 
                            "border-green-300 text-green-700"
                          }`}
                        >
                          {Math.round(prediction.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <h5 className="font-medium text-indigo-800 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Next Model Update
                </h5>
                <p className="text-sm text-indigo-700">
                  Scheduled for tonight at 2:00 AM (in 14 hours)
                </p>
                <div className="mt-2 flex items-center text-xs text-indigo-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
                  Continuous learning enabled
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Information */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">AI Forecasting System</h3>
                  <p className="text-sm text-slate-600">
                    Last updated: {forecastData?.generated_at ?
                      new Date(forecastData.generated_at).toLocaleString('fr-FR') :
                      'N/A'
                    }
                  </p>

                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Enhanced AI: {forecastData?.enhanced_forecasting_available ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}