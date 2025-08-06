"use client"

import {useLanguage} from "@/contexts/language-context"
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Languages} from "lucide-react"

type Language = "en" | "fr" | "duala" | "bassa" | "ewondo"

const languageOptions = [
    {value: "fr", label: "Français", flag: "🇫🇷"},
    {value: "en", label: "English", flag: "🇬🇧"},
    {value: "duala", label: "Duala", flag: "🇨🇲"},
    {value: "bassa", label: "Bassa", flag: "🇨🇲"},
    {value: "ewondo", label: "Ewondo", flag: "🇨🇲"},
]

interface LanguageSelectorProps {
    variant?: "select" | "buttons"
    size?: "sm" | "md" | "lg"
    showLabel?: boolean
}

export function LanguageSelector({
                                     variant = "select",
                                     size = "md",
                                     showLabel = true
                                 }: LanguageSelectorProps) {
    const {language, setLanguage, t} = useLanguage()

    const handleLanguageChange = (newLanguage: Language) => {
        setLanguage(newLanguage)
    }

    if (variant === "buttons") {
        return (
            <div className="flex flex-col gap-2">
                {showLabel && (
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-4 w-4"/>
                        <span>Langue / Language</span>
                    </div>
                )}
                <div className="flex flex-wrap gap-1">
                    {languageOptions.map((option) => (
                        <Button
                            key={option.value}
                            variant={language === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleLanguageChange(option.value as Language)}
                            className={`${
                                size === "sm" ? "px-2 py-1 text-xs" :
                                    size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm"
                            } transition-all`}
                        >
                            <span className="mr-1">{option.flag}</span>
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {showLabel && (
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Languages className="h-4 w-4"/>
                    <span>Langue / Language</span>
                </div>
            )}
            <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger
                    className={`${
                        size === "sm" ? "h-8 text-xs" :
                            size === "lg" ? "h-12 text-base" : "h-10 text-sm"
                    } w-full`}
                >
                    <SelectValue>
                        <div className="flex items-center gap-2">
                            <span>{languageOptions.find(opt => opt.value === language)?.flag}</span>
                            <span>{languageOptions.find(opt => opt.value === language)?.label}</span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                                <span>{option.flag}</span>
                                <span>{option.label}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}