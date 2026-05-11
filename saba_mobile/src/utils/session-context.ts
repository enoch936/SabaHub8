import { Platform } from "react-native";
import { mobileStorage, storageKeys } from "../storage/mmkv";

function ensureDeviceId() {
  const current = mobileStorage.getString(storageKeys.deviceId);
  if (current) {
    return current;
  }
  const generated = `${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  mobileStorage.set(storageKeys.deviceId, generated);
  return generated;
}

function devicePlatform() {
  if (Platform.OS === "ios") {
    return "iOS";
  }
  if (Platform.OS === "android") {
    return "Android";
  }
  return Platform.OS;
}

function readTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

export function getSessionContextHeaders() {
  const headers: Record<string, string> = {};
  const id = ensureDeviceId();
  if (id) {
    headers["X-Device-Id"] = id;
  }
  const platform = devicePlatform();
  if (platform) {
    headers["X-Device-Platform"] = platform;
    headers["X-Device-Type"] = "Mobile";
    headers["X-Device-Name"] = `${platform} App`;
  }
  const timezone = readTimezone();
  if (timezone) {
    headers["X-Timezone"] = timezone;
  }
  return headers;
}
