"use client";

import { useState, useRef } from "react";
import PersistentForm from "./PersistentForm";
import PrintHeader from "./PrintHeader";
import { getCurrentUser } from "../../lib/api";
import FormLockBanner from "./FormLockBanner";
import { Patient } from "../../store/patientStore";

interface CorpsEnDepotsFormProps {
    patientId: string;
    patientName: string;
    patientData?: Patient;
}

export default function CorpsEnDepotsForm({ patientId, patientName, patientData }: CorpsEnDepotsFormProps) {
    const [isBebe, setIsBebe] = useState(false);
    const [showAllForPrint, setShowAllForPrint] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    // Permission state
    const [isEditing, setIsEditing] = useState(false);
    const currentUser = getCurrentUser();
    const isChef = currentUser?.role === "chef_service";
    const isOwner = patientData?.created_by === currentUser?.id || patientData?.medecin_traitant === currentUser?.id;
    const canEdit = !!currentUser;

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

    const handlePrint = async () => {
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
        }, 500);
    };

    const handleDownloadExamPDF = async () => {
        if (!formRef.current) return;
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
            pdf.save(`Rapport_Examen_Corps_${patientName.replace(/\s+/g, '_')}.pdf`);
        } catch (error: any) {
            console.error("PDF Generation Error (Exam):", error);
            alert("Erreur lors de la génération du PDF: " + (error?.message || error));
        } finally {
            formRef.current.classList.remove("pdf-mode");
            showAllFields();
            resetTextareas();
            setShowAllForPrint(false);
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

    const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-base print:bg-white print:text-black print:border-transparent";
    const labelClass = "block text-sm font-bold text-blue-300 mb-1.5 print:text-black";
    const sectionTitleClass = "text-base font-bold text-blue-300 mb-3 pb-2 border-b border-blue-400/40 print:text-black print:border-transparent";

    return (
        <PersistentForm
            patientId={patientId}
            formType="corps_en_depots"
            className="space-y-6 print:space-y-2"
            initialData={patientData?.rapport_medical || ""}
        >
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
                        margin-bottom: 5px;
                        border: none;
                    }
                    input, textarea, select {
                        background: transparent !important;
                        color: black !important;
                        border: none !important;
                        border-color: transparent !important;
                        box-shadow: none !important;
                        border-radius: 0;
                        padding: 0px 2px;
                        font-size: 11pt;
                    }
                    label {
                        color: black;
                        font-weight: bold;
                    }
                    h3, h4 {
                        background-color: #d1d5db !important;
                        color: black !important;
                        padding: 2px 4px !important;
                        margin-top: 2px !important;
                        margin-bottom: 2px !important;
                        font-size: 11pt !important;
                        line-height: 1.2 !important;
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

            {/* Contrôles - masqués à l'impression */}
            <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-white/10 no-print">
                {/* Toggle Bébé / Adulte */}
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                    <span className="text-sm text-gray-300 font-medium">Type :</span>
                    <button
                        type="button"
                        onClick={() => setIsBebe(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isBebe ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                    >
                        👤 Adulte
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsBebe(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isBebe ? "bg-pink-600 text-white shadow-lg" : "bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                    >
                        👶 Nouveau-né / Bébé
                    </button>
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimer le rapport
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
            </div>

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
                    title="RAPPORT D'EXAMEN DE CORPS"
                    unitName="UNITÉ DE THANATOLOGIE"
                />

                <fieldset disabled={!isEditing} className="contents group">
                    {/* ==================== EN-TÊTE ÉCRAN ==================== */}
                    <div className="print:hidden mb-6">
                        <div className="text-center mb-4 pb-4 border-b border-white/10">
                            <p className="text-xs text-gray-400">المركز الاستشفائي الجامعي - تلمسان</p>
                            <p className="text-sm font-bold text-white">CENTRE HOSPITALIER UNIVERSITAIRE - TLEMCEN</p>
                            <p className="text-xs text-gray-400">مصلحة الطب الشرعي و قانون الطب والأخلاقيات</p>
                            <p className="text-xs text-gray-300">SERVICE DE MEDECINE LEGALE, DROIT MEDICAL ET ETHIQUE</p>
                            <h2 className="text-lg font-bold text-blue-400 mt-4">RAPPORT MEDICO-LEGAL</h2>
                            {isBebe && (
                                <span className="inline-block mt-2 px-3 py-1 bg-pink-600/20 border border-pink-500/30 rounded-full text-pink-300 text-xs font-medium">
                                    👶 Mode Nouveau-né / Bébé
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ==================== SECTION 1: PRÉAMBULE ==================== */}
                    <div className="space-y-6 print:space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">1</span>
                            Préambule
                        </h3>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-transparent">
                            <div className="preambule-text text-sm text-gray-300 print:text-black leading-relaxed space-y-3 p-4">
                                {isBebe ? (
                                    <>
                                        <p className="flex items-start gap-2">
                                            <span className="font-medium">–</span>
                                            <span>Cadavre du nouveau né de sexe <input type="text" className={`${inputClass} inline-block w-32`} placeholder="" /></span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="font-medium">–</span>
                                            <span>Date et lieu de naissance : <input type="text" className={`${inputClass} inline-block w-64`} placeholder="" defaultValue={`${patientData?.date_naissance || ""} ${patientData?.lieu_naissance ? 'à ' + patientData.lieu_naissance : ""}`.trim()} /></span>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="flex items-start gap-2">
                                            <span className="font-medium">–</span>
                                            <span>Cadavre du nommé <input type="text" className={`${inputClass} inline-block w-64`} placeholder="" defaultValue={patientName} /></span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="font-medium">–</span>
                                            <span>Date et lieu de naissance : <input type="text" className={`${inputClass} inline-block w-64`} placeholder="" defaultValue={`${patientData?.date_naissance || ""} ${patientData?.lieu_naissance ? 'à ' + patientData.lieu_naissance : ""}`.trim()} /></span>
                                        </p>
                                    </>
                                )}
                                <p className="flex items-start gap-2">
                                    <span className="font-medium">–</span>
                                    <span>Date du décès : le <input type="text" className={`${inputClass} inline-block w-48`} placeholder="" /></span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="font-medium">–</span>
                                    <span>Date du dépôt au service de médecine légale du CHU Tlemcen : le <input type="text" className={`${inputClass} inline-block w-48`} placeholder="" /></span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="font-medium">–</span>
                                    <span>Réquisition : <input type="text" className={`${inputClass} inline-block w-full max-w-lg`} placeholder="" /></span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ==================== SECTION 2: COMMÉMORATIFS ==================== */}
                    <div className="space-y-6 print:space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">2</span>
                            Commémoratifs
                        </h3>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-transparent">
                            {isBebe ? (
                                <textarea
                                    rows={4}
                                    className={inputClass}
                                    placeholder=""
                                />
                            ) : (
                                <textarea
                                    rows={8}
                                    className={inputClass}
                                    placeholder=""
                                />
                            )}
                        </div>
                    </div>

                    {/* ==================== SECTION 3: EXAMEN DU CORPS ==================== */}
                    <div className="space-y-6 print:space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">3</span>
                            Examen du corps <span className="text-sm font-normal text-gray-400 print:text-gray-600">: au service de médecine légale CHU Tlemcen</span>
                        </h3>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-transparent space-y-6">
                            {/* Date d'examen */}
                            <div><label className={labelClass}>Date de l&apos;examen au service</label><input type="text" placeholder="" /></div>

                            {/* Effets vestimentaires */}
                            <div>
                                <h4 className={sectionTitleClass}>Effets vestimentaires</h4>
                                <textarea
                                    rows={2}
                                    className={inputClass}
                                    placeholder=""
                                />
                            </div>

                            {/* Phénomènes cadavériques */}
                            <div>
                                <h4 className={sectionTitleClass}>Phénomènes cadavériques</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {!isBebe && (
                                        <div><label className={labelClass}>Corps</label><input type="text" placeholder="" /></div>
                                    )}
                                    <div><label className={labelClass}>Rigidités</label><input type="text" placeholder="" /></div>
                                    <div><label className={labelClass}>Lividités</label><input type="text" placeholder="" /></div>
                                </div>
                            </div>

                            {/* Examen du corps */}
                            <div>
                                <h4 className={sectionTitleClass}>Examen du corps</h4>

                                {/* Section spécifique bébé: Corpulence */}
                                {isBebe && (
                                    <div className="mb-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                                        <h5 className="text-xs font-bold text-pink-300 mb-3 print:text-black">Corpulence</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div><label className={labelClass}>Taille</label>
                                                <div className="text-lg font-bold text-white flex items-center gap-2">
                                                    <input type="text" className={inputClass} placeholder="" />
                                                    <span className="text-gray-300 text-sm print:text-black">cm</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Poids</label>
                                                <div className="text-lg font-bold text-white flex items-center gap-2">
                                                    <input type="text" className={inputClass} placeholder="" />
                                                    <span className="text-gray-300 text-sm print:text-black">grammes</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Périmètre crânien</label>
                                                <div className="text-lg font-bold text-white flex items-center gap-2">
                                                    <input type="text" className={inputClass} placeholder="" />
                                                    <span className="text-gray-300 text-sm print:text-black">cm</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className={labelClass}>Grossesse estimée</label><input type="text" placeholder="" /></div>
                                    </div>
                                )}

                                {/* Inspection */}
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 mb-2 print:text-black">Inspection</h5>
                                    <textarea
                                        rows={4}
                                        className={inputClass}
                                        placeholder=""
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==================== SECTION 4: CONCLUSION ==================== */}
                    <div className="space-y-6 print:space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">4</span>
                            Conclusion
                        </h3>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-transparent">
                            <textarea
                                rows={4}
                                className={inputClass}
                                placeholder=""
                            />
                        </div>
                    </div>

                    {/* ==================== SECTION 5: SIGNATURE ==================== */}
                    <div className="space-y-6 print:space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm print:bg-gray-200">5</span>
                            Le Médecin
                        </h3>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 print:bg-white print:border-transparent">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className={labelClass}>Docteur</label><input type="text" placeholder="" /></div>
                                <div><label className={labelClass}>Date</label><input type="date" /></div>
                            </div>
                            <div className="mt-4 h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-gray-400 print:border-transparent">
                                Signature et cachet
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
