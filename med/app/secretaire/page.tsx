"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchPatients, createPatient, logout, getCurrentUser, type PatientAPI, type UserProfile } from "../lib/api";

export default function SecretaireDashboard() {
    const router = useRouter();
    const [patients, setPatients] = useState<PatientAPI[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        numeroDossier: "",
        nom: "",
        prenom: "",
        dateNaissance: "",
        lieuNaissance: "",
        genre: "" as "" | "Masculin" | "Féminin",
        situation: "" as "" | "Célibataire" | "Marié(e)",
        telephone: "",
        profession: "" as "" | "Étudiant" | "Employé" | "Sans emploi" | "Autre",
        typeConsultation: "" as "" | "CBV" | "ADC" | "AVP",
        auteurAgression: "",
        autoriteRequerante: "" as "" | "Police" | "Gendarmerie",
    });

    // Load patients from API
    const loadPatients = useCallback(async () => {
        try {
            const data = await fetchPatients();
            setPatients(data);
        } catch {
            console.error("Erreur chargement patients");
        }
    }, []);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) { router.push("/"); return; }
        setCurrentUser(user);
        loadPatients();
    }, [loadPatients, router]);

    // Générer un numéro de dossier automatique
    useEffect(() => {
        if (showForm && !formData.numeroDossier) {
            const year = new Date().getFullYear();
            const nextNum = String(patients.length + 1).padStart(3, "0");
            setFormData(prev => ({ ...prev, numeroDossier: `DOS-${year}-${nextNum}` }));
        }
    }, [showForm, patients.length, formData.numeroDossier]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await createPatient({
                numero_dossier: formData.numeroDossier,
                nom: formData.nom,
                prenom: formData.prenom,
                date_naissance: formData.dateNaissance || undefined,
                lieu_naissance: formData.lieuNaissance,
                genre: formData.genre,
                situation: formData.situation,
                telephone: formData.telephone,
                profession: formData.profession,
                type_consultation: formData.typeConsultation || undefined,
                auteur_agression: formData.auteurAgression || undefined,
                autorite_requerante: formData.autoriteRequerante || undefined,
            });
            setSuccess(`Patient ${formData.prenom} ${formData.nom} enregistré avec succès !`);
            setShowForm(false);
            setFormData({
                numeroDossier: "",
                nom: "",
                prenom: "",
                dateNaissance: "",
                lieuNaissance: "",
                genre: "",
                situation: "",
                telephone: "",
                profession: "",
                typeConsultation: "",
                auteurAgression: "",
                autoriteRequerante: "",
            });
            await loadPatients();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error(err);
            setSuccess("Erreur lors de l'enregistrement.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Espace Secrétaire</h1>
                            <p className="text-sm text-gray-400">Gestion des dossiers patients</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {currentUser?.role === "chef_service" && (
                            <Link
                                href="/admin"
                                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-all duration-300 flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Dashboard Admin</span>
                            </Link>
                        )}
                        
                        <div className="h-8 w-px bg-white/10 hidden md:block mx-2"></div>

                        {/* Profile Section */}
                        {currentUser && (
                            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-500/20 uppercase">
                                    {currentUser.first_name?.[0] || ""}{currentUser.last_name?.[0] || ""}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-xs font-bold leading-tight capitalize">{currentUser.first_name} {currentUser.last_name}</span>
                                    <span className="text-blue-400 text-[10px] leading-tight font-medium">{currentUser.role_display}</span>
                                </div>
                                <div className="h-4 w-px bg-white/10 mx-1"></div>
                                <div className="flex flex-col items-end justify-center">
                                    <span className="text-gray-400 text-[10px] leading-tight">{currentUser.email}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Success message */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{success}</span>
                    </div>
                )}

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Patients</p>
                                <p className="text-3xl font-bold text-white mt-1">{patients.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Ajoutés aujourd&apos;hui</p>
                                <p className="text-3xl font-bold text-white mt-1">0</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Dossiers ce mois</p>
                                <p className="text-3xl font-bold text-white mt-1">{patients.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action button */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>{showForm ? "Annuler" : "Nouveau Patient"}</span>
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Enregistrer un nouveau patient</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Numéro de dossier */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Numéro de dossier</label>
                                <input
                                    type="text"
                                    name="numeroDossier"
                                    value={formData.numeroDossier}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    readOnly
                                />
                            </div>

                            {/* Nom */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Nom <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            {/* Prénom */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Prénom <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            {/* Date de naissance */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Date de naissance</label>
                                <input
                                    type="date"
                                    name="dateNaissance"
                                    value={formData.dateNaissance}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Lieu de naissance */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Lieu de naissance</label>
                                <input
                                    type="text"
                                    name="lieuNaissance"
                                    value={formData.lieuNaissance}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Genre */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Genre <span className="text-red-400">*</span></label>
                                <select
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="" disabled className="bg-slate-800">-- Sélectionnez --</option>
                                    <option value="Masculin" className="bg-slate-800">Masculin</option>
                                    <option value="Féminin" className="bg-slate-800">Féminin</option>
                                </select>
                            </div>

                            {/* Situation */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Situation</label>
                                <select
                                    name="situation"
                                    value={formData.situation}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" className="bg-slate-800">-- Sélectionnez --</option>
                                    <option value="Célibataire" className="bg-slate-800">Célibataire</option>
                                    <option value="Marié(e)" className="bg-slate-800">Marié(e)</option>
                                </select>
                            </div>

                            {/* Téléphone */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Numéro de téléphone</label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Profession */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Profession</label>
                                <select
                                    name="profession"
                                    value={formData.profession}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" className="bg-slate-800">-- Sélectionnez --</option>
                                    <option value="Étudiant" className="bg-slate-800">Étudiant</option>
                                    <option value="Employé" className="bg-slate-800">Employé</option>
                                    <option value="Sans emploi" className="bg-slate-800">Sans emploi</option>
                                    <option value="Autre" className="bg-slate-800">Autre</option>
                                </select>
                            </div>

                            {/* Type de consultation */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Type de consultation</label>
                                <select
                                    name="typeConsultation"
                                    value={formData.typeConsultation}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" className="bg-slate-800">-- Aucun --</option>
                                    <option value="CBV" className="bg-slate-800">CBV - Coups et Blessures</option>
                                    <option value="ADC" className="bg-slate-800">ADC - Accident de Circulation</option>
                                    <option value="AVP" className="bg-slate-800">AVP - Accident Voie Publique</option>
                                </select>
                            </div>

                            {/* Autorité requérante */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white">Autorité requérante</label>
                                <select
                                    name="autoriteRequerante"
                                    value={formData.autoriteRequerante}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" className="bg-slate-800">-- Aucune --</option>
                                    <option value="Police" className="bg-slate-800">Police</option>
                                    <option value="Gendarmerie" className="bg-slate-800">Gendarmerie</option>
                                </select>
                            </div>

                            {/* Auteur agression (CBV) */}
                            {formData.typeConsultation === "CBV" && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-white">Auteur de l&apos;agression</label>
                                    <select
                                        name="auteurAgression"
                                        value={formData.auteurAgression}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="" className="bg-slate-800">-- Sélectionnez --</option>
                                        <option value="Voisin" className="bg-slate-800">Voisin</option>
                                        <option value="Cousin" className="bg-slate-800">Cousin</option>
                                        <option value="Conjoint" className="bg-slate-800">Conjoint</option>
                                        <option value="Parent" className="bg-slate-800">Parent</option>
                                        <option value="Frère/Sœur" className="bg-slate-800">Frère/Sœur</option>
                                        <option value="Inconnu" className="bg-slate-800">Inconnu</option>
                                        <option value="Autre" className="bg-slate-800">Autre</option>
                                    </select>
                                </div>
                            )}

                            {/* Submit button */}
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Enregistrement...</span>
                                        </div>
                                    ) : (
                                        "Enregistrer le patient"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Patients table */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">Liste des patients</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">N° Dossier</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Nom & Prénom</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date de naissance</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Genre</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Téléphone</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Profession</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-emerald-400 font-mono">{patient.numero_dossier}</td>
                                        <td className="px-6 py-4 text-sm text-white">{patient.nom} {patient.prenom}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{patient.date_naissance}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${patient.genre === "Masculin" ? "bg-blue-500/20 text-blue-300" : "bg-pink-500/20 text-pink-300"}`}>
                                                {patient.genre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{patient.telephone}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{patient.profession}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
