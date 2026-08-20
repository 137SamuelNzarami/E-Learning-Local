import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
      <h1 className="text-2xl font-bold tracking-tight text-white">E-Learning Universitair Local</h1>
      <p className="mt-2 font-serif text-base italic text-brand-200">
        Savoir se cultiver aussi près de chez soi.
      </p>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", mot_de_passe: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(form);
      navigate(from, { replace: true });
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
          <FormAlert error={error} />
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="label">Adresse e-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="vous@exemple.fr"
                value={form.email}
                onChange={update("email")}
              />
              <FieldError error={error} name="email" />
            </div>
            <div>
              <label htmlFor="mot_de_passe" className="label">Mot de passe</label>
              <input
                id="mot_de_passe"
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={form.mot_de_passe}
                onChange={update("mot_de_passe")}
              />
              <FieldError error={error} name="mot_de_passe" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Créer un compte étudiant
            </Link>
          </p>
        </div>

        <Alert type="info" className="mt-4" title="Démonstration">
          Créez un compte étudiant depuis la page d'inscription, ou utilisez un compte
          créé par votre administrateur.
       </Alert>
      </div>
    </div>
  );
}
