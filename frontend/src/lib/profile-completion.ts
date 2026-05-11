"use client";

import {
  getMyFreelancerProfile,
  getUserSettings,
  type FreelancerWorkspaceProfile,
  type UserProfile,
} from "@/lib/api";
import { workspaceRoutes } from "@/lib/workspace-routes";

const PROFILE_COMPLETION_PROMPT_KEY = "sabahub.profile-completion.prompt";

export type ProfileCompletionPromptReason = "login" | "register";
export type ProfileCompletionItemId =
  | "photo"
  | "overview"
  | "skills"
  | "portfolio"
  | "verification";

export type ProfileCompletionItem = {
  id: ProfileCompletionItemId;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  rewardLabel: string;
  complete: boolean;
  detail: string;
  missing: string[];
};

export type ProfileCompletionSummary = {
  complete: boolean;
  percent: number;
  completedCount: number;
  totalCount: number;
  headline: string;
  supportingText: string;
  avatarUrl: string | null;
  displayName: string;
  nextActionHref: string;
  nextActionLabel: string;
  items: ProfileCompletionItem[];
};

type WeightedItem = ProfileCompletionItem & {
  weight: number;
};

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems<T>(value?: T[] | null) {
  return Array.isArray(value) && value.length > 0;
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => hasText(value))?.trim() ?? null;
}

function isFreelancerWorkspaceProfile(value: unknown): value is FreelancerWorkspaceProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && record.id.trim().length > 0;
}

function buildHeadline(percent: number) {
  if (percent >= 100) {
    return "Your freelancer profile is client-ready.";
  }
  if (percent >= 75) {
    return "You are close to a complete freelancer profile.";
  }
  if (percent >= 40) {
    return "A few strong additions will sharpen your profile.";
  }
  return "Start building a freelancer profile that feels trusted and complete.";
}

function buildSupportText(percent: number) {
  if (percent >= 100) {
    return "Everything important is in place. Review it anytime from your workspace.";
  }
  if (percent >= 75) {
    return "Finish the last missing sections so clients see a stronger first impression.";
  }
  if (percent >= 40) {
    return "Focus on the next incomplete card and your profile strength will move quickly.";
  }
  return "Add the essentials first: identity, expertise, and proof of work.";
}

function buildProfileCompletionSummary(
  settings: Partial<UserProfile> | null | undefined,
  freelancer: FreelancerWorkspaceProfile | null,
): ProfileCompletionSummary {
  const avatarUrl = firstText(settings?.profilePictureUrl, freelancer?.profilePicture);
  const photoComplete = Boolean(avatarUrl);
  const overviewMissing = [
    !hasText(freelancer?.professionalTitle) ? "professional title" : null,
    !hasText(freelancer?.bio) ? "bio" : null,
  ].filter(Boolean) as string[];
  const skillsMissing = [
    typeof freelancer?.hourlyRate !== "number" ? "hourly rate" : null,
    !hasItems(freelancer?.categories) ? "categories" : null,
    !hasItems(freelancer?.skills) ? "skills" : null,
    !hasItems(freelancer?.languages) ? "languages" : null,
  ].filter(Boolean) as string[];
  const portfolioMissing = !hasItems(freelancer?.portfolio) ? ["portfolio sample"] : [];
  const verificationMissing =
    Boolean(settings?.emailVerified || settings?.phoneVerified || settings?.identityVerified)
      ? []
      : ["verified email or phone"];

  const items: WeightedItem[] = [
    {
      id: "photo",
      title: "Profile photo",
      description: "Add a recognizable avatar so your workspace feels real and trusted.",
      actionLabel: photoComplete ? "Review photo" : "Upload photo",
      href: `${workspaceRoutes.settings}?section=overview`,
      rewardLabel: "+15%",
      complete: photoComplete,
      detail: photoComplete ? "Avatar is already set." : "Add a profile image from settings.",
      missing: photoComplete ? [] : ["profile photo"],
      weight: 15,
    },
    {
      id: "overview",
      title: "Overview",
      description: "Write the title and summary clients need before they read deeper.",
      actionLabel: overviewMissing.length === 0 ? "Refine overview" : "Add overview",
      href: workspaceRoutes.projects,
      rewardLabel: "+25%",
      complete: overviewMissing.length === 0,
      detail:
        overviewMissing.length === 0
          ? "Professional title and bio are in place."
          : `Missing ${overviewMissing.join(" and ")}.`,
      missing: overviewMissing,
      weight: 25,
    },
    {
      id: "skills",
      title: "Skills and expertise",
      description: "Complete the core expertise signals that power discovery and trust.",
      actionLabel: skillsMissing.length === 0 ? "Review expertise" : "Add expertise",
      href: workspaceRoutes.projects,
      rewardLabel: "+25%",
      complete: skillsMissing.length === 0,
      detail:
        skillsMissing.length === 0
          ? "Rate, categories, skills, and languages are saved."
          : `Still needed: ${skillsMissing.join(", ")}.`,
      missing: skillsMissing,
      weight: 25,
    },
    {
      id: "portfolio",
      title: "Portfolio samples",
      description: "Show real work so employers see proof instead of only text.",
      actionLabel: portfolioMissing.length === 0 ? "Review portfolio" : "Add sample",
      href: workspaceRoutes.projects,
      rewardLabel: "+20%",
      complete: portfolioMissing.length === 0,
      detail:
        portfolioMissing.length === 0
          ? "At least one portfolio story is published."
          : "Add one portfolio story with images or project proof.",
      missing: portfolioMissing,
      weight: 20,
    },
    {
      id: "verification",
      title: "Linked verification",
      description: "Keep one trusted contact channel verified for a stronger account signal.",
      actionLabel: verificationMissing.length === 0 ? "Review verification" : "Verify account",
      href: `${workspaceRoutes.settings}?section=verification`,
      rewardLabel: "+15%",
      complete: verificationMissing.length === 0,
      detail:
        verificationMissing.length === 0
          ? "At least one verification signal is active."
          : "Verify your email or phone from settings.",
      missing: verificationMissing,
      weight: 15,
    },
  ];

  const percent = items.reduce((sum, item) => sum + (item.complete ? item.weight : 0), 0);
  const completedCount = items.filter((item) => item.complete).length;
  const nextItem = items.find((item) => !item.complete) ?? items[0];

  return {
    complete: completedCount === items.length,
    percent,
    completedCount,
    totalCount: items.length,
    headline: buildHeadline(percent),
    supportingText: buildSupportText(percent),
    avatarUrl,
    displayName:
      firstText(settings?.username, settings?.email, freelancer?.professionalTitle, "Freelancer") ?? "Freelancer",
    nextActionHref: nextItem.href,
    nextActionLabel: nextItem.actionLabel,
    items,
  };
}

export function markProfileCompletionPrompt(reason: ProfileCompletionPromptReason) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(PROFILE_COMPLETION_PROMPT_KEY, reason);
}

export function readProfileCompletionPrompt() {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.sessionStorage.getItem(PROFILE_COMPLETION_PROMPT_KEY);
  return value === "login" || value === "register" ? value : null;
}

export function clearProfileCompletionPrompt() {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(PROFILE_COMPLETION_PROMPT_KEY);
}

export async function fetchProfileCompletionSummary() {
  const [settings, rawFreelancerProfile] = await Promise.all([
    getUserSettings(),
    getMyFreelancerProfile().catch(() => null),
  ]);

  const freelancerProfile = isFreelancerWorkspaceProfile(rawFreelancerProfile)
    ? rawFreelancerProfile
    : null;

  return buildProfileCompletionSummary(settings, freelancerProfile);
}
