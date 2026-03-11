import os
import re

directory = r"d:\med L2\med\app\medecin\components"
forms = [
    "GavForm.tsx",
    "ConsultationForm.tsx",
    "AutopsieForm.tsx",
    "LeveeDeCorpsForm.tsx",
    "CorpsEnDepotsForm.tsx"
]

NEW_STYLE = """                <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body { background: white !important; font-family: "Times New Roman", Times, serif !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; max-width: none !important; }
                    input, textarea, select { border-bottom: none !important; color: black !important; }
                    .schema-print-container { page-break-inside: avoid; }
                    .schema-section { page-break-before: always; }
                    .footer-print {
                        position: fixed; bottom: 0; left: 0; width: 100%; text-align: center;
                        font-size: 8pt; color: #666; border-top: 1px solid #ccc; padding-top: 5px; visibility: visible !important;
                    }
                }

                /* Styles globaux pour le document format papier WYSIWYG */
                .print-container input, .print-container textarea, .print-container select {
                    background: transparent;
                    color: #1e1b4b; /* Dark indigo */
                    border: none;
                    border-bottom: 1px dashed #9ca3af;
                    border-radius: 0;
                    padding: 2px 0px;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
                    font-size: 11pt;
                    width: 100%;
                    resize: none;
                }
                .print-container input:focus, .print-container textarea:focus, .print-container select:focus {
                    outline: none;
                    border-bottom-style: solid;
                    border-bottom-color: black;
                }
                .print-container label {
                    color: black;
                    font-weight: 700;
                    font-size: 11pt;
                    width: 14rem;
                    flex-shrink: 0;
                    padding-right: 0.5rem;
                }
                .print-container .col-field {
                    display: flex;
                    flex-direction: row;
                    align-items: baseline;
                    margin-bottom: 0.5rem;
                }
                .print-container .col-field input, .print-container .col-field textarea, .print-container .col-field select {
                    flex: 1;
                }
                .print-container h3, .print-container h4 {
                    color: black;
                    font-weight: 800;
                    text-transform: uppercase;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    font-size: 13pt;
                    background: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                }
                /* Hide dark mode generic elements inside print-container */
                .print-container .bg-white\\\\/5, .print-container .bg-white\\\\/10 {
                    background: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                }
                `}</style>"""

def replace_fields(m):
    label_text = m.group(1)
    tag = m.group(2)
    attrs1 = m.group(3)
    attrs2 = m.group(4)
    closing = m.group(5)
    
    if not label_text.strip().endswith(':'):
        label_text = label_text.strip() + " :"
        
    return f'<div className="col-field"><label>{label_text}</label><{tag}{attrs1}{attrs2}{closing}</div>'


for form in forms:
    filepath = os.path.join(directory, form)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace all `<style jsx global>...</style>` inside the file with my unified WYSIWYG style
    content = re.sub(r'<style jsx global>.*?</style>', NEW_STYLE, content, flags=re.DOTALL)

    # 2. Inject `className="print-container bg-white text-black max-w-[21cm] min-h-[29.7cm] mx-auto p-12 shadow-2xl rounded-sm print:max-w-none print:mx-0 print:p-0 print:shadow-none relative"` to formRef divs
    # Usually it's `<div ref={formRef}>` or `<div className="..." ref={formRef}>`
    content = re.sub(
        r'<div[^>]*?ref=\{formRef\}[^>]*?>', 
        '<div className="print-container bg-white text-black max-w-[21cm] min-h-[29.7cm] mx-auto p-12 shadow-2xl rounded-sm print:max-w-none print:mx-0 print:p-0 print:shadow-none relative" ref={formRef}>', 
        content
    )

    # 3. Apply `.col-field` transformation to all basic div fields
    # Notice we strip out the className={labelClass} and className={inputClass} to let CSS rule.
    # We will search for <div><label className={labelClass}> ... </label><input/textarea... className={inputClass/textareaAutoClass}...></div>

    field_regex = r'<div>\s*<label className=\{[a-zA-Z0-9_]+\}>(.*?)</label>\s*<(input|textarea|select)(.*?)className=\{[a-zA-Z0-9_]+\}(.*?)(/>|></textarea>|</select>)\s*</div>'
    content = re.sub(field_regex, replace_fields, content, flags=re.DOTALL)
    
    # Same but with empty closing (e.g., self-closing components if any, but standard inputs are caught by regex)

    # 4. Remove dark-mode typical block decorations
    content = content.replace('className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1"', 'className="space-y-4"')
    content = content.replace('className="bg-white/5 rounded-xl p-4 print:p-2"', 'className="space-y-4"')
    content = content.replace('className="text-lg font-bold text-white flex items-center gap-2"', 'className="flex items-center gap-2"')
    content = content.replace('className="text-lg font-bold text-white flex items-center gap-2 no-print"', 'className="flex items-center gap-2 no-print"')
    content = content.replace('className="space-y-6 print:space-y-2"', 'className="space-y-6"')
    content = re.sub(r'<span className="w-8 h-8 bg-[a-z]+-600 rounded-lg flex items-center justify-center text-sm">\d*.*?</span>\s*', '', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Upgraded {form}")

print("Done")
