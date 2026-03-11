"use client";

import { useState, useRef, useEffect } from "react";
import PrintSelectionModal from "./PrintSelectionModal";
import PersistentForm from "./PersistentForm";
import PrintHeader from "./PrintHeader";
import { getCurrentUser } from "../../lib/api";
import FormLockBanner from "./FormLockBanner";

import { Patient } from "../../store/patientStore";

interface GavFormProps {
    patientId: string;
    patientName: string;
    patientData?: Patient;
}

type GavView = "choix" | "examen" | "certificat";
type TabExamen = "identification" | "rappel_faits" | "antecedents" | "examen_medical" | "examens_comp" | "schema" | "conclusion";
type TabCertificat = "preambule" | "examen_medical_c" | "schema_c" | "conclusion_c";

const TABS_EXAMEN: { id: TabExamen; label: string }[] = [
    { id: "identification", label: "Identification" },
    { id: "rappel_faits", label: "Rappel des Faits" },
    { id: "antecedents", label: "Antécédents" },
    { id: "examen_medical", label: "Examen Médical" },
    { id: "examens_comp", label: "Examens Complémentaires" },
    { id: "schema", label: "Schéma" },
    { id: "conclusion", label: "Conclusion" },
];

const TABS_CERTIFICAT: { id: TabCertificat; label: string }[] = [
    { id: "preambule", label: "Préambule" },
    { id: "examen_medical_c", label: "Examen Médical" },
    { id: "schema_c", label: "Schéma" },
    { id: "conclusion_c", label: "Conclusion" },
];

export default function GavForm({ patientId, patientName, patientData }: GavFormProps) {
    const [currentView, setCurrentView] = useState<GavView>("choix");
    const [activeTabExamen, setActiveTabExamen] = useState<TabExamen>("identification");
    const [activeTabCertificat, setActiveTabCertificat] = useState<TabCertificat>("preambule");
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
    const [brushColor, setBrushColor] = useState("#0d9488"); // teal-600
    const [brushSize, setBrushSize] = useState(2);
    const [hasUploadedImage, setHasUploadedImage] = useState(false);
    const [schemaHasContent, setSchemaHasContent] = useState(false);

    // Sections imprimables pour le certificat médico-légal
    const PRINTABLE_SECTIONS_CERTIFICAT = [
        { id: "preambule", label: "Préambule", isSecret: false },
        {
            id: "examen_medical_c",
            label: "Examen Médical",
            isSecret: false,
            children: [
                { id: "date_examen_c", label: "Date de l'examen", isSecret: false },
                { id: "doleances_c", label: "Doléances", isSecret: false },
                { id: "antecedents_c", label: "Antécédents", isSecret: false },
                { id: "etat_general_c", label: "État général", isSecret: false },
                { id: "examen_clinique_c", label: "Examen clinique", isSecret: false },
                { id: "reste_examen_c", label: "Reste de l'examen médical", isSecret: false },
            ]
        },
        { id: "schema_c", label: "Schéma", isSecret: false },
        { id: "conclusion_c", label: "Conclusion", isSecret: false },
    ];

    // Ajuster textareas pour impression
    const adjustTextareasForPrint = () => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
            textarea.style.height = 'auto';
            textarea.style.minHeight = 'auto';
            textarea.style.maxHeight = 'none';
            const scrollHeight = textarea.scrollHeight;
            const contentHeight = Math.max(scrollHeight, 50);
            textarea.style.height = contentHeight + 'px';
            textarea.style.minHeight = contentHeight + 'px';
            textarea.style.overflow = 'hidden';
            textarea.style.overflowY = 'hidden';
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

    // Télécharger Fiche Examen
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
            filename: `Fiche_Examen_GAV_${patientName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
        };

        await html2pdf().from(formRef.current).set(opt).save();

        formRef.current.classList.remove("pdf-mode");
        resetTextareas();
        setShowAllForPrint(false);
    };

    // Imprimer le certificat médico-légal
    const handlePrintCertificat = async (selectedSections: string[]) => {
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

    // Télécharger le certificat médico-légal
    const handleDownloadCertificatPDF = async (selectedSections: string[]) => {
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
            filename: `Certificat_GAV_${patientName.replace(/\s+/g, '_')}.pdf`,
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

    const shouldShowCertificat = (tabId: string) => {
        if (showAllForPrint && isPrintingReport) {
            return reportSections.includes(tabId);
        }
        if (showAllForPrint && !isPrintingReport) return false;
        return activeTabCertificat === tabId;
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

    const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-base leading-relaxed print:bg-white print:text-black print:border-transparent print:py-1 print:px-2 print:w-[calc(100%-11rem)] print:inline-block print:align-middle";
    const labelClass = "block text-sm font-bold text-blue-300 mb-1.5 print:text-black print:mb-0 print:font-bold print:w-40 print:inline-block print:align-middle";
    const sectionTitleClass = "text-base font-bold text-blue-300 mb-3 pb-2 border-b border-blue-400/40 bg-white/5 p-2 rounded print:text-black print:bg-gray-100 print:px-2 print:py-1 print:border-transparent print:border-transparent print:mt-2 print:mb-2";

    // ==================== VIEW: CHOIX ====================
    if (currentView === "choix" && !showAllForPrint) {
        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => setCurrentView("examen")}
                        className="group bg-white/5 hover:bg-blue-500/20 rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 text-left hover:scale-[1.02]"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Fiche d&apos;Examen Médical</h3>
                                <p className="text-gray-400 text-sm">Fiche d&apos;examen médical d&apos;une personne gardée à vue</p>
                            </div>
                            <svg className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>

                    <button
                        onClick={() => setCurrentView("certificat")}
                        className="group bg-white/5 hover:bg-blue-500/20 rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 text-left hover:scale-[1.02]"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Certificat Médico-Légal</h3>
                                <p className="text-gray-400 text-sm">Rapport médico-légal d&apos;une personne gardée à vue</p>
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
            <PersistentForm patientId={patientId} formType="gav_examen" initialData={patientData?.rapport_medical || ""} className="space-y-6 print:space-y-2">
                <FormLockBanner
                    patientId={patientId}
                    patientStatus={patientData?.status}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    label="formulaire"
                />
                <div ref={formRef}>
                    <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        background: white !important;
                        font-family: Arial, "Inter", sans-serif !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-field-empty { display: none !important; }
                    .print-section {
                        page-break-inside: avoid;
                        margin-bottom: 20px;
                        border: none;
                    }
                    input, textarea, select {
                        background: transparent !important;
                        color: black !important;
                        border: none !important;
                        border-color: transparent !important;
                        box-shadow: none !important;
                        border-radius: 0;
                        padding: 2px 4px;
                        font-size: 11pt;
                    }
                    label {
                        color: black;
                        font-weight: bold;
                    }
                    h3, h4 {
                        background-color: #d1d5db !important;
                        color: black !important;
                        padding: 4px 8px !important;
                        margin-top: 1rem !important;
                        margin-bottom: 0.5rem !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        text-decoration: underline !important;
                        text-transform: uppercase !important;
                        font-weight: bold !important;
                        border: none !important;
                    }
                    h3 span, h4 span {
                        display: none !important;
                    }
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
                @media screen {
                    .print-container input, .print-container textarea {
                        background: transparent;
                        color: white !important;
                        border-bottom: 1px dashed rgba(255,255,255,0.3) !important;
                        outline: none;
                    }
                    .print-container .titre-gris {
                        background-color: rgba(255, 255, 255, 0.1) !important;
                        color: white !important;
                    }
                    .print-container .print-only-text {
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
                    {/* Nouveau Header Pixel Perfect inclus ci-dessous */}

                    {/* Navigation buttons - OUTSIDE fieldset so they work when not editing */}
                    <div className="no-print mb-6 flex flex-wrap items-center gap-3">
                        <button onClick={() => setCurrentView("choix")} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Retour
                        </button>
                        <button onClick={handlePrintExam} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimer Fiche d&apos;examen
                        </button>
                        <button onClick={handleDownloadExamPDF} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Télécharger PDF
                        </button>
                    </div>

                    {/* Tabs - OUTSIDE fieldset so they work when not editing */}
                    <div className="no-print flex flex-wrap gap-2 mb-6">
                        {TABS_EXAMEN.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTabExamen(tab.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTabExamen === tab.id ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <fieldset disabled={!isEditing} className="contents group">
                        <div className="space-y-6 print:space-y-2">

                            {/* IDENTIFICATION */}
                            <div style={{ display: shouldShowExamen("identification") ? 'block' : 'none' }}>
                                <div className="space-y-6 print:space-y-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Identification
                                    </h3>
                                    <div className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div><label className={labelClass}>N° Fiche</label><input type="text" placeholder="" /></div>
                                            <div><label className={labelClass}>Date d&apos;examen</label><input type="date" /></div>
                                            <div><label className={labelClass}>N° CIN</label><input type="text" placeholder="" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Nom et Prénom</label><input type="text" defaultValue={patientName} /></div>
                                            <div><label className={labelClass}>État Civil</label><input type="text" placeholder="" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Date et lieu de Naissance</label><input type="text" placeholder="" defaultValue={`${patientData?.date_naissance || ""} ${patientData?.lieu_naissance ? 'à ' + patientData.lieu_naissance : ""}`.trim()} /></div>
                                            <div><label className={labelClass}>Profession</label><input type="text" placeholder="" /></div>
                                        </div>
                                        <div><label className={labelClass}>Adresse</label><input type="text" placeholder="" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* RAPPEL DES FAITS */}
                            <div style={{ display: shouldShowExamen("rappel_faits") ? 'block' : 'none' }}>
                                <div className="space-y-6 print:space-y-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Rappel des Faits
                                    </h3>
                                    <div className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Date et heures</label><input type="text" placeholder="" /></div>
                                            <div><label className={labelClass}>Motif</label><input type="text" placeholder="" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>C.B.V. (Coups et Blessures Volontaires)</label>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <label className="flex items-center gap-2 text-sm text-gray-300">
                                                        <input type="radio" name="is_cbv" value="true" className="accent-blue-500" /> Oui
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-gray-300">
                                                        <input type="radio" name="is_cbv" value="false" className="accent-blue-500" /> Non
                                                    </label>
                                                </div>
                                            </div>
                                            <div><label className={labelClass}>Date de fait</label><input type="text" placeholder="" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Objet</label><input type="text" placeholder="" /></div>
                                            <div><label className={labelClass}>Auteur</label><input type="text" placeholder="" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ANTÉCÉDENTS PERSONNELS ET FAMILIAUX */}
                            <div style={{ display: shouldShowExamen("antecedents") ? 'block' : 'none' }}>
                                <div className="space-y-6 print:space-y-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Antécédents Personnels et Familiaux
                                    </h3>
                                    <div className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1">
                                        <div><label className={labelClass}>Antécédents personnels</label><textarea rows={3} placeholder="" /></div>
                                        <div><label className={labelClass}>Antécédents familiaux</label><textarea rows={3} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* EXAMEN MÉDICAL */}
                            <div style={{ display: shouldShowExamen("examen_medical") ? 'block' : 'none' }}>
                                <div className="space-y-6 print:space-y-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Examen Médical
                                    </h3>
                                    <div className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1">
                                        <div><label className={labelClass}>Examen médical</label><textarea rows={6} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* EXAMENS COMPLÉMENTAIRES */}
                            <div style={{ display: shouldShowExamen("examens_comp") ? 'block' : 'none' }}>
                                <div className="space-y-6 print:space-y-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Examens Complémentaires
                                    </h3>
                                    <div className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1">
                                        <div><label className={labelClass}>Examens complémentaires</label><textarea rows={4} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* SCHÉMA LÉSIONNEL (EXAMEN) */}
                            <div style={{ display: shouldShowExamen("schema") && (schemaHasContent || !showAllForPrint) ? 'block' : 'none' }}>
                                <div className="space-y-6 print:space-y-2 print-section">
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
                                        <div className="flex justify-center bg-gray-100 rounded-lg p-4 overflow-hidden print:p-0 print:bg-transparent min-h-[300px]">
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

                            {/* CONCLUSION */}
                            <div style={{ display: shouldShowExamen("conclusion") ? 'block' : 'none' }}>
                                <div className="space-y-6 print:space-y-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Conclusion
                                    </h3>
                                    <div className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1">
                                        <div><label className={labelClass}>Conclusion</label><textarea rows={4} placeholder="" /></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>ITT (Incapacité Totale de Travail)</label><input type="number" name="itt_jours" placeholder="" /></div>
                                            <div><label className={labelClass}>Nom du Médecin</label><input type="text" placeholder="" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton soumission */}
                            <div className="flex gap-4 pt-6 border-t border-white/10 no-print">
                                {isEditing && (
                                    <button type="submit" className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-teal-500/50 transition-all duration-300">
                                        Enregistrer l&apos;examen
                                    </button>
                                )}
                            </div>
                        </div>
                    </fieldset>

                </div>
            </PersistentForm>

        );
    }
    // ==================== VIEW: CERTIFICAT MÉDICO-LÉGAL ====================
    return (
        <PersistentForm patientId={patientId} formType="gav_certificat" initialData={patientData?.rapport_medical || ""} className="space-y-6 print:space-y-2">
            <FormLockBanner
                patientId={patientId}
                patientStatus={patientData?.status}
                canEdit={canEdit}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                label="certificat"
            />
            <div ref={formRef}>
                <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        background: white !important;
                        font-family: Arial, "Inter", sans-serif !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-field-empty { display: none !important; }
                    .print-section {
                        page-break-inside: avoid;
                        margin-bottom: 20px;
                        border: none;
                    }
                    input, textarea, select {
                        background: transparent !important;
                        color: black !important;
                        border: none !important;
                        border-color: transparent !important;
                        box-shadow: none !important;
                        border-radius: 0;
                        padding: 2px 4px;
                        font-size: 11pt;
                    }
                    label {
                        color: black;
                        font-weight: bold;
                    }
                    h3, h4 {
                        background-color: #d1d5db !important;
                        color: black !important;
                        padding: 4px 8px !important;
                        margin-top: 1rem !important;
                        margin-bottom: 0.5rem !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        text-decoration: underline !important;
                        text-transform: uppercase !important;
                        font-weight: bold !important;
                        border: none !important;
                    }
                    h3 span, h4 span {
                        display: none !important;
                    }
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
                @media screen {
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
`}</style>

                {/* Navigation - OUTSIDE fieldset so buttons work when not editing */}
                <div className="no-print mb-6 flex flex-wrap items-center gap-3">
                    <button onClick={() => { setCurrentView("choix"); setShowAllForPrint(false); setIsPrintingReport(false); }} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Retour
                    </button>

                    <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimer Certificat Médico-Légal
                    </button>
                </div>

                {/* Modal impression certificat - OUTSIDE fieldset */}
                {showReportModal && (
                    <PrintSelectionModal
                        isOpen={showReportModal}
                        title="Imprimer/Télécharger le Certificat Médico-Légal GAV"
                        sections={PRINTABLE_SECTIONS_CERTIFICAT}
                        onPrint={(selectedSections) => {
                            setShowReportModal(false);
                            handlePrintCertificat(selectedSections);
                        }}
                        onDownload={(selectedSections) => {
                            setShowReportModal(false);
                            handleDownloadCertificatPDF(selectedSections);
                        }}
                        onClose={() => setShowReportModal(false)}
                    />
                )}

                {/* Onglets - OUTSIDE fieldset */}
                <div className="no-print flex flex-wrap gap-2 mb-6">
                    {TABS_CERTIFICAT.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabCertificat(tab.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTabCertificat === tab.id
                                ? "bg-blue-600 text-white shadow-lg shadow-amber-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <fieldset disabled={!isEditing} className="contents group">
                    <div className="space-y-3 text-[11pt] leading-relaxed relative print-container bg-white/5 text-white print:bg-white print:text-black border border-white/10 print:border-none rounded-xl print:rounded-none p-6 print:p-0 shadow-none print:shadow-none mt-4 print:mt-0">
                        <PrintHeader
                            title="CERTIFICAT MÉDICAL INITIAL DESCRIPTIF DE LÉSIONS TRAUMATIQUES"
                            showDate={true}
                        />

                        <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-2 mt-4 print:mt-0">
                            <h2 className="text-[12pt] font-bold uppercase underline underline-offset-4">CERTIFICAT MÉDICAL INITIAL DE GARDE A VUE</h2>
                        </div>

                        {/* PRÉAMBULE */}
                        <div style={{ display: shouldShowCertificat("preambule") ? 'block' : 'none' }}>
                            <section>
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Préambule</h3>
                                </div>
                                <div className="space-y-0 pl-2">
                                    <div className="flex"><span className="w-[180px] shrink-0">– Réquisition de :</span><input type="text" placeholder="" /></div>
                                    <div className="flex"><span className="w-[180px] shrink-0">– Date de la réquisition :</span><input type="date" className="w-auto" /></div>
                                    <div className="flex"><span className="w-[180px] shrink-0">– Examen de :</span><input type="text" defaultValue={patientName} /></div>
                                    <div className="flex"><span className="w-[180px] shrink-0">– Date et lieu de naissance :</span><input type="text" placeholder="" defaultValue={`${patientData?.date_naissance || ""} ${patientData?.lieu_naissance ? 'à ' + patientData.lieu_naissance : ""}`.trim()} /></div>
                                </div>
                            </section>
                        </div>

                        {/* EXAMEN MÉDICAL */}
                        <div style={{ display: shouldShowCertificat("examen_medical_c") ? 'block' : 'none' }}>
                            <section>
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1 mt-3">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Examen médical</h3>
                                </div>
                                <div className="space-y-0 pl-2">
                                    <div className="flex"><span className="w-[180px] shrink-0">– Date de l'examen :</span><input type="date" className="w-auto" /></div>
                                    <div className="flex"><span className="w-[180px] shrink-0">– Doléances :</span><input type="text" placeholder="" /></div>
                                    <div className="flex"><span className="w-[180px] shrink-0">– Antécédents :</span><input type="text" placeholder="" /></div>
                                    <div className="flex"><span className="w-[180px] shrink-0">– Etat général :</span><input type="text" placeholder="" /></div>
                                    <div className="mt-0">
                                        <span>– Examen clinique :</span>
                                        <div className="pl-8 space-y-0">
                                            <div className="flex items-center"><span className="mr-2">▪</span><span className="w-[120px] shrink-0">Inspection :</span><input type="text" placeholder="" /></div>
                                            <div className="flex items-center"><span className="mr-2">▪</span><span className="w-[120px] shrink-0">Palpation :</span><input type="text" placeholder="" /></div>
                                        </div>
                                    </div>
                                    <div className="flex"><span className="w-[220px] shrink-0">– Reste de l'examen médical :</span><input type="text" placeholder="" /></div>
                                </div>
                            </section>
                        </div>

                        {/* SCHÉMA LÉSIONNEL (CERTIFICAT) */}
                        <div style={{ display: shouldShowCertificat("schema_c") && (schemaHasContent || !(showAllForPrint && isPrintingReport)) ? 'block' : 'none' }}>
                            <section className="print-section mt-4">
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-2 mt-3 print:bg-gray-400">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Schéma Lésionnel</h3>
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
                            </section>
                        </div>

                        {/* CONCLUSION */}
                        <div style={{ display: shouldShowCertificat("conclusion_c") ? 'block' : 'none' }}>
                            <section>
                                <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1 mt-3">
                                    <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Conclusion</h3>
                                </div>
                                <div className="pl-2">
                                    <textarea rows={1} placeholder="" className="overflow-hidden resize-none translate-y-[2px]" />
                                    <div className="flex mt-1 text-[11pt] font-bold">
                                        <span className="shrink-0 mr-2">I.T.T (Incapacité Totale de Travail) :</span>
                                        <input type="number" name="itt_jours" className="w-40 font-bold" placeholder="" />
                                    </div>
                                </div>
                                <div className="mt-6 text-right pr-12">
                                    <span className="font-bold underline underline-offset-2">Médecin légiste</span>
                                </div>
                            </section>
                        </div>

                    </div>
                </fieldset>
            </div>
        </PersistentForm>
    );
}

