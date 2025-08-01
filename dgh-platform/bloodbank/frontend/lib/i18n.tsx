"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "fr" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  fr: {
    // Navigation
    dashboard: "Tableau de Bord",
    blood_inventory: "Inventaire Sang",
    donors: "Donneurs",
    patients: "Patients",
    blood_requests: "Demandes",
    sites: "Sites",
    forecasting: "Prévisions IA",
    reports: "Rapports",
    settings: "Paramètres",
    data_import: "Import Données",
    logout: "Déconnexion",

    // Dashboard
    welcome_message: "Bonjour, Gestionnaire",
    today_overview: "Tableau de bord intelligent pour la gestion optimale des ressources sanguines",
    total_units: "Total Unités",
    available_units: "Unités Disponibles",
    pending_requests: "Demandes en Attente",
    critical_alerts: "Alertes Critiques",
    blood_inventory_overview: "Aperçu Inventaire Sanguin",
    current_stock_levels: "Niveaux de stock actuels",
    ai_forecasting: "Prévisions IA",
    predicted_demand: "Demande prédite",

    // Blood Types
    "O+": "O+",
    "O-": "O-",
    "A+": "A+",
    "A-": "A-",
    "B+": "B+",
    "B-": "B-",
    "AB+": "AB+",
    "AB-": "AB-",

    // Status
    critical: "Critique",
    warning: "Attention",
    good: "Bon",
    blood_type: "Groupe Sanguin",

    // Actions
    view: "Voir",
    edit: "Modifier",
    delete: "Supprimer",
    add: "Ajouter",
    save: "Enregistrer",
    cancel: "Annuler",
    refresh: "Actualiser",
    loading: "Chargement...",
    error: "Erreur",

    // Common
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    address: "Adresse",
    date: "Date",
    status: "Statut",
    actions: "Actions",
    search: "Rechercher",
    filter: "Filtrer",
    export: "Exporter",

    // Language
    language: "Langue",
    french: "Français",
    english: "English",
    cameroon: "Cameroun",
  },
  en: {
    // Navigation
    dashboard: "Dashboard",
    blood_inventory: "Blood Inventory",
    donors: "Donors",
    patients: "Patients",
    blood_requests: "Blood Requests",
    sites: "Sites",
    forecasting: "AI Forecasting",
    reports: "Reports",
    settings: "Settings",
    data_import: "Data Import",
    logout: "Logout",

    // Dashboard
    welcome_message: "Hello, Manager",
    today_overview: "Intelligent dashboard for optimal blood resource management",
    total_units: "Total Units",
    available_units: "Available Units",
    pending_requests: "Pending Requests",
    critical_alerts: "Critical Alerts",
    blood_inventory_overview: "Blood Inventory Overview",
    current_stock_levels: "Current stock levels",
    ai_forecasting: "AI Forecasting",
    predicted_demand: "Predicted demand",

    // Blood Types
    "O+": "O+",
    "O-": "O-",
    "A+": "A+",
    "A-": "A-",
    "B+": "B+",
    "B-": "B-",
    "AB+": "AB+",
    "AB-": "AB-",

    // Status
    critical: "Critical",
    warning: "Warning",
    good: "Good",
    blood_type: "Blood Type",

    // Actions
    view: "View",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    refresh: "Refresh",
    loading: "Loading...",
    error: "Error",

    // Common
    name: "Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    date: "Date",
    status: "Status",
    actions: "Actions",
    search: "Search",
    filter: "Filter",
    export: "Export",

    // Language
    language: "Language",
    french: "Français",
    english: "English",
    cameroon: "Cameroon",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr")

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
