"use client"

import {FormEvent, useState} from "react"
import {useRouter} from "next/navigation"
import {useAuthStore} from "@/stores/auth-store"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Loader2, Lock, User} from "lucide-react"

export function UnifiedLoginForm() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const {login, error, redirectToRoleDashboard} = useAuthStore()
    const router = useRouter()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!username.trim() || !password.trim()) return

        setIsSubmitting(true)

        try {
            await login({username: username.trim(), password})
            // Redirection automatique basée sur le rôle
            redirectToRoleDashboard()
        } catch (err) {
            console.error("Login error:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 p-4">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <div
                        className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-white"/>
                    </div>
                    <CardTitle
                        className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 dark:from-blue-400 dark:via-green-400 dark:to-blue-200 bg-clip-text text-transparent">
                        HIGH5 Medical
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                        Connectez-vous à votre compte patient ou professionnel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-700 dark:text-gray-200 font-medium">Nom
                                d'utilisateur</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Votre nom d'utilisateur"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10 bg-white/60 dark:bg-gray-900/60 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-200 font-medium">Mot de
                                passe</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Votre mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-white/60 dark:bg-gray-900/60 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg py-6 text-lg font-medium transition-all hover:scale-[1.02]"
                            disabled={isSubmitting || !username.trim() || !password.trim()}
                            size="lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                                    Connexion...
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <div
                            className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                🔄 <strong>Accès personnalisé</strong>
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Redirection automatique selon votre profil
                            </p>
                            <div className="flex justify-center gap-4 mt-2 text-xs">
                                <span className="text-blue-600 dark:text-blue-400">👤 Patient → Espace Personnel</span>
                                <span className="text-green-600 dark:text-green-400">🩺 Professionnel → Dashboard</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}