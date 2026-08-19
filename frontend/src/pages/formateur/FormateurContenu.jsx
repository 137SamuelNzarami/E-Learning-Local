import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { moduleService } from "../../services/moduleService";
import { chapterService } from "../../services/chapterService";
import { lessonService } from "../../services/lessonService";
import { videoService } from "../../services/videoService";
import { documentService } from "../../services/documentService";
import { useOwnedFormations } from "../../hooks/useOwnedFormations";
import { fileUrl } from "../../utils/format";
import { Icons } from "../../components/Icons";

const initialForm = { titre: "", fichier: null };

export default function FormateurContenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselected = Number(searchParams.get("lecon")) || null;
  const { formations, loading: loadingFormations } = useOwnedFormations();

  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [m, c, l, v, d] = await Promise.all([
        moduleService.index(),
        chapterService.index(),
        lessonService.index(),
        videoService.index(),
        documentService.index(),
      ]);
      setModules(m.data || []);
      setChapters(c.data || []);
      setLessons(l.data || []);
      setVideos(v.data || []);
      setDocuments(d.data || []);
      if (preselected) setOpenId(preselected);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingFormations) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingFormations]);

  const ownedLessonIds = useMemo(() => {
    const formationIds = new Set(formations.map((f) => f.id_formation));
    const moduleIds = new Set(modules.filter((m) => formationIds.has(m.id_formation)).map((m) => m.id_module));
    const chapterIds = new Set(chapters.filter((c) => moduleIds.has(c.id_module)).map((c) => c.id_chapitre));
    return new Set(lessons.filter((l) => chapterIds.has(l.id_chapitre)).map((l) => l.id_lecon));
  }, [formations, modules, chapters, lessons]);

  const ownedLessons = lessons.filter((l) => ownedLessonIds.has(l.id_lecon));

  const startUpload = (type, idLecon) => {
    setUploadType({ type, idLecon });
    setForm(initialForm);
    setFormError(null);
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = { id_lecon: uploadType.idLecon, titre: form.titre, fichier: form.fichier };
      if (uploadType.type === "video") {
        await videoService.store(payload);
        setNotice("Vidéo ajoutée.");
      } else {
        await documentService.store(payload);
        setNotice("Document ajouté.");
      }
      setUploadType(null);
      loadAll();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      if (deleting.type === "video") await videoService.destroy(deleting.item.id_video);
      else await documentService.destroy(deleting.item.id_document);
      setNotice("Fichier supprimé.");
      setDeleting(null);
      loadAll();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading || loadingFormations) return <Spinner />;

  return (
    <div>
      <PageHeader title="Fichiers des leçons" subtitle="Vidéos et documents de vos leçons" />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {ownedLessons.length === 0 ? (
        <Card>
          <EmptyState title="Aucune leçon" message="Créez d'abord des modules, chapitres et leçons." />
        </Card>
      ) : (
        <div className="space-y-3">
          {ownedLessons.map((l) => {
            const vids = videos.filter((v) => Number(v.id_lecon) === Number(l.id_lecon));
            const docs = documents.filter((d) => Number(d.id_lecon) === Number(l.id_lecon));
            const open = openId === l.id_lecon;
            return (
              <Card key={l.id_lecon} className="overflow-hidden">
                <button type="button" className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpenId(open ? null : l.id_lecon)}>
                  <div className="flex items-center gap-3">
                    <Icons.lessons />
                    <div>
                      <p className="font-semibold text-slate-900">{l.titre}</p>
                      <p className="text-xs text-slate-400">{vids.length} vidéo{vids.length > 1 ? "s" : ""} · {docs.length} doc{docs.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
                </button>

                {open && (
                  <div className="border-t border-slate-100 p-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <section>
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-700">Vidéos</h4>
                          <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => startUpload("video", l.id_lecon)}>
                            + Vidéo
                          </button>
                        </div>
                        <ul className="space-y-1.5">
                          {vids.length === 0 && <li className="text-sm text-slate-400">Aucune vidéo.</li>}
                          {vids.map((v) => (
                            <li key={v.id_video} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="text-xs text-slate-400">🎬</span>
                                <p className="truncate text-sm text-slate-700">{v.titre}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <a href={fileUrl(v.chemin_video)} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">
                                  Voir
                                </a>
                                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setDeleting({ type: "video", item: v })}>
                                  Supprimer
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-700">Documents</h4>
                          <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => startUpload("document", l.id_lecon)}>
                            + Document
                          </button>
                        </div>
                        <ul className="space-y-1.5">
                          {docs.length === 0 && <li className="text-sm text-slate-400">Aucun document.</li>}
                          {docs.map((d) => (
                            <li key={d.id_document} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="text-xs text-slate-400">📄</span>
                                <p className="truncate text-sm text-slate-700">{d.titre}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <a href={fileUrl(d.chemin_document)} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">
                                  Télécharger
                                </a>
                                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setDeleting({ type: "document", item: d })}>
                                  Supprimer
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(uploadType)}
        onClose={() => setUploadType(null)}
        title={uploadType?.type === "video" ? "Ajouter une vidéo" : "Ajouter un document"}
        footer={
          <button type="submit" form="upload-form" className="btn-primary" disabled={busy || !form.fichier}>
            {busy ? "Envoi..." : "Uploader"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="upload-form" onSubmit={submitUpload} className="space-y-4">
          <div>
            <label className="label">Titre</label>
            <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            <FieldError error={formError} name="titre" />
          </div>
          <div>
            <label className="label">Fichier</label>
            <input
              type="file"
              accept={uploadType?.type === "video" ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"}
              className="input-file"
              onChange={(e) => setForm({ ...form, fichier: e.target.files[0] })}
            />
            <FieldError error={formError} name="fichier" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer ce fichier ?"
      />
    </div>
  );
}
