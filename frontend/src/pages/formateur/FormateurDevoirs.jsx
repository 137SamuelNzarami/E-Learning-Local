import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { assignmentService } from "../../services/assignmentService";
import { submissionServiceExtended } from "../../services/submissionService";
import { useOwnedLessons } from "../../hooks/useOwnedLessons";
import { fileUrl, formatDate } from "../../utils/format";
import { Icons } from "../../components/Icons";

export default function FormateurDevoirs() {
  const [searchParams] = useSearchParams();
  const preselected = Number(searchParams.get("lecon")) || null;
  const { lessons, loading: loadingLessons } = useOwnedLessons();

  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ titre: "", id_lecon: "", instructions: "" });
  const [formError, setFormError] = useState(null);

  const [consignesUpload, setConsignesUpload] = useState(null);

  const [grades, setGrades] = useState({});
  const [deleting, setDeleting] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const a = await assignmentService.index();
      const all = a.data || [];
      setAssignments(all);

      const map = {};
      for (const devoir of all) {
        const s = await submissionServiceExtended.getByAssignment(devoir.id_devoir);
        map[devoir.id_devoir] = s.data || [];
      }
      setSubmissionsByAssignment(map);

      if (preselected) {
        const first = all.find((d) => Number(d.id_lecon) === preselected);
        if (first) setExpanded(first.id_devoir);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingLessons) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingLessons]);

  const ownedAssignmentIds = useMemo(() => {
    const lessonIds = new Set(lessons.map((l) => l.id_lecon));
    return new Set(assignments.filter((a) => lessonIds.has(a.id_lecon)).map((a) => a.id_devoir));
  }, [assignments, lessons]);

  const ownedAssignments = assignments.filter((a) => ownedAssignmentIds.has(a.id_devoir));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = { titre: form.titre, id_lecon: Number(form.id_lecon), instructions: form.instructions };
      if (modal?.item) await assignmentService.update(modal.item.id_devoir, payload);
      else await assignmentService.store(payload);
      setNotice("Devoir enregistré.");
      setModal(null);
      loadAll();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const grade = async (submission, note) => {
    setBusy(true);
    try {
      await submissionServiceExtended.update(submission.id_soumission, {
        id_devoir: submission.id_devoir,
        id_utilisateur: submission.id_utilisateur,
        fichier: submission.fichier || "",
        note: Number(note),
      });
      setNotice("Note enregistrée.");
      loadAll();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await assignmentService.destroy(deleting.id_devoir);
      setNotice("Devoir supprimé.");
      setDeleting(null);
      loadAll();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const uploadConsignes = async (e, devoir) => {
    e.preventDefault();
    if (!consignesUpload?.fichier) return;
    setBusy(true);
    try {
      await assignmentService.uploadConsignes(devoir.id_devoir, consignesUpload.fichier);
      setNotice("Fichier de consignes enregistré.");
      setConsignesUpload(null);
      loadAll();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const removeConsignes = async (devoir) => {
    setBusy(true);
    try {
      await assignmentService.deleteConsignes(devoir.id_devoir);
      setNotice("Fichier de consignes supprimé.");
      loadAll();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading || loadingLessons) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Devoirs"
        subtitle="Créez vos devoirs et notez les rendus"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setForm({ titre: "", id_lecon: preselected || "", instructions: "" });
              setFormError(null);
              setModal({});
            }}
          >
            <Icons.plus className="h-4 w-4" /> Nouveau devoir
          </button>
        }
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {ownedAssignments.length === 0 ? (
        <Card>
          <EmptyState title="Aucun devoir" message="Créez un devoir rattaché à l'une de vos leçons." />
        </Card>
      ) : (
        <div className="space-y-3">
          {ownedAssignments.map((d) => {
            const subs = submissionsByAssignment[d.id_devoir] || [];
            const open = expanded === d.id_devoir;
            const gradedCount = subs.filter((s) => s.note !== null && s.note !== undefined).length;
            return (
              <Card key={d.id_devoir} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icons.assignments />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{d.titre}</p>
                      <p className="text-xs text-slate-400">{d.lecon}</p>
                    </div>
                    <Badge tone={gradedCount === subs.length && subs.length > 0 ? "success" : "neutral"}>
                      {gradedCount}/{subs.length} noté{subs.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => setExpanded(open ? null : d.id_devoir)}>
                      {open ? "Réduire" : "Rendus"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-1.5 !text-xs"
                      onClick={() => {
                        setForm({ titre: d.titre, id_lecon: d.id_lecon, instructions: d.instructions || "" });
                        setFormError(null);
                        setModal({ item: d });
                      }}
                    >
                      Modifier
                    </button>
                    <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting(d)}>
                      Supprimer
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-100 p-4">
                    {(d.instructions || d.fichier_consignes) && (
                      <div className="mb-4 rounded-xl bg-slate-50 p-4">
                        {d.instructions && (
                          <>
                            <p className="text-sm font-semibold text-slate-700">Instructions</p>
                            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{d.instructions}</p>
                          </>
                        )}
                        {d.fichier_consignes && (
                          <a href={fileUrl(d.fichier_consignes)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
                            Télécharger le fichier de consignes
                          </a>
                        )}
                      </div>
                    )}

                    <form onSubmit={(e) => uploadConsignes(e, d)} className="mb-4 flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 p-3 sm:flex-row sm:items-center">
                      <input
                        type="file"
                        className="input flex-1"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
                        onChange={(e) => setConsignesUpload({ id_devoir: d.id_devoir, fichier: e.target.files?.[0] || null })}
                      />
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="submit"
                          className="btn-primary !px-3 !py-1.5 !text-xs"
                          disabled={busy || !consignesUpload || consignesUpload.id_devoir !== d.id_devoir || !consignesUpload.fichier}
                        >
                          Déposer les consignes
                        </button>
                        {d.fichier_consignes && (
                          <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50" disabled={busy} onClick={() => removeConsignes(d)}>
                            Supprimer les consignes
                          </button>
                        )}
                      </div>
                    </form>

                    {subs.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucun rendu pour l'instant.</p>
                    ) : (
                      <ul className="space-y-2">
                        {subs.map((s) => (
                          <li key={s.id_soumission} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">{s.prenom} {s.nom}</p>
                              {s.fichier ? (
                                <a href={fileUrl(s.fichier)} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">
                                  Voir le fichier rendu
                                </a>
                              ) : (
                                <p className="text-xs text-slate-400">Aucun fichier joint</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                className="input !w-20 !py-1.5 text-center"
                                placeholder="Note"
                                defaultValue={s.note ?? ""}
                                onChange={(e) => setGrades({ ...grades, [s.id_soumission]: e.target.value })}
                              />
                              <span className="text-xs text-slate-400">/100</span>
                              <button type="button" className="btn-primary !px-3 !py-1.5 !text-xs" disabled={busy || !grades[s.id_soumission]} onClick={() => grade(s, grades[s.id_soumission])}>
                                Noter
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal?.item ? "Modifier le devoir" : "Nouveau devoir"}
        footer={<button type="submit" form="devoir-form" className="btn-primary" disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</button>}>
        <FormAlert error={formError} />
        <form id="devoir-form" onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Titre</label>
            <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            <FieldError error={formError} name="titre" />
          </div>
          <div>
            <label className="label">Leçon</label>
            <select className="input" value={form.id_lecon} onChange={(e) => setForm({ ...form, id_lecon: e.target.value })}>
              <option value="">Choisir...</option>
              {lessons.map((l) => (
                <option key={l.id_lecon} value={l.id_lecon}>{l.titre}</option>
              ))}
            </select>
            <FieldError error={formError} name="id_lecon" />
          </div>
          <div>
            <label className="label">Instructions</label>
            <textarea className="input" rows={5} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            <FieldError error={formError} name="instructions" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} busy={busy} title="Supprimer ce devoir ?" message="Les soumissions associées seront également supprimées." />
    </div>
  );
}
