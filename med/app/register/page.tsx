"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, CHEF_SERVICE_INFO } from "../lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        role: "medecin",
        password: "",
        password_confirm: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const data = await register(form);
            setSuccess(data.detail);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10 w-full max-w-2xl mx-4 flex flex-col items-center">
                {/* Header institutionnel */}
                <div className="text-center mb-8">
                    <p className="text-2xl font-bold text-white mb-1" dir="rtl">المركز الإستشفائي الجامعي - تلمسان</p>
                    <p className="text-xl font-semibold text-emerald-400 mb-3">CENTRE HOSPITALIER UNIVERSITAIRE - TLEMCEN</p>
                    <p className="text-lg text-gray-300" dir="rtl">مصلحة الطب الشرعي وقانون الطب والأخلاقيات</p>
                    <p className="text-base text-gray-400">SERVICE DE MÉDECINE LÉGALE, DROIT MÉDICAL ET ETHIQUE</p>
                </div>

                {/* Glass card */}
                <div className="w-full max-w-lg">
                    <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-white mb-1">Créer un compte</h1>
                            <p className="text-gray-300 text-sm">Votre compte sera activé après validation par le chef de service</p>
                            <p className="text-emerald-400 text-xs mt-1 font-medium">
                                {CHEF_SERVICE_INFO.prenom} {CHEF_SERVICE_INFO.nom} ({CHEF_SERVICE_INFO.email})
                            </p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-start space-x-2">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="whitespace-pre-line">{error}</span>
                            </div>
                        )}

                        {/* Success message */}
                        {success && (
                            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex flex-col items-center space-y-3">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{success}</span>
                                </div>
                                <button
                                    onClick={() => router.push("/")}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all duration-300 text-sm font-medium"
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        )}

                        {/* Form */}
                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Nom & Prénom */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-200">Nom</label>
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                                            placeholder="Nom"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-200">Prénom</label>
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                                            placeholder="Prénom"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-200">Nom d&apos;utilisateur</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={form.username}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                                            placeholder="Choisissez un nom d'utilisateur"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-200">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                                            placeholder="votre.email@exemple.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-200">Rôle</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                                    >
                                        <option value="medecin" className="bg-slate-800">Médecin</option>
                                        <option value="secretaire" className="bg-slate-800">Secrétaire</option>
                                    </select>
                                </div>

                                {/* Passwords */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-200">Mot de passe</label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                                            placeholder="••••••••"
                                            required
                                            minLength={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-200">Confirmer</label>
                                        <input
                                            type="password"
                                            id="password_confirm"
                                            name="password_confirm"
                                            value={form.password_confirm}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                                            placeholder="••••••••"
                                            required
                                            minLength={4}
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Inscription en cours...</span>
                                        </div>
                                    ) : (
                                        "S'inscrire"
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Back to login */}
                        {!success && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => router.push("/")}
                                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    ← Déjà un compte ? Se connecter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
