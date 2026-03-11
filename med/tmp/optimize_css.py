import os
import re

files_to_update = [
    r"d:\med L2\med\app\medecin\components\AutopsieForm.tsx",
    r"d:\med L2\med\app\medecin\components\LeveeDeCorpsForm.tsx",
    r"d:\med L2\med\app\medecin\components\CorpsEnDepotsForm.tsx"
]

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Compress h3, h4 margins in @media print
    old_css = r"""                    h3, h4 \{
                        background-color: #d1d5db !important;
                        color: black !important;
                        padding: 4px 8px !important;
                        margin-top: 1rem !important;
                        margin-bottom: 0\.5rem !important;"""
    
    new_css = r"""                    h3, h4 {
                        background-color: #d1d5db !important;
                        color: black !important;
                        padding: 2px 4px !important;
                        margin-top: 2px !important;
                        margin-bottom: 2px !important;
                        font-size: 11pt !important;
                        line-height: 1.2 !important;"""
    content = re.sub(old_css, new_css, content)

    # 2. Compress .print-section margins
    old_section_css = r"""                    \.print-section \{
                        page-break-inside: avoid;
                        margin-bottom: 20px;
                        border: none;
                    \}"""
    new_section_css = r"""                    .print-section {
                        page-break-inside: avoid;
                        margin-bottom: 5px;
                        border: none;
                    }"""
    content = re.sub(old_section_css, new_section_css, content)

    # 3. Compress inputs and textareas font-size and padding
    old_input_css = r"""                    input, textarea, select \{
                        background: transparent !important;
                        color: black !important;
                        border: none !important;
                        border-color: transparent !important;
                        box-shadow: none !important;
                        border-radius: 0;
                        padding: 2px 4px;
                        font-size: 11pt;
                    \}"""
    new_input_css = r"""                    input, textarea, select {
                        background: transparent !important;
                        color: black !important;
                        border: none !important;
                        border-color: transparent !important;
                        box-shadow: none !important;
                        border-radius: 0;
                        padding: 0px 2px;
                        font-size: 11pt;
                    }"""
    content = re.sub(old_input_css, new_input_css, content)

    # 4. Remove large form margins
    old_form_class = r'<form className="space-y-6 print:space-y-2">'
    new_form_class = r'<form className="space-y-6 print:space-y-1">'
    content = content.replace(old_form_class, new_form_class)

    # 5. Compress signature block
    old_sig = r"""                \{\/\* Signature Area \*\/\}
                <div className="hidden print:block mt-4 mb-2">
                    <div className="flex justify-end pr-8">
                        <div className="text-center">
                            <p className="text-\[10pt\] font-bold text-gray-900 mb-1">Docteur A\. BENCHEKOUR<\/p>
                            <div className="h-12 w-48 rounded mt-1 flex items-center justify-center text-gray-400 text-\[8pt\]">
                                \(Signature et cachet\)
                            </div>
                        </div>
                    </div>
                <\/div>"""
    new_sig = r"""                {/* Signature Area */}
                <div className="hidden print:block mt-2 mb-0">
                    <div className="flex justify-end pr-8">
                        <div className="text-center">
                            <p className="text-[10pt] font-bold text-gray-900 mb-0">Docteur A. BENCHEKOUR</p>
                        </div>
                    </div>
                </div>"""
    content = re.sub(old_sig, new_sig, content)

    # 6. Compress footer margin
    old_footer = r"""                \{\/\* Pied de page impression \*\/\}
                <div className="footer-print hidden print:block">
                    <p>SERVICE DE MÉDECINE LÉGALE C\.H\.U\. TLEMCEN \| Bvd MOHAMMED V - 13000 TLEMCEN<\/p>
                    <p>Tel: 043 20-10-30 \(poste 2223 \/ 2202\) \| Fax: 043 20-14-14<\/p>
                <\/div>"""
    new_footer = r"""                {/* Pied de page impression */}
                <div className="footer-print hidden print:block" style={{paddingTop: '2px', marginTop: '2px'}}>
                    <p>SERVICE DE MÉDECINE LÉGALE C.H.U. TLEMCEN | Bvd MOHAMMED V - 13000 TLEMCEN</p>
                    <p>Tel: 043 20-10-30 (poste 2223 / 2202) | Fax: 043 20-14-14</p>
                </div>"""
    content = re.sub(old_footer, new_footer, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Refactored: {os.path.basename(filepath)}")

for f in files_to_update:
    refactor_file(f)
