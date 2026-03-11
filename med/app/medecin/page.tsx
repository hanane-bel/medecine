"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AutopsieForm from "./components/AutopsieForm";
import LeveeDeCorpsForm from "./components/LeveeDeCorpsForm";
import CorpsEnDepotsForm from "./components/CorpsEnDepotsForm";
import ConsultationForm from "./components/ConsultationForm";
import ExpertiseForm from "./components/ExpertiseForm";
import GavForm from "./components/GavForm";
import { useFormDataStore } from "../store/formDataStore";
import {
    fetchPatients, createPatient, fetchDailyStats, fetchActivity,
    requestModification,
    logout as apiLogout, getCurrentUser,
    type PatientAPI, type DailyStats, type ActivityLogAPI, type UserProfile,
} from "../lib/api";

// Types pour les unités
type Unite = "thanatologie" | "dommage_corporel" | "imagerie_ml" | "medecine_p";

interface UniteInfo {
    id: Unite;
    nom: string;
    description: string;
    icon: string;
    color: string;
}

const UNITES: UniteInfo[] = [
    {
        id: "thanatologie",
        nom: "Unité 1 : Thanatologie",
        description: "Étude des signes de la mort et des cadavres",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        color: "from-red-500 to-rose-600",
    },
    {
        id: "dommage_corporel",
        nom: "Unité 2 : Dommage Corporel & Expertise",
        description: "Évaluation des préjudices corporels et expertises médicales",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
        color: "from-amber-500 to-orange-600",
    },
    {
        id: "imagerie_ml",
        nom: "Unité 3 : Imagerie Médico-Légale",
        description: "Analyse d'images médicales à des fins légales",
        icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
        color: "from-blue-500 to-indigo-600",
    },
    {
        id: "medecine_p",
        nom: "Unité 4 : Médecine Pénitentiaire",
        description: "Soins médicaux en milieu carcéral",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        color: "from-emerald-500 to-teal-600",
    },
];

// Sous-unités pour Thanatologie
type SousUniteThanato = "corps_depots" | "autopsie" | "levee_corps" | "anthropologie";

interface SousUniteInfo {
    id: SousUniteThanato;
    nom: string;
    description: string;
    icon: string;
}

const SOUS_UNITES_THANATO: SousUniteInfo[] = [
    {
        id: "corps_depots",
        nom: "1 - Corps en dépôts",
        description: "Gestion des corps en attente d'identification ou de réclamation",
        icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },

    {
        id: "autopsie",
        nom: "2 - Autopsie",
        description: "Examen post-mortem pour déterminer la cause du décès",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
        id: "levee_corps",
        nom: "3 - Levée de corps",
        description: "Constatation et documentation sur le lieu du décès",
        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
        id: "anthropologie",
        nom: "4 - Anthropologie",
        description: "Étude anthropologique médico-légale",
        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
];

// Sous-unités pour Dommage Corporel
type SousUniteDommage = "consultation" | "expertise" | "gav";

interface SousUniteDommageInfo {
    id: SousUniteDommage;
    nom: string;
    description: string;
    icon: string;
}

const SOUS_UNITES_DOMMAGE: SousUniteDommageInfo[] = [
    {
        id: "consultation",
        nom: "1 - Consultation",
        description: "Consultation médicale pour évaluation des dommages corporels",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    },
    {
        id: "expertise",
        nom: "2 - Expertise",
        description: "Expertise médico-légale incluant les agressions sexuelles (femme/homme)",
        icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7",
    },
    {
        id: "gav",
        nom: "3 - GAV",
        description: "Examen médical en garde à vue",
        icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    },
];

export default function MedecinDashboard() {
    const router = useRouter();
    const [patients, setPatients] = useState<PatientAPI[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogAPI[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
    const [selectedUnite, setSelectedUnite] = useState<Unite | null>(null);
    const [selectedSousUnite, setSelectedSousUnite] = useState<SousUniteThanato | SousUniteDommage | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [showResults, setShowResults] = useState<boolean>(false);
    const [showStats, setShowStats] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    // Stats
    const todayStr = new Date().toISOString().split("T")[0];
    const [statsHistoryDate, setStatsHistoryDate] = useState<string>(todayStr);

    // Load data from API
    const loadData = useCallback(async () => {
        try {
            const [patientsData, activityData, statsData] = await Promise.all([
                fetchPatients(),
                fetchActivity(),
                fetchDailyStats(statsHistoryDate),
            ]);
            setPatients(patientsData);
            setActivityLog(activityData);
            setDailyStats(statsData);
        } catch (err) {
            console.error("Erreur chargement données:", err);
        }
    }, [statsHistoryDate]);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) { router.push("/"); return; }
        setCurrentUser(user);
        loadData();
    }, [loadData, router]);

    // Reload stats when date changes
    useEffect(() => {
        fetchDailyStats(statsHistoryDate).then(setDailyStats).catch(console.error);
    }, [statsHistoryDate]);

    const todayActivity = activityLog.filter(l => l.timestamp.startsWith(todayStr)).length;
    const patientsByUnite = (unite: string) => patients.filter(p => p.unite === unite).length;

    // Stats from API
    const cbvStats = dailyStats?.cbv ?? { total: 0, mineur: 0, adulte: 0, feminin: 0, masculin: 0, itt_0: 0, itt_le_90: 0, itt_gt_90: 0 };
    const adcStats = dailyStats?.adc ?? { total: 0, mineur: 0, adulte: 0, feminin: 0, masculin: 0, itt_0: 0, itt_le_90: 0, itt_gt_90: 0 };
    const avpStats = dailyStats?.avp ?? { total: 0, mineur: 0, adulte: 0, feminin: 0, masculin: 0, itt_0: 0, itt_le_90: 0, itt_gt_90: 0 };
    const auteurCounts: Record<string, number> = (dailyStats?.cbv as { auteurs?: Record<string, number> })?.auteurs ?? {};
    const policeCount = dailyStats?.police ?? 0;
    const gendarmerieCount = dailyStats?.gendarmerie ?? 0;
    const totalDuJour = dailyStats?.total ?? 0;

    // Get the full selected patient object
    const selectedPatientData = patients.find(p => String(p.id) === selectedPatient);

    // Filtrer les patients selon la recherche (nom, prénom ou date de naissance)
    const filteredPatients = patients.filter((patient) => {
        const query = searchQuery.toLowerCase();
        const formattedDate = new Date(patient.date_naissance).toLocaleDateString("fr-FR");
        return (
            patient.nom.toLowerCase().includes(query) ||
            patient.prenom.toLowerCase().includes(query) ||
            patient.date_naissance.includes(query) ||
            formattedDate.includes(query)
        );
    });

    const handleSelectPatient = (patientId: string) => {
        setSelectedPatient(patientId);
        const patient = patients.find(p => String(p.id) === patientId);
        if (patient) {
            setSearchQuery(`${patient.nom} ${patient.prenom}`);
        }
        setShowResults(false);
    };

    const handleLogout = () => {
        useFormDataStore.getState().clearAll();
        apiLogout();
    };

    const handleUniteSelect = (unite: Unite) => {
        setSelectedUnite(unite);
        setSelectedSousUnite(null);
    };

    const handleSousUniteSelect = (sousUnite: SousUniteThanato | SousUniteDommage) => {
        setSelectedSousUnite(sousUnite);
    };

    const handleBack = () => {
        if (selectedSousUnite) {
            // Retour à la sélection de sous-unité
            setSelectedSousUnite(null);
            setSelectedPatient("");
            setSearchQuery("");
        } else {
            // Retour à la sélection d'unité
            setSelectedUnite(null);
            setSelectedPatient("");
            setSearchQuery("");
        }
    };

    const handleCreateAnonymous = async () => {
        try {
            const numPart = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
            const newPatient = await createPatient({
                numero_dossier: `ANO-${new Date().getFullYear()}-${numPart}`,
                nom: "Anonyme",
                prenom: "Inconnu",
                date_naissance: "1900-01-01",
                lieu_naissance: "Inconnu",
                genre: "Masculin",
                situation: "Célibataire",
                telephone: "0000000000",
                profession: "Autre"
            });
            // Recharger les données pour avoir le nouveau patient dans la liste
            await loadData();
            // Sélectionner le patient nouvellement créé
            handleSelectPatient(String(newPatient.id));
        } catch (error) {
            console.error("Erreur création patient anonyme:", error);
            alert("Erreur lors de la création du cas anonyme.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 print:bg-white print:min-h-0">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 no-print">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Espace Médecin</h1>
                            <p className="text-sm text-gray-400">
                                {selectedUnite
                                    ? UNITES.find(u => u.id === selectedUnite)?.nom
                                    : "Sélection des unités médicales"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {currentUser?.role === "chef_service" && (
                            <button
                                onClick={() => router.push("/admin")}
                                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-all duration-300 flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Dashboard Admin</span>
                            </button>
                        )}
                        {selectedUnite && (
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Retour</span>
                            </button>
                        )}

                        <div className="h-8 w-px bg-white/10 hidden md:block mx-2"></div>

                        {/* Profile Section */}
                        {currentUser && (
                            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-500/20 uppercase">
                                    {currentUser.first_name?.[0] || ""}{currentUser.last_name?.[0] || ""}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-xs font-bold leading-tight capitalize">{currentUser.first_name} {currentUser.last_name}</span>
                                    <span className="text-emerald-400 text-[10px] leading-tight font-medium">{currentUser.role_display}</span>
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

            <main className="max-w-7xl mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">
                {!selectedUnite ? (
                    <>
                        {/* ==================== STATISTIQUES DU JOUR ==================== */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 mb-8 overflow-hidden transition-all duration-300">
                            {/* Clickable header bar */}
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-bold text-white">Statistiques du jour</h2>
                                        <p className="text-xs text-gray-400">
                                            {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                                        {showStats ? "Masquer" : "Afficher"}
                                    </span>
                                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showStats ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Collapsible stats content */}
                            {showStats && (
                                <div className="px-6 pb-6">
                                    {/* Date picker for history */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <label className="text-xs text-gray-400">Date :</label>
                                        <input
                                            type="date"
                                            value={statsHistoryDate}
                                            onChange={(e) => setStatsHistoryDate(e.target.value)}
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                        {statsHistoryDate !== todayStr && (
                                            <button
                                                onClick={() => setStatsHistoryDate(todayStr)}
                                                className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                                            >
                                                Aujourd&apos;hui
                                            </button>
                                        )}
                                        <span className="ml-auto text-xs text-gray-500">
                                            {totalDuJour} patient{totalDuJour > 1 ? "s" : ""} ce jour
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                        {/* ========= CBV ========= */}
                                        <div className="bg-gradient-to-br from-red-500/10 to-red-900/10 rounded-xl p-4 border border-red-500/20">
                                            <h3 className="text-sm font-bold text-red-400 mb-3 text-center border-b border-red-500/20 pb-2">CBV <span className="ml-1 text-white bg-red-500/30 px-1.5 py-0.5 rounded-full text-xs">{cbvStats.total}</span></h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Mineur</span>
                                                    <span className="text-sm font-semibold text-white">{cbvStats.mineur}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Adulte</span>
                                                    <span className="text-sm font-semibold text-white">{cbvStats.adulte}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Féminin</span>
                                                    <span className="text-sm font-semibold text-white">{cbvStats.feminin}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Masculin</span>
                                                    <span className="text-sm font-semibold text-white">{cbvStats.masculin}</span>
                                                </div>
                                                <div className="pt-2 border-t border-red-500/20">
                                                    <label className="text-xs text-gray-400 block mb-1">Auteur</label>
                                                    {Object.keys(auteurCounts).length > 0 ? (
                                                        <div className="space-y-1">
                                                            {Object.entries(auteurCounts).map(([auteur, count]) => (
                                                                <div key={auteur} className="flex items-center justify-between">
                                                                    <span className="text-xs text-gray-500">{auteur}</span>
                                                                    <span className="text-xs font-semibold text-white">{count}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-600">Aucun</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ========= ADC ========= */}
                                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 rounded-xl p-4 border border-amber-500/20">
                                            <h3 className="text-sm font-bold text-amber-400 mb-3 text-center border-b border-amber-500/20 pb-2">ADC <span className="ml-1 text-white bg-amber-500/30 px-1.5 py-0.5 rounded-full text-xs">{adcStats.total}</span></h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Mineur</span>
                                                    <span className="text-sm font-semibold text-white">{adcStats.mineur}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Adulte</span>
                                                    <span className="text-sm font-semibold text-white">{adcStats.adulte}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Féminin</span>
                                                    <span className="text-sm font-semibold text-white">{adcStats.feminin}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Masculin</span>
                                                    <span className="text-sm font-semibold text-white">{adcStats.masculin}</span>
                                                </div>
                                                <div className="pt-2 border-t border-amber-500/20">
                                                    <label className="text-xs text-gray-400 block mb-1">ITT</label>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">0 jour</span>
                                                            <span className="text-xs font-semibold text-white">{adcStats.itt_0}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">≤ 90 jrs</span>
                                                            <span className="text-xs font-semibold text-white">{adcStats.itt_le_90}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">&gt; 90 jrs</span>
                                                            <span className="text-xs font-semibold text-white">{adcStats.itt_gt_90}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ========= AVP ========= */}
                                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 rounded-xl p-4 border border-blue-500/20">
                                            <h3 className="text-sm font-bold text-blue-400 mb-3 text-center border-b border-blue-500/20 pb-2">AVP <span className="ml-1 text-white bg-blue-500/30 px-1.5 py-0.5 rounded-full text-xs">{avpStats.total}</span></h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Mineur</span>
                                                    <span className="text-sm font-semibold text-white">{avpStats.mineur}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Adulte</span>
                                                    <span className="text-sm font-semibold text-white">{avpStats.adulte}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Féminin</span>
                                                    <span className="text-sm font-semibold text-white">{avpStats.feminin}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Masculin</span>
                                                    <span className="text-sm font-semibold text-white">{avpStats.masculin}</span>
                                                </div>
                                                <div className="pt-2 border-t border-blue-500/20">
                                                    <label className="text-xs text-gray-400 block mb-1">ITT</label>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">0 jour</span>
                                                            <span className="text-xs font-semibold text-white">{avpStats.itt_0}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">≤ 90 jrs</span>
                                                            <span className="text-xs font-semibold text-white">{avpStats.itt_le_90}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">&gt; 90 jrs</span>
                                                            <span className="text-xs font-semibold text-white">{avpStats.itt_gt_90}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ========= TOTAL DU JOUR ========= */}
                                        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 rounded-xl p-4 border border-emerald-500/20">
                                            <h3 className="text-sm font-bold text-emerald-400 mb-3 text-center border-b border-emerald-500/20 pb-2">Total du jour</h3>
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-3">
                                                    <span className="text-3xl font-bold text-emerald-300">{totalDuJour}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">consultations</p>
                                                <div className="mt-4 w-full space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">CBV</span>
                                                        <span className="text-sm font-bold text-red-400">{cbvStats.total}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">ADC</span>
                                                        <span className="text-sm font-bold text-amber-400">{adcStats.total}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">AVP</span>
                                                        <span className="text-sm font-bold text-blue-400">{avpStats.total}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
                                                        <span className="text-xs text-gray-400">Activité</span>
                                                        <span className="text-sm font-bold text-white">{todayActivity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ========= AUTORITÉ REQUÉRANTE ========= */}
                                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 rounded-xl p-4 border border-purple-500/20">
                                            <h3 className="text-sm font-bold text-purple-400 mb-3 text-center border-b border-purple-500/20 pb-2">Autorité requérante</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-xs text-gray-300 block">Police</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white bg-blue-500/20 px-2.5 py-1 rounded-lg">{policeCount}</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-xs text-gray-300 block">Gendarmerie</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white bg-green-500/20 px-2.5 py-1 rounded-lg">{gendarmerieCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selection des unités */}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-3">Choisissez une unité</h2>
                            <p className="text-gray-400">Sélectionnez l&apos;unité dans laquelle vous souhaitez travailler</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {UNITES.map((unite) => (
                                <button
                                    key={unite.id}
                                    onClick={() => handleUniteSelect(unite.id)}
                                    className="group bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:bg-white/20 transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${unite.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={unite.icon} />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">{unite.nom}</h3>
                                            <p className="text-gray-400 text-sm">{unite.description}</p>
                                        </div>
                                        <svg className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : selectedUnite === "thanatologie" && !selectedSousUnite ? (
                    <>
                        {/* Sélection des sous-unités de Thanatologie */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${UNITES.find(u => u.id === selectedUnite)?.color} flex items-center justify-center`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={UNITES.find(u => u.id === selectedUnite)?.icon} />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{UNITES.find(u => u.id === selectedUnite)?.nom}</h2>
                                    <p className="text-gray-400">Sélectionnez une sous-unité</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {SOUS_UNITES_THANATO.map((sousUnite) => (
                                    <button
                                        key={sousUnite.id}
                                        onClick={() => handleSousUniteSelect(sousUnite.id)}
                                        className="group bg-white/5 hover:bg-red-500/20 rounded-xl p-5 border border-white/10 hover:border-red-500/50 transition-all duration-300 text-left"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sousUnite.icon} />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-red-300 transition-colors">{sousUnite.nom}</h3>
                                                <p className="text-gray-400 text-xs">{sousUnite.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : selectedUnite === "dommage_corporel" && !selectedSousUnite ? (
                    <>
                        {/* Sélection des sous-unités de Dommage Corporel */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${UNITES.find(u => u.id === selectedUnite)?.color} flex items-center justify-center`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={UNITES.find(u => u.id === selectedUnite)?.icon} />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{UNITES.find(u => u.id === selectedUnite)?.nom}</h2>
                                    <p className="text-gray-400">Sélectionnez une sous-unité</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {SOUS_UNITES_DOMMAGE.map((sousUnite) => (
                                    <button
                                        key={sousUnite.id}
                                        onClick={() => handleSousUniteSelect(sousUnite.id)}
                                        className="group bg-white/5 hover:bg-purple-500/20 rounded-xl p-5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 text-left"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sousUnite.icon} />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{sousUnite.nom}</h3>
                                                <p className="text-gray-400 text-xs">{sousUnite.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Interface de l'unité/sous-unité sélectionnée */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8 no-print">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${UNITES.find(u => u.id === selectedUnite)?.color} flex items-center justify-center`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={UNITES.find(u => u.id === selectedUnite)?.icon} />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {UNITES.find(u => u.id === selectedUnite)?.nom}
                                        {selectedSousUnite && (
                                            <span className="text-red-300"> → {[...SOUS_UNITES_THANATO, ...SOUS_UNITES_DOMMAGE].find(s => s.id === selectedSousUnite)?.nom}</span>
                                        )}
                                    </h2>
                                    <p className="text-gray-400">
                                        {selectedSousUnite
                                            ? [...SOUS_UNITES_THANATO, ...SOUS_UNITES_DOMMAGE].find(s => s.id === selectedSousUnite)?.description
                                            : UNITES.find(u => u.id === selectedUnite)?.description
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Recherche du patient */}
                            <div className="space-y-4 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Rechercher un patient (nom, prénom ou date de naissance)
                                    </label>
                                    {selectedUnite === "thanatologie" && (
                                        <button
                                            onClick={handleCreateAnonymous}
                                            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Nouveau cas anonyme
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowResults(true);
                                            if (e.target.value === "") {
                                                setSelectedPatient("");
                                            }
                                        }}
                                        onFocus={() => setShowResults(true)}
                                        placeholder="Tapez le nom, prénom ou date de naissance..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                {/* Résultats de la recherche */}
                                {showResults && searchQuery && (
                                    <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    type="button"
                                                    onClick={() => handleSelectPatient(String(patient.id))}
                                                    className={`w-full px-4 py-3 text-left hover:bg-emerald-600/30 transition-colors flex items-center justify-between ${selectedPatient === String(patient.id) ? 'bg-emerald-600/20' : ''}`}
                                                >
                                                    <div>
                                                        <p className="text-white font-medium">{patient.nom} {patient.prenom}</p>
                                                        <p className="text-gray-400 text-sm">
                                                            {patient.numero_dossier} • Né(e) le {new Date(patient.date_naissance).toLocaleDateString("fr-FR")}
                                                        </p>
                                                    </div>
                                                    {selectedPatient === String(patient.id) && (
                                                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-gray-400 text-center">
                                                Aucun patient trouvé
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Patient sélectionné */}
                                {selectedPatient && (
                                    <div className="mt-4 p-4 bg-emerald-600/20 border border-emerald-500/30 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {selectedPatientData?.nom} {selectedPatientData?.prenom}
                                                    </p>
                                                    <p className="text-gray-400 text-sm">
                                                        {selectedPatientData?.numero_dossier}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Bouton Demander une modification */}
                                                {selectedPatientData?.status === 'demande_modification' ? (
                                                    <span className="px-3 py-2 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-amber-500/30 animate-pulse">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        En attente d&apos;approbation
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (confirm(`Demander la modification du dossier de ${selectedPatientData?.nom} ${selectedPatientData?.prenom} ?\n\nLe chef de service devra approuver votre demande.`)) {
                                                                try {
                                                                    if (!selectedPatientData?.id) throw new Error("ID du patient manquant");
                                                                    await requestModification(selectedPatientData.id);
                                                                    await loadData();
                                                                    alert("Demande de modification envoyée au chef de service.");
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert("Erreur lors de l'envoi de la demande.");
                                                                }
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 border border-purple-500/30"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Demander une modification
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPatient("");
                                                        setSearchQuery("");
                                                    }}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Formulaire spécifique à l'unité */}
                        {
                            selectedPatient && (
                                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 print:p-0 print:bg-white print:border-none">
                                    <h3 className="text-xl font-bold text-white mb-6 no-print">
                                        Formulaire - {UNITES.find(u => u.id === selectedUnite)?.nom}
                                    </h3>

                                    {/* Unité 1: Thanatologie - Formulaires selon la sous-unité */}
                                    {selectedUnite === "thanatologie" && (
                                        <>
                                            {/* Sous-unité: Autopsie */}
                                            {selectedSousUnite === "autopsie" && (
                                                <AutopsieForm
                                                    patientId={selectedPatient}
                                                    patientName={`${selectedPatientData?.nom} ${selectedPatientData?.prenom}`}
                                                    patientData={selectedPatientData as any}
                                                />
                                            )}

                                            {/* Sous-unité: Levée de corps */}
                                            {selectedSousUnite === "levee_corps" && (
                                                <LeveeDeCorpsForm
                                                    patientId={selectedPatient}
                                                    patientName={`${selectedPatientData?.nom} ${selectedPatientData?.prenom}`}
                                                    patientData={selectedPatientData as any}
                                                />
                                            )}

                                            {/* Sous-unité: Corps en dépôts */}
                                            {selectedSousUnite === "corps_depots" && (
                                                <CorpsEnDepotsForm
                                                    patientId={selectedPatient}
                                                    patientName={`${selectedPatientData?.nom} ${selectedPatientData?.prenom}`}
                                                    patientData={selectedPatientData as any}
                                                />
                                            )}

                                            {/* Autres sous-unités: Formulaire générique */}
                                            {selectedSousUnite && selectedSousUnite !== "autopsie" && selectedSousUnite !== "levee_corps" && selectedSousUnite !== "corps_depots" && (
                                                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-300">Date du décès</label>
                                                        <input type="datetime-local" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-300">Lieu du décès</label>
                                                        <input type="text" placeholder="Lieu du décès" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-300">Cause du décès</label>
                                                        <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                            <option value="" disabled className="bg-slate-800">-- Sélectionnez --</option>
                                                            <option value="naturelle" className="bg-slate-800">Mort naturelle</option>
                                                            <option value="accidentelle" className="bg-slate-800">Mort accidentelle</option>
                                                            <option value="suicide" className="bg-slate-800">Suicide</option>
                                                            <option value="homicide" className="bg-slate-800">Homicide</option>
                                                            <option value="indeterminee" className="bg-slate-800">Indéterminée</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-300">Autopsie réalisée</label>
                                                        <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                            <option value="" disabled className="bg-slate-800">-- Sélectionnez --</option>
                                                            <option value="oui" className="bg-slate-800">Oui</option>
                                                            <option value="non" className="bg-slate-800">Non</option>
                                                            <option value="en_cours" className="bg-slate-800">En cours</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="block text-sm font-medium text-gray-300">Observations</label>
                                                        <textarea rows={4} placeholder="Notes et observations..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <button type="submit" className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-red-500/50 transition-all duration-300">
                                                            Enregistrer le rapport
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </>
                                    )}

                                    {/* Unité 2: Dommage Corporel - Formulaires selon la sous-unité */}
                                    {selectedUnite === "dommage_corporel" && (
                                        <>
                                            {/* Sous-unité: Consultation */}
                                            {selectedSousUnite === "consultation" && (
                                                <ConsultationForm
                                                    patientId={selectedPatient}
                                                    patientName={`${selectedPatientData?.nom} ${selectedPatientData?.prenom}`}
                                                    patientData={selectedPatientData as any}
                                                />
                                            )}

                                            {/* Sous-unité: Expertise */}
                                            {selectedSousUnite === "expertise" && (
                                                <ExpertiseForm
                                                    patientId={selectedPatient}
                                                    patientName={`${selectedPatientData?.nom} ${selectedPatientData?.prenom}`}
                                                    patientData={selectedPatientData as any}
                                                />
                                            )}

                                            {/* Sous-unité: GAV */}
                                            {selectedSousUnite === "gav" && (
                                                <GavForm
                                                    patientId={selectedPatient}
                                                    patientName={`${selectedPatientData?.nom} ${selectedPatientData?.prenom}`}
                                                    patientData={selectedPatientData as any}
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Unité 3: Imagerie ML */}
                                    {selectedUnite === "imagerie_ml" && (
                                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Type d&apos;examen</label>
                                                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                    <option value="" disabled className="bg-slate-800">-- Sélectionnez --</option>
                                                    <option value="radiographie" className="bg-slate-800">Radiographie</option>
                                                    <option value="scanner" className="bg-slate-800">Scanner</option>
                                                    <option value="irm" className="bg-slate-800">IRM</option>
                                                    <option value="echographie" className="bg-slate-800">Échographie</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Date de l&apos;examen</label>
                                                <input type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Région anatomique</label>
                                                <input type="text" placeholder="" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Fichier image</label>
                                                <input type="file" accept="image/*,.dcm" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-white" />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Interprétation</label>
                                                <textarea rows={4} placeholder="Résultats et interprétation de l'imagerie..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <button type="submit" className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
                                                    Enregistrer le rapport d&apos;imagerie
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Unité 4: Médecine Pénitentiaire */}
                                    {selectedUnite === "medecine_p" && (
                                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Établissement pénitentiaire</label>
                                                <input type="text" placeholder="Nom de l'établissement" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Date de consultation</label>
                                                <input type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Motif de consultation</label>
                                                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                    <option value="" disabled className="bg-slate-800">-- Sélectionnez --</option>
                                                    <option value="entree" className="bg-slate-800">Visite d&apos;entrée</option>
                                                    <option value="suivi" className="bg-slate-800">Suivi médical</option>
                                                    <option value="urgence" className="bg-slate-800">Urgence</option>
                                                    <option value="sortie" className="bg-slate-800">Visite de sortie</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">État général</label>
                                                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                    <option value="" disabled className="bg-slate-800">-- Sélectionnez --</option>
                                                    <option value="bon" className="bg-slate-800">Bon</option>
                                                    <option value="moyen" className="bg-slate-800">Moyen</option>
                                                    <option value="mauvais" className="bg-slate-800">Mauvais</option>
                                                    <option value="critique" className="bg-slate-800">Critique</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Observations médicales</label>
                                                <textarea rows={4} placeholder="Notes et observations..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="block text-sm font-medium text-gray-300">Prescriptions</label>
                                                <textarea rows={3} placeholder="Médicaments et traitements prescrits..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <button type="submit" className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300">
                                                    Enregistrer la consultation
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )
                        }
                    </>
                )
                }
            </main >
        </div >
    );
}
