"use client";

import { useState, useEffect } from "react";

interface PrintableSection {
    id: string;
    label: string;
    isSecret?: boolean;
    children?: PrintableSection[];
}

interface PrintSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: (selectedSections: string[]) => void;
    onDownload?: (selectedSections: string[]) => void;
    sections: PrintableSection[];
    title: string;
}

export default function PrintSelectionModal({
    isOpen,
    onClose,
    onPrint,
    onDownload,
    sections,
    title,
}: PrintSelectionModalProps) {
    // Flatten all section IDs for initialization
    const getAllSectionIds = (secs: PrintableSection[], includeSecret: boolean = false): string[] => {
        const ids: string[] = [];
        secs.forEach(s => {
            if (!s.isSecret || includeSecret) {
                ids.push(s.id);
            }
            if (s.children) {
                ids.push(...getAllSectionIds(s.children, includeSecret));
            }
        });
        return ids;
    };

    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    // Initialize selected sections when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedSections(getAllSectionIds(sections, false));
            setExpandedSections(sections.filter(s => s.children && s.children.length > 0).map(s => s.id));
        }
    }, [isOpen, sections]);

    const toggleSection = (sectionId: string, parentId?: string) => {
        setSelectedSections(prev => {
            const isSelected = prev.includes(sectionId);
            let newSelected = isSelected
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId];

            // If toggling a parent section, also toggle all children
            const parent = sections.find(s => s.id === sectionId);
            if (parent?.children) {
                const childIds = parent.children.map(c => c.id);
                if (isSelected) {
                    // Deselecting parent - deselect all children
                    newSelected = newSelected.filter(id => !childIds.includes(id));
                } else {
                    // Selecting parent - select all children
                    childIds.forEach(childId => {
                        if (!newSelected.includes(childId)) {
                            newSelected.push(childId);
                        }
                    });
                }
            }

            // If toggling a child, check if parent should be selected/deselected
            if (parentId) {
                const parentSection = sections.find(s => s.id === parentId);
                if (parentSection?.children) {
                    const allChildIds = parentSection.children.map(c => c.id);
                    const selectedChildCount = allChildIds.filter(id => newSelected.includes(id)).length;
                    if (selectedChildCount === 0 && newSelected.includes(parentId)) {
                        newSelected = newSelected.filter(id => id !== parentId);
                    } else if (selectedChildCount > 0 && !newSelected.includes(parentId)) {
                        newSelected.push(parentId);
                    }
                }
            }

            return newSelected;
        });
    };

    const toggleExpand = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const selectAll = () => {
        setSelectedSections(getAllSectionIds(sections, true));
    };

    const deselectAll = () => {
        setSelectedSections([]);
    };

    const handlePrint = () => {
        onPrint(selectedSections);
        onClose();
    };

    const handleDownload = () => {
        if (onDownload) {
            onDownload(selectedSections);
            onClose();
        }
    };

    if (!isOpen) return null;

    const renderSection = (section: PrintableSection, parentId?: string, level: number = 0) => {
        const hasChildren = section.children && section.children.length > 0;
        const isExpanded = expandedSections.includes(section.id);
        const isSelected = selectedSections.includes(section.id);

        return (
            <div key={section.id} className={level > 0 ? "ml-6" : ""}>
                <label
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected
                        ? level === 0
                            ? "bg-emerald-600/20 border border-emerald-500/50"
                            : "bg-blue-600/20 border border-blue-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSection(section.id, parentId)}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                    />

                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleExpand(section.id);
                            }}
                            className="text-gray-400 hover:text-white"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    <span className={`flex-1 ${level === 0 ? "text-white font-medium" : "text-gray-300"}`}>
                        {section.label}
                    </span>

                    {section.isSecret && (
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                            Secret médical
                        </span>
                    )}
                </label>

                {hasChildren && isExpanded && (
                    <div className="mt-2 space-y-2">
                        {section.children!.map(child => renderSection(child, section.id, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                    Sélectionnez les sections et sous-sections à inclure dans le rapport :
                </p>

                <div className="space-y-2 max-h-[400px] overflow-y-auto mb-6 pr-2">
                    {sections.map(section => renderSection(section))}
                </div>

                <div className="flex gap-2 mb-6">
                    <button
                        onClick={selectAll}
                        className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all"
                    >
                        Tout sélectionner
                    </button>
                    <button
                        onClick={deselectAll}
                        className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all"
                    >
                        Tout désélectionner
                    </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={selectedSections.length === 0}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimer le rapport
                    </button>
                    {onDownload && (
                        <button
                            onClick={handleDownload}
                            disabled={selectedSections.length === 0}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Télécharger PDF
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
