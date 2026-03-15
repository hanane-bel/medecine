"use client";

import { useState, useRef, useEffect } from "react";
import PrintSelectionModal from "./PrintSelectionModal";
import PersistentForm from "./PersistentForm";
import PrintHeader from "./PrintHeader";
import { getCurrentUser } from "../../lib/api";
import FormLockBanner from "./FormLockBanner";
import { useFormDataStore } from "../../store/formDataStore";

import { Patient } from "../../store/patientStore";

interface AutopsieFormProps {
    patientId: string;
    patientName: string;
    patientData?: Patient;
}

type TabType = "page_garde" | "externe" | "interne_tete" | "interne_cou" | "interne_thorax" | "interne_abdomen" | "interne_membres" | "schema" | "poids" | "prelevements" | "vestimentaires";

const TABS: { id: TabType; label: string }[] = [
    { id: "page_garde", label: "Page de Garde" },
    { id: "externe", label: "Examen Externe" },
    { id: "interne_tete", label: "Interne - Tête" },
    { id: "interne_cou", label: "Interne - Cou" },
    { id: "interne_thorax", label: "Interne - Thorax" },
    { id: "interne_abdomen", label: "Interne - Abdomen" },
    { id: "interne_membres", label: "Interne - Membres" },
    { id: "schema", label: "Schéma" },
    { id: "poids", label: "Poids Organes" },
    { id: "prelevements", label: "Prélèvements" },
    { id: "vestimentaires", label: "Effets Vestimentaires" },
];

export default function AutopsieForm({ patientId, patientName, patientData }: AutopsieFormProps) {
    const [activeTab, setActiveTab] = useState<TabType>("page_garde");
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
    const [brushColor, setBrushColor] = useState("#dc2626"); // red-600
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
            setField(patientId, "autopsie", "schema_data", dataUrl);
            setSchemaDataUrl(dataUrl);
        }
    };

    useEffect(() => {
        let schemaData = "";
        const savedData = getFormData(patientId, "autopsie");
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
            id: "page_garde",
            label: "Page de Garde",
            isSecret: false,
            children: [
                { id: "page_garde_admin", label: "Informations administratives", isSecret: false },
                { id: "page_garde_cadavre", label: "Cadavre du nommé", isSecret: false },
                { id: "page_garde_commemoratifs", label: "Commémoratifs", isSecret: true },
                { id: "page_garde_cause", label: "Cause de mort", isSecret: false },
            ]
        },
        {
            id: "externe",
            label: "Examen Externe",
            isSecret: true,
            children: [
                { id: "externe_general", label: "Informations générales", isSecret: false },
                { id: "externe_cadaveriques", label: "Phénomènes cadavériques", isSecret: true },
                { id: "externe_tete", label: "Tête", isSecret: true },
                { id: "externe_cou", label: "Cou", isSecret: true },
                { id: "externe_tronc", label: "Tronc", isSecret: true },
                { id: "externe_membres", label: "Membres", isSecret: true },
            ]
        },
        {
            id: "interne_tete",
            label: "Examen Interne - Tête",
            isSecret: true,
            children: [
                { id: "interne_tete_scalp", label: "Scalp et muscles", isSecret: true },
                { id: "interne_tete_crane", label: "Calotte et base de crâne", isSecret: true },
                { id: "interne_tete_fosses", label: "Fosses crâniennes", isSecret: true },
                { id: "interne_tete_encephale", label: "Encéphale", isSecret: true },
            ]
        },
        {
            id: "interne_cou",
            label: "Examen Interne - Cou",
            isSecret: true,
            children: [
                { id: "interne_cou_muscles", label: "Peau et muscles", isSecret: true },
                { id: "interne_cou_os", label: "Os hyoïde et cartilages", isSecret: true },
                { id: "interne_cou_organes", label: "Organes (larynx, trachée, œsophage)", isSecret: true },
            ]
        },
        {
            id: "interne_thorax",
            label: "Examen Interne - Thorax",
            isSecret: true,
            children: [
                { id: "interne_thorax_os", label: "Os et muscles", isSecret: true },
                { id: "interne_thorax_poumons", label: "Poumons", isSecret: true },
                { id: "interne_thorax_coeur", label: "Cœur", isSecret: true },
                { id: "interne_thorax_vaisseaux", label: "Gros vaisseaux", isSecret: true },
            ]
        },
        {
            id: "interne_abdomen",
            label: "Examen Interne - Abdomen",
            isSecret: true,
            children: [
                { id: "interne_abdomen_peritoine", label: "Péritoine et épiploon", isSecret: true },
                { id: "interne_abdomen_rate_foie", label: "Rate et foie", isSecret: true },
                { id: "interne_abdomen_estomac", label: "Estomac", isSecret: true },
                { id: "interne_abdomen_intestins", label: "Intestins", isSecret: true },
                { id: "interne_abdomen_reins", label: "Reins et surrénales", isSecret: true },
            ]
        },
        { id: "interne_membres", label: "Examen Interne - Membres", isSecret: true },
        { id: "schema", label: "Schéma Lésionnel", isSecret: false },
        { id: "poids", label: "Poids des Organes", isSecret: false },
        { id: "prelevements", label: "Prélèvements", isSecret: true },
        { id: "vestimentaires", label: "Effets Vestimentaires", isSecret: false },
    ];

    // Fonction pour ajuster la hauteur des textareas au contenu
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

    // Télécharger Fiche d'examen PDF
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
            pdf.save(`Fiche_Autopsie_${patientName.replace(/\s+/g, '_')}.pdf`);
        } catch (error: any) {
            console.error("PDF Generation Error (Exam):", error);
            alert("Erreur lors de la génération du PDF: " + (error?.message || error));
        } finally {
            formRef.current.classList.remove("pdf-mode");
            resetTextareas();
            setShowAllForPrint(false);
        }
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

    // Télécharger Rapport Médical PDF
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
            pdf.save(`Rapport_Autopsie_${patientName.replace(/\s+/g, '_')}.pdf`);
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

    const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-base leading-relaxed print:bg-white print:text-black print:border-transparent print:py-1 print:px-2 print:w-[calc(100%-11rem)] print:inline-block print:align-middle";
    const labelClass = "block text-sm font-bold text-blue-300 mb-1.5 print:text-black print:mb-0 print:font-bold print:w-40 print:inline-block print:align-middle";
    const sectionTitleClass = "text-base font-bold text-blue-300 mb-3 pb-2 border-b border-blue-400/40 bg-white/5 p-2 rounded print:text-black print:bg-gray-100 print:px-2 print:py-1 print:border-transparent print:border-transparent print:mt-2 print:mb-2";

    // Condition pour afficher une section (active ou mode impression)
    const shouldShow = (tab: TabType) => {
        if (showAllForPrint) {
            // En mode impression de rapport, vérifier si la section est sélectionnée
            if (isPrintingReport) {
                return reportSections.includes(tab);
            }
            // En mode impression fiche d'examen, tout afficher
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
        <PersistentForm patientId={patientId} formType="autopsie" className="space-y-6 print:bg-white print:text-black" initialData={patientData?.rapport_medical || ""}>
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

            {/* Onglets de navigation - masqués à l'impression */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10 no-print">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}

                {/* Boutons Imprimer */}
                <div className="ml-auto flex gap-2">
                    <button
                        type="button"
                        onClick={handlePrintExam}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
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
                    <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
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
                    title="RAPPORT D'AUTOPSIE"
                    unitName="UNITÉ DE THANATOLOGIE"
                />

                <form className="space-y-6 print:space-y-1">
                    <fieldset disabled={!isEditing} className="contents group">
                        {/* PAGE DE GARDE */}
                        <div style={{ display: shouldShow("page_garde") ? 'block' : 'none' }}>
                            <div className="print-section print-first-page">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 no-print mb-4">
                                    Page de Garde
                                </h3>

                                {/* Numéro d'autopsie en haut */}
                                <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3 mb-4 print:bg-gray-100 print:border-transparent">
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-bold text-blue-400 print:text-black whitespace-nowrap">NUMÉRO D&apos;AUTOPSIE :</label>
                                        <span className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-lg font-bold print:bg-white print:text-black print:border-transparent">
                                            {patientData?.numero_dossier || "N° ____/____"}
                                        </span>
                                    </div>
                                </div>

                                {/* Tableau principal de la page de garde - compact */}
                                <div className="bg-white/5 rounded-xl p-4 print:bg-white print:border-transparent print:border-transparent">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Colonne gauche - Informations administratives */}
                                        <div className="space-y-3 md:border-r md:border-white/10 md:pr-4 print:border-transparent">
                                            <div><label className={labelClass}>Tribunal de</label><input type="text" placeholder="" defaultValue={patientData?.autorite_requerante || ""} /></div>
                                            <div><label className={labelClass}>Réquisition de</label><input type="text" placeholder="" defaultValue={patientData?.autorite_requerante || ""} /></div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><label className={labelClass}>En date du</label><input type="date" /></div>
                                                <div><label className={labelClass}>Date d&apos;autopsie</label><input type="date" defaultValue={new Date().toISOString().split('T')[0]} /></div>
                                            </div>
                                            <div><label className={labelClass}>Autopsie pratiquée par</label><textarea rows={2} placeholder="" /></div>
                                        </div>

                                        {/* Colonne droite - Cadavre et Commémoratifs */}
                                        <div className="space-y-3">
                                            {/* Cadavre du nommé */}
                                            <div className="space-y-2">
                                                <h4 className={sectionTitleClass}>Cadavre du nommé</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div><label className={labelClass}>Nom</label><input type="text" placeholder="" defaultValue={patientData?.nom || ""} /></div>
                                                    <div><label className={labelClass}>Prénom</label><input type="text" placeholder="" defaultValue={patientData?.prenom || ""} /></div>
                                                </div>
                                                <div><label className={labelClass}>Date et lieu de naissance</label><input type="text" placeholder="" defaultValue={`${patientData?.date_naissance || ""} ${patientData?.lieu_naissance ? `à ${patientData.lieu_naissance}` : ""}`} /></div>
                                            </div>

                                            {/* Commémoratifs */}
                                            <div className="space-y-2 pt-2">
                                                <h4 className={sectionTitleClass}>Commémoratifs</h4>
                                                <textarea rows={3} className={inputClass} placeholder="" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cause de mort - pleine largeur */}
                                    <div className="pt-3 mt-3 border-t border-white/10 print:border-transparent border-2 border-blue-600 rounded-lg p-4 print:border-black print:border-2">
                                        <h4 className={sectionTitleClass}>Cause de mort</h4>
                                        <textarea rows={2} className={`${inputClass} font-bold`} placeholder="" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXAMEN EXTERNE */}
                        <div style={{ display: shouldShow("externe") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Examen Externe
                                </h3>

                                {/* Informations générales */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <h4 className={sectionTitleClass}>Informations Générales</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div><label className={labelClass}>Sexe</label><select >
                                            <option value="" className="bg-slate-800">--</option>
                                            <option value="M" className="bg-slate-800">Masculin</option>
                                            <option value="F" className="bg-slate-800">Féminin</option>
                                            className={inputClass}</select></div>
                                        <div><label className={labelClass}>Race</label><input type="text" placeholder="" /></div>
                                        <div><label className={labelClass}>Poids du corps (kg)</label><input type="number" placeholder="" /></div>
                                        <div><label className={labelClass}>Corpulence</label><input type="text" placeholder="" /></div>
                                        <div><label className={labelClass}>Taille du corps (cm)</label><input type="number" placeholder="" /></div>
                                    </div>
                                    <div><label className={labelClass}>Éléments d&apos;identification (corps non identifié)</label><textarea rows={2} placeholder="" /></div>
                                </div>

                                {/* Phénomènes cadavériques */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <h4 className={sectionTitleClass}>Phénomènes Cadavériques</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Phénomènes cadavériques</label><textarea rows={3} placeholder="" /></div>
                                        <div><label className={labelClass}>Attitude particulière</label><textarea rows={3} placeholder="" /></div>
                                    </div>
                                </div>

                                {/* TÊTE */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <h4 className={sectionTitleClass}>
                                        <span className="bg-gray-600 text-white px-2 py-1 rounded mr-2 text-xs">TÊTE</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Cuir chevelu</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Visage</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>

                                {/* COU */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <h4 className={sectionTitleClass}>
                                        <span className="bg-gray-600 text-white px-2 py-1 rounded mr-2 text-xs">COU</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Face antérieure</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Nuque</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>

                                {/* TRONC */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <h4 className={sectionTitleClass}>
                                        <span className="bg-gray-600 text-white px-2 py-1 rounded mr-2 text-xs">TRONC</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelClass}>Thorax</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Abdomen</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Dos</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Pubis</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Organes génitaux externes</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>

                                {/* MEMBRES */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <h4 className={sectionTitleClass}>
                                        <span className="bg-gray-600 text-white px-2 py-1 rounded mr-2 text-xs">MEMBRES</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Membres supérieurs</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Membres inférieurs</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXAMEN INTERNE - TÊTE */}
                        <div style={{ display: shouldShow("interne_tete") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Examen Interne - Tête
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Scalp</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Muscles temporaux</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Calotte</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Base de crâne</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <h4 className={sectionTitleClass}>Fosses crâniennes</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelClass}>Fosse antérieure</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Fosse moyenne</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Fosse postérieure</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Massif facial</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Méninges</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <h4 className={sectionTitleClass}>Encéphale</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelClass}>Cerveau</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Cervelet</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Vaisseaux</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXAMEN INTERNE - COU */}
                        <div style={{ display: shouldShow("interne_cou") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Examen Interne - Cou
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Peau</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Muscles</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Os hyoïde</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Cartilage thyroïde</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Cartilage cricoïde</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Vaisseaux et nerfs</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Glande thyroïde</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Épiglotte</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Larynx</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Trachée</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Œsophage</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Colonne vertébrale</label><textarea rows={2} placeholder="" /></div>
                                        <div className="md:col-span-2">
                                            <label className={labelClass}>Moelle épinière</label>
                                            <textarea rows={2} className={inputClass} placeholder="" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXAMEN INTERNE - THORAX */}
                        <div style={{ display: shouldShow("interne_thorax") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Examen Interne - Thorax
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Muscles</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Os (Clavicules, Scapulas, Sternum et côtes)</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Plèvres</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Bronches</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <h4 className={sectionTitleClass}>Poumons</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Poumon Droit</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Poumon Gauche</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <h4 className={sectionTitleClass}>Cœur</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelClass}>Myocarde</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Ventricule droit</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Ventricule gauche</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Valves</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Septum</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Coronaires</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Crosse aortique</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Artère pulmonaire</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Médiastin</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Œsophage</label><textarea rows={2} placeholder="" /></div>
                                        <div className="md:col-span-2">
                                            <label className={labelClass}>Colonne vertébrale</label>
                                            <textarea rows={2} className={inputClass} placeholder="" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXAMEN INTERNE - ABDOMEN */}
                        <div style={{ display: shouldShow("interne_abdomen") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Examen Interne - Abdomen
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Peau</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Péritoine</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Épiploon</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Rate</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Foie</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Pancréas</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <h4 className={sectionTitleClass}>Estomac</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Contenu</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Muqueuse</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Intestins</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Colons</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Mésentère</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Aorte abdominale</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <h4 className={sectionTitleClass}>Reins</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Rein Droit</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Rein Gauche</label><textarea rows={2} placeholder="" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Glandes surrénales</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Vessie</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Utérus et annexes</label><textarea rows={2} placeholder="" /></div>
                                        <div><label className={labelClass}>Colonne vertébrale</label><textarea rows={2} placeholder="" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXAMEN INTERNE - MEMBRES */}
                        <div style={{ display: shouldShow("interne_membres") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Examen Interne - Membres
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/20">
                                                    <th className="text-left py-2 text-gray-300 font-medium">Partie</th>
                                                    <th className="text-left py-2 text-gray-300 font-medium">Droit</th>
                                                    <th className="text-left py-2 text-gray-300 font-medium">Gauche</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10">
                                                {["Bras", "Coude", "Avant bras", "Poignet", "Main", "Bassin", "Fémur", "Tibia", "Péroné", "Genou", "Pied"].map((partie) => (
                                                    <tr key={partie}>
                                                        <td className="py-2 text-white font-medium">{partie}</td>
                                                        <td className="py-2 pr-2">
                                                            <input type="text" className={inputClass} placeholder="" />
                                                        </td>
                                                        <td className="py-2">
                                                            <input type="text" className={inputClass} placeholder="" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SCHÉMA LÉSIONNEL */}
                    <div className="print:break-before-page" style={{ display: shouldShow("schema") && (schemaHasContent || !showAllForPrint) ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2 print-section">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                                    Schéma Lésionnel
                                </h3>
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
                                    <div className="flex justify-center bg-gray-100 rounded-lg p-4 overflow-hidden print:p-0 print:bg-transparent min-h-[300px]">
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

                        {/* POIDS DES ORGANES */}
                        <div style={{ display: shouldShow("poids") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Poids des Organes
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            "Cerveau", "Cœur", "Poumon droit", "Poumon gauche", "Rate", "Foie",
                                            "Pancréas", "Rein droit", "Rein gauche", "Glande surrénale droite",
                                            "Glande surrénale gauche", "Utérus et annexes"
                                        ].map((organe) => (
                                            <div key={organe}>
                                                <label className={labelClass}>{organe} (g)</label>
                                                <input type="number" className={inputClass} placeholder="" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRÉLÈVEMENTS */}
                        <div style={{ display: shouldShow("prelevements") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Prélèvements
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-white/10 last:border-0">
                                            <div><label className={labelClass}>Nature du prélèvement {num}</label><input type="text" placeholder="" /></div>
                                            <div><label className={labelClass}>Résultats</label><input type="text" placeholder="" /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* EFFETS VESTIMENTAIRES */}
                        <div style={{ display: shouldShow("vestimentaires") ? 'block' : 'none' }}>
                            <div className="space-y-6 print:space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Effets Vestimentaires
                                </h3>

                                <div className="bg-white/5 rounded-xl p-4">
                                    <label className={labelClass}>Description des effets vestimentaires</label>
                                    <textarea rows={10} className={inputClass} placeholder="" />
                                </div>
                            </div>
                        </div>

                        {/* Bouton de soumission */}
                        <div className="flex gap-4 pt-6 border-t border-white/10 no-print">
                            {isEditing && (
                                <button
                                    type="submit"
                                    className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-red-500/50 transition-all duration-300"
                                >
                                    Valider le rapport d'autopsie
                                </button>
                            )}
                        </div>
                    </fieldset>
                </form>

                {/* Signature Area */}
                <div className="hidden print:block mt-2 mb-0" style={{ pageBreakBefore: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="flex justify-end pr-8">
                        <div className="text-left">
                            <p className="text-[10pt] font-bold text-gray-900 mb-0">Docteur ....................................</p>
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

