"use client";

import { useState, useRef, useEffect } from "react";
import PrintSelectionModal from "./PrintSelectionModal";
import PersistentForm from "./PersistentForm";
import PrintHeader from "./PrintHeader";
import { getCurrentUser } from "../../lib/api";
import FormLockBanner from "./FormLockBanner";
import { useFormDataStore } from "../../store/formDataStore";

import { Patient } from "../../store/patientStore";

interface LeveeDeCorpsFormProps {
    patientId: string;
    patientName: string;
    patientData?: Patient;
}

export default function LeveeDeCorpsForm({ patientId, patientName, patientData }: LeveeDeCorpsFormProps) {
    const [activeTab, setActiveTab] = useState<"formulaire" | "schema">("formulaire");
    const [showAllForPrint, setShowAllForPrint] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSections, setReportSections] = useState<string[]>([]);
    const [isPrintingReport, setIsPrintingReport] = useState(false);

    // Permission state
    const [isEditing, setIsEditing] = useState(false);
    const currentUser = getCurrentUser();
    const isChef = currentUser?.role === "chef_service";
    const isOwner = patientData?.created_by === currentUser?.id || patientData?.medecin_traitant === currentUser?.id;
    const canEdit = !!currentUser;

    // Canvas refs and state
    const schemaCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState("#3b82f6"); // blue-500
    const [brushSize, setBrushSize] = useState(2);
    const [hasUploadedImage, setHasUploadedImage] = useState(false);
    const [schemaHasContent, setSchemaHasContent] = useState(false);
    const [schemaDataUrl, setSchemaDataUrl] = useState<string>("");

    const setField = useFormDataStore((s) => s.setField);
    const getFormData = useFormDataStore((s) => s.getFormData);

    const saveSchema = () => {
        const canvas = schemaCanvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            setField(patientId, "levee_de_corps", "schema_data", dataUrl);
            setSchemaDataUrl(dataUrl);
        }
    };

    useEffect(() => {
        let schemaData = "";
        const savedData = getFormData(patientId, "levee_de_corps");
        if (savedData && savedData["schema_data"]) {
            schemaData = savedData["schema_data"];
        } else if (patientData?.rapport_medical) {
            try {
                const parsed = JSON.parse(patientData.rapport_medical);
                if (parsed["schema_data"]) schemaData = parsed["schema_data"];
            } catch { }
        }

        if (schemaData) {
            setSchemaDataUrl(schemaData);
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = schemaCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                setHasUploadedImage(true);
                setSchemaHasContent(true);
            };
            img.src = schemaData;
        }
    }, [patientId, patientData, getFormData]);

    // Sections imprimables pour le rapport médical (avec sous-sections)
    const PRINTABLE_SECTIONS = [
        {
            id: "formulaire",
            label: "Formulaire de Levée de Corps",
            isSecret: false,
            children: [
                { id: "identite", label: "Identité présumée", isSecret: false },
                { id: "circonstances", label: "Circonstances médico-légales", isSecret: true },
                { id: "antecedents", label: "Antécédents", isSecret: true },
            ]
        },
        {
            id: "datation",
            label: "Datation de la mort",
            isSecret: false,
            children: [
                { id: "datation_signes", label: "Signes cadavériques", isSecret: false },
                { id: "datation_estimation", label: "Estimation du délai post-mortem", isSecret: false },
            ]
        },
        {
            id: "aspect",
            label: "Aspect extérieur du cadavre",
            isSecret: false,
            children: [
                { id: "aspect_habillage", label: "État d'habillage", isSecret: false },
                { id: "aspect_lesions", label: "Lésions externes", isSecret: true },
                { id: "aspect_orifices", label: "État des orifices naturels", isSecret: true },
            ]
        },
        { id: "schema", label: "Schéma Lésionnel", isSecret: false },
    ];

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
        const editables = formRef.current.querySelectorAll('[contenteditable]');
        editables.forEach((el) => {
            const element = el as HTMLElement;
            element.style.height = 'auto';
            element.style.minHeight = Math.max(element.scrollHeight, 40) + 'px';
            element.style.overflow = 'visible';
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

    // Restaurer les textareas après impression
    const resetTextareas = () => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
            textarea.style.height = '';
            textarea.style.minHeight = '';
            textarea.style.maxHeight = '';
            textarea.style.overflow = '';
            textarea.style.overflowY = '';
        });
        const editables = document.querySelectorAll('[contenteditable]');
        editables.forEach((el) => {
            const element = el as HTMLElement;
            element.style.height = '';
            element.style.minHeight = '';
            element.style.overflow = '';
        });
    };

    // Imprimer la fiche d'examen complète
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

    // Imprimer le rapport médical avec sections sélectionnées
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
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(formRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Fiche_Levee_De_Corps_${patientName.replace(/\s+/g, '_')}.pdf`);
        } catch (error: any) {
            console.error("PDF Generation Error (Exam):", error);
            alert("Erreur lors de la génération du PDF: " + (error?.message || error));
        } finally {
            formRef.current.classList.remove("pdf-mode");
            resetTextareas();
            setShowAllForPrint(false);
        }
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
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(formRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Rapport_Levee_De_Corps_${patientName.replace(/\s+/g, '_')}.pdf`);
        } catch (error: any) {
            console.error("PDF Generation Error (Report):", error);
            alert("Erreur lors de la génération du PDF: " + (error?.message || error));
        } finally {
            formRef.current.classList.remove("pdf-mode");
            showAllFields();
            resetTextareas();
            setShowAllForPrint(false);
            setIsPrintingReport(false);
            setReportSections([]);
        }
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

    // Fonction pour auto-expansion des textarea
    const autoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };

    const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-base leading-relaxed print:bg-white print:text-black print:border-transparent print:py-1 print:px-2 print:w-[calc(100%-11rem)] print:inline-block print:align-middle";
    const textareaAutoClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-base leading-relaxed print:bg-white print:text-black print:border-transparent resize-none overflow-hidden print:w-[calc(100%-11rem)] print:inline-block print:align-middle";
    const labelClass = "block text-sm font-bold text-blue-300 mb-1.5 print:text-black print:mb-0 print:font-bold print:w-40 print:inline-block print:align-middle";
    const sectionTitleClass = "text-base font-bold text-blue-300 mb-3 pb-2 border-b border-blue-400/40 bg-white/5 p-2 rounded print:text-black print:bg-gray-100 print:px-2 print:py-1 print:border-transparent print:border-transparent print:mt-2 print:mb-2";
    const checkboxClass = "w-5 h-5 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500 print:w-3 print:h-3 print:m-0 print:border-gray-500";

    const shouldShow = (tab: "formulaire" | "schema") => {
        if (showAllForPrint) {
            if (isPrintingReport) {
                return reportSections.includes(tab);
            }
            return true;
        }
        return activeTab === tab;
    };

    // Fonctions pour le canvas générique
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
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
                setSchemaHasContent(true);
                saveSchema();
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
        saveSchema();
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
        saveSchema();
    };

    return (
        <PersistentForm patientId={patientId} formType="levee_de_corps" className="space-y-6 print:bg-white print:text-black" initialData={patientData?.rapport_medical || ""}>
            {/* Styles d'impression */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        background: white !important;
                        font-family: Arial, "Inter", sans-serif !important;
                        height: auto !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-field-empty { display: none !important; }
                    .print-section {
                        margin-bottom: 5px;
                        border: none;
                        overflow: visible !important;
                    }
                    .print-container {
                        overflow: visible !important;
                        height: auto !important;
                    }
                    input, textarea, select {
                        background: transparent !important;
                        color: black !important;
                        border: none !important;
                        border-radius: 0;
                        padding: 0 !important;
                        font-size: 11pt !important;
                        overflow: visible !important;
                        display: inline !important;
                        width: auto !important;
                        min-width: 50px;
                        margin-left: 5px !important;
                        box-shadow: none !important;
                    }
                    [contenteditable] {
                        background: transparent !important;
                        color: black !important;
                        border: none !important;
                        border-radius: 0;
                        padding: 0 !important;
                        font-size: 11pt !important;
                        overflow: visible !important;
                    }
                    label {
                        color: black !important;
                        font-weight: bold !important;
                        display: inline !important;
                        margin-right: 5px !important;
                        margin-bottom: 0 !important;
                    }
                    .bg-white\\/5, .bg-blue-600\\/20 { background: transparent !important; border: none !important; padding: 0 !important; }
                    .border-white\\/10, .border-blue-500\\/50 { border: none !important; }
                    .grid { display: block !important; margin-bottom: 5px !important; }
                    .grid > div { display: inline-block !important; margin-right: 20px !important; margin-bottom: 5px !important; }
                    .flex-col { flex-direction: row !important; align-items: baseline !important; }
                    h3, h4 {
                        background-color: transparent !important;
                        color: black !important;
                        margin-top: 10px !important;
                        margin-bottom: 5px !important;
                        padding: 0 !important;
                        font-size: 11pt !important;
                        font-weight: bold !important;
                        border: none !important;
                        text-decoration: underline !important;
                        text-transform: uppercase !important;
                    }
                    h3 span, h4 span {
                        display: none !important;
                    }
                    .space-y-6 > * + * { margin-top: 5px !important; }
                    .space-y-4 > * + * { margin-top: 5px !important; }
                    .space-y-3 > * + * { margin-top: 5px !important; }
                    .space-y-2 > * + * { margin-top: 5px !important; }
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
                .pdf-mode h3, .pdf-mode h4 {
                    background-color: #d1d5db !important;
                }
                .pdf-mode .no-print {
                    display: none !important;
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

            {/* Onglets */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10 no-print">
                {[
                    { id: "formulaire", label: "Formulaire" },
                    { id: "schema", label: "Schéma" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
                <div className="ml-auto flex gap-2">
                    <button onClick={handlePrintExam} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2" type="button">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Fiche d&apos;examen
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
                    <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2" type="button">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Rapport médical
                    </button>
                </div>
            </div>

            {/* Modal de sélection pour le rapport médical */}
            <PrintSelectionModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onPrint={handlePrintReport}
                onDownload={handleDownloadReportPDF}
                sections={PRINTABLE_SECTIONS}
                title="Imprimer/Télécharger le rapport médical"
            />

            <FormLockBanner
                patientId={patientId}
                patientStatus={patientData?.status}
                canEdit={canEdit}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                label="formulaire"
            />

            <div ref={formRef}>
                {/* En-tête professionnel partagé */}
                <PrintHeader
                    title="RAPPORT DE LEVÉE DE CORPS"
                    unitName="UNITÉ DE THANATOLOGIE"
                />

                <fieldset disabled={!isEditing} className="contents group">
                    {/* FORMULAIRE */}
                    <div style={{ display: shouldShow("formulaire") ? 'block' : 'none' }}>
                        <div className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 no-print">
                                Formulaire de Levée de Corps
                            </h3>

                            {/* Identité et circonstances */}
                            <div className="bg-white/5 rounded-xl p-4 space-y-4 print:bg-white print:border">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="col-span-2">
                                        <label className={labelClass}>Corps examiné le</label>
                                        <input type="date" className={inputClass} />
                                    </div>
                                    <div><label className={labelClass}>à (Heures)</label><input type="time" /></div>
                                    <div><label className={labelClass}>Sur réquisition de M.</label><input type="text" placeholder="" /></div>
                                </div>

                                <h4 className={sectionTitleClass}>IDENTITÉ PRÉSUMÉE</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div><label className={labelClass}>Nom</label><input type="text" /></div>
                                    <div><label className={labelClass}>Prénom</label><input type="text" /></div>
                                    <div><label className={labelClass}>Né(e) le</label><input type="date" /></div>
                                    <div className="flex gap-4 items-end">
                                        <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="sexe" className={checkboxClass} /> H</label>
                                        <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="sexe" className={checkboxClass} /> F</label>
                                        <div><label className={labelClass}>Âge (ans)</label><input type="number" className={inputClass + " w-20"} placeholder="" /></div>
                                    </div>
                                </div>

                                <h4 >CIRCONSTANCES MÉDICO-LÉGALES</h4>
                                <div
                                    contentEditable
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm print:bg-white print:text-black print:border-transparent min-h-[80px]"
                                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                                    suppressContentEditableWarning={true}
                                    data-placeholder=""
                                ></div>

                                <h4 className={sectionTitleClass}>ANTÉCÉDENTS NOTABLES DE PRISE TOXIQUE</h4>
                                <div className="flex flex-wrap gap-4">
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="toxique" className={checkboxClass} /> OUI</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="toxique" className={checkboxClass} /> NON</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="toxique" className={checkboxClass} /> INCONNU</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Alcool</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Psychotrope</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Autre(s)</label>
                                </div>

                                <h4 className={sectionTitleClass}>ANTÉCÉDENTS DE MALADIE POTENTIELLEMENT MORTELLES</h4>
                                <div className="flex flex-wrap gap-4">
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="maladie" className={checkboxClass} /> OUI</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="maladie" className={checkboxClass} /> NON</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="maladie" className={checkboxClass} /> INCONNU</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Cardiovasculaire</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Pulmonaire</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Neurologie</label>
                                </div>

                                <h4 className={sectionTitleClass}>DATATION DE LA MORT</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div><label className={labelClass}>Déshydratation</label><input type="text" className={inputClass} /></div>
                                    <div><label className={labelClass}>Refroidissement</label><input type="text" /></div>
                                    <div><label className={labelClass}>Lividités (siège)</label><input type="text" /></div>
                                    <div><label className={labelClass}>Rigidité - Masséters</label><input type="text" /></div>
                                    <div><label className={labelClass}>Température rectale (°C)</label><input type="text" placeholder="" /></div>
                                    <div><label className={labelClass}>Température ambiante (°C)</label><input type="text" placeholder="" /></div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <span className="text-sm text-gray-300">Putréfaction:</span>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Absente</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> TVA</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Débutante</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Avancée</label>
                                </div>

                                <h4 className={sectionTitleClass}>ASPECT EXTÉRIEUR DU CADAVRE</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div><label className={labelClass}>Taille (cm)</label><input type="text" placeholder="" /></div>
                                    <div className="flex flex-wrap gap-2">
                                        <label className="flex items-center gap-1 text-xs text-gray-300"><input type="checkbox" className={checkboxClass} /> Nu</label>
                                        <label className="flex items-center gap-1 text-xs text-gray-300"><input type="checkbox" className={checkboxClass} /> Part. déshabillé</label>
                                        <label className="flex items-center gap-1 text-xs text-gray-300"><input type="checkbox" className={checkboxClass} /> Habillé</label>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <label className="flex items-center gap-1 text-xs text-gray-300"><input type="checkbox" className={checkboxClass} /> Vêtements en ordre</label>
                                        <label className="flex items-center gap-1 text-xs text-gray-300"><input type="checkbox" className={checkboxClass} /> En désordre</label>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <span className="text-sm text-gray-300">Corpulence:</span>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Normale</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Forte</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Maigre</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Cachectique</label>
                                </div>
                                <div><label className={labelClass}>Position</label><input type="text" /></div>
                                <div className="flex flex-wrap gap-4">
                                    <span className="text-sm text-gray-300">État d'hygiène:</span>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Mauvais</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Médiocre</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Bon</label>
                                </div>

                                <h4 className={sectionTitleClass}>PRÉSENCE PRÈS DU CADAVRE</h4>
                                <div className="flex flex-wrap gap-4">
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> AAF</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Arme Blanche</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Objet contondant</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Alcool</label>
                                </div>
                                <div><label className={labelClass}>Emballages vides de médicaments correspondant à</label><input type="text" /></div>

                                <h4 className={sectionTitleClass}>FORME MÉDICO-LÉGALE SUPPOSÉE DU DÉCÈS</h4>
                                <div className="flex flex-wrap gap-4">
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Mort naturelle probable</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Mort de cause inconnue</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Mort violente</label>
                                </div>
                                <div className="ml-6 flex flex-wrap gap-4">
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Par suicide</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Homicide volontaire</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Homicide involontaire</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="checkbox" className={checkboxClass} /> Autres</label>
                                </div>

                                <h4 className={sectionTitleClass}>UNE AUTOPSIE MÉDICO-LÉGALE PARAÎT-ELLE INDISPENSABLE ?</h4>
                                <div className="flex gap-8">
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="autopsie" className={checkboxClass} /> OUI</label>
                                    <label className="text-lg font-bold text-white flex items-center gap-2"><input type="radio" name="autopsie" className={checkboxClass} /> NON</label>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div><label className={labelClass}>MÉDECIN DE GARDE</label><input type="text" /></div>
                                    <div><label className={labelClass}>SIGNATURE</label><div className="h-16 border border-white/10 rounded-lg print:border-transparent"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SCHÉMA LÉSIONNEL */}
                    <div className="print:break-before-page" style={{ display: shouldShow("schema") && (schemaHasContent || !showAllForPrint) ? 'block' : 'none' }}>
                        <div className="space-y-6 print:space-y-2 print-section mt-4 schema-section">
                            <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-2 mt-3 print:bg-gray-400">
                                <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt] m-0">Schéma Lésionnel</h3>
                            </div>
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-transparent">
                                <div className="flex flex-wrap gap-4 mb-4 no-print items-center">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Importer une image</label>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" />
                                    </div>
                                    <div className="w-px h-8 bg-white/20 mx-2"></div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Couleur</label>
                                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
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
                                    <div className={`w-full justify-center ${showAllForPrint ? 'hidden' : 'flex'} print:hidden`}>
                                        <canvas
                                            ref={schemaCanvasRef}
                                            width={800} height={500}
                                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                                            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                            className="border border-gray-300 cursor-crosshair max-w-full bg-white shadow-sm"
                                            style={{ touchAction: "none" }}
                                        />
                                    </div>
                                    <div className={`w-full justify-center ${showAllForPrint ? 'flex' : 'hidden'} print:flex`}>
                                        {schemaDataUrl && <img src={schemaDataUrl} alt="Schéma Lésionnel" className="max-w-full object-contain" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </fieldset>

                {/* Signature Area */}
                <div className="hidden print:block mt-4 mb-2" style={{ pageBreakBefore: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="flex justify-start">
                        <div className="text-left">
                            <p className="text-[11pt] font-bold text-gray-900 mb-1">Docteur ....................................</p>
                            <div className="h-16 w-40 border border-gray-400 rounded mt-1 flex items-center justify-center text-gray-400 text-[8pt]">
                                Cachet et Signature
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pied de page impression */}
                <div className="footer-print hidden print:block" style={{ paddingTop: '2px', marginTop: '2px' }}>
                    <p>SERVICE DE MÉDECINE LÉGALE C.H.U. TLEMCEN | Bvd MOHAMMED V - 13000 TLEMCEN</p>
                    <p>Tel: 043 20-10-30 (poste 2223 / 2202) | Fax: 043 20-14-14</p>
                </div>
            </div>
        </PersistentForm >
    );
}
