"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    fetchPatients, fetchActivity, fetchDailyStats, updatePatient, deletePatient as apiDeletePatient,
    fetchPendingUsers, approveUser, rejectUser,
    acceptModification,
    logout, getCurrentUser,
    type PatientAPI, type ActivityLogAPI, type UserProfile, type DailyStats,
} from "../lib/api";

export default function AdminDashboard() {
    const router = useRouter();
    const [patients, setPatients] = useState<PatientAPI[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogAPI[]>([]);
    const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);


    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<PatientAPI | null>(null);
    const [activeTab, setActiveTab] = useState<"patients" | "activity" | "pending" | "stats">("patients");

    // Stats state
    const [statsPeriod, setStatsPeriod] = useState<"day" | "month" | "year">("day");
    const [statsDate, setStatsDate] = useState(new Date().toISOString().split("T")[0]);
    const [statsMonth, setStatsMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
    const [statsYear, setStatsYear] = useState(String(new Date().getFullYear()));
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Load data
    const loadData = useCallback(async () => {
        try {
            const [p, a, pu] = await Promise.all([fetchPatients(), fetchActivity(), fetchPendingUsers()]);
            setPatients(p);
            setActivityLog(a);
            setPendingUsers(pu);
        } catch { console.error("Erreur chargement"); }
    }, []);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) { router.push("/"); return; }
        setCurrentUser(user);
        loadData();
    }, [loadData, router]);

    // Stats
    const todayStr = new Date().toISOString().split("T")[0];
    const todayActivity = activityLog.filter(l => l.timestamp.startsWith(todayStr)).length;
    const patientsByUnite = (unite: string) => patients.filter(p => p.unite === unite).length;

    // Load stats
    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            let dateVal = "";
            if (statsPeriod === "day") dateVal = statsDate;
            else if (statsPeriod === "month") dateVal = statsMonth;
            else dateVal = statsYear;
            const data = await fetchDailyStats(dateVal, statsPeriod);
            setStats(data);
        } catch { console.error("Erreur stats"); }
        setStatsLoading(false);
    }, [statsPeriod, statsDate, statsMonth, statsYear]);

    useEffect(() => {
        if (activeTab === "stats") loadStats();
    }, [activeTab, loadStats]);

    const filteredPatients = patients.filter((patient) => {
        const term = searchTerm.toLowerCase();
        return (
            patient.numero_dossier.toLowerCase().includes(term) ||
            patient.nom.toLowerCase().includes(term) ||
            patient.prenom.toLowerCase().includes(term) ||
            (patient.unite || "").toLowerCase().includes(term)
        );
    });

    const handleEdit = (patient: PatientAPI) => {
        setEditForm({ ...patient });
        setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!editForm) return;
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!editForm) return;
        try {
            await updatePatient(editForm.id, {
                numero_dossier: editForm.numero_dossier,
                nom: editForm.nom,
                prenom: editForm.prenom,
                date_naissance: editForm.date_naissance,
                lieu_naissance: editForm.lieu_naissance,
                genre: editForm.genre,
                situation: editForm.situation,
                telephone: editForm.telephone,
                profession: editForm.profession,
                unite: editForm.unite,
            });
            setIsEditing(false);
            setEditForm(null);
            await loadData();
        } catch (err) { console.error(err); }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm(null);
    };

    const handleDelete = async (patient: PatientAPI) => {
        if (confirm(`Supprimer le dossier de ${patient.nom} ${patient.prenom} ?`)) {
            try {
                await apiDeletePatient(patient.id);
                await loadData();
            } catch (err) { console.error(err); }
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleApprove = async (user: UserProfile) => {
        if (confirm(`Approuver le compte de ${user.first_name} ${user.last_name} ?`)) {
            try {
                await approveUser(user.id);
                await loadData();
            } catch (err: any) {
                console.error(err);
                alert(err.message || "Erreur lors de l'approbation");
            }
        }
    };

    const handleReject = async (user: UserProfile) => {
        if (confirm(`Rejeter la demande de ${user.first_name} ${user.last_name} ? Le compte sera supprimé.`)) {
            try {
                await rejectUser(user.id);
                await loadData();
            } catch (err: any) {
                console.error(err);
                alert(err.message || "Erreur lors du rejet");
            }
        }
    };

    const handleAcceptModification = async (patient: PatientAPI) => {
        if (confirm(`Autoriser la modification du dossier de ${patient.nom} ${patient.prenom} ?`)) {
            try {
                await acceptModification(patient.id);
                await loadData();
            } catch (err: any) {
                console.error(err);
                alert(err.message || "Erreur lors de l'autorisation");
            }
        }
    };

    // Format timestamp for activity log display
    const formatTimestamp = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    };

    const actionLabels: Record<string, { label: string; color: string }> = {
        create: { label: "Création", color: "bg-emerald-500/20 text-emerald-300" },
        update: { label: "Modification", color: "bg-amber-500/20 text-amber-300" },
        delete: { label: "Suppression", color: "bg-red-500/20 text-red-300" },
        assign: { label: "Assignation", color: "bg-blue-500/20 text-blue-300" },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-gray-400 text-sm">Gestion complète du système</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/medecin"
                            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl transition-all duration-300 shrink-0"
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="whitespace-nowrap hidden sm:inline">Espace Médecin</span>
                        </Link>
                        <Link
                            href="/secretaire"
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-all duration-300 shrink-0"
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="whitespace-nowrap hidden sm:inline">Espace Secrétaire</span>
                        </Link>

                        <div className="h-8 w-px bg-white/10 hidden md:block mx-2"></div>

                        {/* Profile Section */}
                        {currentUser && (
                            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-amber-500/20 uppercase">
                                    {currentUser.first_name?.[0] || ""}{currentUser.last_name?.[0] || ""}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-xs font-bold leading-tight capitalize">{currentUser.first_name} {currentUser.last_name}</span>
                                    <span className="text-amber-400 text-[10px] leading-tight font-medium">{currentUser.role_display}</span>
                                </div>
                                <div className="h-4 w-px bg-white/10 mx-1"></div>
                                <div className="flex flex-col items-end justify-center">
                                    <span className="text-gray-400 text-[10px] leading-tight">{currentUser.email}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-300 rounded-xl transition-all duration-300"
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
                {/* Statistics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
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
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Thanatologie</p>
                                <p className="text-3xl font-bold text-white mt-1">{patientsByUnite("Thanatologie")}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Dommage Corporel</p>
                                <p className="text-3xl font-bold text-white mt-1">{patientsByUnite("Dommage Corporel")}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Activité aujourd&apos;hui</p>
                                <p className="text-3xl font-bold text-white mt-1">{todayActivity}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Journal d&apos;activité</p>
                                <p className="text-3xl font-bold text-white mt-1">{activityLog.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setActiveTab("patients")}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "patients"
                            ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/30"
                            : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                            }`}
                    >
                        📋 Gestion des Patients
                    </button>
                    <button
                        onClick={() => setActiveTab("activity")}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "activity"
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                            : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                            }`}
                    >
                        📊 Journal d&apos;activité
                    </button>
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === "pending"
                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                            : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                            }`}
                    >
                        👤 Demandes d&apos;inscription
                        {pendingUsers.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                {pendingUsers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "stats"
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                            }`}
                    >
                        📊 Statistiques
                    </button>
                </div>

                {/* PATIENTS TAB */}
                {activeTab === "patients" && (
                    <>
                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Rechercher un patient (nom, prénom, numéro de dossier)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Edit Modal */}
                        {isEditing && editForm && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-white">Modifier le patient</h2>
                                        <button onClick={handleCancel} className="text-gray-400 hover:text-white">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">N° Dossier</label>
                                            <input type="text" name="numero_dossier" value={editForm.numero_dossier} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Nom</label>
                                            <input type="text" name="nom" value={editForm.nom} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Prénom</label>
                                            <input type="text" name="prenom" value={editForm.prenom} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Date de naissance</label>
                                            <input type="date" name="date_naissance" value={editForm.date_naissance} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Lieu de naissance</label>
                                            <input type="text" name="lieu_naissance" value={editForm.lieu_naissance} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Genre</label>
                                            <select name="genre" value={editForm.genre} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option value="Masculin" className="bg-slate-800">Masculin</option>
                                                <option value="Féminin" className="bg-slate-800">Féminin</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Situation</label>
                                            <select name="situation" value={editForm.situation} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option value="Célibataire" className="bg-slate-800">Célibataire</option>
                                                <option value="Marié(e)" className="bg-slate-800">Marié(e)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Téléphone</label>
                                            <input type="tel" name="telephone" value={editForm.telephone} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Profession</label>
                                            <select name="profession" value={editForm.profession} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option value="Étudiant" className="bg-slate-800">Étudiant</option>
                                                <option value="Employé" className="bg-slate-800">Employé</option>
                                                <option value="Sans emploi" className="bg-slate-800">Sans emploi</option>
                                                <option value="Autre" className="bg-slate-800">Autre</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Unité</label>
                                            <select name="unite" value={editForm.unite || ""} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option value="" className="bg-slate-800">-- Aucune --</option>
                                                <option value="Thanatologie" className="bg-slate-800">Thanatologie</option>
                                                <option value="Dommage Corporel" className="bg-slate-800">Dommage Corporel</option>
                                                <option value="Imagerie ML" className="bg-slate-800">Imagerie ML</option>
                                                <option value="Médecine P" className="bg-slate-800">Médecine Pénitentiaire</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 flex space-x-4 mt-4">
                                            <button type="button" onClick={handleCancel} className="flex-1 py-3 px-6 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300">
                                                Annuler
                                            </button>
                                            <button type="button" onClick={handleSave} className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300">
                                                Sauvegarder les modifications
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Patients table */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Tous les patients</h2>
                                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm">Accès complet</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">N° Dossier</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Nom & Prénom</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Genre</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Téléphone</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Unité</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredPatients.map((patient) => (
                                            <tr key={patient.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-sm text-emerald-400 font-mono">{patient.numero_dossier}</td>
                                                <td className="px-6 py-4 text-sm text-white">{patient.nom} {patient.prenom}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${patient.genre === "Masculin" ? "bg-blue-500/20 text-blue-300" : "bg-pink-500/20 text-pink-300"}`}>
                                                        {patient.genre}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">{patient.telephone}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        {patient.unite ? (
                                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs w-fit">{patient.unite}</span>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                        {patient.status === 'termine' && (
                                                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs w-fit">Validé</span>
                                                        )}
                                                        {patient.status === 'demande_modification' && (
                                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs w-fit animate-pulse border border-purple-500/50">Demande Modif.</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {patient.status === 'demande_modification' && (
                                                            <button
                                                                onClick={() => handleAcceptModification(patient)}
                                                                className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all duration-300 flex items-center space-x-1"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="text-xs">Accepter Modif.</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(patient)}
                                                            className="px-3 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-all duration-300 flex items-center space-x-1"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            <span className="text-xs">Modifier</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(patient)}
                                                            className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300 flex items-center space-x-1"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            <span className="text-xs">Supprimer</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ACTIVITY LOG TAB */}
                {activeTab === "activity" && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Journal d&apos;activité</h2>
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">{activityLog.length} entrées</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[...activityLog].reverse().map((log) => {
                                const actionInfo = actionLabels[log.action] || { label: log.action, color: "bg-gray-500/20 text-gray-300" };
                                return (
                                    <div key={log.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionInfo.color}`}>
                                                    {actionInfo.label}
                                                </span>
                                                <span className="text-white font-medium">{log.patient_name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-400">{log.user}</span>
                                                <span className="text-gray-500">{formatTimestamp(log.timestamp)}</span>
                                            </div>
                                        </div>
                                        {log.details && (
                                            <p className="mt-1 text-sm text-gray-400 ml-[calc(0.75rem+4px)]">{log.details}</p>
                                        )}
                                    </div>
                                );
                            })}
                            {activityLog.length === 0 && (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    Aucune activité enregistrée
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PENDING USERS TAB */}
                {activeTab === "pending" && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Demandes d&apos;inscription</h2>
                            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">{pendingUsers.length} en attente</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {pendingUsers.map((user) => (
                                <div key={user.id} className="px-6 py-5 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                                {(user.first_name?.[0] || "").toUpperCase()}{(user.last_name?.[0] || "").toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                                    <span>@{user.username}</span>
                                                    <span>•</span>
                                                    <span>{user.email}</span>
                                                    <span>•</span>
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs">{user.role_display}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApprove(user)}
                                                className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-all duration-300 flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-sm">Approuver</span>
                                            </button>
                                            <button
                                                onClick={() => handleReject(user)}
                                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300 flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span className="text-sm">Rejeter</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pendingUsers.length === 0 && (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg">Aucune demande en attente</p>
                                    <p className="text-sm mt-1">Toutes les demandes d&apos;inscription ont été traitées</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STATS TAB */}
                {activeTab === "stats" && (
                    <div className="space-y-6">
                        {/* Period selector */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex gap-2">
                                    {(["day", "month", "year"] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setStatsPeriod(p)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${statsPeriod === p
                                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                                                : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                                                }`}
                                        >
                                            {p === "day" ? "Jour" : p === "month" ? "Mois" : "Année"}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    {statsPeriod === "day" && (
                                        <input type="date" value={statsDate} onChange={(e) => setStatsDate(e.target.value)}
                                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    )}
                                    {statsPeriod === "month" && (
                                        <input type="month" value={statsMonth} onChange={(e) => setStatsMonth(e.target.value)}
                                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    )}
                                    {statsPeriod === "year" && (
                                        <select value={statsYear} onChange={(e) => setStatsYear(e.target.value)}
                                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                <option key={y} value={y} className="bg-slate-800">{y}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button onClick={loadStats}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-300 text-sm font-semibold">
                                        Charger
                                    </button>
                                </div>
                            </div>
                        </div>

                        {statsLoading ? (
                            <div className="text-center text-gray-400 py-12">Chargement des statistiques...</div>
                        ) : stats ? (
                            <>
                                {/* Summary row */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                        <p className="text-gray-400 text-sm">Période</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stats.date}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                        <p className="text-gray-400 text-sm">Total Patients</p>
                                        <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.total}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                        <p className="text-gray-400 text-sm">Police</p>
                                        <p className="text-3xl font-bold text-blue-400 mt-1">{stats.police}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                        <p className="text-gray-400 text-sm">Gendarmerie</p>
                                        <p className="text-3xl font-bold text-amber-400 mt-1">{stats.gendarmerie}</p>
                                    </div>
                                </div>

                                {/* CBV / ADC / AVP breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(["cbv", "adc", "avp"] as const).map((type) => {
                                        const s = stats[type];
                                        const label = type === "cbv" ? "CBV – Coups et Blessures" : type === "adc" ? "ADC – Accident Circulation" : "AVP – Accident Voie Publique";
                                        const color = type === "cbv" ? "red" : type === "adc" ? "amber" : "blue";
                                        return (
                                            <div key={type} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                                <h3 className={`text-lg font-bold text-${color}-400 mb-4`}>{label}</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="text-white font-bold text-lg">{s.total}</span></div>
                                                    <hr className="border-white/10" />
                                                    <div className="flex justify-between"><span className="text-gray-400">Mineurs (&lt;18)</span><span className="text-white">{s.mineur}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400">Adultes (≥18)</span><span className="text-white">{s.adulte}</span></div>
                                                    <hr className="border-white/10" />
                                                    <div className="flex justify-between"><span className="text-gray-400">Féminin</span><span className="text-pink-400">{s.feminin}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400">Masculin</span><span className="text-blue-400">{s.masculin}</span></div>
                                                    <hr className="border-white/10" />
                                                    <div className="flex justify-between"><span className="text-gray-400">ITT = 0</span><span className="text-white">{s.itt_0}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400">ITT ≤ 90j</span><span className="text-white">{s.itt_le_90}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400">ITT &gt; 90j</span><span className="text-white">{s.itt_gt_90}</span></div>
                                                    {type === "cbv" && s.auteurs && Object.keys(s.auteurs).length > 0 && (
                                                        <>
                                                            <hr className="border-white/10" />
                                                            <p className="text-gray-400 font-medium">Auteurs:</p>
                                                            {Object.entries(s.auteurs).map(([k, v]) => (
                                                                <div key={k} className="flex justify-between"><span className="text-gray-400 pl-2">{k}</span><span className="text-white">{v as number}</span></div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-500 py-12">Sélectionnez une période et cliquez sur &quot;Charger&quot;</div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
