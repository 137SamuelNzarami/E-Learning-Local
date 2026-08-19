import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../components/Icons";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";

function Brand() {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lift">
        <Icons.logo className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Rejoindre la plateforme</h1>
      <p className="mt-2 font-serif text-base italic text-brand-200">
        L'apprentissage universitaire, au plus près de vous.
      </p>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nom: "", prenom: "", email: "", mot_de_passe: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 p-4">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center"><Brand /></div>

        <div className="card p-6 shadow-lift sm:p-8">
          {success && <Alert type="success" title="Compte créé !">Redirection vers la connexion...</Alert>}
          <FormAlert error={error} />
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prenom" className="label">Prénom</label>
                <input id="prenom" className="input" placeholder="Marie" value={form.prenom} onChange={update("prenom")} />
                <FieldError error={error} name="prenom" />
              </div>
              <div>
                <label htmlFor="nom" className="label">Nom</label>
                <input id="nom" className="input" placeholder="Dupont" value={form.nom} onChange={update("nom")} />
                <FieldError error={error} name="nom" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="label">Adresse e-mail</label>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="vous@exemple.fr" value={form.email} onChange={update("email")} />
              <FieldError error={error} name="email" />
            </div>
            <div>
              <label htmlFor="mot_de_passe" className="label">Mot de passe</label>
              <input id="mot_de_passe" type="password" autoComplete="new-password" className="input" placeholder="8 caractères minimum" value={form.mot_de_passe} onChange={update("mot_de_passe")} />
              <FieldError error={error} name="mot_de_passe" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Déjà inscrit ?{" "}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
