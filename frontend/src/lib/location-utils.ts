import { rememberSessionLocation } from "./session-context";

export type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "ET", name: "Ethiopia", dialCode: "+251" },
  { code: "KE", name: "Kenya", dialCode: "+254" },
  { code: "UG", name: "Uganda", dialCode: "+256" },
  { code: "TZ", name: "Tanzania", dialCode: "+255" },
  { code: "RW", name: "Rwanda", dialCode: "+250" },
  { code: "SO", name: "Somalia", dialCode: "+252" },
  { code: "DJ", name: "Djibouti", dialCode: "+253" },
  { code: "ER", name: "Eritrea", dialCode: "+291" },
  { code: "SD", name: "Sudan", dialCode: "+249" },
  { code: "SS", name: "South Sudan", dialCode: "+211" },
  { code: "EG", name: "Egypt", dialCode: "+20" },
  { code: "NG", name: "Nigeria", dialCode: "+234" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "AU", name: "Australia", dialCode: "+61" },
];

export const LOCATION_SUGGESTIONS_BY_COUNTRY: Record<string, string[]> = {
  ET: ["Addis Ababa", "Dire Dawa", "Mekelle", "Bahir Dar", "Hawassa"],
  KE: ["Nairobi", "Mombasa", "Kisumu", "Nakuru"],
  UG: ["Kampala", "Entebbe", "Gulu", "Jinja"],
  TZ: ["Dar es Salaam", "Dodoma", "Arusha", "Mwanza"],
  RW: ["Kigali", "Butare", "Musanze"],
  SO: ["Mogadishu", "Hargeisa", "Kismayo"],
  US: ["New York", "San Francisco", "Chicago", "Austin"],
  GB: ["London", "Manchester", "Birmingham", "Leeds"],
  IN: ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah"],
};

export function getCountryByCode(code: string) {
  return COUNTRY_OPTIONS.find((country) => country.code === code);
}

export function formatPhoneNumberWithCountryCode(countryCode: string, phoneNumber: string) {
  const digits = phoneNumber.replace(/[^\d]/g, "");
  if (!digits) {
    return "";
  }

  const normalizedCode = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
  return `${normalizedCode}${digits}`;
}

export function getLocationSuggestions(countryCode: string) {
  return LOCATION_SUGGESTIONS_BY_COUNTRY[countryCode] ?? [];
}

export function detectTimeZoneFromBrowser() {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    return "";
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

export async function detectLocationFromBrowser(): Promise<{ country: string; location: string }> {
  if (typeof window === "undefined") {
    throw new Error("Location detection is only available in the browser.");
  }

  const hasGeolocation = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
  if (hasGeolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 120000,
        });
      });

      const reverse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
      );

      if (reverse.ok) {
        const data = (await reverse.json()) as {
          city?: string;
          locality?: string;
          principalSubdivision?: string;
          countryName?: string;
        };

        const city = data.city || data.locality || "";
        const region = data.principalSubdivision || "";
        const location = [city, region].filter(Boolean).join(", ");
        if (data.countryName || location) {
          rememberSessionLocation(location, data.countryName || "");
          return {
            country: data.countryName || "",
            location,
          };
        }
      }
    } catch {
      // Fall through to IP-based lookup when geolocation is blocked/unavailable.
    }
  }

  try {
    const ipLookup = await fetch("https://ipapi.co/json/");
    if (!ipLookup.ok) {
      throw new Error("IP lookup failed.");
    }

    const ipData = (await ipLookup.json()) as {
      city?: string;
      region?: string;
      country_name?: string;
    };

    const location = [ipData.city || "", ipData.region || ""].filter(Boolean).join(", ");
    rememberSessionLocation(location, ipData.country_name || "");
    return {
      country: ipData.country_name || "",
      location,
    };
  } catch {
    throw new Error("Unable to detect location.");
  }
}
