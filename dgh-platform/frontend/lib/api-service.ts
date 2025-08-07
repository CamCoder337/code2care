// Fichier : lib/api-service.ts

const API_BASE_URL = "https://high5-gateway.onrender.com/api/v1";

export interface Department {
    id: string;
    name: string;
}

export interface FeedbackPayload {
    department_id: string;
    rating: number;
    description: string;
    language: 'fr' | 'en';
    input_type: 'text' | 'voice';
    patient_id: string;
}

async function getDepartments(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments/`);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch departments: ${response.status} - ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch departments: ${response.statusText || 'Unknown error'}. Server response: ${errorText.substring(0, 200)}...`);
    }
    const data = await response.json();

    if (!Array.isArray(data)) {
        console.error("API did not return an array for departments:", data);
        throw new Error("API response for departments was not an array.");
    }

    const seen = new Set<string>();
    const validDepartments: Department[] = [];

    data.forEach((item: any) => {
        // --- CRITICAL CORRECTION HERE ---
        // Access 'department_id' directly from the item, as per your DB example
        const id = item.department_id;
        const name = item.name;

        // Keep checks for string type, non-empty, and uniqueness
        if (typeof id === 'string' && id.length > 0 && typeof name === 'string' && name.length > 0 && !seen.has(id)) {
            validDepartments.push({id, name});
            seen.add(id);
        } else {
            // This detailed log will still help you if other issues arise
            console.warn(`Skipping department due to invalid data or duplicate ID:`, {
                item,
                isStringId: typeof id === 'string',
                idLength: id?.length,
                isStringName: typeof name === 'string',
                nameLength: name?.length,
                isDuplicate: seen.has(id),
                resolvedId: id,
                resolvedName: name
            });
        }
    });

    return validDepartments;
}

async function submitFeedback(payload: FeedbackPayload, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/feedbacks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = `Request failed with status: ${response.statusText} (${response.status})`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

export const apiService = {
    getDepartments,
    submitFeedback,
};