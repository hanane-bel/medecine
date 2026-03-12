"use client";

import React from "react";

export interface ExamPrintData {
    numero: string;
    dateExamen: string;
    nomPrenom: string;
    dateNaissance: string;
    lieuNaissance: string;
    etatCivil: string;
    profession: string;
    adresse: string;
    cin: string;
    tuteur: string;
    autoritesRequerantes: string;
    enDate: string;
    dateFaits: string;
    isCBI: boolean;
    isCBV: boolean;
    isADC: boolean;
    isAVP: boolean;
    isAutresNature: boolean;
    isContondant: boolean;
    isTranchant: boolean;
    isAutresObjet: boolean;
    auteur: string;
    familiaux: string;
    personnels: string;
    examenMedical: string;
    examensComplementaires: string;
    conclusion: string;
    ittJours: string;
    payant: string;
    gratuit: string;
}

interface FicheExamenPrintProps {
    data: ExamPrintData;
    schemaCanvas?: HTMLCanvasElement | null;
    schemaHasContent?: boolean;
}

export default function FicheExamenPrint({ data, schemaCanvas, schemaHasContent }: FicheExamenPrintProps) {
    return (
        <div className="fep-wrapper">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

                .fep-wrapper {
                    background: #fff;
                    font-family: 'Libre Baskerville', Georgia, serif;
                    color: #1a1a1a;
                }

                .fep-sheet {
                    background: #fff;
                    width: 100%;
                    border: 1.5px solid #2a2a2a;
                    position: relative;
                }

                .fep-numero-sidebar {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 28px;
                    border-right: 1.5px solid #2a2a2a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .fep-numero-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    font-size: 9px;
                    letter-spacing: 3px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #2a2a2a;
                }

                .fep-body {
                    margin-left: 28px;
                }

                /* Header */
                .fep-header {
                    padding: 14px 20px 12px;
                    border-bottom: 1.5px solid #2a2a2a;
                }

                .fep-header-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }

                .fep-logo {
                    width: 48px;
                    height: 48px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .fep-logo svg {
                    width: 44px;
                    height: 44px;
                }

                .fep-header-center {
                    flex: 1;
                    text-align: center;
                }

                .fep-arabic {
                    font-size: 11px;
                    font-weight: 700;
                    color: #1a1a1a;
                    line-height: 1.6;
                    direction: rtl;
                    margin-bottom: 4px;
                }

                .fep-institution {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    color: #1a1a1a;
                    line-height: 1.5;
                }

                .fep-unit {
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    margin-top: 4px;
                    color: #1a1a1a;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                }

                .fep-location {
                    font-size: 10px;
                    margin-top: 6px;
                    color: #2a2a2a;
                    font-style: italic;
                }

                .fep-title {
                    text-align: center;
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    margin-top: 10px;
                    color: #1a1a1a;
                    padding-top: 8px;
                    border-top: 1px solid #2a2a2a;
                }

                /* Section */
                .fep-section {
                    padding: 12px 20px;
                    border-bottom: 1.5px solid #2a2a2a;
                }

                .fep-section-title {
                    text-align: center;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                    color: #1a1a1a;
                }

                /* Field row */
                .fep-field {
                    display: flex;
                    align-items: baseline;
                    margin-bottom: 9px;
                    gap: 8px;
                }

                .fep-field.double { gap: 20px; }

                .fep-label {
                    font-size: 10px;
                    font-weight: 700;
                    white-space: nowrap;
                    color: #2a2a2a;
                    min-width: fit-content;
                }

                .fep-value {
                    flex: 1;
                    border-bottom: 1px solid #2a2a2a;
                    font-family: 'Libre Baskerville', Georgia, serif;
                    font-size: 10px;
                    color: #1a1a1a;
                    padding: 2px 4px;
                    min-width: 40px;
                    min-height: 14px;
                }

                .fep-value.short { max-width: 90px; }

                /* Checkbox */
                .fep-cb-group {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                    margin-bottom: 9px;
                }

                .fep-cb-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 10px;
                    color: #2a2a2a;
                    font-weight: 700;
                }

                .fep-cb-box {
                    width: 13px;
                    height: 13px;
                    border: 1.5px solid #2a2a2a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    background: transparent;
                }

                .fep-cb-box.checked {
                    background: #2a2a2a;
                }

                .fep-cb-box.checked::after {
                    content: '✓';
                    color: #fff;
                    font-size: 9px;
                    font-weight: 700;
                    line-height: 1;
                }

                .fep-cb-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #2a2a2a;
                    margin-bottom: 5px;
                }

                /* Textarea */
                .fep-textarea {
                    width: 100%;
                    border: 1px solid #2a2a2a;
                    font-family: 'Libre Baskerville', Georgia, serif;
                    font-size: 10px;
                    color: #1a1a1a;
                    padding: 6px 8px;
                    line-height: 1.7;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .fep-textarea.tall { min-height: 140px; }
                .fep-textarea.medium { min-height: 90px; }

                /* Conclusion */
                .fep-conclusion {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    padding-top: 4px;
                }

                .fep-conclusion-label {
                    font-size: 10px;
                    font-weight: 700;
                    white-space: nowrap;
                    color: #2a2a2a;
                }

                .fep-conclusion-value {
                    flex: 1;
                    border-bottom: 1px solid #2a2a2a;
                    font-family: inherit;
                    font-size: 10px;
                    color: #1a1a1a;
                    padding: 2px 4px;
                    min-height: 14px;
                }

                /* Footer */
                .fep-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 20px;
                    border-top: 1.5px solid #2a2a2a;
                }

                .fep-footer-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .fep-footer-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #2a2a2a;
                }

                .fep-footer-box {
                    width: 50px;
                    border: 1px solid #2a2a2a;
                    font-size: 10px;
                    color: #1a1a1a;
                    padding: 3px 5px;
                    text-align: center;
                    min-height: 18px;
                }

                /* Medecin */
                .fep-medecin {
                    text-align: right;
                    padding: 12px 20px 16px;
                    font-size: 10px;
                    font-weight: 700;
                    font-style: italic;
                    color: #2a2a2a;
                }

                /* Schema page */
                .fep-schema-page {
                    margin-top: 20px;
                    border: 1.5px solid #2a2a2a;
                    padding: 20px;
                    background: #fff;
                }

                .fep-schema-title {
                    text-align: center;
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                    color: #1a1a1a;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                }

                .fep-schema-img {
                    text-align: center;
                }

                .fep-schema-img img {
                    max-width: 100%;
                    height: auto;
                }

                @media print {
                    .fep-wrapper { background: white; }
                    .fep-sheet { box-shadow: none; border: 1px solid #000; }
                    .fep-schema-page { page-break-before: always; }
                }
            `}</style>

            {/* ═══ PAGE 1: THE FORM ═══ */}
            <div className="fep-sheet">
                {/* Sidebar NUMERO */}
                <div className="fep-numero-sidebar">
                    <div className="fep-numero-text">
                        NUMERO
                    </div>
                </div>

                <div className="fep-body">
                    {/* Header */}
                    <div className="fep-header">
                        <div className="fep-header-top">
                            {/* Left logo */}
                            <div className="fep-logo">
                                <img src="/justice_symbol.svg" alt="Justice" />
                            </div>

                            {/* Center text */}
                            <div className="fep-header-center">
                                <div className="fep-arabic">
                                    المركز الاستشفائي الجامعي – تلمسان<br />
                                    مصلحة الطب الشرعي و قانون الطب و الأخلاقيات
                                </div>
                                <div className="fep-institution">
                                    Centre Hospitalier Universitaire - Tlemcen<br />
                                    Service de Médecine Légale, Droit Médical et Ethique
                                </div>
                                <div className="fep-unit">Unité de Consultation Médico-Légale</div>
                                <div className="fep-location">
                                    Tlemcen, le&nbsp;
                                    <strong>
                                        {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                                    </strong>
                                </div>
                            </div>

                            {/* Right logo */}
                            <div className="fep-logo">
                                <img src="/logo_converted.svg" alt="CHU Tlemcen" />
                            </div>
                        </div>

                        <div className="fep-title">Fiche d&apos;Examen Médical</div>
                    </div>

                    {/* Identity section */}
                    <div className="fep-section">
                        <div className="fep-field">
                            <span className="fep-label">Date d&apos;examen :</span>
                            <span className="fep-value">{data.dateExamen}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">Nom et Prénom :</span>
                            <span className="fep-value">{data.nomPrenom}</span>
                        </div>
                        <div className="fep-field double">
                            <span className="fep-label">Date et lieu de naissance :</span>
                            <span className="fep-value short">{data.dateNaissance}</span>
                            <span className="fep-value">{data.lieuNaissance}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">Etat civil :</span>
                            <span className="fep-value">{data.etatCivil}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">Profession :</span>
                            <span className="fep-value">{data.profession}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">Adresse :</span>
                            <span className="fep-value">{data.adresse}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">N° C.I.N. :</span>
                            <span className="fep-value">{data.cin}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">Tuteur légal (Mineur) :</span>
                            <span className="fep-value">{data.tuteur}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">Autorités Requérantes :</span>
                            <span className="fep-value">{data.autoritesRequerantes}</span>
                            <span className="fep-label" style={{ marginLeft: 12 }}>en date :</span>
                            <span className="fep-value short">{data.enDate}</span>
                        </div>
                    </div>

                    {/* Allégations */}
                    <div className="fep-section">
                        <div className="fep-section-title">Allégations</div>
                        <div className="fep-field">
                            <span className="fep-label">Date et heures des faits :</span>
                            <span className="fep-value">{data.dateFaits}</span>
                        </div>

                        <div style={{ marginBottom: 9 }}>
                            <div className="fep-cb-label">Nature des faits :</div>
                            <div className="fep-cb-group">
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isCBI ? 'checked' : ''}`} />
                                    CBI
                                </span>
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isCBV ? 'checked' : ''}`} />
                                    CBV
                                </span>
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isADC ? 'checked' : ''}`} />
                                    ADC
                                </span>
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isAVP ? 'checked' : ''}`} />
                                    AVP
                                </span>
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isAutresNature ? 'checked' : ''}`} />
                                    Autres
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: 9 }}>
                            <div className="fep-cb-label">Objet :</div>
                            <div className="fep-cb-group">
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isContondant ? 'checked' : ''}`} />
                                    Contondant
                                </span>
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isTranchant ? 'checked' : ''}`} />
                                    Tranchant
                                </span>
                                <span className="fep-cb-item">
                                    <div className={`fep-cb-box ${data.isAutresObjet ? 'checked' : ''}`} />
                                    Autres
                                </span>
                            </div>
                        </div>

                        <div className="fep-field">
                            <span className="fep-label">Auteur :</span>
                            <span className="fep-value">{data.auteur}</span>
                        </div>
                    </div>

                    {/* Antécédents */}
                    <div className="fep-section">
                        <div className="fep-section-title">Antécédents</div>
                        <div className="fep-field">
                            <span className="fep-label">Familiaux :</span>
                            <span className="fep-value">{data.familiaux}</span>
                        </div>
                        <div className="fep-field">
                            <span className="fep-label">Personnels :</span>
                            <span className="fep-value">{data.personnels}</span>
                        </div>
                    </div>

                    {/* Examen Médical */}
                    <div className="fep-section">
                        <div className="fep-section-title">Examen Médical</div>
                        <div className="fep-textarea tall">{data.examenMedical}</div>
                    </div>

                    {/* Examens Complémentaires */}
                    <div className="fep-section">
                        <div className="fep-section-title">Examens Complémentaires</div>
                        <div className="fep-textarea medium">{data.examensComplementaires}</div>
                    </div>

                    {/* Conclusion */}
                    <div className="fep-section">
                        <div className="fep-section-title">Conclusion</div>
                        <div className="fep-conclusion">
                            <span className="fep-conclusion-label">Incapacité Temporaire Total de Travail (I.T.T) de</span>
                            <span className="fep-conclusion-value">{data.ittJours ? `${data.ittJours} jours` : ''}</span>
                        </div>
                    </div>

                    {/* Médecin */}
                    <div className="fep-medecin">Le Médecin,</div>

                    {/* Footer */}
                    <div className="fep-footer">
                        <div className="fep-footer-item">
                            <span className="fep-footer-label">Payant</span>
                            <div className="fep-footer-box">{data.payant}</div>
                        </div>
                        <div className="fep-footer-item">
                            <span className="fep-footer-label">Gratuit</span>
                            <div className="fep-footer-box">{data.gratuit}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ PAGE 2: SCHEMA (if content exists) ═══ */}
            {schemaHasContent && schemaCanvas && (
                <div className="fep-schema-page">
                    <div className="fep-schema-title">Schéma Lésionnel</div>
                    <div className="fep-schema-img">
                        <img src={schemaCanvas.toDataURL('image/png')} alt="Schéma lésionnel" />
                    </div>
                </div>
            )}
        </div>
    );
}
