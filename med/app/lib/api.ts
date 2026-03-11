/**
 * API service – centralizes all calls to the Django backend.
 */
import { CHEF_SERVICE_INFO } from "./constants";

export { CHEF_SERVICE_INFO };

const API_BASE = "http://127.0.0.1:8000/api";

// ── Helpers ───────────────────────────────────────────────────────────────

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
}

function setTokens(access: string, refresh: string) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
}

async function authHeaders(): Promise<Record<string, string>> {
    const token = getToken();
    if (!token) return { "Content-Type": "application/json" };
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) },
    });

    if (res.status === 401) {
        // Try refreshing token
        const refreshed = await tryRefresh();
        if (refreshed) {
            const newHeaders = await authHeaders();
            const retryRes = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers: { ...newHeaders, ...(options.headers || {}) },
            });
            return retryRes;
        }
        clearTokens();
        window.location.href = "/";
        throw new Error("Session expirée");
    }

    return res;
}

async function tryRefresh(): Promise<boolean> {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return false;
    try {
        const res = await fetch(`${API_BASE}/auth/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem("access_token", data.access);
        return true;
    } catch {
        return false;
    }
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: "chef_service" | "medecin" | "secretaire";
    role_display: string;
    force_password_change?: boolean;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: UserProfile;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Identifiants invalides");
    }

    const data: LoginResponse = await res.json();
    setTokens(data.access, data.refresh);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
}

export function logout() {
    clearTokens();
    window.location.href = "/";
}

export function getCurrentUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export async function fetchMe(): Promise<UserProfile> {
    const res = await apiFetch("/auth/me/");
    if (!res.ok) throw new Error("Non authentifié");
    return res.json();
}

export async function changePassword(newPassword: string, confirmPassword: string): Promise<{ detail: string }> {
    const res = await apiFetch("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({
            new_password: newPassword,
            confirm_password: confirmPassword
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.non_field_errors || "Erreur de changement de mot de passe");
    }
    return res.json();
}

// ── Users (chef de service) ───────────────────────────────────────────────

export async function fetchUsers(): Promise<UserProfile[]> {
    const res = await apiFetch("/auth/users/");
    if (!res.ok) throw new Error("Erreur chargement utilisateurs");
    return res.json();
}

export async function createUser(data: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}): Promise<UserProfile> {
    const res = await apiFetch("/auth/users/", {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const messages = Object.entries(err)
            .map(([key, val]) => {
                const valueStr = Array.isArray(val) ? val.join(", ") : val;
                return key === "detail" || key === "non_field_errors" ? `${valueStr}` : `${key}: ${valueStr}`;
            })
            .join("\n");
        throw new Error(messages || "Erreur création utilisateur");
    }
    return res.json();
}

export async function deleteUser(id: number): Promise<void> {
    const res = await apiFetch(`/auth/users/${id}/`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur suppression utilisateur");
}

// ── Registration & Approval ──────────────────────────────────────────────

export async function register(data: {
    username: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}): Promise<{ detail: string }> {
    const res = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Just extract the error values to provide cleaner UX 
        const messages = Object.entries(err)
            .map(([key, val]) => {
                const valueStr = Array.isArray(val) ? val.join(", ") : val;
                return key === "detail" || key === "non_field_errors" ? `${valueStr}` : `${key}: ${valueStr}`;
            })
            .join("\n");
        throw new Error(messages || "Erreur lors de l'inscription");
    }
    return res.json();
}

export async function fetchPendingUsers(): Promise<UserProfile[]> {
    const res = await apiFetch("/auth/pending-users/");
    if (!res.ok) throw new Error("Erreur chargement demandes");
    return res.json();
}

export async function approveUser(id: number): Promise<{ detail: string }> {
    const res = await apiFetch(`/auth/users/${id}/approve/`, { method: "POST" });
    if (!res.ok) throw new Error("Erreur approbation utilisateur");
    return res.json();
}

export async function rejectUser(id: number): Promise<{ detail: string }> {
    const res = await apiFetch(`/auth/users/${id}/reject/`, { method: "POST" });
    if (!res.ok) throw new Error("Erreur rejet utilisateur");
    return res.json();
}

// ── Patients ──────────────────────────────────────────────────────────────

export interface PatientAPI {
    id: number;
    numero_dossier: string;
    nom: string;
    prenom: string;
    date_naissance: string;
    lieu_naissance: string;
    genre: string;
    situation: string;
    telephone: string;
    profession: string;
    type_consultation: string | null;
    itt_jours: number;
    auteur_agression: string;
    autorite_requerante: string;
    unite: string;
    sous_unite: string;
    medecin_traitant: number | null;
    medecin_traitant_detail: UserProfile | null;
    rapport_medical: string;
    status: string;
    created_by: number | null;
    created_by_detail: UserProfile | null;
    created_at: string;
    updated_at: string;
    age: number;
}

export async function fetchPatients(params?: {
    date?: string;
    type?: string;
    unite?: string;
    search?: string;
}): Promise<PatientAPI[]> {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.type) query.set("type", params.type);
    if (params?.unite) query.set("unite", params.unite);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    const res = await apiFetch(`/patients/${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error("Erreur chargement patients");
    return res.json();
}

export async function createPatient(data: {
    numero_dossier: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    lieu_naissance?: string;
    genre: string;
    situation?: string;
    telephone?: string;
    profession?: string;
    type_consultation?: string;
    itt_jours?: number;
    auteur_agression?: string;
    autorite_requerante?: string;
}): Promise<PatientAPI> {
    const res = await apiFetch("/patients/", {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const messages = Object.entries(err)
            .map(([key, val]) => {
                const valueStr = Array.isArray(val) ? val.join(", ") : val;
                return key === "detail" || key === "non_field_errors" ? `${valueStr}` : `${key}: ${valueStr}`;
            })
            .join("\n");
        throw new Error(messages || "Erreur création patient");
    }
    return res.json();
}

export async function updatePatient(
    id: number,
    data: Partial<PatientAPI>
): Promise<PatientAPI> {
    const res = await apiFetch(`/patients/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const messages = Object.entries(err)
            .map(([key, val]) => {
                const valueStr = Array.isArray(val) ? val.join(", ") : val;
                return key === "detail" || key === "non_field_errors" ? `${valueStr}` : `${key}: ${valueStr}`;
            })
            .join("\n");
        throw new Error(messages || "Erreur modification patient");
    }
    return res.json();
}

export async function requestModification(id: number): Promise<{ status: string; detail: string }> {
    const res = await apiFetch(`/patients/${id}/request-modification/`, {
        method: "POST",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const messages = Object.entries(err)
            .map(([key, val]) => {
                const valueStr = Array.isArray(val) ? val.join(", ") : val;
                return key === "detail" || key === "non_field_errors" ? `${valueStr}` : `${key}: ${valueStr}`;
            })
            .join("\n");
        throw new Error(messages || "Erreur demande de modification");
    }
    return res.json();
}

export async function acceptModification(id: number): Promise<{ status: string; detail: string }> {
    const res = await apiFetch(`/patients/${id}/accept-modification/`, {
        method: "POST",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const messages = Object.entries(err)
            .map(([key, val]) => {
                const valueStr = Array.isArray(val) ? val.join(", ") : val;
                return key === "detail" || key === "non_field_errors" ? `${valueStr}` : `${key}: ${valueStr}`;
            })
            .join("\n");
        throw new Error(messages || "Erreur acceptation de modification");
    }
    return res.json();
}

export async function rejectModification(id: number): Promise<{ status: string; detail: string }> {
    const res = await apiFetch(`/patients/${id}/reject-modification/`, {
        method: "POST",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const messages = Object.entries(err)
            .map(([key, val]) => {
                const valueStr = Array.isArray(val) ? val.join(", ") : val;
                return key === "detail" || key === "non_field_errors" ? `${valueStr}` : `${key}: ${valueStr}`;
            })
            .join("\n");
        throw new Error(messages || "Erreur rejet de modification");
    }
    return res.json();
}

export async function deletePatient(id: number): Promise<void> {
    const res = await apiFetch(`/patients/${id}/`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur suppression patient");
}

// ── Stats ─────────────────────────────────────────────────────────────────

export interface DailyStats {
    date: string;
    total: number;
    cbv: {
        total: number;
        mineur: number;
        adulte: number;
        feminin: number;
        masculin: number;
        itt_0: number;
        itt_le_90: number;
        itt_gt_90: number;
        auteurs?: Record<string, number>;
    };
    adc: {
        total: number;
        mineur: number;
        adulte: number;
        feminin: number;
        masculin: number;
        itt_0: number;
        itt_le_90: number;
        itt_gt_90: number;
        auteurs?: Record<string, number>;
    };
    avp: {
        total: number;
        mineur: number;
        adulte: number;
        feminin: number;
        masculin: number;
        itt_0: number;
        itt_le_90: number;
        itt_gt_90: number;
        auteurs?: Record<string, number>;
    };
    police: number;
    gendarmerie: number;
}

export async function fetchDailyStats(date?: string, period?: string): Promise<DailyStats> {
    const query = new URLSearchParams();
    if (date) query.set("date", date);
    if (period) query.set("period", period);
    const qs = query.toString();
    const res = await apiFetch(`/stats/daily/${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error("Erreur chargement statistiques");
    return res.json();
}

// ── Activity ──────────────────────────────────────────────────────────────

export interface ActivityLogAPI {
    id: number;
    action: string;
    action_display: string;
    patient: number;
    patient_name: string;
    user: number;
    user_detail: UserProfile;
    details: string;
    timestamp: string;
}

export async function fetchActivity(date?: string): Promise<ActivityLogAPI[]> {
    const qs = date ? `?date=${date}` : "";
    const res = await apiFetch(`/activity/${qs}`);
    if (!res.ok) throw new Error("Erreur chargement activité");
    return res.json();
}
