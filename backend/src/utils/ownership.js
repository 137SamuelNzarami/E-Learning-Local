import ROLES from "../constants/role.js";
import { AccessDeniedError, NotFoundError, UnauthorizedError } from "./app-errors.js";

import FormationRepository from "../repositories/formation.repository.js";
import ModuleRepository from "../repositories/module.repository.js";
import ChapterRepository from "../repositories/chapter.repository.js";
import LessonRepository from "../repositories/lesson.repository.js";
import VideoRepository from "../repositories/video.repository.js";
import DocumentRepository from "../repositories/document.repository.js";
import QuizRepository from "../repositories/quiz.repository.js";
import QuestionRepository from "../repositories/question.repository.js";
import AnswerRepository from "../repositories/answer.repository.js";
import AssignmentRepository from "../repositories/assignment.repository.js";

/**
 * Contrôle de propriété centralisé (PHASE 3).
 *
 * ---------------------------------------------------------------------
 * 1) CHAÎNE PÉDAGOGIQUE (contenu géré par les formateurs)
 * ---------------------------------------------------------------------
 *
 * Formation
 *  └─ Module
 *      └─ Chapitre
 *          └─ Leçon
 *              ├─ Vidéo / Document / Quiz / Devoir
 *              └─ (Quiz) ─ Question ─ Réponse
 *
 * Un Formateur ne peut créer / modifier / supprimer que les ressources
 * dont la formation racine lui appartient (id_formateur == user.id).
 * Un Administrateur conserve un accès global.
 *
 * ---------------------------------------------------------------------
 * 2) RESSOURCES PERSONNELLES (données propres à un utilisateur)
 * ---------------------------------------------------------------------
 *
 * Inscription, Progression, Tentative, Réponse Étudiant, Soumission :
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
  module: ModuleRepository,
  chapter: ChapterRepository,
  lesson: LessonRepository,
  video: VideoRepository,
  document: DocumentRepository,
  quiz: QuizRepository,
  question: QuestionRepository,
  answer: AnswerRepository,
  assignment: AssignmentRepository,
};

const PARENT_TYPE = {
  module: "formation",
  chapter: "module",
  lesson: "chapter",
  video: "lesson",
  document: "lesson",
  quiz: "lesson",
  assignment: "lesson",
  question: "quiz",
  answer: "question",
};

const PARENT_FIELD = {
  module: "id_formation",
  chapter: "id_module",
  lesson: "id_chapitre",
  video: "id_lecon",
  document: "id_lecon",
  quiz: "id_lecon",
  assignment: "id_lecon",
  question: "id_quiz",
  answer: "id_question",
};

const TYPES = Object.keys(REPOS);

/**
 * Remonte la chaîne pédagogique jusqu'à la formation racine.
 *
 * @param {string} type - type de ressource (formation, module, ...)
 * @param {number|string} id - identifiant de la ressource
 * @returns {Promise<object|null>} la formation racine (avec id_formateur)
 *          ou null si la ressource (ou un maillon) n'existe pas.
 */
export async function resolveFormation(type, id) {
  if (!TYPES.includes(type)) {
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
 *
 * Lève une erreur sinon ; ne renvoie rien en cas de succès.
 *
 * @param {string} type - type de ressource à vérifier
 * @param {number|string} id - identifiant de la ressource (ou du parent cible)
 * @param {object} user - utilisateur authentifié ({ id, role })
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
 * (Utilitaire pour les libellés d'erreur et les contrôles explicites.)
 */
export async function getFormationOwnerId(type, id) {
  const formation = await resolveFormation(type, id);
  return formation ? Number(formation.id_formateur) : null;
}

/* ------------------------------------------------------------------ */
/* 2) RESSOURCES PERSONNELLES                                          */
/* ------------------------------------------------------------------ */

/**
 * Vérifie qu'un utilisateur peut ACCÉDER à une ressource personnelle
 * identifiée par son propriétaire (colonne id_utilisateur).
 *
 * - Administrateur : accès global.
 * - Toute autre rôle : accès limité à ses propres données.
 *
 * Lève une erreur sinon.
 *
 * @param {object} user - utilisateur authentifié ({ id, role })
 * @param {number|string} idUtilisateur - propriétaire de la ressource
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
 * Filtre une liste de ressources personnelles pour ne garder que celles
 * de l'utilisateur courant (sauf Administrateur : tout est conservé).
 *
 * @param {Array<object>} rows - lignes contenant la colonne id_utilisateur
 * @param {object} user - utilisateur authentifié
 * @returns {Array<object>} les lignes autorisées
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
 * Vérifie qu'un utilisateur a accès à UNE formation :
 * - Administrateur : toutes les formations.
 * - Formateur     : uniquement ses propres formations.
 * - Étudiant      : jamais (les étudiants n'ont pas de vue globale).
 *
 * @param {object|null} formation - formation avec colonne id_formateur
 * @param {object} user - utilisateur authentifié ({ id, role })
 * @returns {boolean}
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
 * Filtre les ressources personnelles (tentatives, soumissions, ...)
 * selon le contexte d'une formation :
 *
 * - un formateur qui possède la formation voit toutes les lignes ;
 * - un étudiant ne voit que ses propres lignes ;
 * - un formateur qui ne possède PAS la formation ne voit que ses
 *   propres lignes (généralement vides), il n'y a donc aucune fuite.
 *
 * @param {Array<object>} rows - lignes contenant la colonne id_utilisateur
 * @param {object} user - utilisateur authentifié
 * @param {object} formation - formation racine de la ressource
 * @returns {Array<object>} les lignes autorisées
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
 * Renvoie l'identifiant d'utilisateur à utiliser pour une requête
 * « par utilisateur » : imposé par le token sauf pour l'Administrateur.
 *
 * @param {object} user - utilisateur authentifié
 * @param {number|string} idUtilisateurDemande - id fourni (URL ou body)
 * @returns {number} l'identifiant à utiliser
 */
export function scopeToUser(user, idUtilisateurDemande) {
  assertAuthenticated(user);

  if (isAdmin(user)) {
    return Number(idUtilisateurDemande);
  }

  return Number(user.id);
}

/**
 * Vérifie qu'un utilisateur peut écrire une ressource personnelle :
 * pour un non-admin, le propriétaire (colonne id_utilisateur) est imposé
 * par le token, jamais par le client.
 *
 * Mutate `data.id_utilisateur` si nécessaire.
 *
 * @param {object} data - payload d'écriture
 * @param {object} user - utilisateur authentifié
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
 * Un utilisateur peut-il voir le champ `est_correcte` (le corrigé) ?
 *
 * - Administrateur : oui.
 * - Formateur      : oui uniquement s'il possède la formation racine.
 * - Étudiant       : jamais.
 *
 * @param {object} user - utilisateur authentifié
 * @param {object|null} formation - formation racine (colonne id_formateur)
 * @returns {boolean}
 */
export function canSeeCorrection(user, formation) {
  return canAccessFormation(formation, user);
}

/**
 * Un utilisateur peut-il attribuer / modifier une NOTE ?
 *
 * - Administrateur : oui.
 * - Formateur      : oui uniquement s'il possède la formation racine.
 * - Étudiant       : jamais.
 *
 * @param {object} user - utilisateur authentifié
 * @param {object|null} formation - formation racine (colonne id_formateur)
 * @returns {boolean}
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
 * Retire le champ `est_correcte` d'une ligne (sans la muter).
 *
 * @param {object|null} row - ligne pouvant contenir est_correcte
 * @returns {object|null} une copie sans est_correcte
 */
export function stripCorrectionField(row) {
  if (!row) {
    return row;
  }

  const { est_correcte, ...rest } = row;
  return rest;
}
