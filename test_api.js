const API_BASE = "http://127.0.0.1:8000/api";

async function run() {
    let res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: "imene", password: "password123"})
    });
    let data = await res.json();
    const tokenMedecin = data.access;

    const patientId = 7; 

    // Medecin tries to update patient status to 'termine'
    res = await fetch(`${API_BASE}/patients/${patientId}/`, {
        method: "PATCH", 
        headers: { "Authorization": `Bearer ${tokenMedecin}`, "Content-Type": "application/json" },
        body: JSON.stringify({status: "termine", rapport_medical: "test rapport"})
    });
    console.log("Medecin update response:", res.status, await res.text());
}
run().catch(console.error);
