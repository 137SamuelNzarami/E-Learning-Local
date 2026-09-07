import DOMPurify from "dompurify";
import { API_URL } from "../api/client";

/**
 * Logique CENTRALISée du contenu riche :
 * - sanitation XSS (DOMPurify)
 * - sécurité des URLs (javascript:, data:, vbscript:)
 * - résolution des fichiers protégés (/api/files/:nom) avec ?token=
 *
 * Le HTML stocké en base ne contient JAMAIS de JWT : il référence les
 * fichiers protégés par un chemin relatif `/api/files/<nom>`. Le token
 * est injecté uniquement AU RENDU (img/video/audio/a), jamais persisté.
 */

export const MAX_CONTENU = 2_000_000;

/** Protocoles interdits dans les attributs URL. */
const DANGEROUS_PROTOCOL_RE = /^\s*(javascript|data|vbscript):/i;

/**
 * URL sûre pour href/src : refuse javascript:, data:, vbscript:.
 * Les URLs relatives (/api/files/..., /chemin) sont autorisées.
 */
export function isSafeUrl(url) {
  const value = String(url ?? "").trim();
  if (!value) return false;
  if (DANGEROUS_PROTOCOL_RE.test(value)) return false;
  return true;
}

/**
 * Un chemin pointe-t-il vers un fichier protégé servi par le backend ?
 * Formes acceptées : /api/files/<nom>, http(s)://host/api/files/<nom>.
 */
export function isProtectedFileUrl(url) {
  const value = String(url ?? "");
  return /(?:^|\/)api\/files\/[^/?#]+/.test(value);
}

/** Nom de fichier extrait d'une URL /api/files/<nom>. */
export function filenameFromUrl(url) {
  const match = String(url ?? "").match(/api\/files\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Construit l'URL utilisable par une balise <img>/<video>/<a> pour un
 * fichier protégé : URL absolue + jeton en query (?token=), mécanisme
 * réellement prévu par GET /api/files/:filename.
 */
export function buildFileUrl(pathOrFilename, token) {
  let filename = String(pathOrFilename ?? "");
  const match = filename.match(/api\/files\/([^?#]+)/);
  if (match) filename = decodeURIComponent(match[1]);
  filename = filename.replace(/^\/+/, "").replace(/^api\/files\//, "");
  const base = `${API_URL}/files/${encodeURIComponent(filename)}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

/**
 * Ajoute ?token= aux URLs /api/files d'un attribut si nécessaire.
 * Les URLs externes sont renvoyées inchangées.
 */
export function resolveMediaUrl(url, token) {
  const value = String(url ?? "").trim();
  if (!isSafeUrl(value)) return "";
  if (!isProtectedFileUrl(value)) return value;
  return buildFileUrl(value, token);
}

/**
 * Injecte le ?token= sur les fichiers protégés d'un DOM (éditeur TipTap).
 *
 * Couvre TOUS les éléments exploités par le formateur :
 *   - <img src>      → image ;
 *   - <video src> / <source src> → vidéo (lecture immédiate) ;
 *   - <a href>       → document (lien/ouverture immédiate).
 *
 * - Opération idempotente : un URL déjà pourvu d'un token est ignoré.
 * - Volatile par conception : elle ne modifie QUE le DOM affiché. Elle ne
 *   touche JAMAIS aux attributs du document TipTap, donc le HTML persisté
 *   (editor.getHTML()) conserve l'URL relative `/api/files/<nom>`, sans JWT.
 * - n'atteint que les URLs protégées (`/api/files/...`) ; les liens externes
 *   et tout autre attribut restent inchangés.
 *
 * Retourne le nombre d'URLs réécrites.
 */
export function tokenizeMediaUrlsInDom(rootEl, token) {
  if (typeof document === "undefined") return 0;
  let root =
    rootEl && rootEl.querySelectorAll ? rootEl : null;
  if (typeof rootEl === "string" && !root) {
    root = document.querySelector(rootEl);
  }
  if (!root || !token) return 0;

  let changed = 0;
  root
    .querySelectorAll("img[src], video[src], source[src], a[href]")
    .forEach((el) => {
      const attr = el.tagName === "A" ? "href" : "src";
      const value = String(el.getAttribute(attr) ?? "").trim();
      if (!value || !isProtectedFileUrl(value) || value.includes("token=")) {
        return;
      }
      const resolved = buildFileUrl(value, token);
      if (resolved) {
        el.setAttribute(attr, resolved);
        changed++;
      }
    });
  return changed;
}

/* ------------------------------------------------------------------ */
/* Éditeur TipTap : tokens DANS le document ProseMirror                */
/* ------------------------------------------------------------------ */

/**
 * TUTORE stocke des URL RELATIVES `/api/files/<nom>` (jamais de JWT en base).
 * Pour un aperçu immédiat dans l'éditeur (sans enregistrement ni rechargement),
 * on injecte l'URL absolue + ?token= dans le HTML AVANT setContent : le token
 * vit alors dans le DOCUMENT ProseMirror (source de vérité), est rendu
 * nativement par TipTap et survit aux re-rendus — sans jamais toucher au DOM,
 * donc sans conflit de réconciliation (origine des boucles de rendu infinies).
 */
const URL_ATTR_RE = /((?:src|href)=")((?:https?:)?\/\/[^"]*?)?(\/api\/files\/[^"?#]+)(\?token=[^"]+)?(")/g;

/**
 * HTML d'ENTRÉE (stocké, relatif) → HTML chargé dans l'éditeur (absolu + ?token=).
 * Idempotent : une URL déjà dotée d'un token est simplement reconstruite.
 */
export function prepareRichTextForEditor(html, token) {
  const value = String(html ?? "");
  if (!isProtectedFilePath(value)) return value;
  return value.replace(URL_ATTR_RE, (m, pre, origin, filePath) => pre + buildFileUrl((origin || "") + filePath, token) + '"');
}

/**
 * HTML de SORTIE (editor.getHTML(), absolu + ?token=) → HTML à PERSISTER
 * (relatif, sans JWT). Convertit aussi les absolus sans token en relatifs.
 */
export function stripTokensFromRichText(html) {
  const value = String(html ?? "");
  if (!/[a-z]*api\/files\//i.test(value)) return value;
  return value.replace(URL_ATTR_RE, (m, pre, origin, filePath) => pre + filePath + '"');
}

function isProtectedFilePath(html) {
  return /(?:^|\/|"|')(?:api\/files\/)/i.test(html);
}

/* ------------------------------------------------------------------ */
/* Sanitation                                                          */
/* ------------------------------------------------------------------ */

const ALLOWED_TAGS = [
  // texte
  "p", "br", "hr", "span",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "mark", "sub", "sup", "code", "pre", "kbd",
  // listes
  "ul", "ol", "li",
  // citations
  "blockquote",
  // médias
  "img", "video", "audio", "source", "figure", "figcaption",
  // liens + tableaux
  "a", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "target", "rel", "colspan", "rowspan", "scope",
  "width", "height", "controls", "loop", "muted", "preload", "type", "loading",
];

let hooksInstalled = false;
function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    // Liens externes : nouvel onglet + noopener
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
    // Images : responsives + chargement différé
    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
      node.removeAttribute("srcset");
      node.removeAttribute("sizes");
    }
    // video/audio : jamais de lecture auto
    if (node.tagName === "VIDEO" || node.tagName === "AUDIO") {
      node.setAttribute("controls", "");
      node.removeAttribute("autoplay");
    }
  });
}

/**
 * Nettoie un HTML riche (contenu de sous-section écrit par un formateur)
 * avant tout rendu. Conserve titres, listes, tableaux, images, vidéo/audio,
 * liens et blocs de code ; supprime scripts, iframes, formulaires,
 * gestionnaires d'événements et URLs dangereuses.
 */
export function sanitizeRichText(dirty) {
  installHooks();
  return DOMPurify.sanitize(String(dirty ?? ""), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button", "object", "embed"],
    FORBID_ATTR: ["style", "class", "id", "onerror", "onclick", "onload"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Pipeline complet de rendu :
 * 1. sanitation ;
 * 2. réécriture des médias protégés avec ?token= (au volatil, non persisté) ;
 * 3. transformation des liens vers /api/files/*.ext en cartes document.
 */
export function prepareRichTextForRender(html, token) {
  const clean = sanitizeRichText(html);
  if (!clean) return "";

  const doc = new DOMParser().parseFromString(`<div id="root">${clean}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return clean;

  // Médias : injection du token sur les sources protégées
  root.querySelectorAll("img[src], video[src], audio[src], source[src]").forEach((el) => {
    const resolved = resolveMediaUrl(el.getAttribute("src"), token);
    if (resolved) el.setAttribute("src", resolved);
    else el.removeAttribute("src");
  });

  // Liens internes vers la plateforme : navigation SPA au lieu d'un reload
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const resolved = resolveMediaUrl(href, token);

    // Lien vers un fichier protégé avec extension connue -> carte document
    if (isProtectedFileUrl(href)) {
      const filename = filenameFromUrl(href) || "document";
      const info = fileInfoFromName(filename);
      if (info.isDocument) {
        const card = doc.createElement("span");
        card.setAttribute("data-document-card", "");
        card.innerHTML = documentCardHtml(filename, buildFileUrl(href, token), info);
        a.replaceWith(card);
        return;
      }
      a.setAttribute("href", resolved || "#");
      return;
    }

    a.setAttribute("href", href);
  });

  return root.innerHTML;
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

const DOCUMENT_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "md", "csv", "odt",
]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov", "mkv", "avi"]);

/**
 * Type déduit de l'extension UNIQUEMENT lorsque c'est fiable
 * (le backend ne fournit pas de métadonnées MIME par nom de fichier).
 */
export function fileInfoFromName(nameOrUrl) {
  const name = String(nameOrUrl ?? "").split("?")[0];
  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] || "").toLowerCase();
  if (DOCUMENT_EXTENSIONS.has(ext)) {
    return { kind: "document", label: ext.toUpperCase(), isDocument: true };
  }
  if (IMAGE_EXTENSIONS.has(ext)) {
    return { kind: "image", label: ext.toUpperCase(), isDocument: false };
  }
  if (VIDEO_EXTENSIONS.has(ext)) {
    return { kind: "video", label: ext.toUpperCase(), isDocument: false };
  }
  return { kind: "document", label: "Document", isDocument: true };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function documentCardHtml(filename, downloadUrl, info) {
  const prettyName = filename
    .replace(/^(\d+-)?\d{13}-/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/-/g, " ");
  return `
    <span class="doc-card">
      <span class="doc-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      </span>
      <span class="doc-card__body">
        <span class="doc-card__name">${escapeHtml(prettyName)}</span>
        <span class="doc-card__meta">${escapeHtml(info.label)} · ${escapeHtml(filename)}</span>
      </span>
      <span class="doc-card__actions">
        <a href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener noreferrer" class="doc-card__btn">Ouvrir</a>
        <a href="${escapeHtml(downloadUrl)}" download="${escapeHtml(filename)}" class="doc-card__btn doc-card__btn--primary">Télécharger</a>
      </span>
    </span>`;
}
