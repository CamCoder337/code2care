"use client"

import React, { useState } from "react"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link" // Importation de Link pour la navigation
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
// Ajout de l'icône ArrowLeft pour le bouton de retour
import { Eye, EyeOff, Lock, User, Sun, Moon, Stethoscope, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// La prop onLogin n'est plus nécessaire, ce qui rend le composant plus simple.
export function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const { theme, setTheme } = useTheme()
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // La redirection est maintenant gérée par la page qui utilise ce composant.
    await login(username, password)
  }

  return (
      <div className="min-h-screen flex items-center justify-center medical-gradient p-4">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Bouton de retour vers la page d'accueil */}
        <Button
            variant="outline"
            size="sm"
            asChild // Permet au bouton de se comporter comme un lien
            className="absolute top-4 left-4 z-10 glass-effect border-white/20 text-white hover:bg-white/10"
        >
          <Link href="/" aria-label="Retour à la page d'accueil">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>

        {/* Theme Toggle */}
        <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="absolute top-4 right-4 z-10 glass-effect border-white/20 text-white hover:bg-white/10"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Card className="w-full max-w-md glass-effect border-white/20 shadow-2xl animate-bounce-in relative z-10">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Image src="/high5-logo.png" alt="HIGH5 Logo" width={80} height={80} className="rounded-2xl" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary-500 rounded-full animate-pulse-glow flex items-center justify-center">
                  <Stethoscope className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-white">MedAdmin</CardTitle>
              <p className="text-white/80">Professional Medical Dashboard</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/90">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                  <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-secondary-500 focus:ring-secondary-500"
                      required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-secondary-500 focus:ring-secondary-500"
                      required
                  />
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-secondary-500 data-[state=checked]:border-secondary-500"
                  />
                  <Label htmlFor="remember" className="text-sm text-white/80">
                    Remember me
                  </Label>
                </div>
                <Button variant="link" className="text-secondary-400 hover:text-secondary-300 p-0">
                  Forgot password?
                </Button>
              </div>

              <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In to Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}