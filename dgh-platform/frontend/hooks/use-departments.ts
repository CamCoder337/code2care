// C:/Users/User/IdeaProjects/HIGH5_Code2care/dgh-platform/frontend/hooks/use-departments.ts

import {useEffect, useState} from "react";
import {useToast} from "@/hooks/use-toast";
import {apiService, Department} from "@/lib/api-service";

interface UseDepartmentsReturn {
    departments: Department[];
    isLoading: boolean;
    error: string | null;
}

// The key is this line: `export function ...`
// This makes it a NAMED export.
export function useDepartments(): UseDepartmentsReturn {
    const {toast} = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDepartments() {
            try {
                const data = await apiService.getDepartments();
                setDepartments(data);
            } catch (err) {
                const errorMessage = "Impossible de charger la liste des départements.";
                console.error("Failed to fetch departments:", err);
                setError(errorMessage);
                toast({
                    title: "Erreur de chargement",
                    description: errorMessage,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchDepartments();
    }, [toast]);

    return {departments, isLoading, error};
}