"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "fr" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
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

    // Dashboard - Headers
    welcome_message: "Bonjour, Gestionnaire",
    system_overview: "Vue d'ensemble du système",
    dashboard_title: "Tableau de bord intelligent pour la gestion optimale des ressources sanguines",

    // KPIs
    total_stock: "Stock Total",
    available_stock: "Stock Disponible",
    total_units: "Unités Totales",
    available_units: "Unités Disponibles",
    pending_requests: "Demandes en Attente",
    critical_alerts: "Alertes Critiques",
    system_efficiency: "Efficacité Système",
    daily_activity: "Activité Quotidienne",
    blood_type_stock: "Stock par Groupe",
    system_alerts: "Alertes Système",

    // Metrics
    utilization: "d'utilisation",
    ready: "prêt",
    urgent: "urgent",
    expired: "expirées",
    transfusions_today: "Transfusions aujourd'hui",
    units_used: "Unités utilisées",
    expiring_soon: "Expire bientôt",
    efficiency: "Efficacité",

    // Blood Types
    "O+": "O+",
    "O-": "O-",
    "A+": "A+",
    "A-": "A-",
    "B+": "B+",
    "B-": "B-",
    "AB+": "AB+",
    "AB-": "AB-",
    blood_type: "Groupe Sanguin",

    // Status
    critical: "Critique",
    warning: "Attention",
    good: "Bon",
    low: "Faible",

    // Actions
    view: "Voir",
    view_all: "Voir tout",
    edit: "Modifier",
    delete: "Supprimer",
    add: "Ajouter",
    save: "Enregistrer",
    cancel: "Annuler",
    refresh: "Actualiser",
    export_report: "Exporter Rapport",
    acknowledge_all: "Tout marquer",
    retry: "Réessayer",

    // States
    loading: "Chargement...",
    processing: "Traitement...",
    exporting: "Export...",
    error: "Erreur",

    // Messages
    data_refreshed_successfully: "Données actualisées avec succès",
    refresh_error: "Erreur lors de l'actualisation",
    system_error: "Erreur Système",
    data_loading_error: "Erreur lors du chargement des données",
    loading_system_data: "Récupération des données du système",
    no_alerts: "Aucune alerte",
    all_systems_normal: "Tous les systèmes fonctionnent normalement",
    last_updated: "Dernière mise à jour",
    and_more: "et {{count}} de plus",

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

    // Inventory
    blood_inventory_overview: "Aperçu Inventaire Sanguin",
    current_stock_levels: "Niveaux de stock actuels",
    ai_forecasting: "Prévisions IA",
    predicted_demand: "Demande prédite",

    // UI Elements
    navigation: "Navigation",
    sidebar: "Menu latéral",
    main_navigation: "Navigation principale",
    blood_bank_system: "Système de Banque de Sang",
    blood_manager: "Gestionnaire Sang",
    administrator: "Administrateur",
    online: "En ligne",
    open_menu: "Ouvrir le menu",
    close_menu: "Fermer le menu",
    expand_sidebar: "Étendre la barre latérale",
    collapse_sidebar: "Réduire la barre latérale",
    light_mode: "Mode Clair",
    dark_mode: "Mode Sombre",
    light: "Clair",
    dark: "Sombre",


    // Sites Management
sites_management: "Gestion des Sites",
network_partners: "Réseau des hôpitaux, cliniques et centres de collecte partenaires",
offline_mode: "Mode hors ligne",
new_site: "Nouveau Site",
export: "Exporter",
create_new_site: "Créer un Nouveau Site",
add_new_partner_site: "Ajouter un nouveau site au réseau de partenaires",
site_id: "ID du Site",
site_name: "Nom du Site",
city: "Ville",
region: "Région",
address: "Adresse",
phone: "Téléphone",
email: "Email",
manager: "Responsable",
capacity: "Capacité",
site_type: "Type de Site",
site_status: "Statut",
has_blood_bank: "Dispose d'une banque de sang",
hospital: "Hôpital",
clinic: "Clinique",
collection_center: "Centre de Collecte",
active: "Actif",
maintenance: "Maintenance",
inactive: "Inactif",
departments: "Départements",
select_region: "Sélectionner une région",
select_departments: "Sélectionner les départements",
total_sites: "Total Sites",
active_sites: "Sites Actifs",
with_blood_bank: "Avec Banque de Sang",
in_maintenance: "En Maintenance",
partner_network: "Réseau des Sites Partenaires",
site_details: "Détails du Site",
complete_site_info: "Informations complètes du site",
contact_info: "Informations de Contact",
services: "Services",
available: "Disponible",
not_available: "Non disponible",
current_occupation: "Occupation Actuelle",
total_requests: "Total des Demandes",
edit_site: "Modifier le Site",
update_site_info: "Mettre à jour les informations du site",
confirm_deletion: "Confirmer la Suppression",
delete_site_confirm: "Êtes-vous sûr de vouloir supprimer le site",
action_irreversible: "Cette action est irréversible",
last_request: "Dernière demande",
occupied: "occupé",
patients: "patients",
requests: "demandes",
not_specified: "Non renseigné",
not_provided: "Non renseignée",
connection_lost: "Connexion perdue. Mode hors ligne activé.",
connection_restored: "Connexion API rétablie!",
using_offline_data: "Utilisation des données hors ligne",
offline_changes_not_saved: "Mode hors ligne - Changements non sauvegardés",
attempting_reconnection: "Tentative de reconnexion...",
site_created_success: "Site créé avec succès!",
site_updated_success: "Site mis à jour avec succès!",
site_deleted_success: "Site supprimé avec succès!",
creation_error: "Erreur lors de la création",
update_error: "Erreur lors de la mise à jour",
deletion_error: "Erreur lors de la suppression",
fill_required_fields: "Veuillez remplir tous les champs obligatoires",
loading_sites: "Chargement des sites...",
no_sites_found: "Aucun site trouvé",
modify_search_criteria: "Essayez de modifier vos critères de recherche",
create_first_site: "Commencez par créer votre premier site",
sites_found: "site(s) trouvé(s)",
showing: "Affichage de",
to: "à",
on: "sur",
sites: "sites",
previous: "Précédent",
next: "Suivant",
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

    // Dashboard - Headers
    welcome_message: "Hello, Manager",
    system_overview: "System Overview",
    dashboard_title: "Intelligent dashboard for optimal blood resource management",

    // KPIs
    total_stock: "Total Stock",
    available_stock: "Available Stock",
    total_units: "Total Units",
    available_units: "Available Units",
    pending_requests: "Pending Requests",
    critical_alerts: "Critical Alerts",
    system_efficiency: "System Efficiency",
    daily_activity: "Daily Activity",
    blood_type_stock: "Stock by Type",
    system_alerts: "System Alerts",

    // Metrics
    utilization: "utilization",
    ready: "ready",
    urgent: "urgent",
    expired: "expired",
    transfusions_today: "Transfusions today",
    units_used: "Units used",
    expiring_soon: "Expiring soon",
    efficiency: "Efficiency",

    // Blood Types
    "O+": "O+",
    "O-": "O-",
    "A+": "A+",
    "A-": "A-",
    "B+": "B+",
    "B-": "B-",
    "AB+": "AB+",
    "AB-": "AB-",
    blood_type: "Blood Type",

    // Status
    critical: "Critical",
    warning: "Warning",
    good: "Good",
    low: "Low",

    // Actions
    view: "View",
    view_all: "View All",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    refresh: "Refresh",
    export_report: "Export Report",
    acknowledge_all: "Acknowledge All",
    retry: "Retry",

    // States
    loading: "Loading...",
    processing: "Processing...",
    exporting: "Exporting...",
    error: "Error",

    // Messages
    data_refreshed_successfully: "Data refreshed successfully",
    refresh_error: "Error while refreshing",
    system_error: "System Error",
    data_loading_error: "Error loading data",
    loading_system_data: "Loading system data",
    no_alerts: "No alerts",
    all_systems_normal: "All systems operating normally",
    last_updated: "Last updated",
    and_more: "and {{count}} more",

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

    // Inventory
    blood_inventory_overview: "Blood Inventory Overview",
    current_stock_levels: "Current stock levels",
    ai_forecasting: "AI Forecasting",
    predicted_demand: "Predicted demand",

    // UI Elements
    navigation: "Navigation",
    sidebar: "Sidebar",
    main_navigation: "Main navigation",
    blood_bank_system: "Blood Bank System",
    blood_manager: "Blood Manager",
    administrator: "Administrator",
    online: "Online",
    open_menu: "Open menu",
    close_menu: "Close menu",
    expand_sidebar: "Expand sidebar",
    collapse_sidebar: "Collapse sidebar",
    light_mode: "Light Mode",
    dark_mode: "Dark Mode",
    light: "Light",
    dark: "Dark",

    sites_management: "Sites Management",
network_partners: "Network of partner hospitals, clinics and collection centers",
offline_mode: "Offline mode",
new_site: "New Site",
export: "Export",
create_new_site: "Create New Site",
add_new_partner_site: "Add a new site to the partner network",
site_id: "Site ID",
site_name: "Site Name",
city: "City",
region: "Region",
address: "Address",
phone: "Phone",
email: "Email",
manager: "Manager",
capacity: "Capacity",
site_type: "Site Type",
site_status: "Site Status",
has_blood_bank: "Has blood bank",
hospital: "Hospital",
clinic: "Clinic",
collection_center: "Collection Center",
active: "Active",
maintenance: "Maintenance",
inactive: "Inactive",
departments: "Departments",
select_region: "Select a region",
select_departments: "Select departments",
total_sites: "Total Sites",
active_sites: "Active Sites",
with_blood_bank: "With Blood Bank",
in_maintenance: "In Maintenance",
partner_network: "Partner Network Sites",
site_details: "Site Details",
complete_site_info: "Complete site information",
contact_info: "Contact Information",
services: "Services",
available: "Available",
not_available: "Not available",
current_occupation: "Current Occupation",
total_requests: "Total Requests",
edit_site: "Edit Site",
update_site_info: "Update site information",
confirm_deletion: "Confirm Deletion",
delete_site_confirm: "Are you sure you want to delete the site",
action_irreversible: "This action is irreversible",
last_request: "Last request",
occupied: "occupied",
patients: "patients",
requests: "requests",
not_specified: "Not specified",
not_provided: "Not provided",
connection_lost: "Connection lost. Offline mode activated.",
connection_restored: "API connection restored!",
using_offline_data: "Using offline data",
offline_changes_not_saved: "Offline mode - Changes not saved",
attempting_reconnection: "Attempting to reconnect...",
site_created_success: "Site created successfully!",
site_updated_success: "Site updated successfully!",
site_deleted_success: "Site deleted successfully!",
creation_error: "Creation error",
update_error: "Update error",
deletion_error: "Deletion error",
fill_required_fields: "Please fill in all required fields",
loading_sites: "Loading sites...",
no_sites_found: "No sites found",
modify_search_criteria: "Try modifying your search criteria",
create_first_site: "Start by creating your first site",
sites_found: "site(s) found",
showing: "Showing",
to: "to",
on: "of",
sites: "sites",
previous: "Previous",
next: "Next",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr")

  const t = (key: string, params?: Record<string, any>): string => {
    let translation = translations[language][key as keyof (typeof translations)[typeof language]] || key

    // Support pour les paramètres avec {{variable}}
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]))
      })
    }

    return translation
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