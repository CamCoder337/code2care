import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { UnifiedAuthProvider } from "@/contexts/unified-auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "HIGH5 medical platform",
    description: "Modern medical platform for professionals and patients",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
        <body className={`${inter.className} overflow-x-hidden w-full max-w-full`}>
        <UnifiedAuthProvider>
            <LanguageProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange={false}
                >
                    <div className="w-full max-w-full overflow-x-hidden">
                        {children}
                    </div>
                </ThemeProvider>
            </LanguageProvider>
        </UnifiedAuthProvider>
        </body>
        </html>
    )
}