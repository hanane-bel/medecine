"use client";

import { useEffect, useRef, useCallback } from "react";
import { useFormDataStore } from "../../store/formDataStore";
import { updatePatient } from "../../lib/api";

interface PersistentFormProps {
    patientId: string;
    formType: string;
    children: React.ReactNode;
    className?: string;
    initialData?: string; // root rapport_medical string from DB
}

/**
 * Wrapper component that automatically persists all form input values
 * (input, textarea, select) to sessionStorage via the formDataStore.
 * 
 * It uses event delegation and position-based indexing to identify each field,
 * so no changes are needed to the children form elements.
 */
export default function PersistentForm({ patientId, formType, children, className, initialData }: PersistentFormProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const setField = useFormDataStore((s) => s.setField);
    const getFormData = useFormDataStore((s) => s.getFormData);
    const formDataState = useFormDataStore((s) => s.formData);
    const restoredRef = useRef(false);

    // Current form data to trigger autosave
    const currentFormData = formDataState[`${patientId}_${formType}`] || {};

    // Auto-save debounced effect
    useEffect(() => {
        if (!restoredRef.current) return;
        const keys = Object.keys(currentFormData);
        if (keys.length === 0) return;

        const timer = setTimeout(async () => {
            try {
                const payload: any = {
                    rapport_medical: JSON.stringify(currentFormData)
                };

                // Extract known stats fields
                if (currentFormData.itt_jours) {
                    payload.itt_jours = parseInt(currentFormData.itt_jours, 10);
                }
                if (currentFormData.auteur_agression) {
                    payload.auteur_agression = currentFormData.auteur_agression;
                }
                if (currentFormData.is_cbv === "true") {
                    payload.type_consultation = "CBV";
                }

                await updatePatient(parseInt(patientId, 10), payload);
            } catch (error) {
                console.error("Auto-save failed", error);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [currentFormData, patientId]);

    // Build a unique key for each form element based on its position in the DOM
    const getFieldKey = useCallback((element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string => {
        // Prefer name or id if available
        if (element.name) return element.name;
        if (element.id) return element.id;

        // Fallback: use position-based index among siblings of same type
        const container = containerRef.current;
        if (!container) return "";

        const allOfType = container.querySelectorAll(element.tagName.toLowerCase());
        const index = Array.from(allOfType).indexOf(element);
        const type = element.getAttribute("type") || element.tagName.toLowerCase();
        return `_pos_${type}_${index}`;
    }, []);

    // Restore saved values after mount
    useEffect(() => {
        if (restoredRef.current) return;
        const container = containerRef.current;
        if (!container) return;

        // Small delay to ensure children are rendered
        const timer = setTimeout(() => {
            let savedData = getFormData(patientId, formType);

            // If empty in store but we have initial DB data, parse and use it
            if ((!savedData || Object.keys(savedData).length === 0) && initialData) {
                try {
                    savedData = JSON.parse(initialData);
                    // Pre-fill store so it persists locally too
                    Object.entries(savedData).forEach(([k, v]) => {
                        setField(patientId, formType, k, v as string);
                    });
                } catch {
                    // Ignore parse error
                }
            }

            if (!savedData || Object.keys(savedData).length === 0) {
                restoredRef.current = true;
                return;
            }

            // Restore text inputs, date, time, number
            const textInputs = container.querySelectorAll<HTMLInputElement>(
                'input[type="text"], input[type="date"], input[type="time"], input[type="number"], input[type="color"]'
            );
            textInputs.forEach((input) => {
                const key = getFieldKey(input);
                if (key && savedData[key] !== undefined) {
                    // Use native setter to work with React controlled components
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, "value"
                    )?.set;
                    if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(input, savedData[key]);
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                    } else {
                        input.value = savedData[key];
                    }
                }
            });

            // Restore textareas
            const textareas = container.querySelectorAll<HTMLTextAreaElement>("textarea");
            textareas.forEach((textarea) => {
                const key = getFieldKey(textarea);
                if (key && savedData[key] !== undefined) {
                    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLTextAreaElement.prototype, "value"
                    )?.set;
                    if (nativeTextAreaValueSetter) {
                        nativeTextAreaValueSetter.call(textarea, savedData[key]);
                        textarea.dispatchEvent(new Event("input", { bubbles: true }));
                    } else {
                        textarea.value = savedData[key];
                    }
                }
            });

            // Restore selects
            const selects = container.querySelectorAll<HTMLSelectElement>("select");
            selects.forEach((select) => {
                const key = getFieldKey(select);
                if (key && savedData[key] !== undefined) {
                    select.value = savedData[key];
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });

            // Restore checkboxes
            const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
                const key = getFieldKey(checkbox);
                if (key && savedData[key] !== undefined) {
                    const shouldBeChecked = savedData[key] === "true";
                    if (checkbox.checked !== shouldBeChecked) {
                        checkbox.checked = shouldBeChecked;
                        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }
            });

            // Restore radio buttons
            const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
            radios.forEach((radio) => {
                const key = getFieldKey(radio);
                if (key && savedData[key] !== undefined) {
                    const shouldBeChecked = savedData[key] === "true";
                    if (radio.checked !== shouldBeChecked) {
                        radio.checked = shouldBeChecked;
                        if (shouldBeChecked) {
                            radio.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                }
            });

            // Restore contenteditable divs
            const editables = container.querySelectorAll<HTMLElement>("[contenteditable]");
            editables.forEach((el, index) => {
                const key = `_pos_contenteditable_${index}`;
                if (savedData[key] !== undefined) {
                    el.innerHTML = savedData[key];
                }
            });

            restoredRef.current = true;
        }, 100);

        return () => clearTimeout(timer);
    }, [patientId, formType, getFormData, getFieldKey]);

    // Event delegation for capturing changes
    const handleInput = useCallback((e: Event) => {
        const target = e.target as HTMLElement;
        if (!target) return;

        if (target instanceof HTMLInputElement) {
            const key = getFieldKey(target);
            if (!key) return;
            if (target.type === "checkbox") {
                setField(patientId, formType, key, target.checked ? "true" : "false");
            } else if (target.type === "radio") {
                // For radios, save the checked state
                setField(patientId, formType, key, target.checked ? "true" : "false");
                // Also uncheck other radios in the same group
                if (target.name && containerRef.current) {
                    const siblings = containerRef.current.querySelectorAll<HTMLInputElement>(
                        `input[type="radio"][name="${target.name}"]`
                    );
                    siblings.forEach((sibling) => {
                        if (sibling !== target) {
                            const siblingKey = getFieldKey(sibling);
                            if (siblingKey) {
                                setField(patientId, formType, siblingKey, "false");
                            }
                        }
                    });
                }
            } else {
                setField(patientId, formType, key, target.value);
            }
        } else if (target instanceof HTMLTextAreaElement) {
            const key = getFieldKey(target);
            if (key) {
                setField(patientId, formType, key, target.value);
            }
        } else if (target instanceof HTMLSelectElement) {
            const key = getFieldKey(target);
            if (key) {
                setField(patientId, formType, key, target.value);
            }
        }
    }, [patientId, formType, setField, getFieldKey]);

    // Handle contenteditable changes
    const handleContentEditableInput = useCallback((e: Event) => {
        const target = e.target as HTMLElement;
        if (target?.getAttribute("contenteditable") === "true" && containerRef.current) {
            const editables = containerRef.current.querySelectorAll<HTMLElement>("[contenteditable]");
            const index = Array.from(editables).indexOf(target);
            if (index >= 0) {
                setField(patientId, formType, `_pos_contenteditable_${index}`, target.innerHTML);
            }
        }
    }, [patientId, formType, setField]);

    // Set up event listeners via delegation
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("input", handleInput, true);
        container.addEventListener("change", handleInput, true);
        container.addEventListener("input", handleContentEditableInput, true);

        return () => {
            container.removeEventListener("input", handleInput, true);
            container.removeEventListener("change", handleInput, true);
            container.removeEventListener("input", handleContentEditableInput, true);
        };
    }, [handleInput, handleContentEditableInput]);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
}
