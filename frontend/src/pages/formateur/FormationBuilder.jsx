import { useState, useCallback, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import RichTextEditor, { MAX_CONTENU } from "../../components/editor/RichTextEditor";
import RichTextRenderer from "../../components/content/RichTextRenderer";
import { chapterServiceExtended } from "../../services/chapterService";
import { sectionServiceExtended } from "../../services/sectionService";
import { sousSectionServiceExtended } from "../../services/sousSectionService";
import { formationServiceExtended } from "../../services/formationService";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

export default function FormationBuilder() {
  const { id } = useParams();
  const {
    formation,
    chapters,
    sectionsByChapter,
    sousBySection,
    load,
    loadSections,
    loadSousSections,
    refreshChapters,
    setNotice,
    selectTarget,
    clearSelectTarget,
  } = useOutletContext();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ titre: "", description: "", contenu: "" });
  const [formError, setFormError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  const [formationForm, setFormationForm] = useState({
    titre: formation?.titre || "",
    description: formation?.description || "",
  });
  const [savingFormation, setSavingFormation] = useState(false);

  useEffect(() => {
    if (formation) {
      setFormationForm((prev) => ({
        titre: prev.titre || formation.titre || "",
        description: prev.description || formation.description || "",
      }));
    }
  }, [formation?.id_formation]);

  const openCreate = (kind, parentId = null) => {
    setModal({ kind, parentId, item: null });
    setForm({ titre: "", description: "", contenu: "" });
    setFormError(null);
    setPreviewMode(false);
  };

  const openEdit = (kind, item, parentId = null) => {
    setModal({ kind, parentId, item });
    setForm({
      titre: item.titre || "",
      description: item.description || "",
      contenu: kind === "sous" || kind === "section" ? item.contenu ?? "" : undefined,
    });
    setFormError(null);
    setPreviewMode(false);
    if (
      (kind === "sous" || kind === "section") &&
      (item.contenu === null || item.contenu === undefined)
    ) {
      const fetch = kind === "sous" ? sousSectionServiceExtended.show(item.id_sous_section) : sectionServiceExtended.show(item.id_section);
      fetch
        .then((res) => setForm((f) => ({ ...f, contenu: res.data.contenu || "" })))
        .catch((err) => setError(err));
    }
  };

  useEffect(() => {
    if (!selectTarget) return;
    const { kind, item, parentId } = selectTarget;
    openEdit(kind, item, parentId);
    clearSelectTarget();
  }, [selectTarget]);

  const save = async (e) => {
    e.preventDefault();
    if (!modal) return;
    setBusy(true);
    setFormError(null);
    try {
      const { kind, parentId, item } = modal;
      if (kind === "chapter") {
        const payload = { titre: form.titre, description: form.description };
        if (item) await chapterServiceExtended.update(item.id_chapitre, payload);
        else await chapterServiceExtended.store({ ...payload, id_formation: Number(id) });
        await refreshChapters();
      } else if (kind === "section") {
        const contenu = (form.contenu || "").slice(0, MAX_CONTENU);
        const payload = { titre: form.titre, contenu };
        if (item) await sectionServiceExtended.update(item.id_section, payload);
        else await sectionServiceExtended.store({ ...payload, id_chapitre: Number(parentId) });
        await loadSections(Number(parentId));
      } else if (kind === "sous") {
        const contenu = (form.contenu || "").slice(0, MAX_CONTENU);
        if (item) await sousSectionServiceExtended.update(item.id_sous_section, { titre: form.titre, contenu });
        else await sousSectionServiceExtended.store({ titre: form.titre, contenu, id_section: Number(parentId) });
        await loadSousSections(Number(parentId));
      }
      setNotice("Enregistré.");
      setModal(null);
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const { kind, item } = deleting;
      if (kind === "chapter") {
        await chapterServiceExtended.destroy(item.id_chapitre);
        await refreshChapters();
      } else if (kind === "section") {
        await sectionServiceExtended.destroy(item.id_section);
        await loadSections(item.id_chapitre);
      } else if (kind === "sous") {
        await sousSectionServiceExtended.destroy(item.id_sous_section);
        await loadSousSections(item.id_section);
      }
      setNotice("Supprimé.");
      setDeleting(null);
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const moveChapter = async (index, dir) => {
    const next = [...chapters];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await chapterServiceExtended.reorder(id, next.map((c) => c.id_chapitre));
      refreshChapters();
    } catch (err) { setError(err); }
  };

  const moveSection = async (chapterId, index, dir) => {
    const list = sectionsByChapter[chapterId] || [];
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await sectionServiceExtended.reorder(chapterId, next.map((s) => s.id_section));
      await loadSections(chapterId);
    } catch (err) { setError(err); }
  };

  const moveSous = async (sectionId, index, dir) => {
    const list = sousBySection[sectionId] || [];
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await sousSectionServiceExtended.reorder(sectionId, next.map((s) => s.id_sous_section));
      await loadSousSections(sectionId);
    } catch (err) { setError(err); }
  };

  const togglePublish = async () => {
    setPublishBusy(true);
    try {
      if (formation.statut === "PUBLIEE") await formationServiceExtended.unpublish(id);
      else await formationServiceExtended.publish(id);
      await load();
      setNotice(formation?.statut === "PUBLIEE" ? "Formation dépubliée." : "Formation publiée — visible dans le catalogue.");
    } catch (err) { setError(err); }
    finally { setPublishBusy(false); }
  };

  const saveFormation = async (e) => {
    e.preventDefault();
    setSavingFormation(true);
    try {
      await formationServiceExtended.update(id, {
        titre: formationForm.titre,
        description: formationForm.description,
        id_categorie: formation.id_categorie,
      });
      setNotice("Informations mises à jour.");
      await load();
    } catch (err) { setError(err); }
    finally { setSavingFormation(false); }
  };

  if (!formation) return <Spinner />;

  const publiee = formation?.statut === "PUBLIEE";

  return (
    <div className="space-y-6">
      {error && <Alert type="error" title={getErrorMessage(error)} />}

      {/* Formation info card */}
      <Card className="overflow-hidden p-0">
        <div className="gradient-brand p-4 text-white sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Icons.formations className="h-4 w-4" /> Informations de la formation
            </h3>
            <div className="flex items-center gap-2">
              <span className={`badge ${publiee ? "badge-success" : "badge-warning"}`}>
                {publiee ? "Publiée" : "Brouillon"}
              </span>
            </div>
          </div>
        </div>
        <form onSubmit={saveFormation} className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Titre</label>
              <input className="input" value={formationForm.titre} onChange={(e) => setFormationForm({ ...formationForm, titre: e.target.value })} />
              <FieldError error={formError} name="titre" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={formationForm.description} onChange={(e) => setFormationForm({ ...formationForm, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button type="submit" className="btn-secondary btn-sm" disabled={savingFormation}>
              {savingFormation ? "..." : <><Icons.check className="h-3.5 w-3.5" /> Enregistrer</>}
            </button>
            <button type="button" className={`${publiee ? "btn-secondary" : "btn-primary"} btn-sm`} disabled={publishBusy} onClick={togglePublish}>
              {publishBusy ? "..." : publiee ? <><Icons.eye className="h-3.5 w-3.5" /> Dépublier</> : <><Icons.check className="h-3.5 w-3.5" /> Publier</>}
            </button>
          </div>
        </form>
      </Card>

      {/* Chapters tree */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3 sm:px-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Icons.modules className="h-4 w-4 text-brand-600" /> Chapitres ({chapters.length})
          </h3>
          <button type="button" className="btn-primary btn-sm" onClick={() => openCreate("chapter")}>
            <Icons.plus className="h-3.5 w-3.5" /> Chapitre
          </button>
        </div>

        {chapters.length === 0 && (
          <div className="p-8 text-center">
            <div className="empty-icon mx-auto">
              <Icons.book className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-slate-500">Aucun chapitre — ajoutez le premier</p>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {chapters.map((chapter, idx) => {
            const sections = sectionsByChapter[chapter.id_chapitre] || [];
            return (
              <div key={chapter.id_chapitre}>
                <div className="flex items-center gap-3 px-5 py-3 sm:px-6 hover:bg-slate-50/50 transition-base">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-[11px] font-bold text-brand-700">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{chapter.titre}</span>
                  <span className="flex items-center gap-1">
                    <ArrowBtn disabled={idx === 0} onClick={() => moveChapter(idx, -1)} up />
                    <ArrowBtn disabled={idx === chapters.length - 1} onClick={() => moveChapter(idx, 1)} />
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit("chapter", chapter)}>
                      <Icons.edit className="h-3 w-3" />
                    </button>
                    <button type="button" className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50" onClick={() => setDeleting({ kind: "chapter", item: chapter })}>
                      <Icons.trash className="h-3 w-3" />
                    </button>
                  </span>
                </div>

                {sections.length > 0 && (
                  <div className="border-t border-slate-50 bg-slate-50/30 px-5 py-2 sm:px-6">
                    <ul className="space-y-1">
                      {sections.map((section, sIdx) => {
                        const sous = sousBySection[section.id_section] || [];
                        return (
                          <li key={section.id_section}>
                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white transition-base">
                              <Icons.folder className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-700">{section.titre}</span>
                              <span className="flex items-center gap-1">
                                <ArrowBtn small disabled={sIdx === 0} onClick={() => moveSection(chapter.id_chapitre, sIdx, -1)} up />
                                <ArrowBtn small disabled={sIdx === sections.length - 1} onClick={() => moveSection(chapter.id_chapitre, sIdx, 1)} />
                                <button type="button" className="btn-secondary !px-2 !py-0.5 !text-[10px]" onClick={() => openEdit("section", section, chapter.id_chapitre)}>
                                  <Icons.edit className="h-3 w-3" />
                                </button>
                                <button type="button" className="btn-ghost !px-1 !py-0.5 !text-[10px] text-danger-500 hover:!bg-danger-50" onClick={() => setDeleting({ kind: "section", item: { ...section, id_chapitre: chapter.id_chapitre } })}>
                                  <Icons.trash className="h-3 w-3" />
                                </button>
                              </span>
                            </div>
                            {sous.length > 0 && (
                              <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-100 pl-3">
                                {sous.map((ss, ssIdx) => (
                                  <li key={ss.id_sous_section} className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px] hover:bg-white transition-base">
                                    <Icons.file className="h-3 w-3 shrink-0 text-slate-400" />
                                    <span className="min-w-0 flex-1 truncate text-slate-600">{ss.titre}</span>
                                    <span className="flex items-center gap-1">
                                      <ArrowBtn small disabled={ssIdx === 0} onClick={() => moveSous(section.id_section, ssIdx, -1)} up />
                                      <ArrowBtn small disabled={ssIdx === sous.length - 1} onClick={() => moveSous(section.id_section, ssIdx, 1)} />
                                      <button type="button" className="btn-secondary !px-2 !py-0.5 !text-[10px]" onClick={() => openEdit("sous", ss, section.id_section)}>
                                        <Icons.edit className="h-3 w-3" />
                                      </button>
                                      <button type="button" className="btn-ghost !px-1 !py-0.5 !text-[10px] text-danger-500 hover:!bg-danger-50" onClick={() => setDeleting({ kind: "sous", item: { ...ss, id_section: section.id_section } })}>
                                        <Icons.trash className="h-3 w-3" />
                                      </button>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="ml-6 mt-0.5">
                              <button type="button" className="btn-ghost !py-1 !text-[11px] text-brand-600" onClick={() => openCreate("sous", section.id_section)}>
                                <Icons.plus className="h-3 w-3" /> Sous-section
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="border-t border-slate-50 px-5 py-2 sm:px-6">
                  <button type="button" className="btn-ghost !py-1 !text-[11px] text-brand-600" onClick={() => openCreate("section", chapter.id_chapitre)}>
                    <Icons.plus className="h-3 w-3" /> Section
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* CRUD Modal */}
      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={
          modal?.kind === "chapter"
            ? modal.item ? "Modifier le chapitre" : "Nouveau chapitre"
            : modal?.kind === "section"
              ? modal.item ? "Modifier la section" : "Nouvelle section"
              : modal?.item ? "Éditer la sous-section" : "Nouvelle sous-section"
        }
        size={modal?.kind === "sous" || modal?.kind === "section" ? "xl" : undefined}
        footer={<button type="submit" form="builder-form" className="btn-primary" disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</button>}
      >
        <FormAlert error={formError} />
        <form id="builder-form" onSubmit={save} className="space-y-4">
          {modal?.kind === "chapter" && (
            <>
              <div>
                <label className="label">Titre</label>
                <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
                <FieldError error={formError} name="titre" />
              </div>
              <div>
                <label className="label">Description (optionnelle)</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </>
          )}
          {(modal?.kind === "sous" || modal?.kind === "section") && (
            <>
              <div>
                <label className="label">Titre</label>
                <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
                <FieldError error={formError} name="titre" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label !mb-0">Contenu pédagogique</label>
                  <button type="button" className={`rounded-lg px-3 py-1 text-xs font-semibold transition-base ${previewMode ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setPreviewMode((p) => !p)}>
                    {previewMode ? "Éditer" : "Aperçu"}
                  </button>
                </div>
                {previewMode ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft min-h-[200px]">
                    {form.contenu ? <RichTextRenderer html={form.contenu} /> : <p className="py-6 text-center text-sm text-slate-300">Rien à prévisualiser.</p>}
                  </div>
                ) : (
                  <RichTextEditor value={form.contenu || ""} onChange={(html) => setForm((f) => ({ ...f, contenu: html }))} />
                )}
                <p className="mt-1 text-[11px] text-slate-400">Titres, listes, citations, liens, images, vidéo, documents. Limite : {MAX_CONTENU.toLocaleString()} caractères.</p>
              </div>
            </>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title={deleting?.kind === "chapter" ? "Supprimer ce chapitre ?" : deleting?.kind === "section" ? "Supprimer cette section ?" : "Supprimer cette sous-section ?"}
        message="Les éléments enfants seront également supprimés."
      />
    </div>
  );
}

function ArrowBtn({ small, up, disabled, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} title={up ? "Monter" : "Descendre"}
      className={`rounded-lg border border-slate-200 bg-white text-slate-500 transition-base hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed ${small ? "p-0.5 text-[9px]" : "p-1 text-[10px]"}`}>
      {up ? "↑" : "↓"}
    </button>
  );
}
