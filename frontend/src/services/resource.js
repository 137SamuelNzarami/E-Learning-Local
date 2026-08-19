import client, { toFormData } from "../api/client";

export function createResourceService(base, { multipart = false } = {}) {
  const transform = (payload) => (multipart ? toFormData(payload) : payload);

  return {
    index: (params) => client.get(base, { params }),
    show: (id) => client.get(`${base}/${id}`),
    store: (payload) => client.post(base, transform(payload)),
    update: (id, payload) => client.put(`${base}/${id}`, transform(payload)),
    destroy: (id) => client.delete(`${base}/${id}`),
    getBy: (key, id, params) => client.get(`${base}/${key}/${id}`, { params }),
  };
}
