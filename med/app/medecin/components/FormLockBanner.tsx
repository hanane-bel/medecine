"use client";

import { requestModification, updatePatient } from "../../lib/api";

interface FormLockBannerProps {
    patientId: string;
    patientStatus?: string;
    canEdit: boolean;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;
    label?: string; // e.g. "formulaire", "certificat", "rapport"
}

/**
 * Shared lock/unlock banner for all medical form components.
 * 3 states based on patient status:
 *   - 'termine'                → Purple "Demander une modification" button
 *   - 'demande_modification'   → Amber pulsing "En attente d'approbation" badge
 *   - '' (normal)              → Purple "Demander une modification" button
 */
export default function FormLockBanner({
    patientId,
    patientStatus,
    canEdit,
    isEditing,
    setIsEditing,
    label = "formulaire",
}: FormLockBannerProps) {
    if (!canEdit) return null;

    const isTermine = patientStatus === "termine";
    const isPending = patientStatus === "demande_modification";
    const isEnCours = !isTermine && !isPending && !isEditing;

    return (
        <div
            className={`${isEditing
                ? "bg-emerald-500/10 border-emerald-500/30"
                : isTermine
                    ? "bg-purple-500/10 border-purple-500/30"
                    : isPending
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-blue-500/10 border-blue-500/30"
                } border rounded-xl p-4 mb-6 flex items-center justify-between no-print transition-all duration-300`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isEditing
                        ? "bg-emerald-500/20 text-emerald-500"
                        : isTermine
                            ? "bg-purple-500/20 text-purple-500"
                            : isPending
                                ? "bg-amber-500/20 text-amber-500"
                                : "bg-blue-500/20 text-blue-500"
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={
                                isEditing
                                    ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            }
                        />
                    </svg>
                </div>
                <div>
                    {isEditing ? (
                        <>
                            <h3 className="text-emerald-400 font-bold">Mode Édition Actif</h3>
                            <p className="text-emerald-400/80 text-sm">
                                Le {label} est déverrouillé. Vous pouvez maintenant le modifier.
                                Cliquez sur Enregistrer pour terminer l'édition actuelle.
                            </p>
                        </>
                    ) : isPending ? (
                        <>
                            <h3 className="text-amber-400 font-bold">
                                Demande de modification en cours
                            </h3>
                            <p className="text-amber-400/80 text-sm">
                                Votre demande est en attente d&apos;approbation par le chef de
                                service. Vous ne pouvez pas éditer pour le moment.
                            </p>
                        </>
                    ) : isTermine ? (
                        <>
                            <h3 className="text-purple-400 font-bold">
                                Dossier Verrouillé
                            </h3>
                            <p className="text-purple-400/80 text-sm">
                                Le {label} est verrouillé car il a été marqué comme terminé. Vous pouvez demander une modification au
                                chef de service pour le débloquer.
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-blue-400 font-bold">
                                Dossier en cours - Prêt pour édition
                            </h3>
                            <p className="text-blue-400/80 text-sm">
                                Le {label} est modifiable. Cliquez sur Éditer pour commencer la saisie.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={async () => {
                            if (confirm("Voulez-vous valider et terminer ce dossier ? Il sera verrouillé.")) {
                                try {
                                    const idToSubmit = parseInt(patientId, 10);
                                    if (isNaN(idToSubmit)) throw new Error("ID invalide: " + patientId);
                                    await updatePatient(idToSubmit, { status: "termine" });
                                    window.location.reload();
                                } catch (err) {
                                    console.error(err);
                                    alert("Erreur lors de la validation du dossier.");
                                }
                            }
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 transform hover:scale-[1.02]"
                    >
                        ✅ Valider & Terminer
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            const btn = document.activeElement as HTMLElement;
                            if (btn) btn.blur(); // Remove focus
                        }}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Fermer l'édition
                    </button>
                </div>
            ) : isPending ? (
                <span className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-amber-500/30 animate-pulse">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    En attente d&apos;approbation
                </span>
            ) : isTermine ? (
                <button
                    type="button"
                    onClick={async () => {
                        if (
                            confirm(
                                "Demander la modification de ce dossier ?\n\nLe chef de service devra approuver votre demande."
                            )
                        ) {
                            try {
                                const idToSubmit = parseInt(patientId, 10);
                                if (isNaN(idToSubmit)) throw new Error("ID invalide: " + patientId);
                                await requestModification(idToSubmit);
                                window.location.reload();
                            } catch (err) {
                                console.error(err);
                                alert("Erreur lors de l'envoi de la demande. L'ID était " + patientId);
                            }
                        }
                    }}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                    Demander une modification
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        setIsEditing(true);
                    }}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 transform hover:scale-[1.02]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Éditer le dossier
                </button>
            )}
        </div>
    );
}
