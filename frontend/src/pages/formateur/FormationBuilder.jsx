import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import RichTextEditor, { MAX_CONTENU } from "../../components/editor/RichTextEditor";
import { formationServiceExtended } from "../../services/formationService";
import { chapterServiceExtended } from "../../services/chapterService";
import { sectionServiceExtended } from "../../services/sectionService";
import { sousSectionServiceExtended } from "../../services/sousSectionService";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * BUILDER FORMATEUR — architecture backend :
 * Formation → Chapitres → Sections → Sous-sections (rich text ≤ 2 Mo) → Quiz fin de chapitre.
 * Réordonnancement : PATCH .../reorder avec la liste COMPLÈTE des ids du parent.
 */
export default function FormationBuilder() {
  const { id } = useParams();

  const [formation, setFormation] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const [formationForm, setFormationForm] = useState({ titre: "", description: "" });
  const [savingFormation, setSavingFormation] = useState(false);
  const [formationError, setFormationError] = useState(null);
  const [publishBusy, setPublishBusy] = useState(false);

  const [modal, setModal] = useState(null); // { kind:'chapter'|'section'|'sous', item?, parentId }
  const [form, setForm] = useState({ titre: "", description: "", contenu: "" });
  const [formError, setFormError] = useState(null);

  const [deleting, setDeleting] = useState(null); // { kind, item }

  const [sectionsByChapter, setSectionsByChapter] = useState({});
  const [openChapter, setOpenChapter] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [sousBySection, setSousBySection] = useState({});

  /* ---------------------------------------------------------------- */
  /* Chargement                                                        */
  /* ---------------------------------------------------------------- */

  const load = async () => {
    setLoading(true);
    try {
      const f = await formationServiceExtended.show(id);
      const ch = await chapterServiceExtended.byFormation(id);
      setFormation(f.data);
      setFormationForm({ titre: f.data?.titre || "", description: f.data?.description || "" });
      setChapters(Array.isArray(ch.data) ? ch.data : []);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadSections = async (idChapitre) => {
    const res = await sectionServiceExtended.byChapter(idChapitre);
    const list = res.data || [];
    setSectionsByChapter((m) => ({ ...m, [idChapitre]: list }));
    return list;
  };

  const loadSousSections = async (idSection) => {
    const res = await sousSectionServiceExtended.bySection(idSection);
    const list = res.data || [];
    setSousBySection((m) => ({ ...m, [idSection]: list }));
    return list;
  };

  const toggleChapter = async (chapter) => {
    const open = openChapter === chapter.id_chapitre;
    setOpenChapter(open ? null : chapter.id_chapitre);
    if (!open && !sectionsByChapter[chapter.id_chapitre]) {
      try {
        await loadSections(chapter.id_chapitre);
      } catch (err) {
        setError(err);
      }
    }
  };

  const toggleSection = async (section) => {
    const open = openSection === section.id_section;
    setOpenSection(open ? null : section.id_section);
    if (!open && !sousBySection[section.id_section]) {
      try {
        await loadSousSections(section.id_section);
      } catch (err) {
        setError(err);
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /* Formation : infos + publication                                   */
  /* ---------------------------------------------------------------- */

  const saveFormation = async (e) => {
    e.preventDefault();
    setSavingFormation(true);
    setFormationError(null);
    try {
      await formationServiceExtended.update(id, {
        titre: formationForm.titre,
        description: formationForm.description,
      });
      setNotice("Informations de la formation mises à jour.");
      const f = await formationServiceExtended.show(id);
      setFormation(f.data);
    } catch (err) {
      setFormationError(err);
    } finally {
      setSavingFormation(false);
    }
  };

  const togglePublish = async () => {
    setPublishBusy(true);
    setFormationError(null);
    try {
      if (formation.statut === "PUBLIEE") await formationServiceExtended.unpublish(id);
      else await formationServiceExtended.publish(id);
      const f = await formationServiceExtended.show(id);
      setFormation(f.data);
      setNotice(
        f.data.statut === "PUBLIEE"
          ? "Formation publiée — visible dans le catalogue étudiant."
          : "Formation dépubliée — masquée du catalogue étudiant.",
      );
    } catch (err) {
      setFormationError(err);
    } finally {
      setPublishBusy(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* CRUD chapitres / sections / sous-sections                         */
  /* ---------------------------------------------------------------- */

  const openCreate = (kind, parentId = null) => {
    setModal({ kind, parentId, item: null });
    setForm({ titre: "", description: "", contenu: "" });
    setFormError(null);
  };

  const openEdit = (kind, item, parentId = null) => {
    setModal({ kind, parentId, item });
    setForm({
      titre: item.titre || "",
      description: item.description || "",
      // pour une sous-section, le contenu complet doit être chargé avant
      contenu: kind === "sous" ? item.contenu ?? null : undefined,
    });
    setFormError(null);
    if (kind === "sous" && (item.contenu === null || item.contenu === undefined)) {
      sousSectionServiceExtended
        .show(item.id_sous_section)
        .then((res) => {
          setForm((f) => ({ ...f, contenu: res.data.contenu || "" }));
        })
        .catch((err) => setError(err));
    }
  };

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
        const payload = { titre: form.titre, description: form.description };
        if (item) await sectionServiceExtended.update(item.id_section, payload);
        else await sectionServiceExtended.store({ ...payload, id_chapitre: Number(parentId) });
        await loadSections(Number(parentId));
      } else if (kind === "sous") {
        const contenu = (form.contenu || "").slice(0, MAX_CONTENU);
        if (item)
          await sousSectionServiceExtended.update(item.id_sous_section, {
            titre: form.titre,
            contenu,
          });
        else
          await sousSectionServiceExtended.store({
            titre: form.titre,
            contenu,
            id_section: Number(parentId),
          });
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

  const refreshChapters = async () => {
    const ch = await chapterServiceExtended.byFormation(id);
    setChapters(Array.isArray(ch.data) ? ch.data : []);
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
        await loadSections(item.id_chapitre ?? openChapter);
      } else if (kind === "sous") {
        await sousSectionServiceExtended.destroy(item.id_sous_section);
        await loadSousSections(item.id_section ?? openSection);
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

  /* ---------------------------------------------------------------- */
  /* Réordonnancement                                                  */
  /* ---------------------------------------------------------------- */

  const moveChapter = async (index, dir) => {
    const next = [...chapters];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setChapters(next);
    try {
      const updated = await chapterServiceExtended.reorder(
        id,
        next.map((c) => c.id_chapitre),
      );
      setChapters(updated.data || next);
    } catch (err) {
      setError(err);
      await refreshChapters();
    }
  };

  const moveSection = async (chapterId, index, dir) => {
    const list = sectionsByChapter[chapterId] || [];
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSectionsByChapter((m) => ({ ...m, [chapterId]: next }));
    try {
      const updated = await sectionServiceExtended.reorder(
        chapterId,
        next.map((s) => s.id_section),
      );
      setSectionsByChapter((m) => ({ ...m, [chapterId]: updated.data || next }));
    } catch (err) {
      setError(err);
      await loadSections(chapterId).catch(() => {});
    }
  };

  const moveSous = async (sectionId, index, dir) => {
    const list = sousBySection[sectionId] || [];
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSousBySection((m) => ({ ...m, [sectionId]: next }));
    try {
      const updated = await sousSectionServiceExtended.reorder(
        sectionId,
        next.map((s) => s.id_sous_section),
      );
      setSousBySection((m) => ({ ...m, [sectionId]: updated.data || next }));
    } catch (err) {
      setError(err);
      await loadSousSections(sectionId).catch(() => {});
    }
  };

  if (loading) return <Spinner />;

  const publiee = formation?.statut === "PUBLIEE";

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/formateur/formations" className="text-sm font-medium text-brand-600 hover:underline">
        ← Mes formations
      </Link>
      <PageHeader
        title={formation?.titre || "Formation"}
        subtitle={formation?.description}
        actions={
          <div className="flex items-center gap-2">
            <Badge color={publiee ? "green" : "amber"}>{publiee ? "Publiée" : "Brouillon"}</Badge>
            <button
              type="button"
              className={publiee ? "btn-secondary !py-2 !text-sm" : "btn-primary !py-2 !text-sm"}
              disabled={publishBusy}
              onClick={togglePublish}
            >
              {publishBusy ? "..." : publiee ? "Dépublier" : "Publier"}
            </button>
          </div>
        }
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={getErrorMessage(error)} />}

      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Icons.formations />
          <p className="font-semibold text-slate-800">Informations de la formation</p>
        </div>
        <FormAlert error={formationError} />
        <form id="formation-form" onSubmit={saveFormation} className="space-y-4">
          <div>
            <label className="label">Titre</label>
            <input
              className="input"
              value={formationForm.titre}
              onChange={(e) => setFormationForm({ ...formationForm, titre: e.target.value })}
            />
            <FieldError error={formationError} name="titre" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={formationForm.description}
              onChange={(e) => setFormationForm({ ...formationForm, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary !py-2 !text-sm" disabled={savingFormation}>
            {savingFormation ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </Card>

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Icons.modules />
          <div>
            <p className="font-semibold text-slate-800">Chapitres</p>
            <p className="text-xs text-slate-500">Sections → Sous-sections (rich text) → Quiz</p>
          </div>
        </div>
        <button type="button" className="btn-primary !py-2 !text-sm" onClick={() => openCreate("chapter")}>
          <Icons.plus className="h-4 w-4" /> Ajouter un chapitre
        </button>
      </Card>

      {chapters.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">
            Aucun chapitre. Ajoutez le premier chapitre de votre formation.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {chapters.map((chapter, idx) => {
          const sections = sectionsByChapter[chapter.id_chapitre] || [];
          const open = openChapter === chapter.id_chapitre;
          return (
            <Card key={chapter.id_chapitre} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{chapter.titre}</p>
                    {chapter.description && (
                      <p className="truncate text-xs text-slate-400">{chapter.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ArrowBtn disabled={idx === 0} onClick={() => moveChapter(idx, -1)} up />
                  <ArrowBtn disabled={idx === chapters.length - 1} onClick={() => moveChapter(idx, 1)} />
                  <Link
                    to={`/formateur/quizzes?chapitre=${chapter.id_chapitre}`}
                    className="btn-secondary !px-3 !py-1.5 !text-xs"
                  >
                    Quiz
                  </Link>
                  <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => toggleChapter(chapter)}>
                    {open ? "Réduire" : `Sections (${sections.length})`}
                  </button>
                  <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => openEdit("chapter", chapter)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50"
                    onClick={() => setDeleting({ kind: "chapter", item: chapter })}
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-4">
                  <div className="mb-3 space-y-2">
                    {sections.length === 0 && (
                      <p className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-400">
                        Aucune section dans ce chapitre.
                      </p>
                    )}
                    {sections.map((section, sIdx) => {
                      const sous = sousBySection[section.id_section] || [];
                      const secOpen = openSection === section.id_section;
                      return (
                        <div key={section.id_section} className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleSection(section)}
                              className="flex min-w-0 items-center gap-2 text-left"
                            >
                              <Icons.folder className="h-4 w-4 shrink-0 text-brand-500" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-800">
                                  {section.titre}
                                </span>
                                {section.description && (
                                  <span className="block truncate text-[11px] text-slate-400">
                                    {section.description}
                                  </span>
                                )}
                              </span>
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <ArrowBtn small disabled={sIdx === 0} onClick={() => moveSection(chapter.id_chapitre, sIdx, -1)} up />
                              <ArrowBtn small disabled={sIdx === sections.length - 1} onClick={() => moveSection(chapter.id_chapitre, sIdx, 1)} />
                              <button type="button" className="btn-secondary !px-2.5 !py-1 !text-xs" onClick={() => toggleSection(section)}>
                                {secOpen ? `Masquer (${sous.length})` : `Sous-sections (${sous.length})`}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary !px-2.5 !py-1 !text-xs"
                                onClick={() => openEdit("section", section, chapter.id_chapitre)}
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setDeleting({ kind: "section", item: { ...section, id_chapitre: chapter.id_chapitre } })
                                }
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>

                          {secOpen && (
                            <div className="border-t border-slate-100 p-3">
                              <ul className="mb-2 space-y-1.5">
                                {sous.length === 0 && (
                                  <li className="rounded-md bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
                                    Aucune sous-section — ajoutez votre contenu pédagogique.
                                  </li>
                                )}
                                {sous.map((ss, ssIdx) => (
                                  <li
                                    key={ss.id_sous_section}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      <Icons.file className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                      <span className="truncate text-sm text-slate-700">{ss.titre}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <ArrowBtn small disabled={ssIdx === 0} onClick={() => moveSous(section.id_section, ssIdx, -1)} up />
                                      <ArrowBtn small disabled={ssIdx === sous.length - 1} onClick={() => moveSous(section.id_section, ssIdx, 1)} />
                                      <button
                                        type="button"
                                        className="btn-secondary !px-2.5 !py-1 !text-xs"
                                        onClick={() => openEdit("sous", ss, section.id_section)}
                                      >
                                        Éditer
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50"
                                        onClick={() =>
                                          setDeleting({ kind: "sous", item: { ...ss, id_section: section.id_section } })
                                        }
                                      >
                                        Supprimer
                                      </button>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <button
                                type="button"
                                className="btn-primary !py-1.5 !text-xs"
                                onClick={() => openCreate("sous", section.id_section)}
                              >
                                <Icons.plus className="h-3.5 w-3.5" /> Sous-section (rich text)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="btn-secondary !py-1.5 !text-xs"
                    onClick={() => openCreate("section", chapter.id_chapitre)}
                  >
                    <Icons.plus className="h-3.5 w-3.5" /> Ajouter une section
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={
          modal?.kind === "chapter"
            ? modal.item
              ? "Modifier le chapitre"
              : "Nouveau chapitre"
            : modal?.kind === "section"
              ? modal.item
                ? "Modifier la section"
                : "Nouvelle section"
              : modal?.item
                ? "Éditer la sous-section"
                : "Nouvelle sous-section"
        }
        size={modal?.kind === "sous" ? "xl" : undefined}
        footer={
          <button type="submit" form="builder-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="builder-form" onSubmit={save} className="space-y-4">
          {modal?.kind !== "sous" && (
            <>
              <div>
                <label className="label">Titre</label>
                <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
                <FieldError error={formError} name="titre" />
              </div>
              <div>
                <label className="label">Description (optionnelle)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </>
          )}

          {modal?.kind === "sous" && (
            <>
              <div>
                <label className="label">Titre</label>
                <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
                <FieldError error={formError} name="titre" />
              </div>
              <div>
                <label className="label">Contenu pédagogique</label>
                <RichTextEditor value={form.contenu || ""} onChange={(html) => setForm((f) => ({ ...f, contenu: html }))} />
                <p className="mt-1 text-xs text-slate-400">
                  Titres, listes, citations, liens et images (par URL). Limite : 2 000 000 caractères.
                </p>
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
        title={
          deleting?.kind === "chapter"
            ? "Supprimer ce chapitre ?"
            : deleting?.kind === "section"
              ? "Supprimer cette section ?"
              : "Supprimer cette sous-section ?"
        }
        message="Les éléments enfants éventuels seront également supprimés."
      />
    </div>
  );
}

function ArrowBtn({ small, up, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={up ? "Monter" : "Descendre"}
      className={`btn-secondary ${small ? "!px-1.5 !py-0.5 !text-[10px]" : "!px-2 !py-1 !text-xs"} disabled:opacity-30`}
    >
      {up ? "↑" : "↓"}
    </button>
  );
}
