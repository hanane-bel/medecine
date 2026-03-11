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

for form in forms:
    filepath = os.path.join(directory, form)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix ternary operator lacking colon between strings
    # e.g. condition ? 'string1' 'string2' -> condition ? 'string1' : 'string2'
    content = re.sub(r"(\?)(\s*'[a-zA-Z0-9_\-\s]*')(\s+)('[a-zA-Z0-9_\-\s]*')", r"\1\2 :\4", content)
    content = re.sub(r'(\?)(\s*"[a-zA-Z0-9_\-\s]*")(\s+)("[a-zA-Z0-9_\-\s]*")', r'\1\2 :\4', content)

    # Re-save
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Ternary fixes applied")
