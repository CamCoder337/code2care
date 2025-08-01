"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BarChart3,
  Download,
  FileText,
  CalendarIcon,
  TrendingUp,
  Users,
  Droplets,
  Activity,
  PieChart,
  LineChart,
} from "lucide-react"

export function Reports() {
  const [reportType, setReportType] = useState("inventory")
  const [dateRange, setDateRange] = useState("30days")
  const [selectedDate, setSelectedDate] = useState<Date>()

  const reportTypes = [
    { value: "inventory", label: "Inventory Report", icon: Droplets },
    { value: "donors", label: "Donor Analytics", icon: Users },
    { value: "requests", label: "Request Analysis", icon: FileText },
    { value: "forecasting", label: "Forecast Report", icon: TrendingUp },
    { value: "consumption", label: "Consumption Trends", icon: Activity },
    { value: "performance", label: "Performance Metrics", icon: BarChart3 },
  ]

  const quickReports = [
    {
      title: "Daily Inventory Summary",
      description: "Current stock levels by blood type",
      type: "inventory",
      lastGenerated: "2 hours ago",
      size: "2.3 MB",
    },
    {
      title: "Weekly Donor Report",
      description: "Donor activity and registration trends",
      type: "donors",
      lastGenerated: "1 day ago",
      size: "1.8 MB",
    },
    {
      title: "Monthly Consumption Analysis",
      description: "Blood usage patterns and trends",
      type: "consumption",
      lastGenerated: "3 days ago",
      size: "4.1 MB",
    },
    {
      title: "AI Forecast Accuracy",
      description: "Model performance and prediction results",
      type: "forecasting",
      lastGenerated: "1 week ago",
      size: "3.2 MB",
    },
  ]

  const reportMetrics = [
    { label: "Reports Generated", value: "1,247", change: "+18%", icon: FileText, color: "text-blue-600" },
    { label: "Data Points", value: "45.2K", change: "+12%", icon: BarChart3, color: "text-green-600" },
    { label: "Export Downloads", value: "892", change: "+24%", icon: Download, color: "text-teal-600" },
    { label: "Scheduled Reports", value: "23", change: "+3", icon: CalendarIcon, color: "text-purple-600" },
  ]

  const getReportIcon = (type: string) => {
    const reportType = reportTypes.find((rt) => rt.value === type)
    if (reportType) {
      const Icon = reportType.icon
      return <Icon className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "inventory":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "donors":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "requests":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "forecasting":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "consumption":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "performance":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Generate comprehensive reports and insights</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 transition-all duration-200 hover:scale-105">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Report Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.label}
              className="hover:shadow-lg transition-all duration-200 hover:scale-105 animate-slide-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{metric.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Generator */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-teal-600" />
            Custom Report Generator
          </CardTitle>
          <CardDescription>Create customized reports with specific parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? selectedDate.toDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 transition-all duration-200 hover:scale-105">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="hover:scale-105 transition-transform bg-transparent">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" />
            Quick Reports
          </CardTitle>
          <CardDescription>Pre-generated reports ready for download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickReports.map((report, index) => (
              <div
                key={report.title}
                className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 animate-slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getReportIcon(report.type)}
                    <h3 className="font-semibold">{report.title}</h3>
                  </div>
                  <Badge className={getTypeColor(report.type)}>
                    {reportTypes.find((rt) => rt.value === report.type)?.label.split(" ")[0]}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{report.description}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Last generated: {report.lastGenerated}</span>
                  <span>Size: {report.size}</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:scale-105 transition-transform bg-transparent"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="hover:scale-105 transition-transform bg-transparent">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <PieChart className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Inventory Analytics</CardTitle>
            <CardDescription>Stock levels, turnover rates, and inventory optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Available Reports:</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated:</span>
                <span className="text-green-600">2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <LineChart className="w-12 h-12 mx-auto text-green-600 mb-2" />
            <CardTitle className="text-lg">Trend Analysis</CardTitle>
            <CardDescription>Historical trends and pattern recognition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Available Reports:</span>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated:</span>
                <span className="text-green-600">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-purple-600 mb-2" />
            <CardTitle className="text-lg">Predictive Reports</CardTitle>
            <CardDescription>AI-powered forecasts and predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Available Reports:</span>
                <span className="font-semibold">6</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated:</span>
                <span className="text-green-600">30 min ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-teal-600" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>Automated report generation schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div>
                  <p className="font-medium">Daily Inventory Summary</p>
                  <p className="text-sm text-muted-foreground">Every day at 8:00 AM</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="font-medium">Weekly Donor Analytics</p>
                  <p className="text-sm text-muted-foreground">Every Monday at 9:00 AM</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div>
                  <p className="font-medium">Monthly Performance Report</p>
                  <p className="text-sm text-muted-foreground">First day of each month</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
