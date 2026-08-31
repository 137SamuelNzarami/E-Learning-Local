import { useMemo } from "react";
import EmptyState from "../ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { prepareRichTextForRender } from "../../utils/richText";

/**
 * Rendu centralisé du contenu rich text des sous-sections.
 * - sanitation XSS systématique (DOMPurify, config unique) ;
 * - injection volatile du ?token= sur les médias /api/files ;
 * - transformation des liens documents en cartes [Ouvrir | Télécharger].
 *
 * Aucune page ne doit utiliser dangerouslySetInnerHTML directement :
 * passer TOUJOURS par <RichTextRenderer html={...} />.
 */
export default function RichTextRenderer({ html, className = "", emptyLabel = "Aucun contenu pour le moment." }) {
  const { token } = useAuth();

  const prepared = useMemo(() => prepareRichTextForRender(html, token), [html, token]);

  if (!prepared || !prepared.trim()) {
    return (
      <EmptyState
        title="Contenu vide"
        message={emptyLabel}
      />
    );
  }

  return (
    <div
      className={`rte-content ${className}`}
      dangerouslySetInnerHTML={{ __html: prepared }}
    />
  );
}
