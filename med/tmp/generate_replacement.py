import re
import os

filepath = r"d:\med L2\med\app\medecin\components\ExpertiseForm.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Extract lines from 369 to 793
lines = content.split('\n')
chunk = '\n'.join(lines[368:794])  # 369 to 794 (inclusive is lines[368:794])

# Define the new style block
NEW_STYLE = """                <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
                    input, textarea { border-bottom: none !important; color: black !important; }
                    .schema-print-container { page-break-inside: avoid; }
                    .schema-section { page-break-before: always; }
                }

                /* Styles globaux pour le document format papier WYSIWYG */
                .print-container input, .print-container textarea {
                    background: transparent;
                    color: #1e1b4b;
                    border: none;
                    border-bottom: 1px dashed #9ca3af;
                    border-radius: 0;
                    padding: 2px 0px;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
                    font-size: 11pt;
                    width: 100%;
                    resize: none;
                }
                .print-container input:focus, .print-container textarea:focus {
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
                .print-container .col-field input, .print-container .col-field textarea {
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
                }
                `}</style>"""

# Replace style block
chunk = re.sub(r'<style jsx global>.*?</style>', NEW_STYLE, chunk, flags=re.DOTALL)

# Convert divs with labels + inputs
def field_repl(m):
    label_text = m.group(1)
    tag = m.group(2)
    attrs1 = m.group(3)
    attrs2 = m.group(4)
    closing = m.group(5)
    
    # ensure colon
    if not label_text.strip().endswith(':'):
        label_text = label_text.strip() + " :"
        
    return f'<div className="col-field"><label>{label_text}</label><{tag}{attrs1}{attrs2}{closing}</div>'

chunk = re.sub(r'<div>\s*<label className=\{labelClass\}>(.*?)</label>\s*<(input|textarea)(.*?)className=\{inputClass\}(.*?)(/>|></textarea>)\s*</div>', field_repl, chunk, flags=re.DOTALL)

# Replace dark mode classes on containers
chunk = chunk.replace('className="bg-white/5 rounded-xl p-4 print:p-2 space-y-4 print:space-y-1"', 'className="space-y-4"')
chunk = chunk.replace('className="text-lg font-bold text-white flex items-center gap-2"', 'className="flex items-center gap-2"')
chunk = chunk.replace('className="text-lg font-bold text-white flex items-center gap-2 no-print"', 'className="flex items-center gap-2 no-print"')

# Other dark mode removals
chunk = chunk.replace('className="space-y-6 print:space-y-2"', 'className="space-y-6"')
chunk = re.sub(r'<span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-sm">\d+</span>\s*', '', chunk)


# Extract navigation (it's between En-tête professionnel and Onglets)
nav_pattern = r'(                    {/\* Navigation \*/}.*?                    </div>)'
tabs_pattern = r'(                    {/\* Onglets \*/}.*?                    </div>)'

nav_match = re.search(nav_pattern, chunk, flags=re.DOTALL)
tabs_match = re.search(tabs_pattern, chunk, flags=re.DOTALL)

if nav_match and tabs_match:
    nav_str = nav_match.group(1)
    tabs_str = tabs_match.group(1)
    
    # remove them from chunk
    chunk = chunk.replace(nav_str, '')
    chunk = chunk.replace(tabs_str, '')
    
    # We will extract the form container definition
    print_container_start = '<div className="print-container" ref={formRef}>'
    
    # Replace the container start line
    # the new layout: we put nav and tabs BEFORE print-container but wrapped in a max-w-4xl no-print
    header_actions = f"""        {{/* Actions (Screen only) */}}
        <div className="max-w-4xl mx-auto mb-6 no-print">
{nav_str}

{tabs_str}
        </div>
"""
    
    new_print_container = f"""{header_actions}
        <div 
            className="print-container bg-white text-black max-w-[21cm] min-h-[29.7cm] mx-auto p-12 shadow-2xl rounded-sm print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none relative" 
            ref={{formRef}}
        >"""
    
    chunk = chunk.replace(print_container_start, new_print_container)


# Write output to /tmp/output.tsx
with open(r"d:\med L2\med\tmp\output.tsx", "w", encoding="utf-8") as f:
    f.write(chunk)
    
print("Done")
