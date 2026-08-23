import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Icons } from "../Icons";
import "./rich-text.css";

const MAX_CONTENU = 2_000_000;

function ToolButton({ active, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm font-semibold transition ${
        active
          ? "bg-brand-600 text-white"
          : "text-slate-600 hover:bg-slate-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

/**
 * Éditeur Rich Text (Tiptap) pour le contenu des sous-sections.
 * - HTML contrôlé par value/onChange ;
 * - insertion d'images et de liens par URL (aucun upload côté backend) ;
 * - limite stricte : 2 000 000 caractères (alignée sur le validator backend).
 */
export default function RichTextEditor({ value, onChange, disabled = false }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      if (!onChange) return;
      let html = ed.getHTML();
      if (html.length > MAX_CONTENU) {
        html = html.slice(0, MAX_CONTENU);
        ed.commands.setContent(html, { emitUpdate: false });
      }
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if ((value || "") !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return <div className="h-56 animate-pulse rounded-lg bg-slate-100" />;
  }

  const chain = () => editor.chain().focus();

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      chain().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      chain().setLink({ href }).run();
    }
    setLinkUrl("");
    setShowLink(false);
  };

  const applyImage = () => {
    const src = imageUrl.trim();
    if (src) {
      const full = /^(https?:)?\/\//i.test(src) ? src : `https://${src}`;
      chain().setImage({ src: full }).run();
    }
    setImageUrl("");
    setShowImage(false);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
        <ToolButton
          title="Titre section"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolButton>
        <ToolButton
          title="Sous-titre"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolButton title="Gras" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>
          B
        </ToolButton>
        <ToolButton
          title="Italique"
          active={editor.isActive("italic")}
          onClick={() => chain().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </ToolButton>
        <ToolButton
          title="Barré"
          active={editor.isActive("strike")}
          onClick={() => chain().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </ToolButton>
        <ToolButton
          title="Bloc citation"
          active={editor.isActive("blockquote")}
          onClick={() => chain().toggleBlockquote().run()}
        >
          ❝
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolButton
          title="Liste à puces"
          active={editor.isActive("bulletList")}
          onClick={() => chain().toggleBulletList().run()}
        >
          •—
        </ToolButton>
        <ToolButton
          title="Liste numérotée"
          active={editor.isActive("orderedList")}
          onClick={() => chain().toggleOrderedList().run()}
        >
          1.
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolButton
          title="Lien"
          active={editor.isActive("link")}
          onClick={() => {
            setShowLink((v) => !v);
            setShowImage(false);
            setLinkUrl(editor.getAttributes("link").href || "");
          }}
        >
          <Icons.external className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Image par URL"
          onClick={() => {
            setShowImage((v) => !v);
            setShowLink(false);
            setImageUrl("");
          }}
        >
          <Icons.video className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Ligne horizontale"
          onClick={() => chain().setHorizontalRule().run()}
        >
          —
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolButton title="Annuler" onClick={() => chain().undo().run()}>
          ↶
        </ToolButton>
        <ToolButton title="Rétablir" onClick={() => chain().redo().run()}>
          ↷
        </ToolButton>
        <span className="ml-auto pr-1 text-[11px] text-slate-400">
          {editor.getText().length.toLocaleString("fr-FR")} / 2 000 000
        </span>
      </div>

      {showLink && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-brand-50/50 px-3 py-2">
          <input
            className="input !py-1.5 !text-xs"
            placeholder="https://exemple.com — vide pour retirer le lien"
            value={linkUrl}
            autoFocus
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyLink()}
          />
          <button type="button" className="btn-primary !py-1.5 !text-xs" onClick={applyLink}>
            OK
          </button>
        </div>
      )}
      {showImage && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-brand-50/50 px-3 py-2">
          <input
            className="input !py-1.5 !text-xs"
            placeholder="URL de l'image (ex. https://.../image.jpg)"
            value={imageUrl}
            autoFocus
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyImage()}
          />
          <button type="button" className="btn-primary !py-1.5 !text-xs" onClick={applyImage}>
            Insérer
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="prose-sm max-w-none px-4 py-3" />
    </div>
  );
}

export { MAX_CONTENU };
