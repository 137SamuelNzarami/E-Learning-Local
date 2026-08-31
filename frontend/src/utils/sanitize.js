/**
 * Wrapper de compatibilité — la logique unique vit dans utils/richText.js
 * (sanitizeRichText). Tout nouveau code doit importer richText.js.
 */
export { sanitizeRichText as sanitizeHtml, isSafeUrl } from "./richText";

import { sanitizeRichText } from "./richText";

export default sanitizeRichText;
