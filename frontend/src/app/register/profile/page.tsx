"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, AtSign, LocateFixed, Mail, MapPin, UserRound } from "lucide-react";
import {
  AuthFlowShell,
  AuthStatusBanner,
  AuthTextField,
  authFlowStyles,
} from "@/components/auth/AuthFlowShell";
import { isAuthenticated, resolveWorkspaceRouteFromToken } from "@/lib/auth";
import {
  createUniqueId,
  hasRegisterRole,
  readRegisterDraft,
  saveRegisterDraft,
} from "@/lib/auth-flow";
import {
  COUNTRY_OPTIONS,
  detectLocationFromBrowser,
  detectTimeZoneFromBrowser,
  formatPhoneNumberWithCountryCode,
  getCountryByCode,
  getLocationSuggestions,
} from "@/lib/location-utils";

const steps = [
  {
    label: "Path",
    detail: "The workspace direction is already chosen.",
    status: "complete" as const,
    href: "/register",
  },
  {
    label: "Profile",
    detail: "Add the identity details tied to this account.",
    status: "current" as const,
  },
  {
    label: "Security",
    detail: "Create credentials before we request verification.",
    status: "upcoming" as const,
  },
  {
    label: "Verification",
    detail: "Finish by confirming the OTP code.",
    status: "upcoming" as const,
  },
];

const profileHighlights = [
  {
    title: "Basic identity",
    detail: "Add your names, email, and username here.",
    icon: UserRound,
  },
  {
    title: "Unique ID preview",
    detail: "See your handle as you type.",
    icon: AtSign,
  },
  {
    title: "Verification details",
    detail: "Add region and contact details before security.",
    icon: Mail,
  },
];

const emptyProfile = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  username: "",
  country: "",
  phoneCountryCode: "+251",
  phoneNumber: "",
  location: "",
  timezone: "",
  verificationMethod: "EMAIL" as "EMAIL" | "PHONE",
};

export default function RegisterProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [roleLabel, setRoleLabel] = useState("");
  const [form, setForm] = useState(emptyProfile);
  const [error, setError] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("auth_token");
      router.replace(resolveWorkspaceRouteFromToken(token));
      return;
    }

    const draft = readRegisterDraft();
    if (!hasRegisterRole(draft)) {
      router.replace("/register");
      return;
    }

    setRoleLabel(draft.role);
    const fallbackDialCode = draft.phoneCountryCode || "+251";
    const detectedTimezone = detectTimeZoneFromBrowser();
    const localPhone = draft.phoneNumber.startsWith(fallbackDialCode)
      ? draft.phoneNumber.slice(fallbackDialCode.length)
      : draft.phoneNumber;
    setForm({
      firstName: draft.firstName,
      middleName: draft.middleName,
      lastName: draft.lastName,
      email: draft.email,
      username: draft.username,
      country: draft.country,
      phoneCountryCode: fallbackDialCode,
      phoneNumber: localPhone.replace(/[^\d]/g, ""),
      location: draft.location,
      timezone: draft.timezone || detectedTimezone,
      verificationMethod: draft.verificationMethod || "EMAIL",
    });
    setReady(true);
  }, [router]);

  const uniqueId = useMemo(() => createUniqueId(form.username), [form.username]);
  const locationSuggestions = useMemo(() => getLocationSuggestions(form.country), [form.country]);

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const detected = await detectLocationFromBrowser();
      const matchingCountry = COUNTRY_OPTIONS.find(
        (country) => country.name.toLowerCase() === detected.country.toLowerCase(),
      );

      setForm((current) => ({
        ...current,
        country: matchingCountry?.code ?? current.country,
        phoneCountryCode: matchingCountry?.dialCode ?? current.phoneCountryCode,
        location: detected.location || current.location,
      }));
      if (error) {
        setError("");
      }
    } catch {
      setError("Unable to detect location. Please choose your country and location manually.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const detectTimezone = () => {
    const timezone = detectTimeZoneFromBrowser();
    if (!timezone) {
      setError("Unable to detect timezone automatically. Please select it manually.");
      return;
    }

    setForm((current) => ({ ...current, timezone }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

    if (!form.email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (uniqueId.length < 3) {
      setError("Username must produce at least 3 valid characters for your unique ID.");
      return;
    }

    if (!form.country) {
      setError("Select your country.");
      return;
    }

    if (!form.location.trim()) {
      setError("Add your location.");
      return;
    }

    const normalizedPhone = formatPhoneNumberWithCountryCode(form.phoneCountryCode, form.phoneNumber);

    if (form.verificationMethod === "PHONE" && !normalizedPhone) {
      setError("Phone number is required when phone verification is selected.");
      return;
    }

    const draft = readRegisterDraft();
    saveRegisterDraft({
      ...draft,
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      country: form.country,
      phoneCountryCode: form.phoneCountryCode,
      phoneNumber: normalizedPhone,
      location: form.location.trim(),
      timezone: form.timezone.trim(),
      verificationMethod: form.verificationMethod,
    });
    startTransition(() => router.push("/register/security"));
  };

  const hero = (
    <div className="space-y-5">
      <div className={authFlowStyles.summaryCard}>
        <div className={authFlowStyles.summaryLabel}>Selected path</div>
        <div className={authFlowStyles.summaryValue}>{ready ? roleLabel : "Loading..."}</div>
      </div>

      <div className="space-y-3">
        {profileHighlights.map((item) => (
          <div key={item.title} className={authFlowStyles.featureCard}>
            <div className={authFlowStyles.featureIcon}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-950">{item.title}</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={authFlowStyles.quoteCard}>
        <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Next step</div>
        <div className="mt-3 text-lg font-semibold leading-8 text-slate-950">
          After this, you set your password and request the code.
        </div>
      </div>
    </div>
  );

  return (
    <AuthFlowShell
      stageLabel="Sign up"
      title="Add your profile"
      description="Basic account details before security."
      steps={steps}
      hero={hero}
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Step 2 of 4
          </div>
          <h2 className={clsx(authFlowStyles.displayHeading, "mt-5 text-3xl font-bold tracking-[-0.04em] text-slate-950 md:text-4xl")}>
            Add your profile details
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            These details shape your account and the verification message we send later.
          </p>
        </div>

        {!ready ? (
          <div className="mt-8">
            <AuthStatusBanner tone="info" message="Loading your registration step..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-3">
              <AuthTextField
                label="First name"
                value={form.firstName}
                onChange={(event) => {
                  setForm((current) => ({ ...current, firstName: event.target.value }));
                  if (error) {
                    setError("");
                  }
                }}
                autoComplete="given-name"
                autoFocus
              />
              <AuthTextField
                label="Middle name"
                value={form.middleName}
                onChange={(event) => setForm((current) => ({ ...current, middleName: event.target.value }))}
                autoComplete="additional-name"
              />
              <AuthTextField
                label="Last name"
                value={form.lastName}
                onChange={(event) => {
                  setForm((current) => ({ ...current, lastName: event.target.value }));
                  if (error) {
                    setError("");
                  }
                }}
                autoComplete="family-name"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AuthTextField
                label="Email address"
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }));
                  if (error) {
                    setError("");
                  }
                }}
                autoComplete="email"
              />

              <label className={authFlowStyles.fieldset}>
                <span className={authFlowStyles.fieldLabel}>Country</span>
                <select
                  value={form.country}
                  onChange={(event) => {
                    const nextCountry = event.target.value;
                    const country = getCountryByCode(nextCountry);
                    setForm((current) => ({
                      ...current,
                      country: nextCountry,
                      phoneCountryCode: country?.dialCode ?? current.phoneCountryCode,
                    }));
                    if (error) {
                      setError("");
                    }
                  }}
                  className={authFlowStyles.input}
                >
                  <option value="">Select your country</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <span className={authFlowStyles.fieldHint}>Used for profile region and phone code defaults.</span>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AuthTextField
                label="Location"
                value={form.location}
                onChange={(event) => {
                  setForm((current) => ({ ...current, location: event.target.value }));
                  if (error) {
                    setError("");
                  }
                }}
                autoComplete="address-level2"
                hint="Choose from suggestions or enter city/region manually."
                list="register-location-suggestions"
                suffix={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-1 text-slate-500 transition-colors hover:text-slate-900"
                    onClick={() => void detectLocation()}
                    disabled={isDetectingLocation}
                    aria-label="Detect current location"
                  >
                    {isDetectingLocation ? <MapPin className="h-4 w-4 animate-pulse" /> : <LocateFixed className="h-4 w-4" />}
                  </button>
                }
              />
              <datalist id="register-location-suggestions">
                {locationSuggestions.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>

              <AuthTextField
                label="Timezone"
                value={form.timezone}
                onChange={(event) => {
                  setForm((current) => ({ ...current, timezone: event.target.value }));
                  if (error) {
                    setError("");
                  }
                }}
                hint="Detected from your device. You can still edit it manually."
                placeholder="Africa/Addis_Ababa"
                suffix={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-1 text-slate-500 transition-colors hover:text-slate-900"
                    onClick={detectTimezone}
                    aria-label="Detect current timezone"
                  >
                    <LocateFixed className="h-4 w-4" />
                  </button>
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
              <label className={authFlowStyles.fieldset}>
                <span className={authFlowStyles.fieldLabel}>Country code</span>
                <select
                  value={form.phoneCountryCode}
                  onChange={(event) => setForm((current) => ({ ...current, phoneCountryCode: event.target.value }))}
                  className={authFlowStyles.input}
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={`${country.code}-${country.dialCode}`} value={country.dialCode}>
                      {country.dialCode} ({country.code})
                    </option>
                  ))}
                </select>
              </label>

              <AuthTextField
                label="Phone number"
                type="tel"
                value={form.phoneNumber.replace(/[^\d]/g, "")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phoneNumber: event.target.value.replace(/[^\d]/g, "").slice(0, 15),
                  }))
                }
                autoComplete="tel"
                hint="Optional, but useful for contact and verification support."
                placeholder="911223344"
              />
            </div>

            <label className={authFlowStyles.fieldset}>
              <span className={authFlowStyles.fieldLabel}>Verification method</span>
              <select
                value={form.verificationMethod}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    verificationMethod: event.target.value as "EMAIL" | "PHONE",
                  }))
                }
                className={authFlowStyles.input}
              >
                <option value="EMAIL">Email OTP</option>
                <option value="PHONE">Phone OTP</option>
              </select>
              <span className={authFlowStyles.fieldHint}>Only the selected channel will be required during verification.</span>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <AuthTextField
                label="Username"
                value={form.username}
                onChange={(event) => {
                  setForm((current) => ({ ...current, username: event.target.value }));
                  if (error) {
                    setError("");
                  }
                }}
                autoComplete="username"
                hint="Letters, numbers, dots, dashes, and underscores work best."
              />
              <AuthTextField
                label="Unique ID preview"
                value={uniqueId ? `@${uniqueId}` : ""}
                readOnly
                hint="Generated automatically from your username."
              />
            </div>

            <div className={authFlowStyles.summaryCard}>
              <div className={authFlowStyles.summaryGrid}>
                <div>
                  <div className={authFlowStyles.summaryLabel}>Path</div>
                  <div className={authFlowStyles.summaryValue}>{roleLabel}</div>
                </div>
                <div>
                  <div className={authFlowStyles.summaryLabel}>Verification channel</div>
                  <div className={authFlowStyles.summaryValue}>
                    {form.verificationMethod === "PHONE" ? "Phone OTP" : "Email OTP"}
                  </div>
                </div>
                <div>
                  <div className={authFlowStyles.summaryLabel}>Region</div>
                  <div className={authFlowStyles.summaryValue}>
                    {form.location
                      ? `${form.location}${form.country ? `, ${getCountryByCode(form.country)?.name ?? form.country}` : ""}`
                      : "Not set"}
                  </div>
                </div>
              </div>
            </div>

            {error ? <AuthStatusBanner tone="error" message={error} /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={clsx(authFlowStyles.buttonBase, authFlowStyles.secondaryButton)}
                onClick={() => startTransition(() => router.push("/register"))}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button type="submit" className={clsx(authFlowStyles.buttonBase, authFlowStyles.primaryButton)}>
                Continue to security
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm leading-7 text-slate-500">
              Already registered?{" "}
              <Link href="/login" className={authFlowStyles.textLink}>
                Sign in instead
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthFlowShell>
  );
}
