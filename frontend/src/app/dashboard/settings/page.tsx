"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Globe, Award, Briefcase, DollarSign, Bell, Lock, Shield, CheckCircle, Loader, Upload } from "lucide-react";
import { bootstrapSession, useSession } from "@/lib/session";
import { getUserSettings, updateUserSettings, uploadProfileImage, requestEmailVerification, confirmEmailVerification, requestPhoneVerification, confirmPhoneVerification } from "@/lib/api";
import { Avatar } from "@/components/ui";

interface UserProfile {
  bio?: string;
  profilePictureUrl?: string;
  location?: string;
  timezone?: string;
  phoneNumber?: string;
  language?: string;
  skills?: string[];
  certifications?: string[];
  expertise?: string;
  yearsOfExperience?: number;
  portfolioUrls?: string[];
  hourlyRate?: string;
  availability?: string;
  preferredCategories?: string[];
  openToOpportunities?: boolean;
  paymentMethod?: string;
  taxId?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  hideProfile?: boolean;
  showEarnings?: boolean;
  preferredLanguage?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  identityVerified?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastSavedTab, setLastSavedTab] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.replace("/login");
  };

  const handleRelogin = () => {
    localStorage.removeItem("auth_token");
    setMessage({ type: "error", text: "✗ Please log in again to refresh your session." });
    setTimeout(() => router.replace("/login"), 1500);
  };

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchSettings = async () => {
      try {
        console.log("=== FETCHING SETTINGS ===");
        const data = await getUserSettings();
        console.log("Settings loaded:", JSON.stringify(data, null, 2));
        setProfile(data);
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          console.error("Invalid/expired token detected - redirecting to register");
          localStorage.removeItem("auth_token");
          setMessage({
            type: "error",
            text: "⚠️ Your session token is invalid. Redirecting to registration..."
          });
          setTimeout(() => router.replace("/register"), 1500);
          return;
        }
        console.error("Failed to fetch settings:", error);
        setMessage({ type: "error", text: "Failed to load settings" });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  const handleSave = async (updates: Partial<UserProfile>) => {
    setSaving(true);
    console.log("=== SAVING SETTINGS ===");
    console.log("Updates being sent:", JSON.stringify(updates, null, 2));
    try {
      const updated = await updateUserSettings(updates);
      console.log("Response received:", JSON.stringify(updated, null, 2));
      setProfile(updated);
      setLastSavedTab(activeTab);
      setMessage({ type: "success", text: "✓ Settings saved successfully!" });
      // Keep message visible for longer
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      const message = error?.message;
      console.error("=== SAVE FAILED ===");
      console.error("Status:", status);
      console.error("Error Message:", message);
      console.error("Response Data:", errorData);
      console.error("Full Error:", error);
      
      // Check for authentication errors
      if (status === 401 || status === 403) {
        console.error("PATCH failed with 401/403 - token is invalid or expired");
        localStorage.removeItem("auth_token");
        setMessage({
          type: "error",
          text: "⚠️ Your session token is invalid. Please register again to continue."
        });
        setTimeout(() => router.replace("/register"), 2000);
        return;
      }
      
      setMessage({ type: "error", text: `✗ Error saving settings (Status: ${status || "error"}). Please try again.` });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = (updated: UserProfile, messageText?: string, messageType: "success" | "error" = "success") => {
    setProfile(updated);
    if (messageText) {
      setMessage({ type: messageType, text: messageText });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="relative mx-auto max-w-6xl p-6 pb-12 space-y-6">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_78%_8%,rgba(167,139,250,0.2),transparent_40%),radial-gradient(circle_at_45%_85%,rgba(16,185,129,0.16),transparent_35%)]" />

      <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings & Profile</h1>
            <p className="text-slate-600 mt-2">Manage your professional profile, preferences, and account security.</p>
          </div>
          <span className="rounded-full border border-white/30 bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-700">Prototype data only</span>
        </div>

        {message && (
          <div className={`mt-4 rounded-xl border p-4 animate-in fade-in ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-lg shadow-emerald-100" : "border-rose-200 bg-rose-50 text-rose-800 shadow-lg shadow-rose-100"}`}>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{message.type === "success" ? "✓" : "✗"}</span>
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        <div className="mt-6 border-b border-white/30">
          <nav className="flex gap-6 overflow-x-auto">
            {[
              { id: "basic", label: "Basic Info", icon: User },
              { id: "professional", label: "Professional", icon: Briefcase },
              { id: "payment", label: "Payment & Billing", icon: DollarSign },
              { id: "verification", label: "Verification", icon: Shield },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 border-b-2 transition-colors relative ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {lastSavedTab === tab.id && (
                  <span className="ml-1" title="Saved" aria-label="Saved">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === "basic" && (
          <BasicInfoTab profile={profile} onSave={handleSave} saving={saving} />
        )}
        {activeTab === "professional" && (
          <ProfessionalTab profile={profile} onSave={handleSave} saving={saving} />
        )}
        {activeTab === "payment" && (
          <PaymentTab profile={profile} onSave={handleSave} saving={saving} />
        )}
        {activeTab === "verification" && (
          <VerificationTab profile={profile} onProfileUpdate={handleProfileUpdate} />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab profile={profile} onSave={handleSave} saving={saving} />
        )}
      </div>
    </main>
  );
}

// === Tab Components ===

function BasicInfoTab({ profile, onSave, saving }: { profile: UserProfile | null; onSave: (u: any) => void; saving: boolean }) {
  const [data, setData] = useState(profile || {});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const setProfilePictureUrl = useSession((s) => s.setProfilePictureUrl);
  const setEmailVerified = useSession((s) => s.setEmailVerified);
  const fullName = useSession((s) => s.fullName);

  useEffect(() => {
    setData(profile || {});
    if (profile?.profilePictureUrl) {
      setProfilePictureUrl(profile.profilePictureUrl);
    }
    if (profile?.emailVerified !== undefined && profile?.emailVerified !== null) {
      setEmailVerified(Boolean(profile.emailVerified));
    }
  }, [profile]);

  const convertToJpeg = async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to process image.");
    }
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
    if (!blob) {
      throw new Error("Unable to convert image.");
    }
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    setAvatarError(null);
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Unsupported image type. Use PNG, JPG, WEBP, AVIF, or HEIC.");
      setAvatarUploading(false);
      return;
    }
    let uploadFile = file;
    try {
      uploadFile = await convertToJpeg(file);
    } catch (error) {
      setAvatarError("Unable to process this image. Please export it as JPG or PNG.");
      setAvatarUploading(false);
      return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      setAvatarError("Image too large. Max size is 10MB.");
      setAvatarUploading(false);
      return;
    }
    try {
      const url = await uploadProfileImage(uploadFile);
      if (!url) {
        throw new Error("Upload failed");
      }
      setData({ ...data, profilePictureUrl: url });
      setProfilePictureUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload avatar.";
      setAvatarError(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <h2 className="mb-6 text-xl font-semibold">Basic Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Profile photo</label>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar src={data.profilePictureUrl} fallback={fullName || "User"} size="lg" />
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                  <Upload className="h-4 w-4 text-slate-500" />
                  <span>Upload photo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleAvatarUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {avatarUploading && <p className="text-xs text-slate-500">Uploading avatar…</p>}
                {avatarError && <p className="text-xs text-rose-600">{avatarError}</p>}
                {!avatarUploading && !avatarError && (
                  <p className="text-xs text-slate-500">PNG, JPG, or WEBP up to 10MB.</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <textarea
              value={data.bio || ""}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              placeholder="Tell us about yourself"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <input
              type="text"
              value={data.location || ""}
              onChange={(e) => setData({ ...data, location: e.target.value })}
              placeholder="City, Country"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
            <input
              type="text"
              value={data.timezone || ""}
              onChange={(e) => setData({ ...data, timezone: e.target.value })}
              placeholder="e.g., UTC+3, EST"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
            <input
              type="text"
              value={data.language || ""}
              onChange={(e) => setData({ ...data, language: e.target.value })}
              placeholder="English, Amharic, etc."
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={data.phoneNumber || ""}
              onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => onSave(data)}
          disabled={saving}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-all hover:shadow-lg"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}

function ProfessionalTab({ profile, onSave, saving }: { profile: UserProfile | null; onSave: (u: any) => void; saving: boolean }) {
  const [data, setData] = useState(profile || {});
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    setData(profile || {});
  }, [profile]);

  const addSkill = () => {
    if (newSkill.trim()) {
      setData({
        ...data,
        skills: [...(data.skills || []), newSkill],
      });
      setNewSkill("");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <h2 className="mb-6 text-xl font-semibold">Professional Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
            <input
              type="number"
              value={data.yearsOfExperience || ""}
              onChange={(e) => setData({ ...data, yearsOfExperience: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Expertise Level</label>
            <select
              value={data.expertise || ""}
              onChange={(e) => setData({ ...data, expertise: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Level</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="EXPERT">Expert</option>
              <option value="MASTER">Master</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hourly Rate (USD)</label>
            <input
              type="text"
              value={data.hourlyRate || ""}
              onChange={(e) => setData({ ...data, hourlyRate: e.target.value })}
              placeholder="e.g., 50-100"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
            <select
              value={data.availability || ""}
              onChange={(e) => setData({ ...data, availability: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Availability</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="OCCASIONAL">Occasional</option>
            </select>
          </div>

          {/* Skills Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g., React, Design)"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
              />
              <button onClick={addSkill} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.skills?.map((skill, i) => (
                <div key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                  {skill}
                  <button
                    onClick={() => setData({ ...data, skills: data.skills?.filter((_, idx) => idx !== i) })}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Open to Opportunities</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.openToOpportunities || false}
                onChange={(e) => setData({ ...data, openToOpportunities: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Yes, I'm looking for new projects</span>
            </label>
          </div>
        </div>
        <button
          onClick={() => onSave(data)}
          disabled={saving}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-all hover:shadow-lg"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}

function PaymentTab({ profile, onSave, saving }: { profile: UserProfile | null; onSave: (u: any) => void; saving: boolean }) {
  const [data, setData] = useState(profile || {});

  useEffect(() => {
    setData(profile || {});
  }, [profile]);

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <h2 className="mb-6 text-xl font-semibold">Payment & Billing</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
            <select
              value={data.paymentMethod || ""}
              onChange={(e) => setData({ ...data, paymentMethod: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Payment Method</option>
              <option value="STRIPE">Stripe</option>
              <option value="PAYPAL">PayPal</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CRYPTOCURRENCY">Cryptocurrency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tax ID</label>
            <input
              type="text"
              value={data.taxId || ""}
              onChange={(e) => setData({ ...data, taxId: e.target.value })}
              placeholder="Your tax identification number"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => onSave(data)}
          disabled={saving}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-all hover:shadow-lg"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}

function VerificationTab({
  profile,
  onProfileUpdate,
}: {
  profile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile, messageText?: string, messageType?: "success" | "error") => void;
}) {
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ type: "idle" | "sent" | "error" | "success"; text?: string }>({ type: "idle" });
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<{ type: "idle" | "sent" | "error" | "success"; text?: string }>({ type: "idle" });
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const setEmailVerified = useSession((s) => s.setEmailVerified);

  useEffect(() => {
    if (profile?.emailVerified) {
      setEmailStatus({ type: "success", text: "Email verified" });
    }
  }, [profile?.emailVerified]);

  const handleRequestEmailCode = async () => {
    setEmailSending(true);
    setEmailStatus({ type: "idle" });
    try {
      const response = await requestEmailVerification();
      setEmailStatus({ type: "sent", text: response?.message || "Verification code sent." });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to send verification code.";
      setEmailStatus({ type: "error", text: message });
    } finally {
      setEmailSending(false);
    }
  };

  const handleConfirmEmailCode = async () => {
    if (!emailOtp.trim()) {
      setEmailStatus({ type: "error", text: "Enter the verification code from your email." });
      return;
    }
    setEmailVerifying(true);
    try {
      const updated = await confirmEmailVerification(emailOtp.trim());
      setEmailVerified(true);
      onProfileUpdate(updated, "✓ Email verified successfully!", "success");
      setEmailStatus({ type: "success", text: "Email verified" });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Invalid or expired code.";
      setEmailStatus({ type: "error", text: message });
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleVerifyPhone = async () => {
    setPhoneSending(true);
    setPhoneStatus({ type: "idle" });
    try {
      const response = await requestPhoneVerification();
      setPhoneStatus({ type: "sent", text: response?.message || "Verification code sent." });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to send verification code.";
      setPhoneStatus({ type: "error", text: message });
    } finally {
      setPhoneSending(false);
    }
  };

  const handleConfirmPhoneCode = async () => {
    if (!phoneOtp.trim()) {
      setPhoneStatus({ type: "error", text: "Enter the verification code sent to your phone." });
      return;
    }
    setPhoneVerifying(true);
    try {
      const updated = await confirmPhoneVerification(phoneOtp.trim());
      onProfileUpdate(updated, "✓ Phone verified successfully!", "success");
      setPhoneStatus({ type: "success", text: "Phone verified" });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Invalid or expired code.";
      setPhoneStatus({ type: "error", text: message });
    } finally {
      setPhoneVerifying(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <h2 className="mb-6 text-xl font-semibold">Verification Status</h2>
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Email Verification</p>
                  <p className="text-sm text-slate-600">
                    {profile?.emailVerified ? "Verified" : "Verify your email to unlock enterprise access."}
                  </p>
                </div>
              </div>
              {profile?.emailVerified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Verified
                </span>
              ) : (
                <button
                  onClick={handleRequestEmailCode}
                  disabled={emailSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:bg-slate-400"
                >
                  {emailSending ? "Sending..." : "Send Code"}
                </button>
              )}
            </div>
            {!profile?.emailVerified && (
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleConfirmEmailCode}
                  disabled={emailVerifying}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm disabled:bg-slate-400"
                >
                  {emailVerifying ? "Verifying..." : "Verify Email"}
                </button>
              </div>
            )}
            {emailStatus.type !== "idle" && (
              <p
                className={`mt-3 text-sm ${
                  emailStatus.type === "error" ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {emailStatus.text}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Phone Verification</p>
                  <p className="text-sm text-slate-600">{profile?.phoneVerified ? "Verified" : "Confirm your phone number for SMS alerts."}</p>
                </div>
              </div>
              {profile?.phoneVerified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Verified
                </span>
              ) : (
                <button
                  onClick={handleVerifyPhone}
                  disabled={phoneSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:bg-slate-400"
                >
                  {phoneSending ? "Sending..." : "Send Code"}
                </button>
              )}
            </div>
            {!profile?.phoneVerified && (
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  placeholder="Enter SMS code"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleConfirmPhoneCode}
                  disabled={phoneVerifying}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm disabled:bg-slate-400"
                >
                  {phoneVerifying ? "Verifying..." : "Verify Phone"}
                </button>
              </div>
            )}
            {phoneStatus.type !== "idle" && (
              <p
                className={`mt-3 text-sm ${
                  phoneStatus.type === "error" ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {phoneStatus.text}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Identity Verification</p>
                  <p className="text-sm text-slate-600">{profile?.identityVerified ? "Verified" : "Complete identity checks for high-trust contracts."}</p>
                </div>
              </div>
              {profile?.identityVerified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Verified
                </span>
              ) : (
                <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm" disabled>
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ profile, onSave, saving }: { profile: UserProfile | null; onSave: (u: any) => void; saving: boolean }) {
  const [data, setData] = useState(profile || {});

  useEffect(() => {
    setData(profile || {});
  }, [profile]);

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold">Notification Preferences</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              checked={data.emailNotifications !== false}
              onChange={(e) => setData({ ...data, emailNotifications: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <div>
              <p className="font-medium text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-600">Get updates about jobs, messages, and payments</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              checked={data.smsNotifications || false}
              onChange={(e) => setData({ ...data, smsNotifications: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <div>
              <p className="font-medium text-slate-900">SMS Notifications</p>
              <p className="text-sm text-slate-600">Receive important alerts via SMS</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              checked={data.hideProfile || false}
              onChange={(e) => setData({ ...data, hideProfile: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <div>
              <p className="font-medium text-slate-900">Hide Profile</p>
              <p className="text-sm text-slate-600">Make your profile private</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              checked={data.showEarnings || false}
              onChange={(e) => setData({ ...data, showEarnings: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <div>
              <p className="font-medium text-slate-900">Show Earnings</p>
              <p className="text-sm text-slate-600">Display your earnings publicly</p>
            </div>
          </label>
        </div>

        <button
          onClick={() => onSave(data)}
          disabled={saving}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-all hover:shadow-lg"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
