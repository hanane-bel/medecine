"use client";

import { useState, useRef, useEffect } from "react";
import PrintSelectionModal from "./PrintSelectionModal";
import PersistentForm from "./PersistentForm";
import PrintHeader from "./PrintHeader";
import FicheExamenPrint, { ExamPrintData } from "./FicheExamenPrint";
import { getCurrentUser, updatePatient, requestModification } from "../../lib/api";
import FormLockBanner from "./FormLockBanner";
import { useFormDataStore } from "../../store/formDataStore";

import { Patient } from "../../store/patientStore";

interface ConsultationFormProps {
    patientId: string;
    patientName: string;
    patientData?: Patient;
}

type TabType = "identification" | "examen" | "rapport" | "schema";

const TABS: { id: TabType; label: string }[] = [
    { id: "identification", label: "Identification & Allégations" },
    { id: "examen", label: "Examen Médical" },
    { id: "rapport", label: "Certificat Médical" },
    { id: "schema", label: "Schéma" },
];

export default function ConsultationForm({ patientId, patientName, patientData }: ConsultationFormProps) {
    const [isEditing, setIsEditing] = useState(false);

    // Check permissions
    const currentUser = getCurrentUser();
    const isChef = currentUser?.role === "chef_service";
    const isOwner = patientData?.created_by === currentUser?.id || patientData?.medecin_traitant === currentUser?.id;

    // Workflow logic: any authenticated user can edit (the form toggle controls actual editing)
    const canEdit = !!currentUser;

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            await updatePatient(parseInt(patientId, 10), { status: newStatus });
            window.location.reload(); // Refresh to apply lock/unlock
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const setField = useFormDataStore((s) => s.setField);
    const getFormData = useFormDataStore((s) => s.getFormData);

    const [activeTab, setActiveTab] = useState<TabType>("identification");
    const [showAllForPrint, setShowAllForPrint] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSections, setReportSections] = useState<string[]>([]);
    const [isPrintingReport, setIsPrintingReport] = useState(false);
    const [isPrintingExam, setIsPrintingExam] = useState(false);
    const [isCBIChecked, setIsCBIChecked] = useState(false);
    const [isMineur, setIsMineur] = useState(false);
    const [isHospitalise, setIsHospitalise] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const [examPrintData, setExamPrintData] = useState<ExamPrintData | null>(null);

    // Canvas refs and state
    const schemaCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState("#ff0000");
    const [brushSize, setBrushSize] = useState(2);
    const [hasUploadedImage, setHasUploadedImage] = useState(false);
    const [schemaHasContent, setSchemaHasContent] = useState(false);
    const [schemaDataUrl, setSchemaDataUrl] = useState<string>("");

    const saveSchema = () => {
        const canvas = schemaCanvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            setField(patientId, "consultation", "schema_data", dataUrl);
            setSchemaDataUrl(dataUrl);
        }
    };

    useEffect(() => {
        let schemaData = "";
        const savedData = getFormData(patientId, "consultation");
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
            id: "identification",
            label: "Identification",
            isSecret: false,
            children: [
                { id: "identification_patient", label: "Informations du patient", isSecret: false },
                { id: "identification_autorites", label: "Autorités requérantes", isSecret: false },
            ]
        },
        {
            id: "allegations",
            label: "Allégations",
            isSecret: true,
            children: [
                { id: "allegations_faits", label: "Date et nature des faits", isSecret: true },
                { id: "allegations_objet", label: "Objet et auteur", isSecret: true },
            ]
        },
        {
            id: "antecedents",
            label: "Antécédents",
            isSecret: true,
            children: [
                { id: "antecedents_familiaux", label: "Familiaux", isSecret: true },
                { id: "antecedents_personnels", label: "Personnels", isSecret: true },
            ]
        },
        {
            id: "examen",
            label: "Examen Médical",
            isSecret: true,
            children: [
                { id: "examen_clinique", label: "Examen clinique", isSecret: true },
                { id: "examen_complementaire", label: "Examens complémentaires", isSecret: true },
            ]
        },
        { id: "conclusion", label: "Conclusion", isSecret: false },
        { id: "itt", label: "Incapacité Temporaire de Travail (ITT)", isSecret: false },
        { id: "schema", label: "Schéma", isSecret: false },
        { id: "rapport", label: "Certificat Médical Complet", isSecret: false },
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

    // Collect all form values from DOM for the print view
    const collectFormValues = (): ExamPrintData => {
        const f = formRef.current;

        // Read all inputs by their position in the form
        const allInputs = f?.querySelectorAll('input[type="text"], input[type="date"], input[type="number"]') || [];
        const allTextareas = f?.querySelectorAll('textarea') || [];
        const allSelects = f?.querySelectorAll('select') || [];

        const textInputs = Array.from(allInputs) as HTMLInputElement[];
        const textareaInputs = Array.from(allTextareas) as HTMLTextAreaElement[];
        const selectInputs = Array.from(allSelects) as HTMLSelectElement[];

        // CBI radio buttons — determine which sub-type is selected
        const cbiRadios = f?.querySelectorAll('input[name="cbi_type"]') || [];
        let isADC = false, isAVP = false, isAutresNature = false;
        cbiRadios.forEach((radio, idx) => {
            if ((radio as HTMLInputElement).checked) {
                if (idx === 0) isADC = true;
                if (idx === 1) isAVP = true;
                if (idx === 2) isAutresNature = true;
            }
        });

        // Checkboxes: CBI, CBV, then 3 objet checkboxes (Contondant, Tranchant, Autres)
        const allCheckboxes = Array.from(f?.querySelectorAll('input[type="checkbox"]') || []) as HTMLInputElement[];
        const cbiCheckbox = allCheckboxes[0];
        const cbvCheckbox = allCheckboxes[1];
        const contondantCheckbox = allCheckboxes[2];
        const tranchantCheckbox = allCheckboxes[3];
        const autresObjetCheckbox = allCheckboxes[4];

        // Payment radios
        const paymentRadios = f?.querySelectorAll('input[name="paiement"]') || [];
        const isPayant = (paymentRadios[0] as HTMLInputElement)?.checked || false;
        const isGratuit = (paymentRadios[1] as HTMLInputElement)?.checked || false;

        // Split date/lieu de naissance from the combined field
        const dateNaissanceRaw = textInputs[3]?.value || "";
        let dateNaissance = patientData?.date_naissance || "";
        let lieuNaissance = patientData?.lieu_naissance || "";
        if (dateNaissanceRaw.includes("à ")) {
            const parts = dateNaissanceRaw.split("à ");
            dateNaissance = parts[0].trim();
            lieuNaissance = parts[1]?.trim() || "";
        } else if (dateNaissanceRaw) {
            dateNaissance = dateNaissanceRaw;
        }

        return {
            numero: textInputs[0]?.value || patientData?.numero_dossier || "",
            dateExamen: textInputs[1]?.value || "",
            nomPrenom: textInputs[2]?.value || patientName,
            dateNaissance,
            lieuNaissance,
            etatCivil: selectInputs[0]?.options[selectInputs[0].selectedIndex]?.text || "",
            profession: textInputs[4]?.value || "",
            adresse: textInputs[5]?.value || "",
            cin: textInputs[6]?.value || "",
            tuteur: textInputs[7]?.value || "",
            autoritesRequerantes: textInputs[8]?.value || "",
            enDate: "",
            dateFaits: textInputs[9]?.value || "",
            isCBI: cbiCheckbox?.checked || false,
            isCBV: cbvCheckbox?.checked || false,
            isADC,
            isAVP,
            isAutresNature,
            isContondant: contondantCheckbox?.checked || false,
            isTranchant: tranchantCheckbox?.checked || false,
            isAutresObjet: autresObjetCheckbox?.checked || false,
            auteur: (f?.querySelector('input[name="auteur_agression"]') as HTMLInputElement)?.value || "",
            familiaux: textareaInputs[0]?.value || "",
            personnels: textareaInputs[1]?.value || "",
            examenMedical: textareaInputs[2]?.value || "",
            examensComplementaires: textareaInputs[3]?.value || "",
            conclusion: textareaInputs[4]?.value || "",
            ittJours: (f?.querySelector('input[name="itt_jours"]') as HTMLInputElement)?.value || "",
            payant: isPayant ? "✓" : "",
            gratuit: isGratuit ? "✓" : "",
        };
    };

    // Imprimer la fiche d'examen
    const handlePrintExam = async () => {
        // IMPORTANT: set print mode FIRST to remove PrintHeader from DOM
        // (PrintHeader has a text input that shifts all field indices)
        setShowAllForPrint(true);
        setIsPrintingReport(false);
        setIsPrintingExam(true);
        await new Promise(r => setTimeout(r, 200));
        // Now collect values with clean DOM (no PrintHeader input)
        const data = collectFormValues();
        setExamPrintData(data);
        await new Promise(r => setTimeout(r, 200));
        window.print();
        setTimeout(() => {
            setShowAllForPrint(false);
            setIsPrintingExam(false);
            setExamPrintData(null);
        }, 500);
    };

    // Télécharger Fiche Examen PDF
    const handleDownloadExamPDF = async () => {
        if (!formRef.current) return;
        // IMPORTANT: set print mode FIRST to remove PrintHeader from DOM
        setShowAllForPrint(true);
        setIsPrintingReport(false);
        setIsPrintingExam(true);
        await new Promise(r => setTimeout(r, 200));
        // Now collect values with clean DOM
        const data = collectFormValues();
        setExamPrintData(data);
        await new Promise(r => setTimeout(r, 200));

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
            pdf.save(`Fiche_Consultation_${patientName.replace(/\s+/g, '_')}.pdf`);

        } catch (error: any) {
            console.error("PDF Generation Error (Exam):", error);
            alert("Erreur lors de la génération du PDF: " + (error?.message || error));
        } finally {
            formRef.current.classList.remove("pdf-mode");
            setShowAllForPrint(false);
            setIsPrintingExam(false);
            setExamPrintData(null);
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

    // Télécharger Certificat Médical PDF
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
            pdf.save(`Certificat_Consultation_${patientName.replace(/\s+/g, '_')}.pdf`);

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

    const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-base leading-relaxed print:bg-white print:text-black print:border-gray-300 print:py-1 print:px-2 print:w-[calc(100%-11rem)] print:inline-block print:align-middle";
    const labelClass = "block text-sm font-bold text-blue-300 mb-1.5 print:text-black print:mb-0 print:font-bold print:w-40 print:inline-block print:align-middle";
    const sectionTitleClass = "text-base font-bold text-blue-300 mb-3 pb-2 border-b border-blue-400/40 bg-white/5 p-2 rounded print:text-black print:bg-gray-100 print:px-2 print:py-1 print:border print:border-gray-400 print:mb-2 print:mt-2";
    const checkboxClass = "w-5 h-5 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500";

    // Condition pour afficher une section
    const shouldShow = (tab: TabType) => {
        if (showAllForPrint) {
            if (isPrintingReport) {
                return reportSections.includes(tab);
            }
            if (isPrintingExam) {
                // Fiche d'examen = identification, examen, et schéma
                return tab === "identification" || tab === "examen" || tab === "schema";
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

                // Redimensionner le canvas pour correspondre à l'image tout en gardant une taille max
                const maxWidth = 800; // Taille max raisonnable
                let targetWidth = img.width;
                let targetHeight = img.height;

                if (targetWidth > maxWidth) {
                    targetHeight = (maxWidth / targetWidth) * targetHeight;
                    targetWidth = maxWidth;
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // Remplir avec fond blanc puis dessiner l'image
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
        e.preventDefault();
        if (!isEditing) return;
        const canvas = schemaCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        setSchemaHasContent(true);
        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

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
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

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
        <PersistentForm patientId={patientId} formType="consultation" initialData={patientData?.rapport_medical || ""} className="space-y-6 print:bg-white print:text-black">
            <FormLockBanner
                patientId={patientId}
                patientStatus={patientData?.status}
                canEdit={canEdit}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                label="formulaire"
            />

            {/* Onglets de navigation */}
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
                        Certificat médical
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
                title="Imprimer/Télécharger le certificat médical"
            />

            <div ref={formRef}>
                {/* ═══ FICHE EXAMEN PRINT VIEW (paper form, hidden on screen) ═══ */}
                {isPrintingExam && examPrintData && (
                    <FicheExamenPrint
                        data={examPrintData}
                        schemaCanvas={schemaCanvasRef.current}
                        schemaHasContent={schemaHasContent}
                    />
                )}

                <fieldset disabled={!isEditing} className={`contents group ${isPrintingExam ? 'fiche-hide-regular' : ''}`}>
                    {/* En-tête professionnel partagé */}
                    {!shouldShow("rapport") && !isPrintingExam && (
                        <PrintHeader
                            title={isPrintingExam ? "FICHE D'EXAMEN MÉDICAL" : "CERTIFICAT MÉDICAL INITIAL"}
                            unitName="UNITÉ DE CONSULTATION MÉDICO-LÉGALE"
                        />
                    )}

                    {/* PAGE 1: IDENTIFICATION & ALLÉGATIONS */}
                    <div style={{ display: shouldShow("identification") ? 'block' : 'none' }}>
                        <div className="space-y-6 print-section">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">1</span>
                                Identification & Allégations
                            </h3>

                            <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-gray-300">
                                {/* Section Identification */}
                                <h4 className={sectionTitleClass}>Identification du Patient</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="md:col-span-2 flex gap-4">
                                        <div className="w-32">
                                            <label className={labelClass}>NUMÉRO</label>
                                            <input type="text" className={inputClass} placeholder="" defaultValue={patientData?.numero_dossier || ""} />
                                        </div>
                                        <div className="flex-1">
                                            <label className={labelClass}>Date d&apos;examen</label>
                                            <input type="date" className={inputClass} defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                    </div>
                                    <div><label className={labelClass}>Nom et Prénom</label><input type="text" placeholder="" defaultValue={patientName} className={inputClass} /></div>
                                    <div><label className={labelClass}>Date et lieu de naissance</label><input type="text" placeholder="" defaultValue={`${patientData?.date_naissance || ""} ${patientData?.lieu_naissance ? `à ${patientData.lieu_naissance}` : ""}`.trim()} className={inputClass} /></div>
                                    <div><label className={labelClass}>État civil</label><select defaultValue={patientData?.situation || ""} className={inputClass}>
                                        <option value="" className="bg-gray-800 text-white">Sélectionner...</option>
                                        <option value="Célibataire" className="bg-gray-800 text-white">Célibataire</option>
                                        <option value="Marié(e)" className="bg-gray-800 text-white">Marié(e)</option>
                                        <option value="Divorcé(e)" className="bg-gray-800 text-white">Divorcé(e)</option>
                                        <option value="Veuf/Veuve" className="bg-gray-800 text-white">Veuf/Veuve</option>
                                    </select></div>
                                    <div><label className={labelClass}>Profession</label><input type="text" placeholder="" defaultValue={patientData?.profession || ""} className={inputClass} /></div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Adresse</label>
                                        <input type="text" className={inputClass} placeholder="" />
                                    </div>
                                    <div><label className={labelClass}>N° C.I.N.</label><input type="text" placeholder="" className={inputClass} /></div>
                                    <div><label className={labelClass}>Tuteur légal (Mineur)</label><input type="text" placeholder="" className={inputClass} /></div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Autorités Requérantes</label>
                                        <input type="text" className={inputClass} placeholder="" defaultValue={patientData?.autorite_requerante || ""} />
                                    </div>
                                </div>

                                {/* Section Allégations */}
                                <h4 className={sectionTitleClass}>Allégations</h4>

                                <div className="space-y-4 mb-6">
                                    <div><label className={labelClass}>Date et heures des faits</label><input type="text" placeholder="" className={inputClass} /></div>

                                    <div><label className={labelClass}>Nature des faits</label>

                                        {/* Ligne 1: CBI avec ses sous-options */}
                                        <div className="flex flex-wrap items-center gap-4 mt-2 p-3 bg-white/5 rounded-lg border border-white/10 print:bg-transparent print:border-gray-300">
                                            <label className="flex items-center gap-2 text-gray-300 print:text-black">
                                                <input
                                                    type="checkbox"
                                                    className={checkboxClass}
                                                    checked={isCBIChecked}
                                                    onChange={(e) => setIsCBIChecked(e.target.checked)}
                                                />
                                                <span className="text-sm font-medium">CBI (Coups et Blessures Involontaires)</span>
                                            </label>
                                            <span className="text-gray-500 print:text-black">:</span>
                                            <label className={`flex items-center gap-2 ${isCBIChecked ? 'text-gray-300' : 'text-gray-500 opacity-50'} print:text-black print:opacity-100`}>
                                                <input
                                                    type="radio"
                                                    name="cbi_type"
                                                    className={checkboxClass}
                                                    disabled={!isCBIChecked}
                                                    required={isCBIChecked}
                                                />
                                                <span className="text-sm">ADC (Accident de Circulation)</span>
                                            </label>
                                            <label className={`flex items-center gap-2 ${isCBIChecked ? 'text-gray-300' : 'text-gray-500 opacity-50'} print:text-black print:opacity-100`}>
                                                <input
                                                    type="radio"
                                                    name="cbi_type"
                                                    className={checkboxClass}
                                                    disabled={!isCBIChecked}
                                                    required={isCBIChecked}
                                                />
                                                <span className="text-sm">AVP (Accident de la Voie Publique)</span>
                                            </label>
                                            <label className={`flex items-center gap-2 ${isCBIChecked ? 'text-gray-300' : 'text-gray-500 opacity-50'} print:text-black print:opacity-100`}>
                                                <input
                                                    type="radio"
                                                    name="cbi_type"
                                                    className={checkboxClass}
                                                    disabled={!isCBIChecked}
                                                    required={isCBIChecked}
                                                />
                                                <span className="text-sm">Autres</span>
                                            </label>
                                        </div>

                                        {/* Ligne 2: CBV séparé */}
                                        <div className="flex items-center gap-4 mt-2 p-3 bg-white/5 rounded-lg border border-white/10 print:bg-transparent print:border-gray-300">
                                            <label className="flex items-center gap-2 text-gray-300 print:text-black">
                                                <input type="checkbox" name="is_cbv" className={checkboxClass} />
                                                <span className="text-sm font-medium">CBV (Coups et Blessures Volontaires)</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Objet</label>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <label className="flex items-center gap-2 text-gray-300 print:text-black">
                                                <input type="checkbox" className={checkboxClass} />
                                                <span className="text-sm">Contondant</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-gray-300 print:text-black">
                                                <input type="checkbox" className={checkboxClass} />
                                                <span className="text-sm">Tranchant</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-gray-300 print:text-black">
                                                <input type="checkbox" className={checkboxClass} />
                                                <span className="text-sm">Autres</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Auteur</label>
                                        <select name="auteur_agression" className={inputClass} defaultValue="">
                                            <option value="" className="bg-gray-800 text-white">Sélectionner...</option>
                                            <option value="Voisin" className="bg-gray-800 text-white">Voisin</option>
                                            <option value="Cousin" className="bg-gray-800 text-white">Cousin</option>
                                            <option value="Conjoint" className="bg-gray-800 text-white">Conjoint</option>
                                            <option value="Parent" className="bg-gray-800 text-white">Parent</option>
                                            <option value="Frère/Sœur" className="bg-gray-800 text-white">Frère/Sœur</option>
                                            <option value="Inconnu" className="bg-gray-800 text-white">Inconnu</option>
                                            <option value="Autre" className="bg-gray-800 text-white">Autre</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Section Antécédents */}
                                <h4 className={sectionTitleClass}>Antécédents</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div><label className={labelClass}>Familiaux</label><textarea rows={2} placeholder="" className={inputClass} /></div>
                                    <div><label className={labelClass}>Personnels</label><textarea rows={2} placeholder="" className={inputClass} /></div>
                                </div>

                                {/* Payant / Gratuit */}
                                <div className="flex gap-6 pt-4 border-t border-white/10 print:border-gray-300">
                                    <label className="flex items-center gap-2 text-gray-300 print:text-black">
                                        <input type="radio" name="paiement" className={checkboxClass} />
                                        <span className="text-sm font-medium">Payant</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-gray-300 print:text-black">
                                        <input type="radio" name="paiement" className={checkboxClass} />
                                        <span className="text-sm font-medium">Gratuit</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div >

                    {/* PAGE 2: EXAMEN MÉDICAL */}
                    < div style={{ display: shouldShow("examen") ? 'block' : 'none' }
                    }>
                        <div className="space-y-6 print-section">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">2</span>
                                Examen Médical
                            </h3>

                            <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-gray-300">
                                <div className="space-y-6 print:space-y-2">
                                    <div>
                                        <h4 className={sectionTitleClass}>Examen Médical</h4>
                                        <textarea
                                            rows={8}
                                            className={inputClass}
                                            placeholder=""
                                        />
                                    </div>

                                    <div>
                                        <h4 className={sectionTitleClass}>Examens Complémentaires</h4>
                                        <textarea
                                            rows={4}
                                            className={inputClass}
                                            placeholder=""
                                        />
                                    </div>

                                    <div className="border-2 border-blue-600 rounded-lg p-4 print:border-black print:border-2">
                                        <h4 className={sectionTitleClass}>Conclusion</h4>
                                        <textarea
                                            rows={4}
                                            className={`${inputClass} font-bold`}
                                            placeholder=""
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className={sectionTitleClass}>Incapacité Temporaire Totale de Travail - I.T.T. (jours)</h4>
                                            <div className="text-lg font-bold text-white flex items-center gap-2">
                                                <input type="number" name="itt_jours" className={`${inputClass} w-24`} placeholder="" />
                                                <span className="text-gray-300 print:text-black">jours</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 print:border-gray-300">
                                        <h4 className={sectionTitleClass}>Le Médecin</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Nom du médecin</label><input type="text" placeholder="" className={inputClass} /></div>
                                            <div><label className={labelClass}>Date</label><input type="date" className={inputClass} /></div>
                                        </div>
                                        <div className="mt-4 h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-gray-400 print:border-gray-400">
                                            Signature et cachet
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >

                    {/* PAGE 3: CERTIFICAT MÉDICAL (RAPPORT) */}
                    < div style={{ display: shouldShow("rapport") ? 'block' : 'none' }}>
                        <div className="print-container bg-white/5 text-white print:bg-white print:text-black border border-white/10 print:border-none rounded-xl print:rounded-none p-6 print:p-0 relative shadow-none print:shadow-none">
                            <PrintHeader
                                title="CERTIFICAT MÉDICAL INITIAL DE CONSTATATION DE COUPS ET BLESSURES"
                                showDate={true}
                            />

                            <div className="space-y-3 text-[11pt] leading-relaxed mt-4 print:mt-0">
                                <section>
                                    <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                        <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Préambule</h3>
                                    </div>
                                    <div className="space-y-0 pl-2">
                                        <div className="flex"><span className="w-[180px] shrink-0">– Réquisition de :</span><input type="text" className={inputClass} defaultValue="" /></div>
                                        <div className="flex"><span className="w-[180px] shrink-0">– Date de la réquisition :</span><input type="date" className={`${inputClass} w-auto`} defaultValue="" /></div>
                                        <div className="flex"><span className="w-[180px] shrink-0">– Examen de :</span><input type="text" className={inputClass} defaultValue={patientName} /></div>
                                        <div className="flex items-center gap-2"><span className="w-[180px] shrink-0">– Date de naissance :</span><input type="date" className={`${inputClass} w-auto`} defaultValue={patientData?.date_naissance || ""} /></div>
                                        <div className="flex items-center gap-2"><span className="w-[180px] shrink-0">– Lieu de naissance :</span><input type="text" className={inputClass} defaultValue={patientData?.lieu_naissance || ""} /></div>
                                    </div>
                                </section>

                                <section>
                                    <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                        <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Mission</h3>
                                    </div>
                                    <div className="pl-2">
                                        <textarea rows={1} defaultValue="" className={`${inputClass} overflow-hidden resize-none translate-y-[2px]`} />
                                    </div>
                                </section>

                                <section>
                                    <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                        <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Examen médical</h3>
                                    </div>
                                    <div className="space-y-0 pl-2">
                                        <div className="flex"><span className="w-[180px] shrink-0">– Date de l'examen :</span><input type="date" className={`${inputClass} w-auto`} defaultValue="" /></div>
                                        <div className="flex"><span className="w-[180px] shrink-0">– Doléances :</span><input type="text" className={inputClass} defaultValue="" /></div>
                                        <div className="flex"><span className="w-[180px] shrink-0">– Antécédents :</span><input type="text" className={inputClass} defaultValue="" /></div>
                                        <div className="flex"><span className="w-[180px] shrink-0">– Etat général :</span><input type="text" className={inputClass} defaultValue="" /></div>
                                        <div className="mt-0">
                                            <span>– Examen clinique :</span>
                                            <div className="pl-8 space-y-0">
                                                <div className="flex items-center"><span className="mr-2">▪</span><span className="w-[120px] shrink-0">Inspection :</span><input type="text" className={inputClass} defaultValue="" /></div>
                                                <div className="flex items-center"><span className="mr-2">▪</span><span className="w-[120px] shrink-0">Palpation :</span><input type="text" className={inputClass} defaultValue="" /></div>
                                            </div>
                                        </div>
                                        <div className="flex"><span className="w-[220px] shrink-0">– Reste de l'examen médical :</span><input type="text" className={inputClass} defaultValue="" /></div>
                                    </div>
                                </section>

                                <section>
                                    <div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                        <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Conclusion</h3>
                                    </div>
                                    <div className="pl-2">
                                        <div className="flex flex-wrap items-baseline gap-1">
                                            <span>L'examen médical de</span>
                                            <input type="text" className={`${inputClass} w-auto flex-1 min-w-[200px]`} defaultValue="" />
                                        </div>
                                    </div>
                                    <div className="mt-6 text-right pr-12">
                                        <span className="font-bold underline underline-offset-2">Médecin légiste</span>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div >

                    {/* PAGE 4: SCHÉMA GÉNÉRIQUE */}
                    <div className="print:break-before-page" style={{ display: shouldShow("schema") && (schemaHasContent || !showAllForPrint) ? 'block' : 'none' }}>
                        <div className="space-y-6 print-section mt-8">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black mt-8">
                                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">3</span>
                                Schéma Lésionnel
                            </h3>

                            <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-gray-300">
                                {/* Contrôles de dessin (masqués à l'impression) */}
                                <div className="flex flex-wrap gap-4 mb-4 no-print items-center">
                                    {/* Upload de l'image */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Importer une image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="w-px h-8 bg-white/20 mx-2"></div>
                                    {/* Couleur du trait */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Couleur</label>
                                        <input
                                            type="color"
                                            value={brushColor}
                                            onChange={(e) => setBrushColor(e.target.value)}
                                            className="h-8 w-12 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    {/* Taille du trait */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-500 mb-1">Épaisseur ({brushSize}px)</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                            className="w-32 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {patientData?.status !== 'termine' && patientData?.status !== 'demande_modification' && isEditing && (
                                            <button
                                                onClick={() => {
                                                    if (confirm("Voulez-vous valider et terminer ce dossier ? Il sera verrouillé.")) {
                                                        handleStatusUpdate('termine');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                                            >
                                                ✅ Valider & Terminer
                                            </button>
                                        )}


                                        <button onClick={handlePrintExam} className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-all">
                                            Imprimer l&apos;Examen
                                        </button>
                                        <button onClick={handleDownloadExamPDF} className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-all">
                                            PDF Examen
                                        </button>
                                    </div>
                                    <div className="flex-1"></div>
                                    {/* Bouton Effacer */}
                                    <button
                                        onClick={clearCanvas}
                                        type="button"
                                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Tout effacer
                                    </button>
                                </div>

                                <p className="text-xs text-gray-400 mb-4 no-print italic">
                                    S'il n'y a pas d'image, le dessin se fera sur un fond blanc.
                                </p>

                                <div className="flex justify-center bg-gray-100 rounded-lg p-4 overflow-hidden print:p-0 print:bg-transparent min-h-[300px]">
                                    <div className={`w-full justify-center ${showAllForPrint ? 'hidden' : 'flex'} print:hidden`}>
                                        <canvas
                                            ref={schemaCanvasRef}
                                            width={800} // Taille par défaut, sera modifiée lors de l'upload
                                            height={500}
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseOut={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchMove={draw}
                                            onTouchEnd={stopDrawing}
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

                    {/* Signature Area — only for non-exam prints */}
                    {!shouldShow("rapport") && !isPrintingExam && (
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
                    )}

                    {/* Pied de page impression — only for non-exam prints */}
                    {!shouldShow("rapport") && !isPrintingExam && (
                        <div className="footer-print hidden print:block" >
                            <p>SERVICE DE MÉDECINE LÉGALE C.H.U. TLEMCEN | Bvd MOHAMMED V - 13000 TLEMCEN</p>
                            <p>Tel: 043 20-10-30 (poste 2223 / 2202) | Fax: 043 20-14-14</p>
                        </div >
                    )}
                </fieldset>
            </div >
        </PersistentForm >
    );
}
