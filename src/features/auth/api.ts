import { axiosClient } from "../../shared/api/axiosClient";
import { endpoints } from "../../shared/api/endpoints";

export function login(payload: { email: string; password: string }) {
  return axiosClient.post(endpoints.auth.login, payload, {
    retryOnUnauthorized: false,
  });
}

export function loginWithGoogle(accessToken: string) {
  return axiosClient.get(endpoints.auth.googleLogin, {
    query: { access_token: accessToken },
    retryOnUnauthorized: false,
  });
}

export function listProjects(params = { page: 1, limit: 10 }, options = {}) {
  return axiosClient.get(endpoints.projects.list, {
    ...options,
    query: params,
  });
}

export function listTemplates(params = { page: 1, limit: 10 }) {
  return axiosClient.get(endpoints.projects.templates, {
    query: params,
    retryOnUnauthorized: false,
  });
}

export function createProject(payload: any) {
  return axiosClient.post(endpoints.projects.list, payload);
}

export function getProjectDetail(publicId: string) {
  return axiosClient.get(endpoints.projects.detail(publicId));
}

export function getProjectInit(publicId: string) {
  return axiosClient.get(endpoints.projects.init(publicId));
}

export function getProjectInitPublic(publicId: string) {
  return axiosClient.get(endpoints.projects.init(publicId), {
    retryOnUnauthorized: false,
  });
}

export function updateProject(publicId: string, payload: any) {
  return axiosClient.patch(endpoints.projects.detail(publicId), payload);
}

export function deleteProject(publicId: string) {
  return axiosClient.delete(endpoints.projects.detail(publicId));
}

export function updateProjectNodes(publicId: string, payload: any) {
  return axiosClient.patch(endpoints.projects.nodes(publicId), payload);
}

export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.postForm(endpoints.uploads.images, formData);
}
