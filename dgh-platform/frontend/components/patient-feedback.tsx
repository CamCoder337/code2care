"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageSquare, Star, ThumbsUp, ThumbsDown, Globe, Calendar, Reply, Archive, Flag } from "lucide-react"

export default function PatientFeedback() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [themeFilter, setThemeFilter] = useState("all")

  const feedbackThemes = [
    { id: "THEME001", name: "Service Quality" },
    { id: "THEME002", name: "Wait Time" },
    { id: "THEME003", name: "Staff Behavior" },
    { id: "THEME004", name: "Facility Cleanliness" },
    { id: "THEME005", name: "Treatment Effectiveness" },
  ]

  const feedbacks = [
    {
      id: "FB001",
      patient: {
        name: "John Smith",
        id: "PAT001",
        avatar: "JS",
      },
      createdAt: "2024-01-20T10:30:00",
      inputType: "rating",
      language: "English",
      description:
        "Excellent service! Dr. Johnson was very professional and took time to explain everything clearly. The staff was friendly and the facility was clean.",
      status: "reviewed",
      theme: {
        id: "THEME001",
        name: "Service Quality",
      },
      rating: 5,
    },
    {
      id: "FB002",
      patient: {
        name: "Maria Garcia",
        id: "PAT002",
        avatar: "MG",
      },
      createdAt: "2024-01-19T14:15:00",
      inputType: "text",
      language: "Français",
      description:
        "Le temps d'attente était un peu long, mais le personnel était très aimable. Le docteur a pris le temps de répondre à toutes mes questions.",
      status: "pending",
      theme: {
        id: "THEME002",
        name: "Wait Time",
      },
      rating: 4,
    },
    {
      id: "FB003",
      patient: {
        name: "David Johnson",
        id: "PAT003",
        avatar: "DJ",
      },
      createdAt: "2024-01-18T16:45:00",
      inputType: "rating",
      language: "English",
      description:
        "The treatment was effective and I'm feeling much better. However, the waiting room could be more comfortable.",
      status: "reviewed",
      theme: {
        id: "THEME005",
        name: "Treatment Effectiveness",
      },
      rating: 4,
    },
    {
      id: "FB004",
      patient: {
        name: "Sarah Wilson",
        id: "PAT004",
        avatar: "SW",
      },
      createdAt: "2024-01-17T11:20:00",
      inputType: "text",
      language: "Duala",
      description: "Ndokta a yi nkap mingi. A longue ma nkap nye nye. Facility a yi propre mingi.",
      status: "pending",
      theme: {
        id: "THEME003",
        name: "Staff Behavior",
      },
      rating: 5,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500 hover:bg-orange-600"
      case "reviewed":
        return "bg-green-500 hover:bg-green-600"
      case "archived":
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  const getLanguageColor = (language: string) => {
    switch (language) {
      case "English":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "Français":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "Duala":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 sm:w-4 sm:h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ))
  }

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      feedback.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || feedback.status === statusFilter
    const matchesTheme = themeFilter === "all" || feedback.theme.id === themeFilter

    return matchesSearch && matchesStatus && matchesTheme
  })

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mobile-container">
        <div className="mobile-content space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
          {/* Header - Mobile First */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Patient Feedback
                </h1>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm lg:text-base">
                  Monitor and respond to patient feedback
                </p>
              </div>
              <div className="button-group-responsive w-full sm:w-auto mt-2 sm:mt-0">
                <Button variant="outline" className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none">
                  <Archive className="icon-responsive-sm" />
                  <span className="truncate">Archive Selected</span>
                </Button>
                <Button className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 flex-1 sm:flex-none">
                  <MessageSquare className="icon-responsive-sm" />
                  <span className="truncate">Send Survey</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Filters - Mobile Optimized */}
          <Card className="glass-effect border-0 shadow-lg floating-card w-full">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground icon-responsive-sm" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 btn-responsive bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="btn-responsive bg-transparent w-full">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={themeFilter} onValueChange={setThemeFilter}>
                    <SelectTrigger className="btn-responsive bg-transparent w-full">
                      <SelectValue placeholder="Filter by theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Themes</SelectItem>
                      {feedbackThemes.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List - Completely Mobile Responsive */}
          <div className="space-y-4 sm:space-y-6">
            {filteredFeedbacks.map((feedback, index) => (
              <Card
                key={feedback.id}
                className="card-hover glass-effect border-0 shadow-lg animate-slide-up w-full"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Patient Header - Mobile First */}
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary-500 ring-offset-2 ring-offset-background flex-shrink-0">
                        <AvatarImage src={`/placeholder.svg?height=64&width=64`} />
                        <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-lg font-bold">
                          {feedback.patient.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                            {feedback.patient.name}
                          </h3>
                          <Badge variant="outline" className="text-xs flex-shrink-0 px-1 sm:px-2">
                            {feedback.patient.id}
                          </Badge>
                          <Badge className={`${getStatusColor(feedback.status)} text-xs px-1 sm:px-2`}>
                            {feedback.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="icon-responsive-sm flex-shrink-0" />
                            <span className="truncate">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="icon-responsive-sm flex-shrink-0" />
                            <Badge
                              variant="secondary"
                              className={`${getLanguageColor(feedback.language)} text-xs px-1 sm:px-2`}
                            >
                              {feedback.language}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="icon-responsive-sm flex-shrink-0" />
                            <span className="truncate">{feedback.inputType}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Mobile Stack */}
                    <div className="button-group-responsive w-full sm:w-auto">
                      <Button variant="outline" className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none">
                        <Reply className="icon-responsive-sm" />
                        <span className="truncate">Reply</span>
                      </Button>
                      <Button variant="outline" className="btn-responsive-sm gap-1 bg-transparent flex-1 sm:flex-none">
                        <Flag className="icon-responsive-sm" />
                        <span className="truncate">Flag</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Theme and Rating - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-background/50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Badge
                        variant="secondary"
                        className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-xs px-1 sm:px-2 self-start"
                      >
                        {feedback.theme.name}
                      </Badge>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-0.5 sm:gap-1">{renderStars(feedback.rating)}</div>
                        <span className="text-xs sm:text-sm font-medium">{feedback.rating}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {feedback.rating >= 4 ? (
                        <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Feedback Content - Mobile Optimized */}
                  <div className="p-3 sm:p-4 bg-background/30 rounded-lg">
                    <p className="text-xs sm:text-sm leading-relaxed break-words">{feedback.description}</p>
                  </div>

                  {/* Response Area - Mobile Optimized */}
                  {feedback.status === "pending" && (
                    <div className="space-y-3 p-3 sm:p-4 bg-background/20 rounded-lg border-l-4 border-primary-500">
                      <h5 className="font-medium text-xs sm:text-sm">Quick Response</h5>
                      <Textarea
                        placeholder="Type your response to the patient..."
                        className="bg-background/50 border-0 focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm"
                        rows={3}
                      />
                      <div className="button-group-responsive">
                        <Button className="btn-responsive-sm bg-gradient-to-r from-primary-500 to-secondary-500 flex-1 sm:flex-none">
                          Send Response
                        </Button>
                        <Button variant="outline" className="btn-responsive-sm bg-transparent flex-1 sm:flex-none">
                          Mark as Reviewed
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
