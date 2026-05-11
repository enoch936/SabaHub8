import axios, { AxiosError, type AxiosResponse } from "axios";
import { API_BASE_URL } from "../config/env";
import { useSessionStore } from "../store/session-store";
import { getSessionContextHeaders } from "../utils/session-context";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const session = useSessionStore.getState();
  config.headers = config.headers ?? {};

  const sessionHeaders = getSessionContextHeaders();
  Object.entries(sessionHeaders).forEach(([key, value]) => {
    if (value) {
      config.headers[key] = value;
    }
  });

  if (session.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  if (session.activeRole === "EMPLOYER" || session.activeRole === "FREELANCER") {
    config.headers["X-Active-Role"] = session.activeRole;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.status === 204 || response.data === "") {
      response.data = null;
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      useSessionStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

export function readApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const record = payload as Record<string, unknown>;
  const message = record.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }
  const error = record.error;
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return fallback;
}

export function unwrapResponse<T>(response: AxiosResponse<T>, fallback: string) {
  if (response.status >= 400) {
    throw new Error(readApiErrorMessage(response.data, fallback));
  }
  return response.data;
}

export function toApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return readApiErrorMessage(error.response?.data, error.message || fallback);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
