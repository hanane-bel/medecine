"use client";

import { useState, useRef, useEffect } from "react";
import PrintSelectionModal from "./PrintSelectionModal";
import PersistentForm from "./PersistentForm";
import PrintHeader from "./PrintHeader";
import { getCurrentUser } from "../../lib/api";
import FormLockBanner from "./FormLockBanner";

import { Patient } from "../../store/patientStore";

interface ExpertiseFormProps {
    patientId: string;
    patientName: string;
    patientData?: Patient;
}

type ExpertiseView = "choix" | "examen" | "rapport";
type TabExamen = "identification" | "antecedents" | "allegations" | "examen_general" | "examen_genital" | "examen_anorectal" | "examens_comp" | "schema";
type TabRapport = "requisition" | "mission" | "examen_medical" | "schema_r" | "conclusion_r";
type Genre = "femme" | "homme";

const TABS_EXAMEN: { id: TabExamen; label: string }[] = [
    { id: "identification", label: "Identification" },
    { id: "antecedents", label: "Antécédents" },
    { id: "allegations", label: "Allégations" },
    { id: "examen_general", label: "Examen Général" },
    { id: "examen_genital", label: "Examen Génital" },
    { id: "examen_anorectal", label: "Examen Ano-Rectal" },
    { id: "examens_comp", label: "Examens Complémentaires" },
    { id: "schema", label: "Schéma" },
];

const TABS_RAPPORT: { id: TabRapport; label: string }[] = [
    { id: "requisition", label: "Réquisition" },
    { id: "mission", label: "Mission" },
    { id: "examen_medical", label: "Examen Médical" },
    { id: "schema_r", label: "Schéma" },
    { id: "conclusion_r", label: "Conclusion" },
];

export default function ExpertiseForm({ patientId, patientName, patientData }: ExpertiseFormProps) {
    const [currentView, setCurrentView] = useState<ExpertiseView>("choix");
    const [genre, setGenre] = useState<Genre>(patientData?.genre === "Féminin" ? "femme" : "homme");
    const [activeTabExamen, setActiveTabExamen] = useState<TabExamen>("identification");
    const [activeTabRapport, setActiveTabRapport] = useState<TabRapport>("requisition");
    const [showAllForPrint, setShowAllForPrint] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSections, setReportSections] = useState<string[]>([]);
    const [isPrintingReport, setIsPrintingReport] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    // Permission state
    const [isEditing, setIsEditing] = useState(false);
    const currentUser = getCurrentUser();
    const isChef = currentUser?.role === "chef_service";
    const isOwner = patientData?.created_by === currentUser?.id || patientData?.medecin_traitant === currentUser?.id;
    const canEdit = !!currentUser;

    // Canvas refs and state
    const schemaCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState("#9333ea"); // purple-600
    const [brushSize, setBrushSize] = useState(2);
    const [hasUploadedImage, setHasUploadedImage] = useState(false);
    const [schemaHasContent, setSchemaHasContent] = useState(false);

    // Sections imprimables pour le rapport médical
    const PRINTABLE_SECTIONS_RAPPORT = [
        { id: "requisition", label: "Réquisition", isSecret: false },
        { id: "mission", label: "Mission", isSecret: false },
        {
            id: "examen_medical",
            label: "Examen Médical",
            isSecret: true,
            children: [
                { id: "date_faits", label: "Date des faits allégués", isSecret: true },
                { id: "doleances", label: "Doléances", isSecret: true },
                { id: "etat_general_r", label: "État général", isSecret: true },
                { id: "inspection_corps", label: "Inspection du corps", isSecret: true },
                { id: "examen_genital_r", label: "Examen des organes génitaux externes", isSecret: true },
                { id: "region_anale", label: "Région anale", isSecret: true },
            ]
        },
        { id: "schema_r", label: "Schéma", isSecret: false },
        { id: "conclusion_r", label: "Conclusion", isSecret: false },
    ];

    // Ajuster textareas pour impression
    const adjustTextareasForPrint = () => {
        if (!formRef.current) return;
        const textareas = formRef.current.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
            textarea.style.height = 'auto';
            textarea.style.minHeight = 'auto';
            textarea.style.maxHeight = 'none';
            const scrollHeight = textarea.scrollHeight;
            const contentHeight = Math.max(scrollHeight, 40);
            textarea.style.height = contentHeight + 'px';
            textarea.style.minHeight = contentHeight + 'px';
            textarea.style.overflow = 'visible';
            textarea.style.overflowY = 'visible';
            textarea.innerHTML = textarea.value;
        });

        const inputs = formRef.current.querySelectorAll('input');
        inputs.forEach((input) => {
            if (input.type !== 'checkbox' && input.type !== 'radio') {
                input.setAttribute('value', input.value);
            } else {
                if (input.checked) input.setAttribute('checked', 'checked');
                else input.removeAttribute('checked');
            }
        });

        const selects = formRef.current.querySelectorAll('select');
        selects.forEach((select) => {
            const options = select.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].selected) options[i].setAttribute('selected', 'selected');
                else options[i].removeAttribute('selected');
            }
        });
    };

    const resetTextareas = () => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
            textarea.style.height = '';
            textarea.style.minHeight = '';
            textarea.style.maxHeight = '';
            textarea.style.overflow = '';
            textarea.style.overflowY = '';
        });
    };

    // Imprimer la fiche d'examen
    const handlePrintExam = async () => {
        setShowAllForPrint(true);
        setIsPrintingReport(false);
        await new Promise(r => setTimeout(r, 200));
        adjustTextareasForPrint();
        await new Promise(r => setTimeout(r, 100));
        window.print();
        setTimeout(() => {
            resetTextareas();
            setShowAllForPrint(false);
        }, 500);
    };

    // Imprimer le rapport médical
    const handlePrintReport = async (selectedSections: string[]) => {
        setReportSections(selectedSections);
        setIsPrintingReport(true);
        setShowAllForPrint(true);
        await new Promise(r => setTimeout(r, 200));
        adjustTextareasForPrint();
        hideEmptyFields();
        await new Promise(r => setTimeout(r, 100));
        window.print();
        setTimeout(() => {
            showAllFields();
            resetTextareas();
            setShowAllForPrint(false);
            setIsPrintingReport(false);
            setReportSections([]);
        }, 500);
    };

    const handleDownloadExamPDF = async () => {
        if (!formRef.current) return;
        setShowAllForPrint(true);
        setIsPrintingReport(false);
        await new Promise(r => setTimeout(r, 200));
        adjustTextareasForPrint();
        await new Promise(r => setTimeout(r, 100));

        formRef.current.classList.add("pdf-mode");
        const html2pdf = (await import('html2pdf.js')).default;
        const opt = {
            margin: 10,
            filename: `Fiche_Expertise_${patientName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
        };

        await html2pdf().from(formRef.current).set(opt).save();

        formRef.current.classList.remove("pdf-mode");
        resetTextareas();
        setShowAllForPrint(false);
    };

    const handleDownloadReportPDF = async (selectedSections: string[]) => {
        if (!formRef.current) return;
        setReportSections(selectedSections);
        setIsPrintingReport(true);
        setShowAllForPrint(true);
        await new Promise(r => setTimeout(r, 200));
        adjustTextareasForPrint();
        await new Promise(r => setTimeout(r, 100));

        formRef.current.classList.add("pdf-mode");
        const html2pdf = (await import('html2pdf.js')).default;
        const opt = {
            margin: 10,
            filename: `Rapport_Expertise_${patientName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
        };

        await html2pdf().from(formRef.current).set(opt).save();

        formRef.current.classList.remove("pdf-mode");
        showAllFields();
        resetTextareas();
        setShowAllForPrint(false);
        setIsPrintingReport(false);
        setReportSections([]);
    };

    // Hide empty fields before printing
    const hideEmptyFields = () => {
        if (!formRef.current) return;
        const inputs = formRef.current.querySelectorAll('input, textarea, select');
        inputs.forEach((el) => {
            const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (input.type === 'checkbox' || input.type === 'radio' || input.type === 'hidden') return;
            if (!input.value || input.value.trim() === '') {
                const parent = input.closest('div:has(> label)');
                if (parent) parent.classList.add('print-field-empty');
            }
        });
    };

    const showAllFields = () => {
        if (!formRef.current) return;
        formRef.current.querySelectorAll('.print-field-empty').forEach(el => {
            el.classList.remove('print-field-empty');
        });
    };

    // Visibility helpers
    const shouldShowExamen = (tabId: string) => {
        if (showAllForPrint && !isPrintingReport) return true;
        return activeTabExamen === tabId;
    };

    const shouldShowRapport = (tabId: string) => {
        if (showAllForPrint && isPrintingReport) {
            return reportSections.includes(tabId);
        }
        if (showAllForPrint && !isPrintingReport) return false;
        return activeTabRapport === tabId;
    };

    // Fonctions pour le canvas générique
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = schemaCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                const maxWidth = 800;
                let targetWidth = img.width;
                let targetHeight = img.height;

                if (targetWidth > maxWidth) {
                    targetHeight = (maxWidth / targetWidth) * targetHeight;
                    targetWidth = maxWidth;
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                setHasUploadedImage(true);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const clearCanvas = () => {
        const canvas = schemaCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasUploadedImage(false);
        setSchemaHasContent(false);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isEditing) return;
        e.preventDefault();
        const canvas = schemaCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        setSchemaHasContent(true);
        const rect = canvas.getBoundingClientRect();
        let clientX = e && 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        let clientY = e && 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        ctx.beginPath();
        ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing) return;
        const canvas = schemaCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX = e && 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        let clientY = e && 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-base leading-relaxed print:bg-white print:text-black print:border-gray-300 print:py-1 print:px-2 print:w-[calc(100%-11rem)] print:inline-block print:align-middle";
    const labelClass = "block text-sm font-bold text-blue-300 mb-1.5 print:text-black print:mb-0 print:font-bold print:w-40 print:inline-block print:align-middle";
    const sectionTitleClass = "text-base font-bold text-blue-300 mb-3 pb-2 border-b border-blue-400/40 bg-white/5 p-2 rounded print:text-black print:bg-gray-100 print:px-2 print:py-1 print:border print:border-gray-400 print:mt-2 print:mb-2";

    // ==================== VIEW: CHOIX ====================
    if (currentView === "choix" && !showAllForPrint) {
        return (
            <div>
                {/* Sélection Genre */}
                <div className="mb-6 flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                    <span className="text-sm text-gray-300 font-medium">Genre du patient :</span>
                    <button
                        onClick={() => setGenre("femme")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${genre === "femme" ? "bg-blue-600 text-white shadow-lg shadow-pink-500/30" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
                    >
                        ♀ Femme
                    </button>
                    <button
                        onClick={() => setGenre("homme")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${genre === "homme" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
                    >
                        ♂ Homme
                    </button>
                </div>

                {/* Choix entre Examen et Rapport */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => setCurrentView("examen")}
                        className="group bg-white/5 hover:bg-blue-500/20 rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 text-left hover:scale-[1.02]"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Examen Médical</h3>
                                <p className="text-gray-400 text-sm">Fiche d&apos;examen d&apos;une victime présumée d&apos;agression sexuelle</p>
                            </div>
                            <svg className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>

                    <button
                        onClick={() => setCurrentView("rapport")}
                        className="group bg-white/5 hover:bg-blue-500/20 rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 text-left hover:scale-[1.02]"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Rapport Médical</h3>
                                <p className="text-gray-400 text-sm">Rapport médico-légal ({genre === "femme" ? "Femme" : "Homme"})</p>
                            </div>
                            <svg className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // ==================== VIEW: EXAMEN MÉDICAL ====================
    if (currentView === "examen" || (showAllForPrint && !isPrintingReport)) {
        return (
            <PersistentForm patientId={patientId} formType="expertise_examen" initialData={patientData?.rapport_medical || ""}>
                {/* Actions (Screen only) */}
                <div className="max-w-4xl mx-auto mb-6 no-print">
                    {/* Navigation */}
                    <div className="no-print mb-6 flex flex-wrap items-center gap-3">
                        <button onClick={() => setCurrentView("choix")} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Retour
                        </button>

                        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10">
                            <span className="text-sm text-gray-300">Genre :</span>
                            <button onClick={() => setGenre("femme")} className={`px-3 py-1 rounded text-sm transition-all ${genre === "femme" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>♀ Femme</button>
                            <button onClick={() => setGenre("homme")} className={`px-3 py-1 rounded text-sm transition-all ${genre === "homme" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>♂ Homme</button>
                        </div>

                        {/* Onglets */}
                        <div className="no-print flex flex-wrap gap-2 mb-6">
                            {TABS_EXAMEN.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTabExamen(tab.id)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTabExamen === tab.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-purple-500/30"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <FormLockBanner
                        patientId={patientId}
                        patientStatus={patientData?.status}
                        canEdit={canEdit}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        label="formulaire"
                    />
                </div>

                <div
                    className="print-container bg-white/5 text-white max-w-[21cm] mx-auto p-12 shadow-none rounded-xl border border-white/10 print:bg-white print:text-black print:p-0 print:m-0 print:shadow-none print:w-full print:border-none print:max-w-none print:min-h-0 relative"
                    ref={formRef}
                >
                    <fieldset disabled={!isEditing} className="contents group">
                        <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body { background: white !important; height: auto !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-container { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; min-height: 0 !important; overflow: visible !important; }
                    input, textarea, select { border-bottom: none !important; color: black !important; overflow: visible !important; }
                    .schema-print-container { page-break-inside: avoid; }
                    .schema-section { margin-top: 10px; }
                    .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 10px !important; }
                    .mb-6 { margin-bottom: 10px !important; }
                    .gap-4 { gap: 8px !important; }
                    .grid { margin-bottom: 5px !important; }
                    h3 { margin-bottom: 5px !important; }
                    .footer-print {
                        width: 100%;
                        text-align: center;
                        font-size: 8pt;
                        color: #666;
                        border-top: 1px solid #ccc;
                        padding-top: 3px;
                        margin-top: 10px;
                    }
                }

                /* Styles globaux pour le document format papier WYSIWYG */
                .print-container input, .print-container textarea {
                    background: transparent;
                    color: #1e1b4b;
                    border: none;
                    border-bottom: 1px dashed #9ca3af;
                    border-radius: 0;
                    padding: 2px 0px;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
                    font-size: 11pt;
                    width: 100%;
                    resize: none;
                }
                .print-container input:focus, .print-container textarea:focus {
                    outline: none;
                    border-bottom-style: solid;
                    border-bottom-color: black;
                }
                .print-container label { color: black; font-weight: 700; width: 14rem; flex-shrink: 0; padding-right: 0.5rem; }
                .print-container .col-field {
                    display: flex;
                    flex-direction: row;
                    align-items: baseline;
                    margin-bottom: 0.5rem;
                }
                .print-container .col-field input, .print-container .col-field textarea {
                    flex: 1;
                }
                
                @media screen {
                    .print-container input, .print-container textarea {
                        color: white !important;
                        border-bottom: 1px dashed rgba(255,255,255,0.3) !important;
                    }
                    .print-container label {
                        color: white !important;
                    }
                    .print-container .titre-gris {
                        background-color: rgba(255, 255, 255, 0.1) !important;
                        color: white !important;
                    }
                    fieldset input[type="text"],
                    fieldset input[type="date"],
                    fieldset input[type="time"],
                    fieldset input[type="number"],
                    fieldset textarea,
                    fieldset select {
                        background: rgba(255,255,255,0.1) !important;
                        border: 1px solid rgba(255,255,255,0.2) !important;
                        border-radius: 0.5rem;
                        color: white !important;
                        padding: 0.75rem 1rem !important;
                        font-size: 1rem !important;
                        line-height: 1.5 !important;
                        width: 100%;
                        outline: none;
                    }
                    fieldset input[type="text"]:focus,
                    fieldset input[type="date"]:focus,
                    fieldset input[type="time"]:focus,
                    fieldset input[type="number"]:focus,
                    fieldset textarea:focus,
                    fieldset select:focus {
                        border-color: rgba(96,165,250,0.6) !important;
                        box-shadow: 0 0 0 2px rgba(59,130,246,0.3) !important;
                    }
                    fieldset input[type="file"],
                    fieldset input[type="color"],
                    fieldset input[type="range"],
                    fieldset input[type="radio"],
                    fieldset input[type="checkbox"] {
                        background: transparent !important;
                        border: none !important;
                        padding: 0 !important;
                        width: auto;
                    }
                }
                .pdf-mode {
                    background-color: white !important;
                    color: black !important;
                }
                .pdf-mode input, .pdf-mode textarea, .pdf-mode label, .pdf-mode h1, .pdf-mode h2, .pdf-mode h3, .pdf-mode p, .pdf-mode span, .pdf-mode div {
                    color: black !important;
                }
                .pdf-mode input, .pdf-mode textarea {
                    border-bottom: 1px dashed black !important;
                }
                .pdf-mode .titre-gris {
                    background-color: #d1d5db !important;
                }
                .pdf-mode .no-print {
                    display: none !important;
                }
                `}</style>

                        {/* En-tête professionnel partagé */}
                        <PrintHeader
                            title="UNITÉ D'EXPERTISE MÉDICO-LÉGALE"
                        />



                        <div className="flex items-center gap-2">
                            <button onClick={handlePrintExam} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                                🖨 Imprimer
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadExamPDF}
                                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                PDF
                            </button>
                        </div>

                        <div className="space-y-6">

                            {/* IDENTIFICATION */}
                            <div style={{ display: shouldShowExamen("identification") ? 'block' : 'none' }}>
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2">
                                        Identification
                                    </h3>
                                    <div className="border border-white/20 print:border-black p-4 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 mb-4">
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Date d&apos;examen</label><input type="date" className="font-semibold" /></div>
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Heure</label><input type="time" className="font-semibold" /></div>
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">N° Dossier</label><input type="text" placeholder="" className="font-semibold" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-4">
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Nom et Prénom</label><input type="text" defaultValue={patientName} className="font-semibold" /></div>
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Père</label><input type="text" placeholder="" className="font-semibold" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-4">
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Date et lieu de naissance</label><input type="text" placeholder="" className="font-semibold" defaultValue={`${patientData?.date_naissance || ""} ${patientData?.lieu_naissance ? 'à ' + patientData.lieu_naissance : ""}`.trim()} /></div>
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Mère</label><input type="text" placeholder="" className="font-semibold" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-4">
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Adresse</label><input type="text" placeholder="" className="font-semibold" /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Sœurs</label><input type="number" placeholder="" className="font-semibold" /></div>
                                                <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Frères</label><input type="number" placeholder="" className="font-semibold" /></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 mb-4">
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Profession</label><input type="text" placeholder="" className="font-semibold" /></div>
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Niveau Social</label><input type="text" placeholder="" className="font-semibold" /></div>
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">Niveau d&apos;instruction</label><input type="text" placeholder="" className="font-semibold" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
                                            <div className="flex flex-col"><label className="text-xs uppercase text-gray-400 print:text-black mb-1">État Civil</label><input type="text" placeholder="" className="font-semibold" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ANTÉCÉDENTS */}
                            <div style={{ display: shouldShowExamen("antecedents") ? 'block' : 'none' }}>
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2">
                                        Antécédents
                                    </h3>
                                    <div className="space-y-0 pl-2">
                                        <div className="flex mb-0"><label>1. Médicaux :</label><textarea rows={2} placeholder="" /></div>
                                        <div className="flex mb-0"><label>2. Chirurgicaux :</label><textarea rows={2} placeholder="" /></div>
                                        <div className="flex mb-0"><label>3. Gynéco-Obstétricaux :</label><textarea rows={2} placeholder="" /></div>
                                        {genre === "femme" && (
                                            <div className="flex mb-0"><label>4. Date des Dernières Règles :</label><input type="text" placeholder="" /></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ALLÉGATIONS */}
                            <div style={{ display: shouldShowExamen("allegations") ? 'block' : 'none' }}>
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2">
                                        Allégations
                                    </h3>
                                    <div className="space-y-0 pl-2">
                                        <div className="flex mb-0"><label>1. Date et Heure des Faits :</label><input type="text" placeholder="" /></div>
                                        <div className="flex mb-0"><label>2. CBV (Coups et Blessures Volontaires) :</label><textarea rows={2} placeholder="" /></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex mb-0"><label>3. Agression Sexuelle :</label><textarea rows={2} placeholder="" /></div>
                                            <div className="flex mb-0"><label>Ou Relations Sexuelles :</label><textarea rows={2} placeholder="" /></div>
                                        </div>
                                        <div className="flex mb-0"><label>4. Acte Contre Nature :</label><textarea rows={2} placeholder="" /></div>
                                        <div className="flex mb-0"><label>5. Autres :</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* EXAMEN GÉNÉRAL */}
                            <div style={{ display: shouldShowExamen("examen_general") ? 'block' : 'none' }}>
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2">
                                        Examen Général
                                    </h3>
                                    <div className="space-y-0 pl-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex mb-0"><label>Visage :</label><textarea rows={2} placeholder="" /></div>
                                            <div className="flex mb-0"><label>Dos :</label><textarea rows={2} placeholder="" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex mb-0"><label>Cou :</label><textarea rows={2} placeholder="" /></div>
                                            <div className="flex mb-0"><label>Membres Inférieurs :</label><textarea rows={2} placeholder="" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex mb-0"><label>Thorax :</label><textarea rows={2} placeholder="" /></div>
                                            <div className="flex mb-0"><label>Membres Supérieurs :</label><textarea rows={2} placeholder="" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* EXAMEN DES ORGANES GÉNITAUX EXTERNES */}
                            <div style={{ display: shouldShowExamen("examen_genital") ? 'block' : 'none' }}>
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2">
                                        Examen des Organes Génitaux Externes
                                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${genre === "femme" ? "bg-blue-600/30 text-blue-300" : "bg-blue-600/30 text-blue-300"}`}>
                                            {genre === "femme" ? "♀ Femme" : "♂ Homme"}
                                        </span>
                                    </h3>
                                    <div className="space-y-0 pl-2">
                                        {genre === "femme" ? (
                                            <>
                                                <div className="flex mb-0"><label>Cuisses et Fesses :</label><textarea rows={2} placeholder="" /></div>
                                                <div className="flex mb-0"><label>Périnée :</label><textarea rows={2} placeholder="" /></div>
                                                <div className="flex mb-0"><label>Grandes et Petites Lèvres :</label><textarea rows={2} placeholder="" /></div>
                                                <div className="flex mb-0"><label>Muqueuse Vulvaire :</label><textarea rows={2} placeholder="" /></div>
                                                <div className="flex mb-0"><label>Hymen :</label><textarea rows={2} placeholder="" /></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex mb-0"><label>Scrotum :</label><textarea rows={2} placeholder="" /></div>
                                                <div className="flex mb-0"><label>Verge :</label><textarea rows={2} placeholder="" /></div>
                                                <div className="flex mb-0"><label>Testicules :</label><textarea rows={2} placeholder="" /></div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* EXAMEN ANO-RECTAL */}
                            <div style={{ display: shouldShowExamen("examen_anorectal") ? 'block' : 'none' }}>
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2">
                                        Examen Ano-Rectal
                                    </h3>
                                    <div className="space-y-0 pl-2">
                                        <div className="flex mb-0"><label>Muqueuse Anale :</label><textarea rows={2} placeholder="" /></div>
                                        <div className="flex mb-0"><label>Sphincter Anal :</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* EXAMENS COMPLÉMENTAIRES */}
                            <div style={{ display: shouldShowExamen("examens_comp") ? 'block' : 'none' }}>
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2">
                                        Examens Complémentaires
                                    </h3>
                                    <div className="space-y-0 pl-2">
                                        {genre === "femme" && (
                                            <div className="flex mb-0"><label>1. Test de Grossesse :</label><input type="text" placeholder="" /></div>
                                        )}
                                        <div className="flex mb-0"><label>2. Prélèvements Vaginaux :</label><input type="text" placeholder="" /></div>
                                        <div className="flex mb-0"><label>3. Sérologie :</label><input type="text" placeholder="" /></div>
                                        <div className="flex mb-0"><label>4. Échographie Pelvienne :</label><input type="text" placeholder="" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* SCHÉMA LÉSIONNEL (EXAMEN) */}
                            <div style={{ display: shouldShowExamen("schema") && (schemaHasContent || !showAllForPrint) ? 'block' : 'none' }}>
                                <div className="space-y-6 print-section">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                                        Schéma Lésionnel
                                    </h3>
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-transparent">
                                        <div className="flex flex-wrap gap-4 mb-4 no-print items-center">
                                            <div>
                                                <label className="block text-xs font-bold text-blue-500 mb-1">Importer une image</label>
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                                            </div>
                                            <div className="w-px h-8 bg-white/20 mx-2"></div>
                                            <div>
                                                <label className="block text-xs font-bold text-blue-500 mb-1">Couleur</label>
                                                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-blue-500 mb-1">Épaisseur ({brushSize}px)</label>
                                                <input type="range" min="1" max="10" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-32 accent-blue-500" />
                                            </div>
                                            <div className="flex-1"></div>
                                            <button onClick={clearCanvas} type="button" className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 rounded-lg text-sm font-medium transition-colors">Tout effacer</button>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4 no-print italic">S'il n'y a pas d'image, le dessin se fera sur un fond blanc.</p>
                                        <div className="flex justify-center bg-gray-100 rounded-lg p-4 overflow-hidden print:p-0 min-h-[300px]">
                                            <canvas
                                                ref={schemaCanvasRef}
                                                width={800} height={500}
                                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                                                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                                className="border border-gray-300 cursor-crosshair max-w-full bg-white shadow-sm"
                                                style={{ touchAction: "none" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton soumission */}
                            <div className="flex gap-4 pt-6 border-t border-white/10 no-print">
                                {isEditing && (
                                    <button type="submit" className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                                        Enregistrer l'examen
                                    </button>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    {/* Pied de page impression */}
                </div>
            </PersistentForm >
        );
    }

    // ==================== VIEW: RAPPORT MÉDICAL ====================
    return (
        <PersistentForm patientId={patientId} formType="expertise_rapport" initialData={patientData?.rapport_medical || ""}>
            {/* Navigation and Actions (Screen only, Outside Paper) */}
            <div className="max-w-4xl mx-auto mb-6 no-print">
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => { setCurrentView("choix"); setShowAllForPrint(false); setIsPrintingReport(false); }} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Retour
                    </button>

                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10">
                        <span className="text-sm text-gray-300">Genre :</span>
                        <button onClick={() => setGenre("femme")} className={`px-3 py-1 rounded text-sm transition-all ${genre === "femme" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>♀ Femme</button>
                        <button onClick={() => setGenre("homme")} className={`px-3 py-1 rounded text-sm transition-all ${genre === "homme" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>♂ Homme</button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-amber-600/20">
                            🖨 Imprimer
                        </button>
                    </div>
                </div>

                {/* Onglets Rapport */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {TABS_RAPPORT.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabRapport(tab.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTabRapport === tab.id
                                ? "bg-blue-600 text-white shadow-lg shadow-amber-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <FormLockBanner
                patientId={patientId}
                patientStatus={patientData?.status}
                canEdit={canEdit}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                label="rapport"
            />

            {/* Modal de sélection pour le rapport médical */}
            <PrintSelectionModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onPrint={handlePrintReport}
                onDownload={handleDownloadReportPDF}
                sections={PRINTABLE_SECTIONS_RAPPORT}
                title="Imprimer/Télécharger le rapport médical"
            />

            {/* LE DOCUMENT (Paper layout WYSIWYG) */}
            <div className="print-container bg-white/5 text-white max-w-[21cm] min-h-[29.7cm] mx-auto p-12 shadow-none rounded-xl border border-white/10 print:bg-white print:text-black print:p-0 print:m-0 print:shadow-none print:w-full print:border-none print:max-w-none" ref={formRef}>
                <fieldset disabled={!isEditing} className="contents group">
                    <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
                    input, textarea { border-bottom: none !important; color: black !important; }
                    .schema-print-container { page-break-inside: avoid; }
                    .schema-section { page-break-before: always; }
                }

                /* Styles globaux pour le document format papier WYSIWYG */
                .print-container input, .print-container textarea {
                    background: transparent;
                    color: #1e1b4b; /* Encre bleu très foncé évoquant la machine à écrire ou stylo */
                    border: none;
                    border-bottom: 1px dashed #9ca3af; /* Bordure pointillée masquée à l'impression */
                    border-radius: 0;
                    padding: 2px 0px;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
                    font-size: 11pt;
                    width: 100%;
                    resize: none;
                }
                .print-container input:focus, .print-container textarea:focus {
                    outline: none;
                    border-bottom-style: solid;
                    border-bottom-color: black;
                }
                .print-container label { color: black; font-weight: 700; width: 14rem; flex-shrink: 0; padding-right: 0.5rem; }
                .print-container .col-field {
                    display: flex;
                    flex-direction: row;
                    align-items: baseline;
                    margin-bottom: 0.5rem;
                }
                .print-container .col-field input, .print-container .col-field textarea {
                    flex: 1;
                }
                
                @media screen {
                    .print-container input, .print-container textarea {
                        color: white !important;
                        border-bottom: 1px dashed rgba(255,255,255,0.3) !important;
                    }
                    .print-container label {
                        color: white !important;
                    }
                    .titre-gris {
                        background-color: rgba(255, 255, 255, 0.1) !important;
                        color: white !important;
                    }
                    fieldset input[type="text"],
                    fieldset input[type="date"],
                    fieldset input[type="time"],
                    fieldset input[type="number"],
                    fieldset textarea,
                    fieldset select {
                        background: rgba(255,255,255,0.1) !important;
                        border: 1px solid rgba(255,255,255,0.2) !important;
                        border-radius: 0.5rem;
                        color: white !important;
                        padding: 0.75rem 1rem !important;
                        font-size: 1rem !important;
                        line-height: 1.5 !important;
                        width: 100%;
                        outline: none;
                    }
                    fieldset input[type="text"]:focus,
                    fieldset input[type="date"]:focus,
                    fieldset input[type="time"]:focus,
                    fieldset input[type="number"]:focus,
                    fieldset textarea:focus,
                    fieldset select:focus {
                        border-color: rgba(96,165,250,0.6) !important;
                        box-shadow: 0 0 0 2px rgba(59,130,246,0.3) !important;
                    }
                    fieldset input[type="file"],
                    fieldset input[type="color"],
                    fieldset input[type="range"],
                    fieldset input[type="radio"],
                    fieldset input[type="checkbox"] {
                        background: transparent !important;
                        border: none !important;
                        padding: 0 !important;
                        width: auto;
                    }
                }
                .pdf-mode {
                    background-color: white !important;
                    color: black !important;
                }
                .pdf-mode input, .pdf-mode textarea, .pdf-mode label, .pdf-mode h1, .pdf-mode h2, .pdf-mode h3, .pdf-mode p, .pdf-mode span, .pdf-mode div {
                    color: black !important;
                }
                .pdf-mode input, .pdf-mode textarea {
                    border-bottom: 1px dashed black !important;
                }
                .pdf-mode .titre-gris {
                    background-color: #d1d5db !important;
                }
                .pdf-mode .no-print {
                    display: none !important;
                }
                `}</style>

                    <PrintHeader
                        title="RAPPORT D'EXPERTISE MÉDICO-LÉGALE"
                        showDate={true}
                    />

                    <div className="space-y-3 mt-4 text-[11pt] leading-relaxed">

                        {/* RÉQUISITION */}
                        <div style={{ display: shouldShowRapport("requisition") ? 'block' : 'none' }}>
                            <div>
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt] m-0">Réquisition</h3>
                                </div>
                                <div className="space-y-0 pl-2">
                                    <div className="flex mb-0">
                                        <label>Sur réquisition de :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>En date du :</label>
                                        <input type="date" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>Patient :</label>
                                        <input type="text" defaultValue={patientName} />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>Âge :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>Profession/Statut :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>Demeurant à :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>Examen pratiqué en présence de :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MISSION */}
                        <div style={{ display: shouldShowRapport("mission") ? 'block' : 'none' }}>
                            <div>
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt] m-0">Mission</h3>
                                </div>
                                <div className="space-y-0 pl-2">
                                    <div className="flex mb-0">
                                        <label>1.</label>
                                        <input type="text" defaultValue={genre === "femme" ? "Procéder à l'examen médical, gynécologique et anal" : "Procéder à l'examen médical et anal"} />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>2.</label>
                                        <input type="text" defaultValue="Établir un rapport médical." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXAMEN MÉDICAL */}
                        <div style={{ display: shouldShowRapport("examen_medical") ? 'block' : 'none' }}>
                            <div>
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt] m-0">Examen Médical</h3>
                                </div>
                                <div className="space-y-0 pl-2">
                                    <div className="flex mb-0">
                                        <label>Date des faits allégués :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>Doléances :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>État général :</label>
                                        <input type="text" placeholder="" />
                                    </div>
                                    <div className="flex mb-0">
                                        <label>Inspection du corps :</label>
                                        <input type="text" placeholder="" />
                                    </div>

                                    <h4>Examen des organes génitaux externes</h4>
                                    {genre === "femme" ? (
                                        <>
                                            <div className="flex mb-0"><label>Périnée :</label><input type="text" placeholder="" /></div>
                                            <div className="flex mb-0"><label>Muqueuse vulvaire :</label><input type="text" placeholder="" /></div>
                                            <div className="flex mb-0"><label>Grandes et petites lèvres :</label><input type="text" placeholder="" /></div>
                                            <div className="flex mb-0"><label>Hymen :</label><input type="text" placeholder="" /></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex mb-0"><label>Scrotum :</label><input type="text" placeholder="" /></div>
                                            <div className="flex mb-0"><label>Verge :</label><input type="text" placeholder="" /></div>
                                            <div className="flex mb-0"><label>Testicules :</label><input type="text" placeholder="" /></div>
                                        </>
                                    )}

                                    <h4>Région anale</h4>
                                    <div className="flex mb-0"><label>Sphincter anal :</label><input type="text" placeholder="" /></div>
                                    <div className="flex mb-0"><label>Muqueuse anale :</label><input type="text" placeholder="" /></div>
                                </div>
                            </div>
                        </div>

                        {/* SCHÉMA LÉSIONNEL (RAPPORT) */}
                        <div style={{ display: shouldShowRapport("schema_r") && (schemaHasContent || !showAllForPrint) ? 'block' : 'none' }}>
                            <div className="print-section mt-4 schema-section">
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-2 mt-3 print:bg-gray-400">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt] m-0">Schéma Lésionnel</h3>
                                </div>
                                <div className="flex justify-center bg-gray-50 rounded-lg p-2 overflow-hidden print:p-0 min-h-[300px]">
                                    <canvas
                                        ref={schemaCanvasRef}
                                        width={800} height={500}
                                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                        className="border border-gray-300 cursor-crosshair max-w-full bg-white"
                                        style={{ touchAction: "none" }}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-4 mt-2 mb-4 no-print items-center bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Importer</label>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-[10px] text-gray-300 w-48" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Couleur</label>
                                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="h-6 w-8 rounded cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Épaisseur</label>
                                        <input type="range" min="1" max="10" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-20" />
                                    </div>
                                    <div className="flex-1"></div>
                                    <button onClick={clearCanvas} type="button" className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs font-medium">Effacer</button>
                                </div>
                            </div>
                        </div>

                        {/* CONCLUSION & SIGNATURE */}
                        <div style={{ display: shouldShowRapport("conclusion_r") ? 'block' : 'none' }}>
                            <div>
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt] m-0">Conclusion</h3>
                                </div>
                                <div className="space-y-0 pl-2">
                                    <div className="flex mb-0" style={{ alignItems: 'flex-start' }}>
                                        <label>Conclusion :</label>
                                        <textarea rows={4} className="font-bold" placeholder=""></textarea>
                                    </div>
                                </div>
                                <div className="mt-6 text-right pr-12">
                                    <span className="font-bold underline underline-offset-2">Médecin légiste</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bouton soumission (Écran uniquement) */}
                    <div className="mt-8 pt-6 border-t border-gray-300 no-print flex justify-end">
                        {isEditing && (
                            <button type="submit" className="py-3 px-8 bg-black text-white font-bold rounded shadow hover:bg-gray-800 transition-all">
                                Enregistrer le rapport
                            </button>
                        )}
                    </div>
                </fieldset>

                {/* Signature Area */}
                <div className="hidden print:block mt-4 mb-2" style={{ pageBreakBefore: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="flex justify-end pr-8">
                        <div className="text-left">
                            <p className="text-[10pt] font-bold text-gray-900 mb-1">Docteur ....................................</p>
                            <div className="h-16 w-40 border border-gray-400 rounded mt-1 flex items-center justify-center text-gray-400 text-[8pt]">
                                Cachet et Signature
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pied de page impression */}
                <div className="footer-print hidden print:block">
                    <p>SERVICE DE MÉDECINE LÉGALE C.H.U. TLEMCEN | Bvd MOHAMMED V - 13000 TLEMCEN</p>
                    <p>Tel: 043 20-10-30 (poste 2223 / 2202) | Fax: 043 20-14-14</p>
                </div>
            </div>
        </PersistentForm >
    );
}
