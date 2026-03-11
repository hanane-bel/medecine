import os
import re

filepath = r"d:\med L2\med\app\medecin\components\ExpertiseForm.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remplacer <PrintHeader> (lignes 820-823) par le nouveau header
header_target = r"""                <PrintHeader
                    title="RAPPORT MÉDICO-LÉGAL"
                    unitName="UNITÉ D'EXPERTISE MÉDICO-LÉGALE"
                />"""
header_repl = r"""                <div className="flex justify-between items-center border-b-[1.5px] border-black pb-2 mb-4">
                    <div className="w-[150px] shrink-0">
                        <img src="/logo_converted.svg" alt="Logo CHU" className="w-[150px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div className="flex-1 text-center px-4">
                        <h1 className="text-[10pt] font-bold leading-tight">المركز الاستشفائي الجامعي - تلمسان<br />CENTRE HOSPITALIER UNIVERSITAIRE - TLEMCEN</h1>
                        <h2 className="text-[10pt] font-bold leading-tight mt-1">مصلحة الطب الشرعي و قانون الطب والأخلاقيات<br />SERVICE DE MEDECINE LEGALE, DROIT MEDICAL ET ETHIQUE</h2>
                    </div>
                    <div className="w-[150px] shrink-0 flex justify-end">
                        <img src="/justice_symbol.svg" alt="Logo Service" className="w-[150px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                </div>

                <div className="flex justify-end mb-4">
                    <div className="flex items-baseline gap-2 text-[11pt]">
                        <span>Tlemcen, le</span>
                        <input type="text" className="w-40 font-bold" defaultValue={new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-[12pt] font-bold uppercase underline underline-offset-4">RAPPORT D'EXPERTISE MÉDICO-LÉGALE</h2>
                </div>"""
content = re.sub(header_target, header_repl, content)

# 2. Refonte du conteneur des sections (compresser l'espace vertical mb-8 => mb-4, etc.)
# Le div.space-y-6 mt-8 -> space-y-3 mt-4
content = content.replace('<div className="space-y-6 mt-8">', '<div className="space-y-3 mt-4 text-[11pt] leading-relaxed">')

# Remplacement de chaque section pour utiliser titre-gris bg-gray-400 au lieu de flex items-center gap-2
def replace_section_title(match):
    title = match.group(1)
    return f"""<div className="titre-gris bg-gray-400 text-black px-2 py-0 mb-1">
                                <h3 className="font-bold underline underline-offset-2 uppercase text-[11pt] m-0">{title}</h3>
                            </div>"""

content = re.sub(r'<h3 className="flex items-center gap-2">(.*?)<\/h3>', replace_section_title, content)

# 3. Remplacement des `col-field` pour s'aligner sur les styles compacts
content = re.sub(r'<div className="col-field">', r'<div className="flex mb-0">', content)
content = content.replace('className="col-field"', 'className="flex mb-0"')
content = content.replace('<div className="space-y-4">', '<div className="space-y-0 pl-2">')

# 4. Suppression de la signature séparée existante
sig_target = r'\{\/\*\s*Signature Area\s*\*\/\}.*?Docteur A\. BENCHEKOUR.*?<\/div >\n                <\/div>'
content = re.sub(sig_target, '', content, flags=re.DOTALL)

# 5. Injection de la signature dans la section Conclusion (où elle devrait être pour ExpertiseForm)
# The conclusion block looks like:
# <div className="space-y-0 pl-2">
# <div className="flex mb-0" style={{ alignItems: 'flex-start' }}>
# <label>Conclusion :</label>
# <textarea rows={4} className="font-bold" placeholder="Écrire la conclusion du rapport médico-légal..."></textarea>
# </div>
# </div>
# </div>

conclusion_target = r'(<textarea rows=\{4\} className=\"font-bold\" placeholder=\"Écrire la conclusion du rapport médico-légal\.\.\.\"><\/textarea>\s*<\/div>\s*<\/div>)'
conclusion_repl = r"""\1
                            <div className="mt-6 text-right pr-12">
                                <span className="font-bold underline underline-offset-2">Médecin légiste</span>
                            </div>"""

content = re.sub(conclusion_target, conclusion_repl, content)

# 6. Modifier les CSS dans style jsx global pour enlever les margin-top et font-sizes des .print-container h3,h4
# Enlevons le vieux style h3, h4
css_to_remove = r"""\.print-container h3, \.print-container h4 \{[^}]*\}"""
content = re.sub(css_to_remove, "", content)

# Ajuster label style dans print-container global css
label_css = r"""\.print-container label \{.*?\}"""
new_label_css = r""".print-container label { color: black; font-weight: 700; width: 14rem; flex-shrink: 0; padding-right: 0.5rem; }"""
content = re.sub(label_css, new_label_css, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("ExpertiseForm refactored")
