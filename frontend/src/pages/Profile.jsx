import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Alert from "../components/ui/Alert";
import FieldError, { FormAlert } from "../components/ui/FieldError";
import { RoleBadge } from "../components/ui/Badge";
import { fullName } from "../utils/format";
import { authService } from "../services/authService";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ mot_de_passe_actuel: "", mot_de_passe: "", confirmation: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (form.mot_de_passe !== form.confirmation) {
      setError({ message: "La confirmation du mot de passe ne correspond pas.", errors: [] });
      return;
    }
    setBusy(true);
    try {
      await authService.changePassword({
        mot_de_passe_actuel: form.mot_de_passe_actuel,
        mot_de_passe: form.mot_de_passe,
      });
      setSuccess(true);
      setForm({ mot_de_passe_actuel: "", mot_de_passe: "", confirmation: "" });
      refreshUser();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Mon profil" subtitle="Informations du compte et mot de passe" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold">Informations</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{fullName(user)}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="mt-1.5"><RoleBadge role={user?.role} /></div>
            </div>
          </div>
          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Identifiant</dt>
              <dd className="font-medium text-slate-800">#{user?.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rôle</dt>
              <dd className="font-medium text-slate-800">{user?.role}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold">Changer mon mot de passe</h2>
          {success && <Alert type="success" className="mb-4" title="Mot de passe modifié avec succès." />}
          <FormAlert error={error} />
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Mot de passe actuel</label>
              <input
                type="password"
                className="input"
                value={form.mot_de_passe_actuel}
                onChange={update("mot_de_passe_actuel")}
                autoComplete="current-password"
              />
              <FieldError error={error} name="mot_de_passe_actuel" />
            </div>
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={form.mot_de_passe}
                onChange={update("mot_de_passe")}
                autoComplete="new-password"
              />
              <FieldError error={error} name="mot_de_passe" />
            </div>
            <div>
              <label className="label">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={form.confirmation}
                onChange={update("confirmation")}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
