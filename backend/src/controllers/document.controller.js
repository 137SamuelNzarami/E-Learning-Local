import DocumentService from "../services/document.service.js";
import ApiResponse from "../utils/api-response.js";

class DocumentController {
  async index(req, res) {
    try {
      const documents = await DocumentService.getAllDocuments();

      return ApiResponse.success(
        res,
        "Liste des documents récupérée avec succès.",
        documents,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async show(req, res) {
    try {
      const { id } = req.params;
      const document = await DocumentService.getDocumentById(id);
      return ApiResponse.success(
        res,
        "Document récupéré avec succès.",
        document,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async store(req, res) {
    try {
      const data = { ...req.body };

      // Le chemin est dérivé du fichier uploadé (multipart)
      if (req.file) {
        data.chemin_document = `/uploads/${req.file.filename}`;
      }

      const id = await DocumentService.createDocument(data, req.user);
      return ApiResponse.success(res, "Document créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async update(req, res) {
    try {
      const { id } = req.params;

      const data = { ...req.body };

      // Le chemin est dérivé du fichier uploadé, s'il y en a un
      if (req.file) {
        data.chemin_document = `/uploads/${req.file.filename}`;
      }

      const document = await DocumentService.updateDocument(id, data, req.user);
      return ApiResponse.success(
        res,
        "Document modifié avec succès.",
        document,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async destroy(req, res) {
    try {
      const { id } = req.params;
      await DocumentService.deleteDocument(id, req.user);
      return ApiResponse.success(res, "Document supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new DocumentController();
