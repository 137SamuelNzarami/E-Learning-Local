import DocumentRepository from "../repositories/document.repository.js";
import LessonRepository from "../repositories/lesson.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/app-errors.js";

class DocumentService {
  async getAllDocuments() {
    return await DocumentRepository.findAll();
  }

  async getDocumentById(id) {
    const document = await DocumentRepository.findById(id);

    if (!document) {
      throw new NotFoundError("Document introuvable.");
    }

    return document;
  }

  async createDocument(data, user) {
    // Un fichier (ou un chemin explicite) est obligatoire à la création
    if (!data.chemin_document) {
      throw new ValidationError(
        "Le fichier document est obligatoire.",
        [{ field: "fichier", message: "Le fichier document est obligatoire." }],
      );
    }

    const lesson = await LessonRepository.findById(data.id_lecon);

    if (!lesson) {
      throw new NotFoundError("La leçon sélectionnée est introuvable.");
    }

    // Le formateur ne peut créer que dans ses propres leçons
    await assertCanManage("lesson", data.id_lecon, user);

    const existe = await DocumentRepository.findByTitle(data.titre);

    if (existe) {
      throw new ConflictError("Un document portant ce titre existe déjà.");
    }

    return await DocumentRepository.create(data);
  }

  async updateDocument(id, data, user) {
    const document = await DocumentRepository.findById(id);

    if (!document) {
      throw new NotFoundError("Document introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut modifier le document
    await assertCanManage("document", id, user);

    const lesson = await LessonRepository.findById(data.id_lecon);

    if (!lesson) {
      throw new NotFoundError("La leçon sélectionnée est introuvable.");
    }

    // Si le document est déplacé, le formateur doit posséder la leçon cible
    await assertCanManage("lesson", data.id_lecon, user);

    const existe = await DocumentRepository.findByTitle(data.titre);

    if (existe && existe.id_document !== Number(id)) {
      throw new ConflictError("Un document portant ce titre existe déjà.");
    }

    try {
      await DocumentRepository.update(id, data);

      return await DocumentRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async deleteDocument(id, user) {
    const document = await DocumentRepository.findById(id);

    if (!document) {
      throw new NotFoundError("Document introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("document", id, user);

    try {
      return await DocumentRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new DocumentService();
