"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ───────────────────────────────────────────────────────────────

interface FormDataStore {
    // Clé = `${patientId}_${formType}` (ex: "1_consultation", "3_autopsie")
    formData: Record<string, Record<string, string>>;

    // Set a single field value
    setField: (patientId: string, formType: string, fieldName: string, value: string) => void;

    // Get all form data for a patient + form type
    getFormData: (patientId: string, formType: string) => Record<string, string>;

    // Clear all form data (called on logout)
    clearAll: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────

export const useFormDataStore = create<FormDataStore>()(
    persist(
        (set, get) => ({
            formData: {},

            setField: (patientId, formType, fieldName, value) => {
                const key = `${patientId}_${formType}`;
                const current = get().formData;
                const currentForm = current[key] || {};
                set({
                    formData: {
                        ...current,
                        [key]: {
                            ...currentForm,
                            [fieldName]: value,
                        },
                    },
                });
            },

            getFormData: (patientId, formType) => {
                const key = `${patientId}_${formType}`;
                return get().formData[key] || {};
            },

            clearAll: () => {
                set({ formData: {} });
            },
        }),
        {
            name: "med-form-data-store",
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
