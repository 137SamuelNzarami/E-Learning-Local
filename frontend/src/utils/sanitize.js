import DOMPurify from "dompurify";

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Nettoie un HTML riche avant rendu (contenus des sous-sections).
 * Le HTML provient potentiellement d'utilisateurs → jamais injecté brut.
 */
export function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty ?? "", {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "form", "input"],
    FORBID_ATTR: ["onerror", "onclick", "onload"],
  });
}

export default sanitizeHtml;
