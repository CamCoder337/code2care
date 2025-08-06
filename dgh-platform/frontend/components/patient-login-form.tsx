"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {ArrowLeft, Eye, EyeOff, Loader2, User} from "lucide-react"
import {usePatientAuth} from "@/components/patient-auth-context"
import {useToast} from "@/hooks/use-toast"
import {ThemeToggle} from "@/components/theme-toggle"
import Image from "next/image"
import Link from "next/link"

export function PatientLoginForm() {
    // 1. Remplacer l'état 'email' par 'username'
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    // On utilise directement isLoading et error du contexte
    const {login, isLoading, error} = usePatientAuth()
    const {toast} = useToast()

    // 3. Simplifier la fonction handleSubmit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const loggedInPatient = await login(username, password)

        if (loggedInPatient) {
            toast({
                title: "Connexion réussie",
                description: `Bienvenue, ${loggedInPatient.first_name} !`,
            })
            // La redirection est gérée par la page parente
        } else {
            // L'erreur est déjà dans le contexte, on peut l'afficher directement
            // ou utiliser un message générique.
            toast({
                title: "Échec de la connexion",
                description: error || "Veuillez vérifier votre nom d'utilisateur et mot de passe.",
                variant: "destructive",
            })
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-gray-950 dark:via-blue-950 dark:to-green-950 p-4">
            <Button
                variant="ghost"
                size="icon"
                asChild
                className="absolute top-4 left-4 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            >
                <Link href="/" aria-label="Retour à la page d'accueil">
                    <ArrowLeft className="h-5 w-5"/>
                </Link>
            </Button>
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <ThemeToggle/>
            </div>

            <Card className="w-full max-w-md border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-2xl">
                <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-6">
                        <Image src="/high5-logo.png" alt="HIGH5 Logo" width={80} height={80} className="rounded-2xl"/>
                    </div>
                    <CardTitle
                        className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        HIGH5
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                        Se connecter en tant que patient
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 2. Mettre à jour le champ de saisie */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Nom d'utilisateur</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="zedjunior"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-white/80 dark:bg-gray-900/80 border-white/20 h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Entrez votre mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white/80 dark:bg-gray-900/80 border-white/20 pr-10 h-12"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </div>

                        {/* Affichage de l'erreur du contexte */}
                        {error && !isLoading && <p className="text-sm text-red-500 text-center">{error}</p>}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-6 text-lg font-medium h-12"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <User className="h-5 w-5 mr-2"/>
                                    Se connecter
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}