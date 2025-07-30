// Fichier : lib/api-service.ts

// --- Configuration ---
const API_BASE_URL = "https://high5-gateway.onrender.com/api/v1";

// --- Interfaces (Types de données) ---
// Décrit la structure d'un département reçu de l'API
export interface Department {
    id: string;
    name: string;
}

// Décrit la structure des données à envoyer pour un feedback
export interface FeedbackPayload {
    departmentId: string;
    rating: number;
    comment: string; // Le commentaire final, déjà traduit en anglais
}

// --- Fonctions du Service ---

/**
 * Récupère la liste de tous les départements.
 * @returns Une promesse qui résout avec un tableau de départements.
 * @throws Une erreur si la requête échoue.
 */
async function getDepartments(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments/`);
    if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Soumet un nouveau feedback.
 * @param payload Les données du feedback à envoyer.
 * @returns Une promesse qui résout avec la réponse de l'API (souvent un message de succès).
 * @throws Une erreur si la requête échoue.
 */
async function submitFeedback(payload: FeedbackPayload): Promise<any> {
    // Note : L'URL exacte peut varier selon votre API, par ex. /feedback
    const response = await fetch(`${API_BASE_URL}/feedbacks/`, { // Adaptez l'URL si besoin
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        // Tente de lire le message d'erreur du corps de la réponse
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Failed to submit feedback: ${errorData.message || response.statusText}`);
    }
    return response.json();
}


// --- Export ---
// On exporte un objet contenant toutes nos fonctions pour un import facile
export const apiService = {
    getDepartments,
    submitFeedback,
};