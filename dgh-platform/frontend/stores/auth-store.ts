'use client';

import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import { API_BASE_URL } from '@/lib/config';

// Types unifiés
export type UserRole = 'patient' | 'professional'

export interface BaseUser {
    id: string
    first_name: string
    last_name: string
    username: string
    email?: string
    role: UserRole
}

export interface PatientUser extends BaseUser {
    role: 'patient'
    patient_id: string
}

export interface ProfessionalUser extends BaseUser {
    role: 'professional'
    professional_id: string
    specialization: string
    department_id: string
    date_of_birth: string
    gender: string
    phone: string
}

export type User = PatientUser | ProfessionalUser

export interface LoginRequest {
    username: string
    password: string
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;
    hasHydrated: boolean;
}

interface AuthActions {
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<void>;
    clearError: () => void;
    hasRole: (requiredRole: UserRole) => boolean;
    redirectToRoleDashboard: () => void;
}

type AuthStore = AuthState & AuthActions;

// Helper function pour les cookies CSRF
function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null

    let cookieValue = null
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";")
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    return cookieValue
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // State
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
            hasHydrated: false,

            // Actions
            login: async (credentials: LoginRequest) => {
                set({isLoading: true, error: null});

                try {
                    const csrftoken = getCookie("csrftoken")
                    const headers: HeadersInit = {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    }

                    if (csrftoken) {
                        headers["X-CSRFToken"] = csrftoken
                    }

                    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(credentials),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        if (response.status === 401) {
                            throw new Error("Nom d'utilisateur ou mot de passe incorrect.");
                        }
                        throw new Error(errorData.detail || `Erreur: ${response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('Login response:', data);

                    let userData: User;

                    // Détection automatique du rôle basée sur la structure de réponse
                    if (data.profile && data.profile.professional_id) {
                        // C'est un professionnel
                        userData = {
                            id: data.user.id || data.profile.professional_id,
                            professional_id: data.profile.professional_id,
                            first_name: data.profile.first_name,
                            last_name: data.profile.last_name,
                            username: data.user.username,
                            email: data.user.username,
                            phone: data.user.phone_number,
                            specialization: data.profile.specialization,
                            department_id: data.profile.department_id,
                            date_of_birth: data.profile.date_of_birth,
                            gender: data.profile.gender,
                            role: 'professional'
                        }
                    } else {
                        // C'est un patient
                        userData = {
                            id: data.user.id,
                            patient_id: data.user.id,
                            first_name: data.user.first_name,
                            last_name: data.user.last_name,
                            username: data.user.username,
                            email: data.user.email,
                            role: 'patient'
                        }
                    }

                    const accessToken = data.tokens?.access || data.access
                    const refreshToken = data.tokens?.refresh || data.refresh

                    console.log('🔍 Auth Store Debug:');
                    console.log('📄 Full login response:', data);
                    console.log('🔑 Extracted accessToken:', accessToken);
                    console.log('🔄 Extracted refreshToken:', refreshToken);

                    set({
                        user: userData,
                        accessToken,
                        refreshToken,
                        isLoading: false,
                        error: null,
                    });

                    console.log('✅ User set in store:', userData);
                    console.log('🔑 AccessToken in store after set:', get().accessToken);
                } catch (error) {
                    console.error('Login error:', error);
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Erreur de connexion',
                    });
                    throw error;
                }
            },

            logout: () => {
                const {refreshToken} = get();

                // Call logout endpoint to blacklist token
                if (refreshToken) {
                    console.log('Sending logout request with refresh token:', refreshToken);
                    fetch(`${API_BASE_URL}/auth/logout/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({refresh: refreshToken}),
                    })
                        .then(response => {
                            console.log('Logout response status:', response.status);
                            if (!response.ok) {
                                return response.json().then(data => {
                                    console.error('Logout error response:', data);
                                });
                            }
                            console.log('Logout successful');
                        })
                        .catch(error => {
                            console.error('Logout API error:', error);
                        });
                }

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    error: null,
                });

                // Redirection vers la page d'accueil
                if (typeof window !== 'undefined') {
                    window.location.href = '/';
                }
            },

            refreshAccessToken: async () => {
                const {refreshToken} = get();

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({refresh: refreshToken}),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to refresh token');
                    }

                    const data = await response.json();
                    set({accessToken: data.access});
                } catch (error) {
                    // If refresh fails, logout user
                    get().logout();
                    throw error;
                }
            },

            clearError: () => set({error: null}),

            hasRole: (requiredRole: UserRole): boolean => {
                const {user} = get();
                return user?.role === requiredRole;
            },

            redirectToRoleDashboard: () => {
                const {user} = get();
                if (!user || typeof window === 'undefined') return;

                // Petit délai pour éviter les conflits d'état
                setTimeout(() => {
                    if (user.role === 'patient') {
                        window.location.href = '/patient/home';
                    } else if (user.role === 'professional') {
                        window.location.href = '/professional/dashboard';
                    }
                }, 100);
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
            onRehydrateStorage: () => (state) => {
                console.log('🔄 Auth Store - Rehydrating from localStorage');
                console.log('💾 Rehydrated state:', state);
                
                if (state) {
                    console.log('🔑 Rehydrated accessToken:', state.accessToken);
                    console.log('👤 Rehydrated user:', state.user);
                    state.hasHydrated = true;
                }
            },
        }
    )
);