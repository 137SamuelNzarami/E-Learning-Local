import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { formationService } from "../../services/formationService";
import { moduleService } from "../../services/moduleService";
import { chapterService } from "../../services/chapterService";
import { lessonService } from "../../services/lessonService";
import { videoService } from "../../services/videoService";
import { documentService } from "../../services/documentService";
import { quizService } from "../../services/quizService";
import { assignmentService } from "../../services/assignmentService";
import { Icons } from "../../components/Icons";

const TYPE_LABELS = {
  module: "Module",
  chapter: "Chapitre",
  lesson: "Leçon",
};

export default function FormationBuilder() {
  const { id } = useParams();
  const [formation, setFormation] = useState(null);
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [modal, setModal] = useState(null); // { type, parentId?, item? }
  const [deleting, setDeleting] = useState(null); // { type, item }
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", contenu: "" });
  const [formError, setFormError] = useState(null);
  const [formationForm, setFormationForm] = useState({ titre: "", description: "" });
  const [savingFormation, setSavingFormation] = useState(false);
  const [formationError, setFormationError] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      formationService.show(id),
      moduleService.index(),
      chapterService.index(),
      lessonService.index(),
      videoService.index(),
      documentService.index(),
      quizService.index(),
      assignmentService.index(),
    ])
      .then(([f, m, ch, l, v, d, q, a]) => {
        setFormation(f.data);
        setFormationForm({ titre: f.data?.titre || "", description: f.data?.description || "" });
        setModules((m.data || []).filter((x) => Number(x.id_formation) === Number(id)));
        setChapters(ch.data || []);
        setLessons(l.data || []);
        setVideos(v.data || []);
        setDocuments(d.data || []);
        setQuizzes(q.data || []);
        setAssignments(a.data || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const moduleChapters = (idModule) => chapters.filter((c) => Number(c.id_module) === Number(idModule));
  const chapterLessons = (idChapter) => lessons.filter((l) => Number(l.id_chapitre) === Number(idChapter));
  const lessonVideos = (idLesson) => videos.filter((v) => Number(v.id_lecon) === Number(idLesson));
  const lessonDocs = (idLesson) => documents.filter((d) => Number(d.id_lecon) === Number(idLesson));
  const lessonQuiz = (idLesson) => quizzes.find((q) => Number(q.id_lecon) === Number(idLesson));
  const lessonAssignment = (idLesson) => assignments.find((a) => Number(a.id_lecon) === Number(idLesson));

  const openModal = (type, parentId = null, item = null) => {
    setModal({ type, parentId, item });
    setForm(item ? { titre: item.titre, description: item.description || "", contenu: item.contenu || "" } : { titre: "", description: "", contenu: "" });
    setFormError(null);
  };

  const saveFormation = async (e) => {
    e.preventDefault();
    setSavingFormation(true);
    setFormationError(null);
    try {
      await formationService.update(id, {
        id_categorie: formation?.id_categorie,
        id_formateur: formation?.id_formateur,
        titre: formationForm.titre,
        description: formationForm.description,
      });
      setNotice("Formation mise à jour.");
      load();
    } catch (err) {
      setFormationError(err);
    } finally {
      setSavingFormation(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const { type, parentId, item } = modal;
    try {
      if (type === "module") {
        if (item) await moduleService.update(item.id_module, { id_formation: Number(id), titre: form.titre, description: form.description });
        else await moduleService.store({ id_formation: Number(id), titre: form.titre, description: form.description });
      } else if (type === "chapter") {
        if (item) await chapterService.update(item.id_chapitre, { id_module: parentId, titre: form.titre, description: form.description });
        else await chapterService.store({ id_module: parentId, titre: form.titre, description: form.description });
      } else if (type === "lesson") {
        if (item) await lessonService.update(item.id_lecon, { id_chapitre: parentId, titre: form.titre, description: form.description, contenu: form.contenu });
        else await lessonService.store({ id_chapitre: parentId, titre: form.titre, description: form.description, contenu: form.contenu });
      }
      setNotice(`${TYPE_LABELS[type]} ${item ? "modifié" : "ajouté"}.`);
      setModal(null);
      load();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const { type, item } = deleting;
      if (type === "module") await moduleService.destroy(item.id_module);
      else if (type === "chapter") await chapterService.destroy(item.id_chapitre);
      else if (type === "lesson") await lessonService.destroy(item.id_lecon);
      setNotice(`${TYPE_LABELS[type]} supprimé.`);
      setDeleting(null);
      load();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <Link to="/formateur/formations" className="text-sm font-medium text-brand-600 hover:underline">
        ← Mes formations
      </Link>
      <PageHeader title={formation?.titre || "Formation"} subtitle={formation?.description || ""} />
      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icons.formations />
            <div>
              <p className="font-semibold text-slate-800">Informations de la formation</p>
              <p className="text-xs text-slate-500">Titre et description affichés aux étudiants</p>
            </div>
          </div>
          <button type="submit" form="formation-form" className="btn-primary !py-2" disabled={savingFormation}>
            {savingFormation ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
        <FormAlert error={formationError} />
        <form id="formation-form" onSubmit={saveFormation} className="mt-4 space-y-4">
          <div>
            <label className="label">Titre</label>
            <input className="input" value={formationForm.titre} onChange={(e) => setFormationForm({ ...formationForm, titre: e.target.value })} />
            <FieldError error={formationError} name="titre" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={formationForm.description} onChange={(e) => setFormationForm({ ...formationForm, description: e.target.value })} />
            <FieldError error={formationError} name="description" />
          </div>
        </form>
      </Card>

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Icons.modules />
          <div>
            <p className="font-semibold text-slate-800">Structure de la formation</p>
            <p className="text-xs text-slate-500">Modules → Chapitres → Leçons</p>
          </div>
        </div>
        <button type="button" className="btn-primary !py-2" onClick={() => openModal("module")}>
          + Module
        </button>
      </Card>

      <div className="space-y-3">
        {modules.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-slate-400">
              Aucun module. Ajoutez un premier module pour structurer votre formation.
            </p>
          </Card>
        ) : (
          modules.map((m) => {
            const chs = moduleChapters(m.id_module);
            return (
              <Card key={m.id_module} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">
                      {chs.length}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{m.titre}</p>
                      {m.description && <p className="truncate text-xs text-slate-400">{m.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => openModal("module", null, m)}>
                      Modifier
                    </button>
                    <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => openModal("chapter", m.id_module)}>
                      + Chapitre
                    </button>
                    <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting({ type: "module", item: m })}>
                      Supprimer
                    </button>
                  </div>
                </div>

                {chs.length > 0 && (
                  <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
                    {chs.map((c) => {
                      const les = chapterLessons(c.id_chapitre);
                      return (
                        <div key={c.id_chapitre}>
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">CHAPITRE</span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800">{c.titre}</p>
                                {c.description && <p className="truncate text-xs text-slate-400">{c.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" className="btn-secondary !px-2.5 !py-1 !text-xs" onClick={() => openModal("chapter", m.id_module, c)}>
                                Modifier
                              </button>
                              <button type="button" className="btn-secondary !px-2.5 !py-1 !text-xs" onClick={() => openModal("lesson", c.id_chapitre)}>
                                + Leçon
                              </button>
                              <button type="button" className="btn-ghost !px-2.5 !py-1 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting({ type: "chapter", item: c })}>
                                Supprimer
                              </button>
                            </div>
                          </div>

                          {les.length > 0 && (
                            <ul className="mt-2 space-y-1.5">
                              {les.map((l) => {
                                const nVids = lessonVideos(l.id_lecon).length;
                                const nDocs = lessonDocs(l.id_lecon).length;
                                const quiz = lessonQuiz(l.id_lecon);
                                const devoir = lessonAssignment(l.id_lecon);
                                return (
                                  <li key={l.id_lecon} className="ml-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <Icons.lessons />
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{l.titre}</p>
                                        {l.description && <p className="truncate text-xs text-slate-400">{l.description}</p>}
                                        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                          <span>{nVids} vidéo{nVids > 1 ? "s" : ""}</span>
                                          <span>·</span>
                                          <span>{nDocs} doc{nDocs > 1 ? "s" : ""}</span>
                                          {quiz && <span>· Quiz « {quiz.titre} »</span>}
                                          {devoir && <span>· Devoir « {devoir.titre} »</span>}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button type="button" className="btn-secondary !px-2.5 !py-1 !text-xs" onClick={() => openModal("lesson", c.id_chapitre, l)}>
                                        Modifier
                                      </button>
                                      <Link to={`/formateur/contenu?lecon=${l.id_lecon}`} className="btn-secondary !px-2.5 !py-1 !text-xs">
                                        Fichiers
                                      </Link>
                                      <Link to={`/formateur/quizzes?lecon=${l.id_lecon}`} className="btn-secondary !px-2.5 !py-1 !text-xs">
                                        Quiz
                                      </Link>
                                      <Link to={`/formateur/devoirs?lecon=${l.id_lecon}`} className="btn-secondary !px-2.5 !py-1 !text-xs">
                                        Devoir
                                      </Link>
                                      <button type="button" className="btn-ghost !px-2.5 !py-1 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting({ type: "lesson", item: l })}>
                                        Supprimer
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={`${modal?.item ? "Modifier" : "Ajouter"} ${TYPE_LABELS[modal?.type] || ""}`}
        footer={
          <button type="submit" form="builder-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="builder-form" onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Titre</label>
            <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            <FieldError error={formError} name="titre" />
          </div>
          {modal?.type !== "formation" && (
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <FieldError error={formError} name="description" />
            </div>
          )}
          {modal?.type === "lesson" && (
            <div>
              <label className="label">Contenu</label>
              <textarea className="input" rows={5} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} />
              <FieldError error={formError} name="contenu" />
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title={`Supprimer ${TYPE_LABELS[deleting?.type]?.toLowerCase()} ?`}
        message="Les éléments enfants éventuels seront également supprimés."
      />
    </div>
  );
}
