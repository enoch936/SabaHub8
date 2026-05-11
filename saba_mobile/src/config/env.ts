import Constants from "expo-constants";
import { Platform } from "react-native";

type ExpoExtra = {
  apiBaseUrl?: string;
  wsBaseUrl?: string;
};

function normalizeApiUrl(value: string | undefined) {
  const fallback = getFallbackApiBaseUrl();
  if (!value || !value.trim()) {
    return fallback;
  }
  return value.replace(/\/+$/, "");
}

function normalizeWsUrl(value: string | undefined) {
  const fallback = deriveWsUrl(getFallbackApiBaseUrl());
  if (!value || !value.trim()) {
    return fallback;
  }
  return value.replace(/\/+$/, "");
}

function getDevServerHost() {
  const hostFromConfig = Constants.expoConfig?.hostUri;
  const hostFromManifest = (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  const host = hostFromConfig ?? hostFromManifest;
  if (!host || !host.trim()) {
    return null;
  }
  return host.split(":")[0]?.trim() || null;
}

function getFallbackApiBaseUrl() {
  const devServerHost = getDevServerHost();
  if (devServerHost && devServerHost !== "127.0.0.1" && devServerHost !== "localhost") {
    return `http://${devServerHost}:8080/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api";
  }

  return "http://localhost:8080/api";
}

function deriveWsUrl(apiBaseUrl: string) {
  if (apiBaseUrl.endsWith("/api")) {
    return apiBaseUrl.slice(0, -4).replace(/^http:/, "ws:").replace(/^https:/, "wss:") + "/ws";
  }
  return apiBaseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const envApiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
const envWsBase = process.env.EXPO_PUBLIC_WS_BASE_URL;

export const API_BASE_URL = normalizeApiUrl(envApiBase ?? extra.apiBaseUrl);
export const WS_BASE_URL = normalizeWsUrl(envWsBase ?? extra.wsBaseUrl ?? deriveWsUrl(API_BASE_URL));
