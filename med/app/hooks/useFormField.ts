"use client";

import { useCallback, ChangeEvent } from "react";
import { useFormDataStore } from "../store/formDataStore";

/**
 * Custom hook that provides helpers to bind form inputs to the formDataStore.
 * Usage:
 *   const { field, textArea, checkbox } = useFormField(patientId, "consultation");
 *   <input {...field("nom")} />
 *   <textarea {...textArea("description")} />
 *   <input type="checkbox" {...checkbox("isCBI")} />
 */
export function useFormField(patientId: string, formType: string) {
    const setField = useFormDataStore((s) => s.setField);
    const data = useFormDataStore((s) => s.getFormData(patientId, formType));

    // For text/date/number/time inputs
    const field = useCallback(
        (fieldName: string, defaultValue?: string) => ({
            value: data[fieldName] ?? defaultValue ?? "",
            onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                setField(patientId, formType, fieldName, e.target.value);
            },
        }),
        [data, patientId, formType, setField]
    );

    // Alias for textarea (same as field but typed for clarity)
    const textArea = field;

    // For checkboxes
    const checkbox = useCallback(
        (fieldName: string) => ({
            checked: data[fieldName] === "true",
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                setField(patientId, formType, fieldName, e.target.checked ? "true" : "false");
            },
        }),
        [data, patientId, formType, setField]
    );

    // For radio buttons
    const radio = useCallback(
        (fieldName: string, radioValue: string) => ({
            checked: data[fieldName] === radioValue,
            onChange: () => {
                setField(patientId, formType, fieldName, radioValue);
            },
        }),
        [data, patientId, formType, setField]
    );

    return { field, textArea, checkbox, radio, data };
}
