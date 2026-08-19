/**
 * Utilitaires de pagination (PHASE 4).
 *
 * Les endpoints de listes acceptent `?page=1&limit=20`.
 * Si les paramètres sont absents, la liste complète est renvoyée
 * (comportement rétro-compatible, aucune pagination ajoutée à la réponse).
 */

/**
 * Extraire et normaliser les paramètres de pagination d'une requête.
 *
 * @param {Object} query - `req.query`
 * @param {number} defaultLimit
 * @param {number} maxLimit
 * @returns {{ page: number, limit: number } | null}
 */
export function parsePagination(query, defaultLimit = 20, maxLimit = 100) {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;

  if (!hasPage && !hasLimit) {
    return null;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit),
  );

  return { page, limit };
}

/**
 * Paginer une liste déjà chargée (recommandé pour les volumes locaux).
 *
 * @param {Array} rows
 * @param {Object|null} pagination - résultat de `parsePagination`
 * @returns {{ rows: Array, pagination: Object | null }}
 */
export function paginateRows(rows, pagination) {
  if (!pagination) {
    return { rows, pagination: null };
  }

  const { page, limit } = pagination;
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    rows: rows.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
