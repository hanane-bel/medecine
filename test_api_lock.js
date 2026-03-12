const API_BASE = "http://127.0.0.1:8000/api";

async function login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });
    const data = await res.json();
    return data.access;
}

async function run() {
    const tokenSec = await login("hanane", "hanane123");
    const tokenMed = await login("imene", "imene123");
    const tokenChef = await login("souhila.laribi", "souhilalaribi13");

    console.log("Logged in users.");

    let res = await fetch(`${API_BASE}/patients/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tokenSec}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            numero_dossier: `DOS-TEST-LOCK-${Date.now()}`,
            nom: "Test", prenom: "Lock",
            date_naissance: "1990-01-01",
            genre: "Masculin", situation: "Célibataire"
        })
    });
    
    // The create serializer doesn't return the ID, so we must fetch it
    const searchRes = await fetch(`${API_BASE}/patients/`, {
        headers: { "Authorization": `Bearer ${tokenMed}` }
    });
    const patientsList = await searchRes.json();
    const patientObj = patientsList[0];
    const patientId = patientObj.id;
    console.log("Created & Found patient ID:", patientId);

    // 2. Medecin edits and finalizes
    res = await fetch(`${API_BASE}/patients/${patientId}/`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${tokenMed}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rapport_medical: "First edit", status: "termine" })
    });
    console.log("Medecin first edit response:", res.status, await res.text());

    // 3. Medecin tries to edit finalized
    res = await fetch(`${API_BASE}/patients/${patientId}/`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${tokenMed}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rapport_medical: "Second edit" })
    });
    console.log("Medecin blocked edit response (should be 403):", res.status, await res.text());

    // 4. Medecin requests modification
    res = await fetch(`${API_BASE}/patients/${patientId}/request-modification/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tokenMed}`, "Content-Type": "application/json" },
    });
    console.log("Medecin request modification response:", res.status, await res.text());

    // 5. Chef approves modification
    res = await fetch(`${API_BASE}/patients/${patientId}/accept-modification/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tokenChef}`, "Content-Type": "application/json" },
    });
    console.log("Chef approve modification response:", res.status, await res.text());

    // 6. Medecin edits after approval
    res = await fetch(`${API_BASE}/patients/${patientId}/`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${tokenMed}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rapport_medical: "Edit after approval", status: "termine" })
    });
    console.log("Medecin final edit response (should be 200/201):", res.status, await res.text());
}

run().catch(console.error);
