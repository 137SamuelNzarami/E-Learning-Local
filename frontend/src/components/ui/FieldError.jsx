import Alert from "./Alert";

export default function FieldError({ error, name }) {
  if (!error || !error.errors) return null;
  const match = error.errors.find(
    (e) => String(e.field).toLowerCase() === String(name).toLowerCase()
  );
  if (!match) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{match.message}</p>;
}

export function FormAlert({ error }) {
  if (!error) return null;
  return <Alert type="error" title="La demande n'a pas pu aboutir.">{error.message}</Alert>;
}
