import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"

// L'erreur est corrigée en supprimant le mot-clé 'export'.
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
        {/*
          Les fournisseurs d'authentification ont été retirés d'ici.
          Ils doivent être placés dans les layouts spécifiques (ex: app/patient/layout.tsx)
          pour isoler les états et améliorer les performances.
          Seuls les fournisseurs réellement globaux restent ici.
        */}
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
        </body>
        </html>
    )
}