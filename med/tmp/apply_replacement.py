import os

filepath = r"d:\med L2\med\app\medecin\components\ExpertiseForm.tsx"
outputpath = r"d:\med L2\med\tmp\output.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

with open(outputpath, "r", encoding="utf-8") as f:
    new_chunk = f.read()

lines = content.split('\n')
before = '\n'.join(lines[:368])
after = '\n'.join(lines[794:])

final_content = before + '\n' + new_chunk + '\n' + after

with open(filepath, "w", encoding="utf-8") as f:
    f.write(final_content)
    
print("Successfully applied replace to ExpertiseForm.tsx")
