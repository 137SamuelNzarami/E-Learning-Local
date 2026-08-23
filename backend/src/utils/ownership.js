import ROLES from "../constants/role.js";
import { AccessDeniedError, NotFoundError, UnauthorizedError } from "./app-errors.js";

import FormationRepository from "../repositories/formation.repository.js";
import ChapterRepository from "../repositories/chapter.repository.js";
import SectionRepository from "../repositories/section.repository.js";
import SousSectionRepository from "../repositories/sous-section.repository.js";
import QuizRepository from "../repositories/quiz.repository.js";
import QuestionRepository from "../repositories/question.repository.js";
import AnswerRepository from "../repositories/answer.repository.js";

/**
 * Contrôle de propriété centralisé (architecture pédagogique 2026).
 *
 * ---------------------------------------------------------------------
 * 1) CHAÎNE PÉDAGOGIQUE (contenu géré par les formateurs)
 * ---------------------------------------------------------------------
 *
 * Formation
 *  └─ Chapitre
 *      └─ Section
 *          └─ Sous-section (rich text)
 *      └─ Quiz ─ Question ─ Réponse
 *
 * Un Formateur ne peut créer / modifier / supprimer que les ressources
 * dont la formation racine lui appartient (id_formateur == user.id).
 * Un Administrateur conserve un accès global.
 *
 * ---------------------------------------------------------------------
 * 2) RESSOURCES PERSONNELLES (données propres à un utilisateur)
 * ---------------------------------------------------------------------
 *
 * Inscription, Progression, Tentative, Réponse Étudiant :
 * un Étudiant (et plus généralement un utilisateur non-admin) ne peut
 * accéder qu'à SES propres données. L'Administrateur y accède globalement.
 * Ces contrôles préviennent les IDOR.
 */

/* ------------------------------------------------------------------ */
/* Helpers de rôle                                                      */
/* ------------------------------------------------------------------ */

export function isAdmin(user) {
  return !!user && user.role === ROLES.ADMIN;
}

export function isFormateur(user) {
  return !!user && user.role === ROLES.FORMATEUR;
}

export function isEtudiant(user) {
  return !!user && user.role === ROLES.ETUDIANT;
}

function assertAuthenticated(user) {
  if (!user || !user.id) {
    throw new UnauthorizedError("Utilisateur non authentifié.");
  }
}

/* ------------------------------------------------------------------ */
/* 1) CHAÎNE PÉDAGOGIQUE                                               */
/* ------------------------------------------------------------------ */

const REPOS = {
  formation: FormationRepository,
  chapter: ChapterRepository,
  section: SectionRepository,
  "sous-section": SousSectionRepository,
  quiz: QuizRepository,
  question: QuestionRepository,
  answer: AnswerRepository,
};

const PARENT_TYPE = {
  chapter: "formation",
  section: "chapter",
  "sous-section": "section",
  quiz: "chapter",
  question: "quiz",
  answer: "question",
};

const PARENT_FIELD = {
  chapter: "id_formation",
  section: "id_chapitre",
  "sous-section": "id_section",
  quiz: "id_chapitre",
  question: "id_quiz",
  answer: "id_question",
};

export const PEDAGOGICAL_TYPES = Object.keys(REPOS);

/**
 * Remonte la chaîne pédagogique jusqu'à la formation racine.
 */
export async function resolveFormation(type, id) {
  if (!PEDAGOGICAL_TYPES.includes(type)) {
    return null;
  }

  let t = type;
  let i = id;

  while (t !== "formation") {
    const row = await REPOS[t].findById(i);
    if (!row) {
      return null;
    }

    i = row[PARENT_FIELD[t]];
    t = PARENT_TYPE[t];
  }

  return await FormationRepository.findById(i);
}

/**
 * Vérifie qu'un utilisateur peut GÉRER (créer/modifier/supprimer) une
 * ressource de la chaîne pédagogique.
 *
 * - Administrateur : droits globaux, toujours autorisé.
 * - Formateur     : autorisé uniquement si la formation racine lui appartient.
 * - Étudiant      : jamais autorisé à gérer le contenu pédagogique.
 */
export async function assertCanManage(type, id, user) {
  assertAuthenticated(user);

  if (isAdmin(user)) {
    return;
  }

  if (!isFormateur(user)) {
    throw new AccessDeniedError(
      "Accès interdit. Vous n'avez pas les permissions nécessaires.",
    );
  }

  const formation = await resolveFormation(type, id);

  if (!formation) {
    throw new NotFoundError("Ressource introuvable.");
  }

  if (Number(formation.id_formateur) !== Number(user.id)) {
    throw new AccessDeniedError(
      "Accès interdit. Cette ressource ne vous appartient pas.",
    );
  }
}

/**
 * Renvoie l'identifiant du formateur propriétaire de la formation racine
 * d'une ressource pédagogique, ou null si la ressource n'existe pas.
 */
export async function getFormationOwnerId(type, id) {
  const formation = await resolveFormation(type, id);
  return formation ? Number(formation.id_formateur) : null;
}

/* ------------------------------------------------------------------ */
/* 2) RESSOURCES PERSONNELLES                                          */
/* ------------------------------------------------------------------ */

/**
 * IDOR : un non-admin ne peut accéder qu'à SES propres ressources.
 */
export function assertPersonalAccess(user, idUtilisateur) {
  assertAuthenticated(user);

  if (isAdmin(user)) {
    return;
  }

  if (Number(user.id) !== Number(idUtilisateur)) {
    throw new AccessDeniedError(
      "Accès interdit. Cette ressource ne vous appartient pas.",
    );
  }
}

/**
 * Filtre une liste de ressources personnelles (sauf admin).
 */
export function filterPersonalRows(rows, user) {
  assertAuthenticated(user);

  if (isAdmin(user)) {
    return rows;
  }

  return rows.filter(
    (row) => Number(row.id_utilisateur) === Number(user.id),
  );
}

/**
 * Accès à UNE formation :
 * - Administrateur : toutes.
 * - Formateur     : uniquement ses propres formations.
 * - Étudiant      : jamais (vue gestionnaire).
 */
export function canAccessFormation(formation, user) {
  if (!formation) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (isFormateur(user)) {
    return Number(formation.id_formateur) === Number(user.id);
  }

  return false;
}

/**
 * Scoping par formation :
 * - formateur propriétaire : toutes les lignes ;
 * - autres : uniquement leurs propres lignes.
 */
export function scopePersonalRowsByFormation(rows, user, formation) {
  assertAuthenticated(user);

  if (canAccessFormation(formation, user)) {
    return rows;
  }

  return rows.filter(
    (row) => Number(row.id_utilisateur) === Number(user.id),
  );
}

/**
 * Identifiant d'utilisateur imposé par le token (sauf administrateur).
 */
export function scopeToUser(user, idUtilisateurDemande) {
  assertAuthenticated(user);

  if (isAdmin(user)) {
    return Number(idUtilisateurDemande);
  }

  return Number(user.id);
}

/**
 * Pour une écriture personnelle : le propriétaire vient du token,
 * jamais du client.
 */
export function imposeOwnership(data, user) {
  assertAuthenticated(user);

  if (isAdmin(user)) {
    return;
  }

  data.id_utilisateur = user.id;
}

/* ------------------------------------------------------------------ */
/* 3) CORRIGÉ (est_correcte) ET NOTATION                              */
/* ------------------------------------------------------------------ */

/**
 * Le champ `est_correcte` / le corrigé n'est visible que par
 * l'administrateur et le formateur propriétaire. Jamais par un étudiant,
 * même inscrit : il ne doit pas pouvoir obtenir les bonnes réponses
 * en inspectant l'API.
 */
export function canSeeCorrection(user, formation) {
  return canAccessFormation(formation, user);
}

/**
 * Attribution / modification d'une NOTE :
 * - Administrateur : oui.
 * - Formateur      : uniquement s'il possède la formation racine.
 * - Étudiant       : jamais.
 */
export function canGrade(user, formation) {
  if (!formation) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  return (
    isFormateur(user) &&
    Number(formation.id_formateur) === Number(user.id)
  );
}

/**
 * Retire `est_correcte` d'une ligne (sans la muter).
 */
export function stripCorrectionField(row) {
  if (!row) {
    return row;
  }

  const { est_correcte, ...rest } = row;
  return rest;
}
