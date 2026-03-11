import os
import re

file_path = r"d:\med L2\med\app\medecin\components\ConsultationForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if "{/* PAGE 3: CERTIFICAT MÉDICAL (RAPPORT)" in line:
        start_index = i + 1 # Point to `< div style = {{ display: shouldShow("rapport") ? 'block' : 'none' }}>`
    elif "{/* SCHÉMA CORPS - always rendered" in line:
        end_index = i
        break

if start_index != -1 and end_index != -1:
    NEW_BLOCK = """    <div style={{ display: shouldShow("rapport") ? 'block' : 'none' }}>
        <div className="print-container bg-white text-black shadow-2xl relative">
            <style jsx global>{`
              @media print {
                @page { size: A4; margin: 2cm; }
                body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none !important; }
                .print-container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
                .titre-gris { background-color: #9ca3af !important; }
              }
              .print-container { width: 21cm; min-height: 29.7cm; padding: 2cm; font-family: Arial, "Inter", sans-serif; box-sizing: border-box; margin: 0 auto; }
              .print-container input, .print-container textarea { background: transparent; color: black; border: none !important; font-family: "Courier New", Courier, monospace; font-size: 11pt; width: 100%; resize: none; outline: none; }
              @media print { .print-container input::placeholder, .print-container textarea::placeholder { color: transparent; } }
            `}</style>
            
            <div className="flex justify-between items-center border-b-[1.5px] border-black pb-3 mb-8">
              <div className="w-[150px] shrink-0">
                <img src="/logo_chu_tlemcen.jpg" alt="Logo CHU" className="w-[150px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="flex-1 text-center px-4">
                <h1 className="text-[10pt] font-bold leading-tight">المركز الاستشفائي الجامعي - تلمسان<br />CENTRE HOSPITALIER UNIVERSITAIRE - TLEMCEN</h1>
                <h2 className="text-[10pt] font-bold leading-tight mt-1">مصلحة الطب الشرعي و قانون الطب والأخلاقيات<br />SERVICE DE MEDECINE LEGALE, DROIT MEDICAL ET ETHIQUE</h2>
              </div>
              <div className="w-[150px] shrink-0 flex justify-end">
                <img src="/logo-service.png" alt="Logo Service" className="w-[150px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            </div>

            <div className="flex justify-end mb-10">
              <div className="flex items-baseline gap-2 text-[11pt]">
                <span>Tlemcen, le</span>
                <input type="text" className="w-40 font-bold" defaultValue="29 janvier 2026" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-[12pt] font-bold uppercase underline underline-offset-4">CERTIFICAT MÉDICAL INITIAL DE CONSTATATION DE COUPS ET BLESSURES</h2>
            </div>

            <div className="space-y-6 text-[11pt] leading-relaxed">
              <section>
                <div className="titre-gris bg-gray-400 text-black px-2 py-0.5 mb-3">
                  <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Préambule</h3>
                </div>
                <div className="space-y-1 pl-4">
                  <div className="flex"><span className="w-[180px] shrink-0">– Réquisition de :</span><input type="text" defaultValue="la sureté daïra de Mansourah de Tlemcen" /></div>
                  <div className="flex"><span className="w-[180px] shrink-0">– Date de la réquisition :</span><input type="date" className="w-auto" defaultValue="2026-01-29" /></div>
                  <div className="flex"><span className="w-[180px] shrink-0">– Examen de :</span><input type="text" defaultValue={patientName} /></div>
                  <div className="flex"><span className="w-[180px] shrink-0">– Date et lieu de naissance :</span><input type="text" placeholder="ex: 30 octobre 1976 à Tlemcen" /></div>
                </div>
              </section>

              <section>
                <div className="titre-gris bg-gray-400 text-black px-2 py-0.5 mb-3">
                  <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Mission</h3>
                </div>
                <div className="pl-4">
                  <textarea rows={2} defaultValue="Décrire les lésions constatées et déterminer l'Incapacité Totale de Travail (ITT)." />
                </div>
              </section>

              <section>
                <div className="titre-gris bg-gray-400 text-black px-2 py-0.5 mb-3">
                  <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Examen médical</h3>
                </div>
                <div className="space-y-1 pl-4">
                  <div className="flex"><span className="w-[180px] shrink-0">– Date de l'examen :</span><input type="date" className="w-auto" defaultValue="2026-01-29" /></div>
                  <div className="flex"><span className="w-[180px] shrink-0">– Doléances :</span><input type="text" defaultValue="rien de particulier" /></div>
                  <div className="flex"><span className="w-[180px] shrink-0">– Antécédents :</span><input type="text" defaultValue="une maladie psychiatrique" /></div>
                  <div className="flex"><span className="w-[180px] shrink-0">– Etat général :</span><input type="text" defaultValue="bon" /></div>
                  <div className="mt-1">
                    <span>– Examen clinique :</span>
                    <div className="pl-12 mt-1 space-y-1">
                      <div className="flex items-center"><span className="mr-3">▪</span><span className="w-[120px] shrink-0">Inspection :</span><input type="text" defaultValue="sans particularité." /></div>
                      <div className="flex items-center"><span className="mr-3">▪</span><span className="w-[120px] shrink-0">Palpation :</span><input type="text" defaultValue="rien de particulier." /></div>
                    </div>
                  </div>
                  <div className="flex pt-1"><span className="w-[220px] shrink-0">– Reste de l'examen médical :</span><input type="text" defaultValue="rien de particulier." /></div>
                </div>
              </section>

              <section>
                <div className="titre-gris bg-gray-400 text-black px-2 py-0.5 mb-3">
                  <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt]">Conclusion</h3>
                </div>
                <div className="pl-4">
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>L'examen médical de</span>
                    <input type="text" className="w-auto flex-1 min-w-[200px]" defaultValue={`${patientName}, pratiqué ce jour est sans particularité.`} />
                  </div>
                </div>
                <div className="mt-20 mr-12 text-right">
                  <span className="font-bold">Médecin légiste</span>
                </div>
              </section>
            </div>
        </div>
    </div>
"""
    new_lines = lines[:start_index] + [NEW_BLOCK + "\n"] + lines[end_index:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("Replace done.")
else:
    print(f"Could not find indices: start_index={start_index}, end_index={end_index}")
