"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Progress} from "@/components/ui/progress"
import {type ProfessionalUser, useAuthStore} from "@/stores/auth-store"
import {
    Activity,
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Plus,
    Star,
    TrendingUp,
    Users,
} from "lucide-react"

export default function DashboardPage() {
    const {user} = useAuthStore()
    const professional = user as ProfessionalUser
    const stats = [
        {
            title: "Total Patients",
            value: "1,247",
            change: "+12%",
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-950",
        },
        {
            title: "Today's Appointments",
            value: "18",
            change: "3 pending",
            icon: Calendar,
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-50 dark:bg-green-950",
        },
        {
            title: "Prescriptions Issued",
            value: "89",
            change: "This week",
            icon: FileText,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50 dark:bg-purple-950",
        },
        {
            title: "Patient Satisfaction",
            value: "4.8/5",
            change: "+0.2",
            icon: Star,
            color: "from-orange-500 to-orange-600",
            bgColor: "bg-orange-50 dark:bg-orange-950",
        },
    ]

    const appointments = [
        {
            id: 1,
            time: "09:00",
            patient: "John Smith",
            type: "Consultation",
            status: "completed",
            avatar: "JS",
        },
        {
            id: 2,
            time: "10:30",
            patient: "Maria Garcia",
            type: "Follow-up",
            status: "completed",
            avatar: "MG",
        },
        {
            id: 3,
            time: "14:00",
            patient: "David Johnson",
            type: "Routine Check",
            status: "scheduled",
            avatar: "DJ",
        },
        {
            id: 4,
            time: "15:30",
            patient: "Sarah Wilson",
            type: "Emergency",
            status: "scheduled",
            avatar: "SW",
        },
    ]

    const tasks = [
        {
            id: 1,
            title: "Review lab results",
            priority: "high",
            status: "pending",
        },
        {
            id: 2,
            title: "Update prescription",
            priority: "medium",
            status: "pending",
        },
        {
            id: 3,
            title: "Schedule follow-up",
            priority: "low",
            status: "pending",
        },
        {
            id: 4,
            title: "Respond to feedback",
            priority: "medium",
            status: "pending",
        },
    ]

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
            {/* Header */}
            <div
                className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        {`Welcome, ${professional?.first_name || "Professional"}`}
                    </h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base xl:text-lg">
                        {"Here's what's happening today"}
                    </p>
                </div>
                <Button
                    className="btn-responsive bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1 sm:gap-2 w-full sm:w-auto">
                    <Plus className="icon-responsive-sm"/>
                    <span className="truncate">New Appointment</span>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="responsive-grid">
                {stats.map((stat, index) => (
                    <Card
                        key={stat.title}
                        className={`card-hover animate-scale-in ${stat.bgColor} border-0 shadow-lg w-full`}
                        style={{animationDelay: `${index * 0.1}s`}}
                    >
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 truncate">
                                        {stat.title}
                                    </p>
                                    <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate">{stat.value}</p>
                                    <div className="flex items-center gap-1 mt-1 sm:mt-2">
                                        <TrendingUp className="icon-responsive-sm text-green-500 flex-shrink-0"/>
                                        <span
                                            className="text-xs sm:text-sm text-green-500 font-medium truncate">{stat.change}</span>
                                    </div>
                                </div>
                                <div
                                    className={`p-2 sm:p-3 rounded-full bg-gradient-to-r ${stat.color} shadow-lg flex-shrink-0`}>
                                    <stat.icon className="icon-responsive text-white"/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Today's Appointments */}
                <Card className="card-hover shadow-lg border-0 glass-effect w-full">
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div
                                className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0">
                                <Calendar className="icon-responsive text-white"/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <CardTitle
                                    className="text-base sm:text-lg lg:text-xl truncate">{"Today's Appointments"}</CardTitle>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">Scheduled for today</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                        {appointments.map((appointment, index) => (
                            <div
                                key={appointment.id}
                                className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-all duration-200 animate-fade-in w-full"
                                style={{animationDelay: `${index * 0.1}s`}}
                            >
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
                                    <Clock className="icon-responsive-sm text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-xs sm:text-sm truncate">{appointment.time}</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div
                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {appointment.avatar}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-xs sm:text-sm truncate">{appointment.patient}</p>
                                        <p className="text-xs text-muted-foreground truncate">{appointment.type}</p>
                                    </div>
                                </div>
                                <Badge
                                    variant={appointment.status === "completed" ? "default" : "secondary"}
                                    className={`text-xs flex-shrink-0 px-1 sm:px-2 py-0.5 ${
                                        appointment.status === "completed"
                                            ? "bg-green-500 hover:bg-green-600"
                                            : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                                >
                                    {appointment.status === "completed" ? (
                                        <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1"/>
                                    ) : (
                                        <Clock className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1"/>
                                    )}
                                    <span className="hidden sm:inline truncate">{appointment.status}</span>
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Pending Tasks */}
                <Card className="card-hover shadow-lg border-0 glass-effect w-full">
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div
                                className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex-shrink-0">
                                <AlertCircle className="icon-responsive text-white"/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg lg:text-xl truncate">Pending
                                    Tasks</CardTitle>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">Need your attention</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                        {tasks.map((task, index) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-all duration-200 animate-fade-in w-full"
                                style={{animationDelay: `${index * 0.1}s`}}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs sm:text-sm truncate">{task.title}</p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`text-xs flex-shrink-0 px-1 sm:px-2 py-0.5 ${
                                        task.priority === "high"
                                            ? "border-red-500 text-red-500"
                                            : task.priority === "medium"
                                                ? "border-blue-500 text-blue-500"
                                                : "border-gray-500 text-gray-500"
                                    }`}
                                >
                                    {task.priority}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Activity Chart */}
            <Card className="card-hover shadow-lg border-0 glass-effect w-full">
                <CardHeader>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div
                            className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex-shrink-0">
                            <Activity className="icon-responsive text-white"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg lg:text-xl truncate">Weekly Activity</CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Performance this week</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center gap-2">
                            <span
                                className="text-xs sm:text-sm font-medium truncate flex-1">Appointments Completed</span>
                            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">85%</span>
                        </div>
                        <Progress value={85} className="h-1.5 sm:h-2"/>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-xs sm:text-sm font-medium truncate flex-1">Prescriptions Issued</span>
                            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">92%</span>
                        </div>
                        <Progress value={92} className="h-1.5 sm:h-2"/>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-xs sm:text-sm font-medium truncate flex-1">Patient Satisfaction</span>
                            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">96%</span>
                        </div>
                        <Progress value={96} className="h-1.5 sm:h-2"/>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}