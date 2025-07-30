import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chat2Care',
  description: 'Chatbot pour les soins de santé',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Ajoute ici tes propres styles ou polices si besoin */}
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}