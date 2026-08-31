import client from "../api/client";

/**
 * Backend : /api/files
 * - POST   /upload   (multipart « fichier ») → { fileName, src, type, mimeType }
 * - GET    /:filename (lecture protégée, JWT header ou ?token=)
 */
export const fileService = {
  upload(file) {
    const formData = new FormData();
    formData.append("fichier", file);
    return client.post("/files/upload", formData);
  },
};

export default fileService;