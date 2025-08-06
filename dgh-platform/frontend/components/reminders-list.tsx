"use client"

import {useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Switch} from "@/components/ui/switch"
import {Calendar, Clock, Edit, MessageSquare, Phone, Pill, Stethoscope, Trash2} from "lucide-react"
import {useLanguage} from "@/contexts/language-context"

export function RemindersList() {
    const {t} = useLanguage()

    const [reminderList, setReminderList] = useState([
        {
            id: 1,
            type: "appointment",
            title: t("reminders.cardiology_appointment"),
            description: t("reminders.followup_consultation"),
            date: "2024-01-20",
            time: "14:30",
            method: "sms",
            language: "en",
            active: true,
            patient: "Marie Dubois",
        },
        {
            id: 2,
            type: "medication",
            title: t("reminders.medication_intake"),
            description: t("reminders.aspirin_tablet"),
            date: "2024-01-18",
            time: "08:00",
            method: "call",
            language: "fr",
            active: true,
            patient: "John Smith",
        },
        {
            id: 3,
            type: "appointment",
            title: t("reminders.blood_test"),
            description: t("reminders.lab_fasting"),
            date: "2024-01-22",
            time: "09:00",
            method: "sms",
            language: "duala",
            active: false,
            patient: "Ngozi Mballa",
        },
    ])

    const toggleReminder = (id: number) => {
        setReminderList((prev) =>
            prev.map((reminder) => (reminder.id === id ? {...reminder, active: !reminder.active} : reminder)),
        )
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "appointment":
                return <Stethoscope className="h-4 w-4"/>
            case "medication":
                return <Pill className="h-4 w-4"/>
            default:
                return <Calendar className="h-4 w-4"/>
        }
    }

    const getMethodIcon = (method: string) => {
        return method === "sms" ? <MessageSquare className="h-4 w-4"/> : <Phone className="h-4 w-4"/>
    }

    const getLanguageBadge = (language: string) => {
        const languages = {
            fr: t("lang.french"),
            en: t("lang.english"),
            duala: t("lang.duala"),
            bassa: t("lang.bassa"),
            ewondo: t("lang.ewondo"),
        }
        return languages[language as keyof typeof languages] || language
    }

    return (
        <div className="space-y-4">
            {reminderList.map((reminder) => (
                <Card
                    key={reminder.id}
                    className={`transition-all border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${!reminder.active ? "opacity-60" : ""}`}
                >
                    <CardHeader className="pb-2 sm:pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {getTypeIcon(reminder.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base sm:text-lg truncate">{reminder.title}</CardTitle>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                        {getLanguageBadge(reminder.language)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                                <Switch checked={reminder.active} onCheckedChange={() => toggleReminder(reminder.id)}/>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm"
                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8 p-0">
                                        <Edit className="h-3 w-3 sm:h-4 sm:w-4"/>
                                    </Button>
                                    <Button variant="ghost" size="sm"
                                            className="hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0">
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <CardDescription className="text-xs sm:text-sm mt-2">{reminder.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0"/>
                                <span className="truncate">{reminder.date}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0"/>
                                <span className="truncate">{reminder.time}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                {getMethodIcon(reminder.method)}
                                <span
                                    className="truncate">{reminder.method === "sms" ? t("reminders.sms") : t("reminders.call")}</span>
                            </div>
                            <div className="text-muted-foreground truncate col-span-2 sm:col-span-1">
                <span className="text-xs">
                  {t("reminders.patient")}: {reminder.patient}
                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {reminderList.length === 0 && (
                <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardContent className="text-center py-12">
                        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                        <p className="text-muted-foreground text-lg">{t("reminders.no_reminders")}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
