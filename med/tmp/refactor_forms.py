import os
import re

directory = "d:/med L2/med/app/medecin/components"
forms = ["ExpertiseForm.tsx", "GavForm.tsx", "ConsultationForm.tsx", "AutopsieForm.tsx", "LeveeDeCorpsForm.tsx", "CorpsEnDepotsForm.tsx"]

WYSIWYG_CSS = """                    <style jsx global>{`
                    /* ================= WYSIWYG PAPER STYLE ================= */
                    .print-container {
                        background: white !important;
                        color: black !important;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 20mm;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                        font-family: "Times New Roman", Times, serif !important;
                        position: relative;
                        min-height: 297mm;
                    }
                    .print-container input, .print-container textarea, .print-container select {
                        background: transparent !important;
                        color: #1e1b4b !important; /* Dark indigo for typewriter ink on screen */
                        border: none !important;
                        border-bottom: 1px dashed #cbd5e1 !important;
                        border-radius: 0 !important;
                        padding: 2px 4px !important;
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace !important;
                        font-size: 11pt !important;
                        width: 100% !important;
                        min-height: auto !important;
                        height: auto !important;
                        box-shadow: none !important;
                        resize: none !important;
                        line-height: 1.5 !important;
                    }
                    .print-container input:focus, .print-container textarea:focus {
                        outline: none !important;
                        border-bottom: 1px solid black !important;
                    }
                    .print-container label {
                        color: black !important;
                        font-weight: 700 !important;
                        font-size: 11pt !important;
                        margin-bottom: 0 !important;
                    }
                    .print-container h3, .print-container h4 {
                        color: black !important;
                        font-weight: bold !important;
                        text-transform: uppercase !important;
                        text-decoration: underline !important;
                        text-underline-offset: 4px !important;
                        margin-top: 1.5rem !important;
                        margin-bottom: 1rem !important;
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                    }
                    .print-container .schema-section h3 {
                        text-decoration: none !important;
                    }
                    
                    /* Hide unnecessary dark mode elements in print container */
                    .print-container .bg-white\\\\/5, .print-container .bg-white\\\\/10 {
                        background: transparent !important;
                        border: none !important;
                    }

                    /* ---------------- PRINT RULES ---------------- */
                    @media print {
                        @page {
                            size: A4;
                            margin: 15mm;
                        }
                        body {
                            background: white !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-container {
                            width: 100% !important;
                            max-width: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                            min-height: auto !important;
                        }
                        .print-container input, .print-container textarea, .print-container select {
                            color: black !important; /* Pure black ink */
                            border-bottom: none !important; /* No borders at all, pure typewriter */
                        }
                        .print-section {
                            page-break-inside: avoid !important;
                        }
                        .schema-print-container { 
                            width: 100% !important; 
                            display: flex !important; 
                            align-items: center !important; 
                            justify-content: center !important; 
                            page-break-inside: avoid; 
                        }
                        .schema-section { page-break-before: always; }
                    }
                `}</style>"""

def refactor_file(filepath):
    if not os.path.exists(filepath):
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace the old `<style jsx global>{...}</style>` with our new WYSIWYG one
    # We find <style jsx global>{` ... `}</style> inside `<div className="print-container"...`
    style_pattern = re.compile(r'<style jsx global>\{`.*?`\}</style>', re.DOTALL)
    content = style_pattern.sub(WYSIWYG_CSS, content)

    # 2. Update field variables if they exist
    # Replace inputClass and labelClass, but wait, if we use pure CSS, we can just simplify them!
    # Because our new CSS targets `.print-container input` and `.print-container label`.
    # But for column alignment, we need:
    
    col_classes = """    const fieldContainerClass = "flex flex-col sm:flex-row sm:items-baseline print:flex-row print:items-baseline mb-2 w-full";
    const labelColumnClass = "w-full sm:w-48 print:w-48 shrink-0 mr-2";
    const inputColumnClass = "flex-1";"""
    
    # We insert col_classes before inputClass
    content = re.sub(r'(const inputClass = ".*?";)', r'\1\n' + col_classes, content)

    # 3. Transform field structures:
    # `<div><label className={labelClass}>XXX</label><input type="text" className={inputClass} ... /></div>`
    # to column flex
    # Regex to find these standard div Wrappers
    field_pattern = re.compile(r'<div>\s*<label className=\{labelClass\}>(.*?)</label>\s*<(input|textarea)(.*?)className=\{inputClass\}(.*?)(/>|></textarea>)\s*</div>', re.DOTALL)
    
    def repl_field(m):
        label_text = m.group(1)
        tag = m.group(2)
        attrs1 = m.group(3)
        attrs2 = m.group(4)
        closing = m.group(5)
        
        # Add a colon if not present (except for numbered items or very long labels maybe, but simple to just add `:` if missing)
        if not label_text.endswith(':') and not label_text.endswith('?') and not '...' in label_text:
            label_text += " :"
            
        return f'<div className={{fieldContainerClass}}>\n    <label className={{`$={{labelClass}} ${{labelColumnClass}}`}}>{label_text}</label>\n    <{tag}{attrs1}className={{`${{inputClass}} ${{inputColumnClass}}`}}{attrs2}{closing}\n</div>'

    content = field_pattern.sub(repl_field, content)

    # Transform <div><label>... <textarea .../></div>
    # Usually caught by regex above since it covers both input and textarea!

    # Save
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Refactored {filepath}")

for form in forms:
    refactor_file(os.path.join(directory, form))
