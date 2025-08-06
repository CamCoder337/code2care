"use client"

import {useEffect, useRef} from "react"
import {useRouter} from "next/navigation"
import Image from "next/image"
import {ThemeToggle} from "@/components/theme-toggle"
import {Button} from "@/components/ui/button"
import Link from "next/link"
import {Stethoscope, User} from "lucide-react"
import {useAuthStore} from "@/stores/auth-store"
import {gsap} from "gsap"
import {ScrollTrigger} from "gsap/ScrollTrigger"

// Enregistrement du plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
    const {user, isLoading, hasHydrated, redirectToRoleDashboard} = useAuthStore()
    const router = useRouter()
    const isAuthenticated = !!user

    // Refs pour les animations
    const heroRef = useRef<HTMLElement>(null)
    const featuresRef = useRef<HTMLElement>(null)
    const languagesRef = useRef<HTMLElement>(null)
    const ctaRef = useRef<HTMLElement>(null)

    useEffect(() => {
        if (hasHydrated && !isLoading && isAuthenticated) {
            redirectToRoleDashboard()
        }
    }, [hasHydrated, isAuthenticated, isLoading, redirectToRoleDashboard])

    // Animations GSAP
    useEffect(() => {
        if (isLoading || isAuthenticated) return

        // Vérifier si GSAP est disponible
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded, using CSS fallbacks')
            return
        }

        // Masquer les éléments avant animation
        gsap.set(".feature-card", {opacity: 0, y: 100, scale: 0.8})
        gsap.set(".language-badge", {opacity: 0, y: 50, rotation: -10})
        gsap.set(".cta-content", {opacity: 0, y: 80})

        // Animation du hero au chargement avec protection contre les conflits
        const tl = gsap.timeline({
            onComplete: () => {
                // S'assurer que les éléments sont dans leur position finale
                gsap.set(".hero-title, .hero-subtitle, .hero-button", {
                    clearProps: "transform,opacity"
                })
            }
        })

        tl.from(".hero-title", {
            duration: 1.5,
            y: 100,
            opacity: 0,
            ease: "power4.out"
        })
            .from(".hero-subtitle", {
                duration: 1.2,
                y: 50,
                opacity: 0,
                ease: "power3.out"
            }, "-=1")
            .from(".hero-button", {
                duration: 1,
                y: 30,
                opacity: 0,
                scale: 0.8,
                ease: "back.out(2)"
            }, "-=0.6")

        // Animation du header
        gsap.from(".header-logo", {
            duration: 1.5,
            x: -100,
            opacity: 0,
            ease: "power3.out",
            delay: 0.2
        })

        gsap.from(".header-nav", {
            duration: 1.5,
            x: 100,
            opacity: 0,
            ease: "power3.out",
            delay: 0.4
        })

        // Animations au scroll - Feature Cards avec effet spectaculaire
        ScrollTrigger.batch(".feature-card", {
            onEnter: (elements) => {
                gsap.fromTo(elements,
                    {
                        opacity: 0,
                        y: 100,
                        scale: 0.8,
                        rotation: 5
                    },
                    {
                        duration: 1.2,
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: "back.out(1.5)",
                        stagger: 0.3
                    }
                )
            },
            start: "top 90%"
        })

        // Animation des language badges - effet cascade
        ScrollTrigger.batch(".language-badge", {
            onEnter: (elements) => {
                gsap.fromTo(elements,
                    {
                        opacity: 0,
                        y: 50,
                        rotation: -15,
                        scale: 0.5
                    },
                    {
                        duration: 0.8,
                        opacity: 1,
                        y: 0,
                        rotation: 0,
                        scale: 1,
                        ease: "back.out(2)",
                        stagger: 0.1
                    }
                )
            },
            start: "top 90%"
        })

        // Animation CTA avec effet dramatique
        gsap.fromTo(".cta-content",
            {
                opacity: 0,
                y: 80,
                scale: 0.9
            },
            {
                duration: 1.5,
                opacity: 1,
                y: 0,
                scale: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ctaRef.current,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        )

        // Animation de flottement pour les icônes - plus prononcée
        gsap.to(".floating-icon", {
            duration: 3,
            y: -20,
            rotation: 360,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
            stagger: 0.5
        })

        // Animation pulsante pour les titres de section
        gsap.to("h2", {
            duration: 2,
            scale: 1.02,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
            stagger: 1
        })

        // Effet de particules subtil et discret
        const createFloatingElements = () => {
            for (let i = 0; i < 5; i++) {
                const element = document.createElement('div')
                const size = Math.random() * 4 + 2
                const colors = ['bg-blue-400/10', 'bg-green-400/10']
                const colorClass = colors[Math.floor(Math.random() * colors.length)]

                element.className = `fixed ${colorClass} rounded-full pointer-events-none`
                element.style.width = size + 'px'
                element.style.height = size + 'px'
                element.style.left = Math.random() * 100 + 'vw'
                element.style.top = '100vh'
                element.style.zIndex = '1'
                document.body.appendChild(element)

                gsap.to(element, {
                    duration: 20 + Math.random() * 15,
                    y: -window.innerHeight - 100,
                    x: Math.random() * 200 - 100,
                    opacity: 0,
                    ease: "power1.out",
                    delay: Math.random() * 5,
                    onComplete: () => {
                        element.remove()
                    }
                })
            }
        }

        // Créer des particules moins fréquemment
        createFloatingElements()
        setInterval(createFloatingElements, 15000)

        // Animation de parallaxe supprimée pour éviter les conflits
        // L'animation sera gérée uniquement par CSS hover et les transitions normales

        // Animation des éléments de navigation au hover
        document.querySelectorAll('.language-badge').forEach(badge => {
            badge.addEventListener('mouseenter', () => {
                gsap.to(badge, {
                    duration: 0.3,
                    scale: 1.1,
                    rotation: 5,
                    ease: "back.out(2)"
                })
            })

            badge.addEventListener('mouseleave', () => {
                gsap.to(badge, {
                    duration: 0.3,
                    scale: 1,
                    rotation: 0,
                    ease: "back.out(1)"
                })
            })
        })

        // Cleanup
        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
    }, [isLoading, isAuthenticated])

    if (!hasHydrated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (isAuthenticated) {
        return null // Redirection en cours
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header
                className="border-b border-border/40 backdrop-blur-sm bg-background/98 dark:bg-background/95 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="header-logo flex items-center gap-2">
                            <Image src="/high5-logo.png" alt="HIGH5 Logo" width={40} height={40}
                                   className="rounded-lg"/>
                            <div>
                <span
                    className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  HIGH5
                </span>
                                <p className="text-xs text-muted-foreground">
                                    Medical Platform
                                </p>
                            </div>
                        </div>
                        <div className="header-nav flex items-center gap-3">
                            <Link href="/login" passHref>
                                <Button variant="outline" size="sm"
                                        className="hidden sm:flex border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/20">
                                    <User className="mr-2 h-4 w-4"/>
                                    Connexion
                                </Button>
                            </Link>
                            <ThemeToggle/>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {/* Hero Section */}
                <section ref={heroRef} className="hero-section container mx-auto px-4 py-16 text-center">
                    <h1 className="hero-title text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 dark:from-blue-400 dark:via-green-400 dark:to-blue-200 bg-clip-text text-transparent mb-6">
                        HIGH5 Medical Platform
                    </h1>
                    <p className="hero-subtitle text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
                        Plateforme médicale innovante pour une meilleure collaboration entre patients et professionnels
                        de santé
                    </p>

                    <div className="hero-button flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link href="/login" passHref>
                            <Button size="lg"
                                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 shine-effect">
                                <User className="mr-2 h-5 w-5"/>
                                Se connecter
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section ref={featuresRef} className="bg-white/60 dark:bg-gray-800/80 py-16">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                            Une plateforme complète pour tous
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Espace Patient */}
                            <div
                                className="feature-card glow-on-hover bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 p-8 rounded-2xl border border-blue-200/50 dark:border-blue-800/70 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                <div
                                    className="floating-icon w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <User className="h-8 w-8 text-white"/>
                                </div>
                                <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4">
                                    Espace Patient
                                </h3>
                                <ul className="space-y-3 text-blue-700 dark:text-blue-300">
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Donnez votre avis sur les services médicaux
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Feedback vocal et écrit multilingue
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Rappels de rendez-vous personnalisés
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Interface intuitive et accessible
                                    </li>
                                </ul>
                            </div>

                            {/* Espace Professionnel */}
                            <div
                                className="feature-card glow-on-hover bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 p-8 rounded-2xl border border-green-200/50 dark:border-green-800/70 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                <div
                                    className="floating-icon w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                                    <Stethoscope className="h-8 w-8 text-white"/>
                                </div>
                                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
                                    Espace Professionnel
                                </h3>
                                <ul className="space-y-3 text-green-700 dark:text-green-300">
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Gestion complète des patients
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Analyse des feedbacks multilingues
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Tableaux de bord analytiques
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Prescriptions et rendez-vous
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Languages Section */}
                <section ref={languagesRef} className="py-16">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                            Support multilingue
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Communication sans barrières avec le support des langues locales du Cameroun
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {[
                                {lang: "🇫🇷 Français", desc: "Langue principale"},
                                {lang: "🇬🇧 English", desc: "International"},
                                {lang: "🇨🇲 Duala", desc: "Langue locale"},
                                {lang: "🇨🇲 Bassa", desc: "Langue locale"},
                                {lang: "🇨🇲 Ewondo", desc: "Langue locale"}
                            ].map((item, index) => (
                                <div key={index}
                                     className="language-badge glow-on-hover bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/70 rounded-lg p-4 text-center hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{item.lang}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section ref={ctaRef}
                         className="bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 py-16 overflow-hidden relative">
                    <div className="absolute inset-0 opacity-50">
                        <div
                            className="animated-bg absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-green-500"></div>
                    </div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <div className="cta-content">
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Prêt à améliorer votre expérience médicale ?
                            </h2>
                            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                                Rejoignez HIGH5 Medical pour une communication plus efficace entre patients et
                                professionnels de santé
                            </p>
                            <Link href="/login" passHref>
                                <Button size="lg"
                                        className="bg-white text-blue-600 hover:bg-gray-100 hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl">
                                    <User className="mr-2 h-5 w-5"/>
                                    Commencer maintenant
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}