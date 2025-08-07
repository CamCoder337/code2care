"use client"

import {Moon, Sun} from "lucide-react"
import {useTheme} from "next-themes"
import {Button} from "@/components/ui/button"
import {useEffect, useState} from "react"

export function ThemeToggle() {
    const {theme, setTheme, resolvedTheme} = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20"
            >
                <Sun className="h-4 w-4"/>
            </Button>
        )
    }

    const isDark = resolvedTheme === "dark"

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 hover:bg-white/90 dark:hover:bg-gray-800/90"
        >
            {isDark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
