"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, changePassword, setSessionCookie, type UserProfile } from "./lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempUser, setTempUser] = useState<UserProfile | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await login(username, password);

      if (data.user.force_password_change) {
        setTempUser(data.user);
        setRequirePasswordChange(true);
        return;
      }

      setSuccess(`Bienvenue ${data.user.first_name || data.user.username} ! Redirection...`);

      setTimeout(() => {
        switch (data.user.role) {
          case "secretaire":
            router.push("/secretaire");
            break;
          case "medecin":
            router.push("/medecin");
            break;
          case "chef_service":
            router.push("/admin");
            break;
        }
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await changePassword(newPassword, confirmPassword);
      setSuccess(`Mot de passe mis à jour ! Bienvenue ${tempUser?.first_name || tempUser?.username} !`);
      setRequirePasswordChange(false);

      if (tempUser) {
        localStorage.setItem("user", JSON.stringify({ ...tempUser, force_password_change: false }));
        setSessionCookie(tempUser.role);
      }

      setTimeout(() => {
        switch (tempUser?.role) {
          case "secretaire":
            router.push("/secretaire");
            break;
          case "medecin":
            router.push("/medecin");
            break;
          case "chef_service":
            router.push("/admin");
            break;
          default:
            router.push("/");
        }
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de changement de mot de passe");
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

      {/* Header avec texte institutionnel - hors du cadre */}
      <div className="relative z-10 w-full max-w-2xl mx-4 flex flex-col items-center">
        {/* Texte institutionnel */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white mb-1" dir="rtl">المركز الإستشفائي الجامعي - تلمسان</p>
          <p className="text-xl font-semibold text-emerald-400 mb-3">CENTRE HOSPITALIER UNIVERSITAIRE - TLEMCEN</p>
          <p className="text-lg text-gray-300" dir="rtl">مصلحة الطب الشرعي وقانون الطب والأخلاقيات</p>
          <p className="text-base text-gray-400">SERVICE DE MÉDECINE LÉGALE, DROIT MÉDICAL ET ETHIQUE</p>
        </div>

        {/* Glass card - Formulaire de connexion */}
        <div className="w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
            {/* Header du formulaire */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Bienvenue</h1>
              <p className="text-gray-300 text-sm">Connectez-vous à votre compte</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            {!requirePasswordChange ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                    Nom d&apos;utilisateur
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                      placeholder="Entrez votre nom d'utilisateur"
                      required
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                      placeholder="Entrez votre mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">Se souvenir de moi</span>
                  </label>
                  <a href="#" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    Mot de passe oublié ?
                  </a>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Connexion en cours...</span>
                    </div>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl mb-4">
                  <p className="text-sm text-amber-200">
                    Pour des raisons de sécurité, vous devez modifier votre mot de passe temporaire lors de votre première connexion.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Nouveau mot de passe"
                      required
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400"
                    >
                      {showPassword ? "Cacher" : "Voir"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">
                    Confirmez le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Confirmez le mot de passe"
                    required
                    minLength={4}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
                >
                  {isLoading ? "Mise à jour..." : "Mettre à jour & Se connecter"}
                </button>
              </form>
            )}

            {/* Create account link */}
            {!requirePasswordChange && (
              <div className="text-center mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Vous n&apos;avez pas de compte ?</p>
                <button
                  onClick={() => router.push("/register")}
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Créer un compte →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
