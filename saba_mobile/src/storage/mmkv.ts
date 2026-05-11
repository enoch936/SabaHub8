import { createMMKV } from "react-native-mmkv";

export const mobileStorage = createMMKV({
  id: "sabahub.mobile",
});

export const storageKeys = {
  token: "auth_token",
  activeRole: "sabahub_active_role",
  deviceId: "sabahub.device_id",
} as const;
