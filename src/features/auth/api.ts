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

export function listProjects(params = { page: 1, limit: 10 }) {
  return axiosClient.get(endpoints.projects.list, {
    query: params,
  });
}

export function createProject(payload: any) {
  return axiosClient.post(endpoints.projects.list, payload);
}

export function getProjectDetail(publicId: string) {
  return axiosClient.get(endpoints.projects.detail(publicId));
}

export function updateProject(publicId: string, payload: any) {
  return axiosClient.patch(endpoints.projects.detail(publicId), payload);
}
