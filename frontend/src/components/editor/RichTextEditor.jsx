import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Video from "./video-extension";
import { Icons } from "../Icons";
import { isSafeUrl, MAX_CONTENU, isProtectedFileUrl, buildFileUrl, prepareRichTextForEditor, stripTokensFromRichText } from "../../utils/richText";
import fileService from "../../services/fileService";
import { useAuth } from "../../context/AuthContext";
import "./rich-text.css";

const SafeEnter = Extension.create({
  name: "safeEnter",
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        if (selection.empty) return false;
        editor.chain().focus().setTextSelection(selection.to).splitBlock().run();
        return true;
      },
    };
  },
});

const UPLOAD_ACCEPT = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska",
  document: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md",
};

function ToolButton({ active, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm font-semibold transition ${
        active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

const Separator = () => <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />;

export default function RichTextEditor({ value, onChange, disabled = false }) {
  const { token } = useAuth();
  const [panel, setPanel] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [urlError, setUrlError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      SafeEnter,
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Underline,
      Video,
    ],
    content: token ? prepareRichTextForEditor(value || "", token) : value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      if (!onChange) return;
      const html = stripTokensFromRichText(ed.getHTML());
      if (html.length > MAX_CONTENU) {
        onChange(html.slice(0, MAX_CONTENU));
        ed.commands.setContent(token ? prepareRichTextForEditor(html.slice(0, MAX_CONTENU), token) : html.slice(0, MAX_CONTENU), { emitUpdate: false });
        return;
      }
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const clean = stripTokensFromRichText(editor.getHTML());
    if ((value || "") !== clean && !editor.isFocused) {
      editor.commands.setContent(token ? prepareRichTextForEditor(value || "", token) : value || "", { emitUpdate: false });
    }
  }, [value, editor, token]);

  /**
   * Les URLs protégées vivent dans le DOCUMENT ProseMirror (préparées via
   * prepareRichTextForEditor) : TipTap les rend nativement, elles survivent
   * aux re-rendus, et getHTML() est dé-tokenisé à la persistance
   * (stripTokensFromRichText). Aucun écouteur de transactions ni
   * MutationObserver sur le DOM : plus de boucle de réconciliation.
   */

  if (!editor) {
    return <div className="h-56 animate-pulse rounded-lg bg-slate-100" />;
  }

  const chain = () => editor.chain().focus();

  const placeCaretAfterSelection = () => {
    const sel = editor.state.selection;
    const pos = typeof sel.to === "number" ? sel.to : sel.$from.pos;
    editor.commands.setTextSelection(pos);
    if (!editor.isFocused) editor.commands.focus();
  };

  const closePanel = () => { setPanel(null); setUrlError(null); };

  const handleFileUpload = async (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
const res = await fileService.upload(file);
      const url = res.data?.src;
      if (!url) throw new Error("Le serveur n'a pas retourné d'URL.");
      const src = token ? buildFileUrl(url, token) : url;

      if (kind === "image") {
        chain().setImage({ src: src, alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") }).run();
      } else if (kind === "video") {
        chain().setVideo({ src: src }).run();
      } else {
        const label = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        chain().insertContent(`<a href="${src}">${esc(label)} — ${esc(file.name)}</a>`).run();
      }

      placeCaretAfterSelection();
      const msg = kind === "image" ? "Image insérée." : kind === "video" ? "Vidéo insérée." : "Document inséré.";
      setUploadSuccess(msg);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err) {
      setUploadError(err?.message || "Échec de l'upload.");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const openPanel = (name) => {
    setPanel((c) => (c === name ? null : name));
    setUrlError(null);
    if (name === "link") setLinkUrl(editor.getAttributes("link").href || "");
  };

  const applyLink = () => {
    const href = linkUrl.trim()
      ? (() => {
          const t = linkUrl.trim();
          if (/^\/api\/files\//.test(t)) return t;
          if (/^(https?:)?\/\//i.test(t)) return t.startsWith("//") ? `https:${t}` : t;
          if (/^www\./i.test(t)) return `https://${t}`;
          return t;
        })()
      : "";
    if (linkUrl.trim() && !isSafeUrl(href)) {
      setUrlError("URL non autorisée (protocole refusé).");
      return;
    }
    if (!href) chain().unsetLink().run();
    else chain().setLink({ href }).run();
    placeCaretAfterSelection();
    setLinkUrl("");
    closePanel();
  };

  /**
   * Ouvre immédiatement le lien sélectionné dans un nouvel onglet.
   * Les documents protégés (/api/files/...) utilisent l'URL authentifiée
   * (avec ?token=) — aucun enregistrement préalable n'est nécessaire.
   */
  const openSelectedLink = () => {
    const currentHref = editor?.getAttributes("link")?.href || linkUrl || "";
    const href = String(currentHref).trim();
    if (!href) return;
    const target = isProtectedFileUrl(href)
      ? buildFileUrl(href, token) || href
      : href;
    if (isSafeUrl(target)) {
      window.open(target, "_blank", "noopener,noreferrer");
    }
  };

  const htmlLength = stripTokensFromRichText(editor.getHTML()).length;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
        <ToolButton title="Titre principal" active={editor.isActive("heading", { level: 1 })} onClick={() => chain().toggleHeading({ level: 1 }).run()}>H1</ToolButton>
        <ToolButton title="Titre section" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>H2</ToolButton>
        <ToolButton title="Sous-titre" active={editor.isActive("heading", { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>H3</ToolButton>
        <Separator />
        <ToolButton title="Gras" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>B</ToolButton>
        <ToolButton title="Italique" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}><span className="italic">I</span></ToolButton>
        <ToolButton title="Souligné" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()}><span className="underline">U</span></ToolButton>
        <ToolButton title="Barré" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}><span className="line-through">S</span></ToolButton>
        <ToolButton title="Code" active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}>{"</>"}</ToolButton>
        <Separator />
        <ToolButton title="Bloc citation" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}>❝</ToolButton>
        <ToolButton title="Bloc de code" active={editor.isActive("codeBlock")} onClick={() => chain().toggleCodeBlock().run()}>▤</ToolButton>
        <Separator />
        <ToolButton title="Liste à puces" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}>•—</ToolButton>
        <ToolButton title="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}>1.</ToolButton>
        <Separator />
        <ToolButton title="Lien" active={panel === "link"} onClick={() => openPanel("link")}><Icons.external className="h-4 w-4" /></ToolButton>
        <ToolButton title="Insérer une image" onClick={() => imageInputRef.current?.click()} disabled={uploading}><Icons.eye className="h-4 w-4" /></ToolButton>
        <ToolButton title="Insérer une vidéo" onClick={() => videoInputRef.current?.click()} disabled={uploading}><Icons.video className="h-4 w-4" /></ToolButton>
        <ToolButton title="Insérer un document" onClick={() => docInputRef.current?.click()} disabled={uploading}><Icons.file className="h-4 w-4" /></ToolButton>
        <ToolButton title="Ligne horizontale" onClick={() => chain().setHorizontalRule().run()}>—</ToolButton>
        <Separator />
        <ToolButton title="Annuler" onClick={() => chain().undo().run()}>↶</ToolButton>
        <ToolButton title="Rétablir" onClick={() => chain().redo().run()}>↷</ToolButton>
        <span className={`ml-auto pr-1 text-[11px] ${htmlLength > MAX_CONTENU ? "font-bold text-red-600" : "text-slate-400"}`} aria-live="polite">
          {htmlLength.toLocaleString("fr-FR")} / {MAX_CONTENU.toLocaleString("fr-FR")}
        </span>
      </div>

      <input ref={imageInputRef} type="file" accept={UPLOAD_ACCEPT.image} className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
      <input ref={videoInputRef} type="file" accept={UPLOAD_ACCEPT.video} className="hidden" onChange={(e) => handleFileUpload(e, "video")} />
      <input ref={docInputRef} type="file" accept={UPLOAD_ACCEPT.document} className="hidden" onChange={(e) => handleFileUpload(e, "document")} />

      {panel === "link" && (
        <div className="border-b border-slate-100 bg-brand-50/50 px-3 py-2">
          {urlError && <p className="mb-1.5 text-xs font-semibold text-red-600">{urlError}</p>}
          <div className="flex items-center gap-2">
            <input
              className="input !py-1.5 !text-xs"
              placeholder="https://exemple.com — vide pour retirer le lien"
              value={linkUrl}
              autoFocus
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
            />
            <button type="button" className="btn-primary !py-1.5 !text-xs" onClick={applyLink}>OK</button>
            <button type="button" disabled={!(editor?.getAttributes("link")?.href || linkUrl.trim())} className="btn-secondary !py-1.5 !text-xs" onClick={openSelectedLink}>↗ Ouvrir</button>
          </div>
        </div>
      )}

      {uploadError && <p className="border-b border-slate-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">{uploadError}</p>}
      {uploadSuccess && <p className="border-b border-slate-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">{uploadSuccess}</p>}

      <EditorContent editor={editor} className="prose-sm max-w-none px-4 py-3" />
    </div>
  );
}

export { MAX_CONTENU };
