"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Globe, Award, Briefcase, DollarSign, Bell, Lock, Shield, CheckCircle, Loader } from "lucide-react";
import { bootstrapSession, useSession } from "@/lib/session";

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

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
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
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: "Error saving settings" });
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings & Profile</h1>
        <p className="text-slate-600 mt-2">Manage your professional profile and preferences</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8 overflow-x-auto">
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
              className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <BasicInfoTab profile={profile} onSave={handleSave} saving={saving} />
        )}

        {/* Professional Tab */}
        {activeTab === "professional" && (
          <ProfessionalTab profile={profile} onSave={handleSave} saving={saving} />
        )}

        {/* Payment & Billing Tab */}
        {activeTab === "payment" && (
          <PaymentTab profile={profile} onSave={handleSave} saving={saving} />
        )}

        {/* Verification Tab */}
        {activeTab === "verification" && (
          <VerificationTab profile={profile} onSave={handleSave} saving={saving} />
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <NotificationsTab profile={profile} onSave={handleSave} saving={saving} />
        )}
      </div>
    </div>
  );
}

// === Tab Components ===

function BasicInfoTab({ profile, onSave, saving }: { profile: UserProfile | null; onSave: (u: any) => void; saving: boolean }) {
  const [data, setData] = useState(profile || {});

  useEffect(() => {
    setData(profile || {});
  }, [profile]);

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold">Basic Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
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
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save Changes"}
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
      <div className="rounded-xl border border-slate-200 bg-white p-6">
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
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save Changes"}
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
      <div className="rounded-xl border border-slate-200 bg-white p-6">
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
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function VerificationTab({ profile, onSave, saving }: { profile: UserProfile | null; onSave: (u: any) => void; saving: boolean }) {
  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold">Verification Status</h2>
        <div className="space-y-4">
          {[
            { label: "Email Verified", verified: profile?.emailVerified, icon: Mail },
            { label: "Phone Verified", verified: profile?.phoneVerified, icon: Phone },
            { label: "Identity Verified", verified: profile?.identityVerified, icon: Shield },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-600">{item.verified ? "Verified" : "Not verified"}</p>
                </div>
              </div>
              {item.verified ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Verify
                </button>
              )}
            </div>
          ))}
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
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
