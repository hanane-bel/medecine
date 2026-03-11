const fs = require('fs');
const files = [
    'd:/med L2/med/app/medecin/components/GavForm.tsx',
    'd:/med L2/med/app/medecin/components/ExpertiseForm.tsx',
    'd:/med L2/med/app/medecin/components/AutopsieForm.tsx',
    'd:/med L2/med/app/medecin/components/LeveeDeCorpsForm.tsx',
    'd:/med L2/med/app/medecin/components/CorpsEnDepotsForm.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/placeholder="[^"]*"/g, 'placeholder=""');
    content = content.replace(/defaultValue="Ex:[^"]*"/gi, 'defaultValue=""');
    fs.writeFileSync(file, content);
});
console.log('Placeholders cleaned.');
