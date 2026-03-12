import { useState } from "react";

type FormData = {
  dateExamen: string;
  nomPrenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  etatCivil: string;
  profession: string;
  adresse: string;
  numeroCIN: string;
  tuteurLegal: string;
  autoritesRequerantes: string;
  enDate: string;
  // Allégations
  dateHeuresFaits: string;
  natureFaits: {
    CBI: boolean;
    ADC: boolean;
    AVP: boolean;
    autres: boolean;
    CBV: boolean;
  };
  objet: {
    contondant: boolean;
    tranchant: boolean;
    autres: boolean;
  };
  auteur: string;
  // Antécédents
  familiaux: string;
  personnels: string;
  // Examen Médical
  examenMedical: string;
  // Examens Complémentaires
  examensComplementaires: string;
  // Conclusion
  ITT: string;
  // Payment
  payant: string;
  gratuit: string;
};

const initialData: FormData = {
  dateExamen: "",
  nomPrenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  etatCivil: "",
  profession: "",
  adresse: "",
  numeroCIN: "",
  tuteurLegal: "",
  autoritesRequerantes: "",
  enDate: "",
  dateHeuresFaits: "",
  natureFaits: { CBI: false, ADC: false, AVP: false, autres: false, CBV: false },
  objet: { contondant: false, tranchant: false, autres: false },
  auteur: "",
  familiaux: "",
  personnels: "",
  examenMedical: "",
  examensComplementaires: "",
  ITT: "",
  payant: "",
  gratuit: "",
};

export default function FicheExamenMedical() {
  const [form, setForm] = useState<FormData>(initialData);

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleNature = (key: keyof FormData["natureFaits"]) =>
    setForm((prev) => ({
      ...prev,
      natureFaits: { ...prev.natureFaits, [key]: !prev.natureFaits[key] },
    }));

  const toggleObjet = (key: keyof FormData["objet"]) =>
    setForm((prev) => ({
      ...prev,
      objet: { ...prev.objet, [key]: !prev.objet[key] },
    }));

  const handlePrint = () => window.print();

  return (
    <div className="page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #e8e0d4; }

        .page-wrapper {
          min-height: 100vh;
          background: #e8e0d4;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 32px 16px;
          font-family: 'Libre Baskerville', Georgia, serif;
        }

        .form-sheet {
          background: #faf8f4;
          width: 100%;
          max-width: 680px;
          border: 1.5px solid #2a2a2a;
          box-shadow: 4px 4px 0px #2a2a2a, 8px 8px 0px rgba(0,0,0,0.12);
          position: relative;
        }

        .numero-sidebar {
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

        .numero-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 9px;
          letter-spacing: 3px;
          font-weight: 700;
          text-transform: uppercase;
          color: #2a2a2a;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .numero-input {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          width: 16px;
          background: transparent;
          border: none;
          border-bottom: 1px solid #2a2a2a;
          font-family: inherit;
          font-size: 9px;
          color: #2a2a2a;
          outline: none;
          padding: 2px 0;
        }

        .form-body {
          margin-left: 28px;
        }

        /* Header */
        .header {
          padding: 14px 20px 12px;
          border-bottom: 1.5px solid #2a2a2a;
        }

        .header-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .header-logo {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-logo svg {
          width: 44px;
          height: 44px;
        }

        .header-center {
          flex: 1;
          text-align: center;
        }

        .header-arabic {
          font-size: 11px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.6;
          direction: rtl;
          margin-bottom: 4px;
        }

        .header-institution {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #1a1a1a;
          line-height: 1.5;
        }

        .header-unit {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 4px;
          color: #1a1a1a;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .header-location {
          font-size: 10px;
          margin-top: 6px;
          color: #2a2a2a;
          font-style: italic;
        }

        .header-title {
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
        .section {
          padding: 12px 20px;
          border-bottom: 1.5px solid #2a2a2a;
        }

        .section-title {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 12px;
          color: #1a1a1a;
        }

        /* Field row */
        .field-row {
          display: flex;
          align-items: baseline;
          margin-bottom: 9px;
          gap: 8px;
        }

        .field-row.double {
          gap: 20px;
        }

        .field-label {
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          color: #2a2a2a;
          min-width: fit-content;
        }

        .field-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 1px solid #2a2a2a;
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 10px;
          color: #1a1a1a;
          outline: none;
          padding: 2px 4px;
          min-width: 40px;
        }

        .field-input:focus {
          border-bottom-color: #4a3f2f;
          background: rgba(74, 63, 47, 0.04);
        }

        .field-input.short { max-width: 90px; }

        /* Checkbox row */
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 9px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          font-size: 10px;
          color: #2a2a2a;
          font-weight: 700;
        }

        .checkbox-box {
          width: 13px;
          height: 13px;
          border: 1.5px solid #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }

        .checkbox-box.checked {
          background: #2a2a2a;
        }

        .checkbox-box.checked::after {
          content: '✓';
          color: #faf8f4;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
        }

        .checkbox-row-label {
          font-size: 10px;
          font-weight: 700;
          color: #2a2a2a;
          margin-bottom: 5px;
        }

        /* Textarea */
        .field-textarea {
          width: 100%;
          min-height: 80px;
          background: transparent;
          border: 1px solid #2a2a2a;
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 10px;
          color: #1a1a1a;
          outline: none;
          padding: 6px 8px;
          resize: vertical;
          line-height: 1.7;
        }

        .field-textarea.tall { min-height: 140px; }
        .field-textarea.medium { min-height: 90px; }

        .field-textarea:focus {
          border-color: #4a3f2f;
          background: rgba(74, 63, 47, 0.03);
        }

        /* Conclusion */
        .conclusion-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding-top: 4px;
        }

        .conclusion-label {
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          color: #2a2a2a;
        }

        .conclusion-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 1px solid #2a2a2a;
          font-family: inherit;
          font-size: 10px;
          color: #1a1a1a;
          outline: none;
          padding: 2px 4px;
        }

        /* Footer */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          border-top: 1.5px solid #2a2a2a;
        }

        .footer-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-label {
          font-size: 10px;
          font-weight: 700;
          color: #2a2a2a;
        }

        .footer-input {
          width: 50px;
          background: transparent;
          border: 1px solid #2a2a2a;
          font-family: inherit;
          font-size: 10px;
          color: #1a1a1a;
          outline: none;
          padding: 3px 5px;
          text-align: center;
        }

        /* Medecin signature */
        .medecin-block {
          text-align: right;
          padding: 12px 20px 16px;
          font-size: 10px;
          font-weight: 700;
          font-style: italic;
          color: #2a2a2a;
        }

        /* Print button */
        .print-btn {
          display: block;
          margin: 20px auto 0;
          padding: 10px 28px;
          background: #2a2a2a;
          color: #faf8f4;
          border: 2px solid #2a2a2a;
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .print-btn:hover {
          background: #faf8f4;
          color: #2a2a2a;
        }

        .divider-thin {
          height: 1px;
          background: #2a2a2a;
          margin: 10px 0;
        }

        @media print {
          .page-wrapper { background: white; padding: 0; }
          .form-sheet { box-shadow: none; border: 1px solid #000; }
          .print-btn { display: none; }
        }
      `}</style>

      <div>
        <div className="form-sheet">
          {/* Sidebar numero */}
          <div className="numero-sidebar">
            <div className="numero-text">
              <span>NUMERO</span>
              <input
                className="numero-input"
                value={form.numeroCIN}
                onChange={(e) => set("numeroCIN", e.target.value)}
                placeholder=".."
              />
            </div>
          </div>

          <div className="form-body">
            {/* Header */}
            <div className="header">
              <div className="header-top-row">
                {/* Left logo - caduceus */}
                <div className="header-logo">
                  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="22" cy="22" r="20" stroke="#2a2a2a" strokeWidth="1.5" fill="none"/>
                    <line x1="22" y1="6" x2="22" y2="38" stroke="#2a2a2a" strokeWidth="1.5"/>
                    <path d="M16 12 Q22 8 28 12 Q22 16 16 12Z" stroke="#2a2a2a" strokeWidth="1" fill="none"/>
                    <path d="M16 18 Q22 14 28 18 Q22 22 16 18Z" stroke="#2a2a2a" strokeWidth="1" fill="none"/>
                    <path d="M19 10 C16 13 16 17 19 18" stroke="#2a2a2a" strokeWidth="1.2" fill="none"/>
                    <path d="M25 10 C28 13 28 17 25 18" stroke="#2a2a2a" strokeWidth="1.2" fill="none"/>
                    <line x1="18" y1="30" x2="26" y2="30" stroke="#2a2a2a" strokeWidth="1"/>
                    <line x1="17" y1="33" x2="27" y2="33" stroke="#2a2a2a" strokeWidth="1"/>
                  </svg>
                </div>

                {/* Center text */}
                <div className="header-center">
                  <div className="header-arabic">
                    المركز الاستشفائي الجامعي – تلمسان<br />
                    مصلحة الطب الشرعي و قانون الطب و الأخلاقيات
                  </div>
                  <div className="header-institution">
                    Centre Hospitalier Universitaire - Tlemcen<br />
                    Service de Médecine Légale, Droit Médical et Ethique
                  </div>
                  <div className="header-unit">Unité de Consultation Médico-Légale</div>
                  <div className="header-location">
                    Tlemcen, le&nbsp;
                    <strong>
                      {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </strong>
                  </div>
                </div>

                {/* Right logo - scales of justice */}
                <div className="header-logo">
                  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="22" cy="22" r="20" stroke="#2a2a2a" strokeWidth="1.5" fill="none"/>
                    <line x1="22" y1="8" x2="22" y2="36" stroke="#2a2a2a" strokeWidth="1.5"/>
                    <line x1="12" y1="16" x2="32" y2="16" stroke="#2a2a2a" strokeWidth="1.2"/>
                    <path d="M12 16 L8 24 Q12 27 16 24 Z" stroke="#2a2a2a" strokeWidth="1" fill="none"/>
                    <path d="M32 16 L28 24 Q32 27 36 24 Z" stroke="#2a2a2a" strokeWidth="1" fill="none"/>
                    <line x1="18" y1="36" x2="26" y2="36" stroke="#2a2a2a" strokeWidth="1.2"/>
                  </svg>
                </div>
              </div>

              <div className="header-title">Fiche d'Examen Médical</div>
            </div>

            {/* Identity section */}
            <div className="section">
              <div className="field-row">
                <span className="field-label">Date d'examen :</span>
                <input type="date" className="field-input" value={form.dateExamen} onChange={(e) => set("dateExamen", e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-label">Nom et Prénom :</span>
                <input className="field-input" value={form.nomPrenom} onChange={(e) => set("nomPrenom", e.target.value)} />
              </div>
              <div className="field-row double">
                <span className="field-label">Date et lieu de naissance :</span>
                <input className="field-input short" value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} placeholder="Date" />
                <input className="field-input" value={form.lieuNaissance} onChange={(e) => set("lieuNaissance", e.target.value)} placeholder="Lieu" />
              </div>
              <div className="field-row">
                <span className="field-label">Etat civil :</span>
                <input className="field-input" value={form.etatCivil} onChange={(e) => set("etatCivil", e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-label">Profession :</span>
                <input className="field-input" value={form.profession} onChange={(e) => set("profession", e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-label">Adresse :</span>
                <input className="field-input" value={form.adresse} onChange={(e) => set("adresse", e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-label">N° C.I.N. :</span>
                <input className="field-input" value={form.numeroCIN} onChange={(e) => set("numeroCIN", e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-label">Tuteur légal (Mineur) :</span>
                <input className="field-input" value={form.tuteurLegal} onChange={(e) => set("tuteurLegal", e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-label">Autorités Requérantes :</span>
                <input className="field-input" value={form.autoritesRequerantes} onChange={(e) => set("autoritesRequerantes", e.target.value)} />
                <span className="field-label" style={{ marginLeft: 12 }}>en date :</span>
                <input type="date" className="field-input short" value={form.enDate} onChange={(e) => set("enDate", e.target.value)} />
              </div>
            </div>

            {/* Allégations */}
            <div className="section">
              <div className="section-title">Allégations</div>
              <div className="field-row">
                <span className="field-label">Date et heures des faits :</span>
                <input className="field-input" value={form.dateHeuresFaits} onChange={(e) => set("dateHeuresFaits", e.target.value)} />
              </div>

              <div style={{ marginBottom: 9 }}>
                <div className="checkbox-row-label">Nature des faits :</div>
                <div className="checkbox-group">
                  {(["CBI", "CBV", "ADC", "AVP", "autres"] as const).map((key) => (
                    <label key={key} className="checkbox-item" onClick={() => toggleNature(key)}>
                      <div className={`checkbox-box ${form.natureFaits[key] ? "checked" : ""}`} />
                      {key === "autres" ? "Autres" : key}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 9 }}>
                <div className="checkbox-row-label">Objet :</div>
                <div className="checkbox-group">
                  {(["contondant", "tranchant", "autres"] as const).map((key) => (
                    <label key={key} className="checkbox-item" onClick={() => toggleObjet(key)}>
                      <div className={`checkbox-box ${form.objet[key] ? "checked" : ""}`} />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field-row">
                <span className="field-label">Auteur :</span>
                <input className="field-input" value={form.auteur} onChange={(e) => set("auteur", e.target.value)} />
              </div>
            </div>

            {/* Antécédents */}
            <div className="section">
              <div className="section-title">Antécédents</div>
              <div className="field-row">
                <span className="field-label">Familiaux :</span>
                <input className="field-input" value={form.familiaux} onChange={(e) => set("familiaux", e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-label">Personnels :</span>
                <input className="field-input" value={form.personnels} onChange={(e) => set("personnels", e.target.value)} />
              </div>
            </div>

            {/* Examen Médical */}
            <div className="section">
              <div className="section-title">Examen Médical</div>
              <textarea
                className="field-textarea tall"
                value={form.examenMedical}
                onChange={(e) => set("examenMedical", e.target.value)}
                placeholder="Résultats de l'examen médical..."
              />
            </div>

            {/* Examens Complémentaires */}
            <div className="section">
              <div className="section-title">Examens Complémentaires</div>
              <textarea
                className="field-textarea medium"
                value={form.examensComplementaires}
                onChange={(e) => set("examensComplementaires", e.target.value)}
                placeholder="Examens complémentaires prescrits ou effectués..."
              />
            </div>

            {/* Conclusion */}
            <div className="section">
              <div className="section-title">Conclusion</div>
              <div className="conclusion-row">
                <span className="conclusion-label">Incapacité Temporaire Total de Travail (I.T.T) de</span>
                <input className="conclusion-input" value={form.ITT} onChange={(e) => set("ITT", e.target.value)} placeholder="durée..." />
              </div>
            </div>

            {/* Médecin */}
            <div className="medecin-block">Le Médecin,</div>

            {/* Footer */}
            <div className="footer">
              <div className="footer-item">
                <span className="footer-label">Payant</span>
                <input className="footer-input" value={form.payant} onChange={(e) => set("payant", e.target.value)} />
              </div>
              <div className="footer-item">
                <span className="footer-label">Gratuit</span>
                <input className="footer-input" value={form.gratuit} onChange={(e) => set("gratuit", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <button className="print-btn" onClick={handlePrint}>
          Imprimer / Exporter
        </button>
      </div>
    </div>
  );
}
