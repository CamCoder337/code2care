"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "fr" | "duala" | "bassa" | "ewondo"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Navigation & General
    "app.title": "MedAdmin - Professional Dashboard",
    "app.subtitle": "Medical administration system for healthcare professionals",
    "nav.home": "Home",
    "nav.feedback": "Feedback",
    "nav.reminders": "Reminders",
    "nav.dashboard": "Dashboard",
    "common.back": "Back",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading...",
    "common.success": "Success",
    "common.error": "Error",
    "welcome.subtitle": "Professional medical platform for patients and healthcare providers",
    "welcome.patient_login": "Patient Access",
    "welcome.patient_description": "Access your medical information, give feedback, and manage appointments",
    "welcome.professional_login": "Healthcare Professional",
    "welcome.professional_description": "Manage patients, appointments, prescriptions, and view analytics",
    "welcome.continue_as_patient": "Continue as Patient",
    "welcome.continue_as_professional": "Continue as Professional",
    "patient.welcome": "Welcome to your Health Portal",
    "patient.subtitle": "Manage your healthcare experience with ease",
    "patient.login.subtitle": "Access your personal health portal",
    "patient.login.button": "Sign In as Patient",
    "common.welcome": "Welcome",
    "common.logout": "Sign Out",

    // Home Page
    "home.patient_feedback": "Patient Feedback",
    "home.patient_feedback_desc": "Review and manage patient feedback in multiple languages",
    "home.give_feedback": "Review Feedback",
    "home.reminders": "Appointment Reminders",
    "home.reminders_desc": "Manage automated patient reminders and notifications",
    "home.my_reminders": "Manage Reminders",
    "home.dashboard": "Analytics Dashboard",
    "home.dashboard_desc": "View comprehensive analytics and performance metrics",
    "home.view_dashboard": "View Analytics",
    "home.supported_languages": "Supported in: French, English, Duala, Bassa, Ewondo",

    // Admin specific
    "admin.patients": "Patient Management",
    "admin.appointments": "Appointments",
    "admin.prescriptions": "Prescriptions",
    "admin.analytics": "Analytics",

    // Languages
    "lang.french": "French",
    "lang.english": "English",
    "lang.duala": "Duala",
    "lang.bassa": "Bassa",
    "lang.ewondo": "Ewondo",

    // Feedback System
    "feedback.title": "Share Your Medical Experience",
    "feedback.subtitle": "Your feedback helps us improve our healthcare services",
    "feedback.department": "Select Department",
    "feedback.department_select": "Choose the department you want to provide feedback about",
    "feedback.department_placeholder": "Select a department...",
    "feedback.general_rating": "Overall Experience Rating",
    "feedback.rate_experience": "How would you rate your overall experience?",
    "feedback.written_feedback": "Written Feedback",
    "feedback.voice_feedback": "Voice Feedback",
    "feedback.describe_experience": "Please describe your experience in detail",
    "feedback.record_message": "Record your message by speaking into your microphone",
    "feedback.placeholder": "Share your thoughts, suggestions, or concerns...",
    "feedback.sending": "Sending feedback...",
    "feedback.send_feedback": "Send Feedback",
    "feedback.stars": "stars",
    "feedback.star": "star",
  },
  fr: {
    // Navigation & General
    "app.title": "MedAdmin - Tableau de Bord Professionnel",
    "app.subtitle": "Système d'administration médicale pour professionnels de santé",
    "nav.home": "Accueil",
    "nav.feedback": "Feedback",
    "nav.reminders": "Rappels",
    "nav.dashboard": "Tableau de bord",
    "common.back": "Retour",
    "common.submit": "Envoyer",
    "common.cancel": "Annuler",
    "common.save": "Sauvegarder",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.loading": "Chargement...",
    "common.success": "Succès",
    "common.error": "Erreur",
    "welcome.subtitle": "Plateforme médicale professionnelle pour patients et professionnels de santé",
    "welcome.patient_login": "Accès Patient",
    "welcome.patient_description": "Accédez à vos informations médicales, donnez votre avis et gérez vos rendez-vous",
    "welcome.professional_login": "Professionnel de Santé",
    "welcome.professional_description": "Gérez les patients, rendez-vous, prescriptions et consultez les analyses",
    "welcome.continue_as_patient": "Continuer en tant que Patient",
    "welcome.continue_as_professional": "Continuer en tant que Professionnel",
    "patient.welcome": "Bienvenue sur votre Portail Santé",
    "patient.subtitle": "Gérez votre expérience de soins en toute simplicité",
    "patient.login.subtitle": "Accédez à votre portail santé personnel",
    "patient.login.button": "Se connecter en tant que Patient",
    "common.welcome": "Bienvenue",
    "common.logout": "Se déconnecter",

    // Home Page
    "home.patient_feedback": "Feedback Patients",
    "home.patient_feedback_desc": "Examiner et gérer les retours patients en plusieurs langues",
    "home.give_feedback": "Examiner Feedback",
    "home.reminders": "Rappels de Rendez-vous",
    "home.reminders_desc": "Gérer les rappels automatiques et notifications patients",
    "home.my_reminders": "Gérer Rappels",
    "home.dashboard": "Tableau de Bord Analytique",
    "home.dashboard_desc": "Voir les analyses complètes et métriques de performance",
    "home.view_dashboard": "Voir Analyses",
    "home.supported_languages": "Supporté en: Français, Anglais, Duala, Bassa, Ewondo",

    // Admin specific
    "admin.patients": "Gestion des Patients",
    "admin.appointments": "Rendez-vous",
    "admin.prescriptions": "Prescriptions",
    "admin.analytics": "Analyses",

    // Languages
    "lang.french": "Français",
    "lang.english": "Anglais",
    "lang.duala": "Duala",
    "lang.bassa": "Bassa",
    "lang.ewondo": "Ewondo",

    // Feedback System
    "feedback.title": "Partagez votre Expérience Médicale",
    "feedback.subtitle": "Vos commentaires nous aident à améliorer nos services de santé",
    "feedback.department": "Sélectionner le Département",
    "feedback.department_select": "Choisissez le département sur lequel vous souhaitez donner votre avis",
    "feedback.department_placeholder": "Sélectionnez un département...",
    "feedback.general_rating": "Évaluation de l'Expérience Globale",
    "feedback.rate_experience": "Comment évalueriez-vous votre expérience globale ?",
    "feedback.written_feedback": "Commentaire Écrit",
    "feedback.voice_feedback": "Commentaire Vocal",
    "feedback.describe_experience": "Veuillez décrire votre expérience en détail",
    "feedback.record_message": "Enregistrez votre message en parlant dans votre microphone",
    "feedback.placeholder": "Partagez vos pensées, suggestions ou préoccupations...",
    "feedback.sending": "Envoi du commentaire...",
    "feedback.send_feedback": "Envoyer le Commentaire",
    "feedback.stars": "étoiles",
    "feedback.star": "étoile",
  },
  duala: {
    // Basic translations for Duala (simplified for demo)
    "app.title": "MedAdmin - Tableau na ba Dokta",
    "app.subtitle": "Système na ba dokta na ba malades",
    "nav.home": "Ndabo",
    "nav.feedback": "Feedback",
    "nav.reminders": "Ba Reminder",
    "nav.dashboard": "Dashboard",
    "common.back": "Buyela",
    "common.submit": "Tinda",
    "common.cancel": "Kangela",
    "home.give_feedback": "Bona Feedback",
    "home.my_reminders": "Ba Reminder bam",
    "home.view_dashboard": "Bona Dashboard",
    "lang.french": "Français",
    "lang.english": "English",
    "lang.duala": "Duala",
    "lang.bassa": "Bassa",
    "lang.ewondo": "Ewondo",
  },
  bassa: {
    // Basic translations for Bassa (simplified for demo)
    "app.title": "MedAdmin - Tableau Bi Dokta",
    "app.subtitle": "Système bi ba dokta bi ba malades",
    "nav.home": "Ndap",
    "nav.feedback": "Feedback",
    "nav.reminders": "Bi Reminder",
    "nav.dashboard": "Dashboard",
    "common.back": "Kɛlɛ",
    "common.submit": "Tɔm",
    "common.cancel": "Yɛmɛ",
    "home.give_feedback": "Yɛn Feedback",
    "home.my_reminders": "Bi Reminder biam",
    "home.view_dashboard": "Yɛn Dashboard",
    "lang.french": "Français",
    "lang.english": "English",
    "lang.duala": "Duala",
    "lang.bassa": "Bassa",
    "lang.ewondo": "Ewondo",
  },
  ewondo: {
    // Basic translations for Ewondo (simplified for demo)
    "app.title": "MedAdmin - Tableau Be Dokta",
    "app.subtitle": "Système be ba dokta be ba belua",
    "nav.home": "Eka",
    "nav.feedback": "Feedback",
    "nav.reminders": "Be Reminder",
    "nav.dashboard": "Dashboard",
    "common.back": "Boa",
    "common.submit": "Tɔɔ",
    "common.cancel": "Bɔlɔ",
    "home.give_feedback": "Yɛ Feedback",
    "home.my_reminders": "Be Reminder biam",
    "home.view_dashboard": "Yɛ Dashboard",
    "lang.french": "Français",
    "lang.english": "English",
    "lang.duala": "Duala",
    "lang.bassa": "Bassa",
    "lang.ewondo": "Ewondo",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferred-language") as Language
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("preferred-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
