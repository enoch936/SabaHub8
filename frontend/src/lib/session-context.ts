type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
    brands?: Array<{ brand: string; version?: string }>;
  };
};

type StoredLocation = {
  country?: string;
  location: string;
  capturedAt: number;
};

const DEVICE_ID_STORAGE_KEY = "sabahub.device_id";
const LOCATION_STORAGE_KEY = "sabahub.session_location";
const LOCATION_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const LOCATION_LOOKUP_TIMEOUT_MS = 750;

let locationLookup: Promise<string> | null = null;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocalStorage(key: string) {
  if (!canUseBrowserStorage()) {
    return "";
  }

  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeLocalStorage(key: string, value: string) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in private/incognito contexts.
  }
}

function ensureDeviceId() {
  const existing = readLocalStorage(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `device-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

  writeLocalStorage(DEVICE_ID_STORAGE_KEY, generated);
  return generated;
}

function normalizeOptional(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function parseStoredLocation() {
  const raw = readLocalStorage(LOCATION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredLocation;
    if (!parsed || typeof parsed.location !== "string" || typeof parsed.capturedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function formatSessionLocation(location: string, country?: string) {
  const normalizedLocation = normalizeOptional(location);
  const normalizedCountry = normalizeOptional(country);

  if (!normalizedLocation && !normalizedCountry) {
    return "";
  }
  if (!normalizedCountry) {
    return normalizedLocation;
  }
  if (!normalizedLocation) {
    return normalizedCountry;
  }
  if (normalizedLocation.toLowerCase().includes(normalizedCountry.toLowerCase())) {
    return normalizedLocation;
  }
  return `${normalizedLocation}, ${normalizedCountry}`;
}

export function rememberSessionLocation(location: string, country?: string) {
  const normalizedLocation = normalizeOptional(location);
  if (!normalizedLocation) {
    return "";
  }

  const payload: StoredLocation = {
    location: normalizedLocation,
    country: normalizeOptional(country) || undefined,
    capturedAt: Date.now(),
  };
  writeLocalStorage(LOCATION_STORAGE_KEY, JSON.stringify(payload));
  return formatSessionLocation(payload.location, payload.country);
}

async function lookupApproximateLocation() {
  if (typeof window === "undefined") {
    return "";
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), LOCATION_LOOKUP_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch("https://ipapi.co/json/", {
      cache: "no-store",
      signal: controller?.signal,
    });
    if (!response.ok) {
      return "";
    }

    const payload = (await response.json()) as {
      city?: string;
      region?: string;
      country_name?: string;
    };
    const location = [payload.city ?? "", payload.region ?? ""].filter(Boolean).join(", ");
    return rememberSessionLocation(location, payload.country_name);
  } catch {
    return "";
  } finally {
    if (timeout != null) {
      window.clearTimeout(timeout);
    }
  }
}

async function resolveSessionLocation() {
  const cached = parseStoredLocation();
  if (cached && Date.now() - cached.capturedAt < LOCATION_CACHE_TTL_MS) {
    return formatSessionLocation(cached.location, cached.country);
  }

  if (!locationLookup) {
    locationLookup = lookupApproximateLocation().finally(() => {
      locationLookup = null;
    });
  }

  const resolved = await locationLookup;
  return resolved || formatSessionLocation(cached?.location ?? "", cached?.country);
}

function inferPlatform(userAgent: string, navigatorData: NavigatorWithUserAgentData) {
  const hintedPlatform = normalizeOptional(navigatorData.userAgentData?.platform);
  if (hintedPlatform) {
    return hintedPlatform;
  }

  const ua = userAgent.toLowerCase();
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("macintosh") || ua.includes("mac os")) return "macOS";
  if (ua.includes("linux")) return "Linux";
  return "";
}

function inferBrowser(userAgent: string, navigatorData: NavigatorWithUserAgentData) {
  const brands = navigatorData.userAgentData?.brands ?? [];
  const brandMatch = brands.find((entry) => !entry.brand.includes("Not"));
  const normalizedBrand = normalizeOptional(brandMatch?.brand);
  if (normalizedBrand) {
    return normalizedBrand;
  }

  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("samsungbrowser/")) return "Samsung Internet";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("firefox/")) return "Firefox";
  return "";
}

function inferDeviceType(userAgent: string, navigatorData: NavigatorWithUserAgentData) {
  if (navigatorData.userAgentData?.mobile === true) {
    return "Mobile";
  }

  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "Mobile";

  if (typeof navigator !== "undefined" && navigator.maxTouchPoints > 1) {
    return "Tablet";
  }

  return "Desktop";
}

function readViewport() {
  if (typeof window === "undefined" || typeof window.screen === "undefined") {
    return "";
  }

  const width = Number(window.screen.width) || 0;
  const height = Number(window.screen.height) || 0;
  if (width <= 0 || height <= 0) {
    return "";
  }
  return `${width}x${height}`;
}

function readTimezone() {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    return "";
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function buildDeviceName(platform: string, browser: string, deviceType: string) {
  if (platform && browser) {
    return `${platform} · ${browser}`;
  }
  if (platform) {
    return platform;
  }
  if (browser) {
    return browser;
  }
  return deviceType;
}

export async function getSessionContextHeaders() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {} as Record<string, string>;
  }

  const navigatorData = navigator as NavigatorWithUserAgentData;
  const userAgent = navigator.userAgent ?? "";
  const platform = inferPlatform(userAgent, navigatorData);
  const browser = inferBrowser(userAgent, navigatorData);
  const deviceType = inferDeviceType(userAgent, navigatorData);
  const viewport = readViewport();
  const timezone = readTimezone();
  const language = normalizeOptional(navigator.language);
  const location = await resolveSessionLocation();

  const headers: Record<string, string> = {};
  const deviceId = ensureDeviceId();
  if (deviceId) headers["X-Device-Id"] = deviceId;
  if (platform) headers["X-Device-Platform"] = platform;
  if (browser) headers["X-Device-Browser"] = browser;
  if (deviceType) headers["X-Device-Type"] = deviceType;
  if (viewport) headers["X-Device-Viewport"] = viewport;
  if (language) headers["X-Device-Language"] = language;
  if (timezone) headers["X-Timezone"] = timezone;

  const deviceName = buildDeviceName(platform, browser, deviceType);
  if (deviceName) headers["X-Device-Name"] = deviceName;
  if (location) headers["X-Session-Location"] = location;

  return headers;
}
