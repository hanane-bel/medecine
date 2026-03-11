"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PatientAPI, type ActivityLogAPI } from "../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────

// Re-export types from API to maintain compatibility with existing imports,
// but now they will enforce snake_case structure.
export type Patient = PatientAPI;
export type ActivityLog = ActivityLogAPI;

// ─── Store Interface ─────────────────────────────────────────────────────

interface PatientStore {
    patients: Patient[];
    activityLog: ActivityLog[];

    // Actions are kept for interface compatibility but will likely be unused
    // as we moved to direct API calls in the dashboards.
    addPatient: (patient: any, user: any) => void;
    updatePatient: (id: any, updates: any, user: any, details?: any) => void;
    deletePatient: (id: any, user: any) => void;
    getPatientById: (id: any) => Patient | undefined;
    getPatientsByUnite: (unite: string) => Patient[];
    getPatientsBySousUnite: (sousUnite: string) => Patient[];
    getTotalPatients: () => number;
    getRecentActivity: (count?: number) => ActivityLog[];
}

// ─── Store ───────────────────────────────────────────────────────────────

export const usePatientStore = create<PatientStore>()(
    persist(
        (set, get) => ({
            patients: [],
            activityLog: [],

            addPatient: () => { console.warn("Store addPatient is deprecated. Use API."); },
            updatePatient: () => { console.warn("Store updatePatient is deprecated. Use API."); },
            deletePatient: () => { console.warn("Store deletePatient is deprecated. Use API."); },

            getPatientById: (id) => {
                // This might still be used if some component tries to get patient from store
                // But since we don't populate store anymore, it returns undefined.
                return get().patients.find(p => String(p.id) === String(id));
            },

            getPatientsByUnite: (unite) => get().patients.filter(p => p.unite === unite),
            getPatientsBySousUnite: (sousUnite) => get().patients.filter(p => p.sous_unite === sousUnite),
            getTotalPatients: () => get().patients.length,
            getRecentActivity: () => [],
        }),
        {
            name: "med-patient-store",
        }
    )
);
