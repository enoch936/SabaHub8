"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  FileText,
  FolderKanban,
  ImageIcon,
  Link2,
  Loader2,
  PlayCircle,
  Sparkles,
  Upload,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import {
  addFreelancerPortfolioItem,
  createMyFreelancerProfile,
  createGig,
  createProjectPost,
  getMyFreelancerProfile,
  getStorageUsage,
  listMyGigs,
  listMyProjectPosts,
  suggestFreelancerProfileTaxonomy,
  updateMyFreelancerProfile,
  uploadJobSampleDocuments,
  uploadJobSampleImages,
  uploadJobSampleVideos,
  type FreelancerPortfolioItem,
  type FreelancerProjectPost,
  type FreelancerWorkspaceSkill,
  type FreelancerWorkspaceProfile,
  type Gig,
  type TaxonomySuggestion,
} from "@/lib/api";
import { findJobCategoryIdByDisplay } from "@/lib/jobTaxonomy";
import { useSession } from "@/lib/session";

type MediaDraft = {
  thumbnail: File | null;
  images: File[];
  videos: File[];
  documents: File[];
};

const EMPTY_MEDIA_DRAFT: MediaDraft = {
  thumbnail: null,
  images: [],
  videos: [],
  documents: [],
};

type FreelancerProfileForm = {
  professionalTitle: string;
  bio: string;
  location: string;
  timezone: string;
  languages: string;
  categories: string;
  skills: string;
  availability: string;
  hourlyRate: string;
  currency: string;
  hoursPerWeek: string;
  preferredIndustries: string;
};

const EMPTY_PROFILE_FORM: FreelancerProfileForm = {
  professionalTitle: "",
  bio: "",
  location: "",
  timezone: "",
  languages: "",
  categories: "",
  skills: "",
  availability: "FULL_TIME",
  hourlyRate: "",
  currency: "USD",
  hoursPerWeek: "",
  preferredIndustries: "",
};

type StudioReadinessItem = {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function joinList(values?: string[]) {
  return (values ?? []).join(", ");
}

function toNumericInput(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function extractSkillNames(skills?: FreelancerWorkspaceSkill[]) {
  return (skills ?? [])
    .map((skill) => skill?.name?.trim())
    .filter((skill): skill is string => Boolean(skill));
}

function toProfileForm(profile?: FreelancerWorkspaceProfile | null): FreelancerProfileForm {
  if (!profile) {
    return EMPTY_PROFILE_FORM;
  }

  return {
    professionalTitle: profile.professionalTitle ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    timezone: profile.timezone ?? "",
    languages: joinList(profile.languages),
    categories: joinList(profile.categories),
    skills: joinList(extractSkillNames(profile.skills)),
    availability: profile.availability ?? "FULL_TIME",
    hourlyRate: toNumericInput(profile.hourlyRate),
    currency: profile.currency ?? "USD",
    hoursPerWeek: toNumericInput(profile.hoursPerWeek),
    preferredIndustries: joinList(profile.preferredIndustries),
  };
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function getStudioReadiness(profile?: FreelancerWorkspaceProfile | null): StudioReadinessItem[] {
  return [
    {
      id: "professionalTitle",
      label: "Professional title",
      detail: "Tell employers the role you want to be hired for.",
      complete: hasText(profile?.professionalTitle),
    },
    {
      id: "bio",
      label: "Bio",
      detail: "Summarize your expertise, tools, and outcomes.",
      complete: hasText(profile?.bio),
    },
    {
      id: "hourlyRate",
      label: "Hourly rate",
      detail: "Required before gigs and project posts can publish.",
      complete: typeof profile?.hourlyRate === "number" && Number.isFinite(profile.hourlyRate),
    },
    {
      id: "categories",
      label: "Categories",
      detail: "Map your offer to the right marketplace lane.",
      complete: (profile?.categories?.length ?? 0) > 0,
    },
    {
      id: "skills",
      label: "Skills",
      detail: "Add at least one skill so search and AI suggestions stay relevant.",
      complete: (profile?.skills?.length ?? 0) > 0,
    },
    {
      id: "languages",
      label: "Languages",
      detail: "Clients need to know how you can collaborate.",
      complete: (profile?.languages?.length ?? 0) > 0,
    },
    {
      id: "portfolio",
      label: "Portfolio story",
      detail: "Add one visual proof-of-work story to unlock publishing.",
      complete: (profile?.portfolio?.length ?? 0) > 0,
    },
  ];
}

function mediaCountLabel(label: string, count: number) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function hasSupportingMedia(draft: MediaDraft) {
  return draft.images.length > 0 || draft.videos.length > 0 || draft.documents.length > 0;
}

function MediaPreview({
  title,
  thumbnailUrl,
  imageUrls,
  videoUrls,
}: {
  title: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
}) {
  const imageUrl = thumbnailUrl || imageUrls?.[0];
  const videoUrl = videoUrls?.[0];

  if (imageUrl) {
    return (
      <div className="overflow-hidden rounded-[22px] border border-gray-200 bg-gray-50">
        <img src={imageUrl} alt={title} className="h-40 w-full object-cover" loading="lazy" />
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="overflow-hidden rounded-[22px] border border-gray-200 bg-black">
        <video src={videoUrl} className="h-40 w-full object-cover" controls preload="metadata" />
      </div>
    );
  }

  return (
    <div className="flex h-40 items-center justify-center rounded-[22px] border border-dashed border-gray-200 bg-gray-50 text-center">
      <div>
        <ImageIcon className="mx-auto h-6 w-6 text-gray-300" />
        <p className="mt-2 text-sm text-gray-400">Media preview appears here</p>
      </div>
    </div>
  );
}

function FilePicker({
  label,
  accept,
  multiple = true,
  onSelect,
  helper,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  onSelect: (files: File[]) => void;
  helper: string;
}) {
  return (
    <label className="block rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300 hover:bg-white">
      <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Upload className="h-4 w-4" />
        {label}
      </span>
      <span className="mt-1 block text-xs text-gray-500">{helper}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="mt-3 block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-gray-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        onChange={(event) => onSelect(Array.from(event.target.files ?? []))}
      />
    </label>
  );
}

function SelectionSummary({
  media,
}: {
  media: MediaDraft;
}) {
  const chips = [
    media.thumbnail ? `1 thumbnail` : null,
    media.images.length ? mediaCountLabel("image", media.images.length) : null,
    media.videos.length ? mediaCountLabel("video", media.videos.length) : null,
    media.documents.length ? mediaCountLabel("file", media.documents.length) : null,
  ].filter(Boolean) as string[];

  if (chips.length === 0) {
    return <p className="text-xs text-gray-400">No files selected yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span key={chip} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
          {chip}
        </span>
      ))}
    </div>
  );
}

function PortfolioCard({ item }: { item: FreelancerPortfolioItem }) {
  return (
    <article className="rounded-[26px] border border-gray-200/80 bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <MediaPreview title={item.title || "Portfolio"} imageUrls={item.images} />
      <div className="mt-4">
        <h3 className="text-base font-semibold text-gray-900">{item.title || "Untitled portfolio item"}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{item.description || "No description yet."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(item.technologies ?? []).slice(0, 5).map((tech) => (
            <span key={tech} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function ContentCard({
  kind,
  title,
  description,
  creator,
  thumbnailUrl,
  imageUrls,
  videoUrls,
  documentUrls,
  metaLine,
}: {
  kind: string;
  title: string;
  description: string;
  creator?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  documentUrls?: string[];
  metaLine: string;
}) {
  return (
    <article className="rounded-[26px] border border-gray-200/80 bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <MediaPreview title={title} thumbnailUrl={thumbnailUrl} imageUrls={imageUrls} videoUrls={videoUrls} />
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            {kind}
          </span>
          <span className="text-xs text-gray-400">{metaLine}</span>
        </div>
        <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
        {creator ? <p className="mt-1 text-sm text-gray-500">by {creator}</p> : null}
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          {(imageUrls?.length ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1">
              <ImageIcon className="h-3.5 w-3.5" />
              {mediaCountLabel("image", imageUrls?.length ?? 0)}
            </span>
          ) : null}
          {(videoUrls?.length ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1">
              <PlayCircle className="h-3.5 w-3.5" />
              {mediaCountLabel("video", videoUrls?.length ?? 0)}
            </span>
          ) : null}
          {(documentUrls?.length ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1">
              <FileText className="h-3.5 w-3.5" />
              {mediaCountLabel("file", documentUrls?.length ?? 0)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function FreelancerContentStudio() {
  const role = useSession((state) => state.role);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<FreelancerWorkspaceProfile | null>(null);
  const [profileForm, setProfileForm] = useState<FreelancerProfileForm>(EMPTY_PROFILE_FORM);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [projectPosts, setProjectPosts] = useState<FreelancerProjectPost[]>([]);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isProfileSuggesting, setIsProfileSuggesting] = useState(false);
  const [profileSuggestion, setProfileSuggestion] = useState<TaxonomySuggestion | null>(null);

  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    category: "",
    projectUrl: "",
    technologies: "",
  });
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [isPortfolioSubmitting, setIsPortfolioSubmitting] = useState(false);

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    category: "",
    skills: "",
    budgetMin: "",
    budgetMax: "",
    currency: "USD",
    deliveryDays: "",
  });
  const [projectMedia, setProjectMedia] = useState<MediaDraft>(EMPTY_MEDIA_DRAFT);
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);

  const [gigForm, setGigForm] = useState({
    title: "",
    description: "",
    skills: "",
    price: "",
    currency: "USD",
    deliveryDays: "",
  });
  const [gigMedia, setGigMedia] = useState<MediaDraft>(EMPTY_MEDIA_DRAFT);
  const [isGigSubmitting, setIsGigSubmitting] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ totalSize: number; storageTotal: number } | null>(null);

  const refreshStudio = async () => {
    setIsLoading(true);
    try {
      const [profileResult, gigsResult, projectPostsResult, storageResult] = await Promise.allSettled([
        getMyFreelancerProfile(),
        listMyGigs(),
        listMyProjectPosts(),
        getStorageUsage(),
      ]);

      const profileData =
        profileResult.status === "fulfilled" &&
        profileResult.value &&
        typeof profileResult.value === "object" &&
        typeof profileResult.value.id === "string"
          ? profileResult.value
          : null;

      setProfile(profileData);
      setProfileForm(toProfileForm(profileData));
      setGigs(gigsResult.status === "fulfilled" ? gigsResult.value : []);
      setProjectPosts(projectPostsResult.status === "fulfilled" ? projectPostsResult.value : []);
      setStorageUsage(storageResult.status === "fulfilled" ? storageResult.value : null);

      if (gigsResult.status !== "fulfilled" || projectPostsResult.status !== "fulfilled") {
        toast("Your studio loaded, but some published content could not be refreshed yet.");
      }
    } catch (error) {
      toast.error("We couldn't load your freelancer content studio.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === "FREELANCER") {
      void refreshStudio();
      return;
    }
    setIsLoading(false);
  }, [role]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Portfolio stories",
        value: (profile?.portfolio?.length ?? 0).toLocaleString(),
        icon: <Sparkles className="h-4 w-4 text-gray-600" />,
      },
      {
        label: "Project posts",
        value: projectPosts.length.toLocaleString(),
        icon: <FolderKanban className="h-4 w-4 text-gray-600" />,
      },
      {
        label: "Published gigs",
        value: gigs.filter((gig) => gig.status === "PUBLISHED" || gig.active).length.toLocaleString(),
        icon: <BriefcaseBusiness className="h-4 w-4 text-gray-600" />,
      },
      {
        label: "Profile rate",
        value: profile?.hourlyRate ? `${profile.currency ?? "USD"} ${profile.hourlyRate}/hr` : "Add pricing",
        icon: <WalletCards className="h-4 w-4 text-gray-600" />,
      },
      {
        label: "Storage used",
        value: storageUsage 
          ? `${(storageUsage.totalSize / (1024 * 1024)).toFixed(1)} MB` 
          : "0 MB",
        icon: <Upload className="h-4 w-4 text-gray-600" />,
      },
    ],
    [gigs, profile?.currency, profile?.hourlyRate, profile?.portfolio?.length, projectPosts.length, storageUsage],
  );

  const readinessItems = useMemo(() => getStudioReadiness(profile), [profile]);
  const completedReadinessCount = readinessItems.filter((item) => item.complete).length;
  const readinessPercent = readinessItems.length
    ? Math.round((completedReadinessCount / readinessItems.length) * 100)
    : 0;
  const missingReadinessItems = readinessItems.filter((item) => !item.complete);
  const publishingBlocked = missingReadinessItems.length > 0;
  const publishingBlockerLabel = missingReadinessItems
    .slice(0, 3)
    .map((item) => item.label)
    .join(", ");

  const submitPortfolioItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!portfolioForm.title.trim() || !portfolioForm.description.trim()) {
      toast.error("Add a title and description for the talent story.");
      return;
    }
    if (portfolioImages.length === 0) {
      toast.error("Add at least one image for your talent portfolio item.");
      return;
    }

    setIsPortfolioSubmitting(true);
    try {
      const imageUrls = await uploadJobSampleImages(portfolioImages);
      await addFreelancerPortfolioItem({
        title: portfolioForm.title.trim(),
        description: portfolioForm.description.trim(),
        category: portfolioForm.category.trim() || undefined,
        projectUrl: portfolioForm.projectUrl.trim() || undefined,
        technologies: splitList(portfolioForm.technologies),
        images: imageUrls,
      });
      toast.success("Talent portfolio item published.");
      setPortfolioForm({ title: "", description: "", category: "", projectUrl: "", technologies: "" });
      setPortfolioImages([]);
      await refreshStudio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish portfolio item.");
    } finally {
      setIsPortfolioSubmitting(false);
    }
  };

  const submitTalentIdentity = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profileForm.professionalTitle.trim() && !profileForm.bio.trim()) {
      toast.error("Add a professional title or bio before saving your profile.");
      return;
    }

    if (profileForm.hourlyRate && Number(profileForm.hourlyRate) <= 0) {
      toast.error("Hourly rate must be greater than zero.");
      return;
    }

    if (profileForm.hoursPerWeek && Number(profileForm.hoursPerWeek) <= 0) {
      toast.error("Hours per week must be greater than zero.");
      return;
    }

    setIsProfileSubmitting(true);
    try {
      const profilePayload = {
        professionalTitle: profileForm.professionalTitle.trim(),
        bio: profileForm.bio.trim(),
        location: profileForm.location.trim() || undefined,
        timezone: profileForm.timezone.trim() || undefined,
        languages: splitList(profileForm.languages),
        categories: splitList(profileForm.categories),
        availability: profileForm.availability.trim() || undefined,
        hourlyRate: profileForm.hourlyRate ? Number(profileForm.hourlyRate) : undefined,
        currency: profileForm.currency.trim().toUpperCase() || "USD",
        hoursPerWeek: profileForm.hoursPerWeek ? Number(profileForm.hoursPerWeek) : undefined,
        preferredIndustries: splitList(profileForm.preferredIndustries),
        skills: splitList(profileForm.skills).map((name) => ({
          name,
          level: "INTERMEDIATE",
        })),
      };
      const updated = profile?.id
        ? await updateMyFreelancerProfile(profilePayload)
        : await createMyFreelancerProfile(profilePayload);
      setProfile(updated);
      setProfileForm(toProfileForm(updated));
      toast.success("Freelancer profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save freelancer profile.");
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const requestProfileSuggestion = async () => {
    if (!profileForm.professionalTitle.trim() && !profileForm.bio.trim()) {
      toast.error("Add a title or bio so AI has enough signal.");
      return;
    }

    setIsProfileSuggesting(true);
    try {
      const suggestion = await suggestFreelancerProfileTaxonomy({
        professionalTitle: profileForm.professionalTitle.trim(),
        bio: profileForm.bio.trim(),
        location: profileForm.location.trim() || undefined,
        timezone: profileForm.timezone.trim() || undefined,
        languages: splitList(profileForm.languages),
        categories: splitList(profileForm.categories),
        availability: profileForm.availability.trim() || undefined,
        preferredIndustries: splitList(profileForm.preferredIndustries),
        skills: splitList(profileForm.skills).map((name) => ({ name })),
      });
      setProfileSuggestion(suggestion);
      toast.success("AI freelancer profile suggestion is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate freelancer profile suggestion.");
    } finally {
      setIsProfileSuggesting(false);
    }
  };

  const applyProfileSuggestion = () => {
    if (!profileSuggestion) return;

    const mappedCategoryId = findJobCategoryIdByDisplay(
      profileSuggestion.recommendations.suggested_categories?.[0],
    );
    const mergedSkills = uniqueValues([
      ...splitList(profileForm.skills),
      ...profileSuggestion.skills.slice(0, 8),
    ]);
    const mergedCategories = uniqueValues([
      ...splitList(profileForm.categories),
      ...(mappedCategoryId ? [mappedCategoryId] : []),
    ]);

    setProfileForm((current) => ({
      ...current,
      skills: joinList(mergedSkills),
      categories: joinList(mergedCategories),
    }));

    if (!mappedCategoryId && profileSuggestion.recommendations.suggested_categories?.[0]) {
      toast("AI suggested a category path, but it could not be mapped automatically.");
      return;
    }

    toast.success("AI suggestion applied to freelancer profile.");
  };

  const uploadMediaDraft = async (draft: MediaDraft) => {
    if (!draft.thumbnail) {
      throw new Error("Thumbnail image is required.");
    }
    if (!hasSupportingMedia(draft)) {
      throw new Error("Add at least one image, video, or file.");
    }

    // Storage quota check
    if (storageUsage) {
      const draftSize = [draft.thumbnail, ...draft.images, ...draft.videos, ...draft.documents]
        .reduce((acc, file) => acc + (file?.size || 0), 0);
      
      if (storageUsage.totalSize + draftSize > storageUsage.storageTotal) {
        throw new Error("Storage quota exceeded. Please delete existing assets or upgrade your plan.");
      }
    }

    const [thumbnailUrls, imageUrls, videoUrls, documentUrls] = await Promise.all([
      uploadJobSampleImages([draft.thumbnail]),
      uploadJobSampleImages(draft.images),
      uploadJobSampleVideos(draft.videos),
      uploadJobSampleDocuments(draft.documents),
    ]);

    return {
      thumbnailUrl: thumbnailUrls[0],
      sampleImageUrls: imageUrls,
      sampleVideoUrls: videoUrls,
      sampleDocumentUrls: documentUrls,
    };
  };

  const submitProjectPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (publishingBlocked) {
      toast.error("Complete your freelancer profile and add one portfolio story before publishing project posts.");
      return;
    }
    if (!projectForm.title.trim() || !projectForm.description.trim()) {
      toast.error("Add a title and description for the project post.");
      return;
    }

    setIsProjectSubmitting(true);
    try {
      const mediaPayload = await uploadMediaDraft(projectMedia);
      await createProjectPost({
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        category: projectForm.category.trim() || undefined,
        skills: splitList(projectForm.skills),
        budgetMin: projectForm.budgetMin ? Number(projectForm.budgetMin) : undefined,
        budgetMax: projectForm.budgetMax ? Number(projectForm.budgetMax) : undefined,
        currency: projectForm.currency.trim().toUpperCase() || "USD",
        deliveryDays: projectForm.deliveryDays ? Number(projectForm.deliveryDays) : undefined,
        status: "PUBLISHED",
        ...mediaPayload,
      });
      toast.success("Project post published with media.");
      setProjectForm({
        title: "",
        description: "",
        category: "",
        skills: "",
        budgetMin: "",
        budgetMax: "",
        currency: "USD",
        deliveryDays: "",
      });
      setProjectMedia(EMPTY_MEDIA_DRAFT);
      await refreshStudio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish project post.");
    } finally {
      setIsProjectSubmitting(false);
    }
  };

  const submitGig = async (event: React.FormEvent) => {
    event.preventDefault();
    if (publishingBlocked) {
      toast.error("Complete your freelancer profile and add one portfolio story before publishing gigs.");
      return;
    }
    if (!gigForm.title.trim() || !gigForm.description.trim()) {
      toast.error("Add a title and description for the gig.");
      return;
    }

    setIsGigSubmitting(true);
    try {
      const mediaPayload = await uploadMediaDraft(gigMedia);
      await createGig({
        title: gigForm.title.trim(),
        description: gigForm.description.trim(),
        skills: splitList(gigForm.skills),
        price: gigForm.price ? Number(gigForm.price) : undefined,
        currency: gigForm.currency.trim().toUpperCase() || "USD",
        deliveryDays: gigForm.deliveryDays ? Number(gigForm.deliveryDays) : undefined,
        status: "PUBLISHED",
        active: true,
        ...mediaPayload,
      });
      toast.success("Gig published with thumbnail and media.");
      setGigForm({
        title: "",
        description: "",
        skills: "",
        price: "",
        currency: "USD",
        deliveryDays: "",
      });
      setGigMedia(EMPTY_MEDIA_DRAFT);
      await refreshStudio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish gig.");
    } finally {
      setIsGigSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-[28px] border border-gray-200/80 bg-white p-6">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (role !== "FREELANCER") {
    return (
      <div className="rounded-[28px] border border-gray-200/80 bg-white p-6 text-sm text-gray-500">
        This workspace is reserved for freelancer content publishing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-gray-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.95fr)]">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Freelancer content studio
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-900">Publish talent, project posts, and gigs with rich media</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                Build your identity first, add one visual proof-of-work story, then publish offers with thumbnails, videos, and supporting files that feel marketplace-ready from the first impression.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {publishingBlocked ? `${missingReadinessItems.length} setup steps left` : "Publishing unlocked"}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                {profile?.professionalTitle || "Freelancer profile"}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                {profile?.location || profile?.timezone || "Add your location and timezone"}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_42%),linear-gradient(160deg,#0f172a,#1e293b_58%,#334155)] p-5 text-white shadow-[0_24px_50px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/80">Studio readiness</p>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{readinessPercent}%</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {completedReadinessCount} of {readinessItems.length} publishing requirements are complete.
                </p>
              </div>
              {publishingBlocked ? (
                <CircleAlert className="h-5 w-5 text-amber-300" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              )}
            </div>

            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,#38bdf8,#34d399)] transition-all"
                style={{ width: `${Math.max(readinessPercent, 8)}%` }}
              />
            </div>

            <div className="mt-5 space-y-2">
              {missingReadinessItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{item.detail}</p>
                </div>
              ))}
              {missingReadinessItems.length === 0 ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-50">
                  Your profile is ready for portfolio publishing, project posts, and gigs.
                </div>
              ) : null}
            </div>

            {storageUsage && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-100/80">Vault Storage Quota</p>
                  <p className="text-[10px] font-bold text-white">
                    {Math.round((storageUsage.totalSize / storageUsage.storageTotal) * 100)}% Used
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (storageUsage.totalSize / storageUsage.storageTotal) > 0.9 ? "bg-amber-400" : "bg-sky-400"
                    }`}
                    style={{ width: `${Math.min(100, Math.round((storageUsage.totalSize / storageUsage.storageTotal) * 100))}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  {(storageUsage.totalSize / (1024 * 1024)).toFixed(1)} MB used of {(storageUsage.storageTotal / (1024 * 1024 * 1024)).toFixed(0)} GB limit.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[24px] border border-gray-100 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{card.label}</p>
                {card.icon}
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.82fr)]">
          <div>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Talent identity</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">Edit your freelancer profile and guide classification</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                  Save the essentials here first so your portfolio, project posts, and gigs all inherit a credible identity. AI suggestions stay preview-only until you apply them.
                </p>
              </div>
              <div className="rounded-[24px] border border-sky-100 bg-sky-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">AI assist</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {profileSuggestion?.recommendations?.suggested_categories?.[0] || "No suggestion yet"}
                </p>
              </div>
            </div>

            <form onSubmit={submitTalentIdentity} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={profileForm.professionalTitle}
                  onChange={(event) => setProfileForm((current) => ({ ...current, professionalTitle: event.target.value }))}
                  placeholder="Professional title"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <select
                  value={profileForm.availability}
                  onChange={(event) => setProfileForm((current) => ({ ...current, availability: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="NOT_AVAILABLE">Not available</option>
                </select>
              </div>

              <textarea
                value={profileForm.bio}
                onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                placeholder="Describe your expertise, outcomes, tools, and the kind of work you do best."
                rows={4}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none resize-none"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profileForm.hourlyRate}
                  onChange={(event) => setProfileForm((current) => ({ ...current, hourlyRate: event.target.value }))}
                  placeholder="Hourly rate"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <input
                  type="text"
                  value={profileForm.currency}
                  onChange={(event) => setProfileForm((current) => ({ ...current, currency: event.target.value }))}
                  placeholder="Currency"
                  maxLength={5}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm uppercase text-gray-700 outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={profileForm.hoursPerWeek}
                  onChange={(event) => setProfileForm((current) => ({ ...current, hoursPerWeek: event.target.value }))}
                  placeholder="Hours per week"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(event) => setProfileForm((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Location"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <input
                  type="text"
                  value={profileForm.timezone}
                  onChange={(event) => setProfileForm((current) => ({ ...current, timezone: event.target.value }))}
                  placeholder="Timezone"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <input
                  type="text"
                  value={profileForm.languages}
                  onChange={(event) => setProfileForm((current) => ({ ...current, languages: event.target.value }))}
                  placeholder="Languages, comma separated"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <input
                  type="text"
                  value={profileForm.preferredIndustries}
                  onChange={(event) => setProfileForm((current) => ({ ...current, preferredIndustries: event.target.value }))}
                  placeholder="Preferred industries, comma separated"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <input
                  type="text"
                  value={profileForm.categories}
                  onChange={(event) => setProfileForm((current) => ({ ...current, categories: event.target.value }))}
                  placeholder="Category IDs, comma separated"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <input
                  type="text"
                  value={profileForm.skills}
                  onChange={(event) => setProfileForm((current) => ({ ...current, skills: event.target.value }))}
                  placeholder="Skills, comma separated"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </div>

              <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                Saving your hourly rate, skills, categories, and languages here unlocks publishing for project posts and gigs. A portfolio story is the final step.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isProfileSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                >
                  {isProfileSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Freelancer Profile"}
                </button>
                <button
                  type="button"
                  disabled={isProfileSuggesting}
                  onClick={requestProfileSuggestion}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-5 text-sm font-semibold text-sky-700 transition hover:border-sky-300 disabled:opacity-60"
                >
                  {isProfileSuggesting ? "Suggesting..." : "Suggest with AI"}
                </button>
                {profileSuggestion ? (
                  <button
                    type="button"
                    onClick={applyProfileSuggestion}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                  >
                    Apply suggestion
                  </button>
                ) : null}
              </div>
            </form>

            {profileSuggestion ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-sky-100 bg-sky-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Suggested path</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {profileSuggestion.recommendations.suggested_categories?.[0] || "No category suggestion"}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Confidence: {Math.round((profileSuggestion.confidence || 0) * 100)}%
                  </p>
                </div>
                <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Suggested skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profileSuggestion.skills.slice(0, 8).map((skill) => (
                      <span key={skill} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="rounded-[28px] border border-gray-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Publishing checklist</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">Real readiness, not guesswork</h3>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {completedReadinessCount}/{readinessItems.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {readinessItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[22px] border px-4 py-3 ${
                    item.complete
                      ? "border-emerald-100 bg-emerald-50/80"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.complete ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    ) : (
                      <CircleAlert className="mt-0.5 h-4 w-4 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-950 px-4 py-4 text-white">
              <p className="text-sm font-semibold">Next unlock</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {publishingBlocked
                  ? `Finish ${publishingBlockerLabel}${missingReadinessItems.length > 3 ? ", and more" : ""} to publish project posts and gigs.`
                  : "Your identity is complete. Add or update offers below whenever you're ready."}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-3">
        <div className="space-y-4 rounded-[30px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Talent portfolio</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">Add a visual proof-of-work story</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Your first portfolio story completes the final publishing requirement for gigs and project posts.
            </p>
          </div>
          <form onSubmit={submitPortfolioItem} className="space-y-4">
            <input
              type="text"
              value={portfolioForm.title}
              onChange={(event) => setPortfolioForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Portfolio title"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
            />
            <textarea
              value={portfolioForm.description}
              onChange={(event) => setPortfolioForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe what you delivered and why it matters."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none resize-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={portfolioForm.category}
                onChange={(event) => setPortfolioForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Category"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <input
                type="url"
                value={portfolioForm.projectUrl}
                onChange={(event) => setPortfolioForm((current) => ({ ...current, projectUrl: event.target.value }))}
                placeholder="Project URL"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
            </div>
            <input
              type="text"
              value={portfolioForm.technologies}
              onChange={(event) => setPortfolioForm((current) => ({ ...current, technologies: event.target.value }))}
              placeholder="Technologies or skills, comma separated"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
            />
            <FilePicker
              label="Portfolio images"
              accept="image/*"
              helper="Required. Add one or more images that represent this talent story."
              onSelect={setPortfolioImages}
            />
            <div className="flex flex-wrap gap-2">
              {portfolioImages.map((file) => (
                <span key={file.name} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">
                  {file.name}
                </span>
              ))}
            </div>
            <button
              type="submit"
              disabled={isPortfolioSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {isPortfolioSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Talent Story"}
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {(profile?.portfolio ?? []).slice(0, 3).map((item) => (
              <PortfolioCard key={item.id ?? `${item.title}-${item.projectUrl}`} item={item} />
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[30px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Project posts</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">Publish a scoped project offer</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Scoped offers unlock after your profile is fully ready, including at least one portfolio story.
            </p>
          </div>
          {publishingBlocked ? (
            <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              Finish {publishingBlockerLabel}
              {missingReadinessItems.length > 3 ? ", and a few more checklist items" : ""} before publishing project posts.
            </div>
          ) : null}
          <form onSubmit={submitProjectPost} className="space-y-4">
            <input
              type="text"
              value={projectForm.title}
              onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Project post title"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
            />
            <textarea
              value={projectForm.description}
              onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Scope the deliverable, output, and collaboration model."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none resize-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={projectForm.category}
                onChange={(event) => setProjectForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Category"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <input
                type="text"
                value={projectForm.skills}
                onChange={(event) => setProjectForm((current) => ({ ...current, skills: event.target.value }))}
                placeholder="Skills, comma separated"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="number"
                min="0"
                value={projectForm.budgetMin}
                onChange={(event) => setProjectForm((current) => ({ ...current, budgetMin: event.target.value }))}
                placeholder="Budget min"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <input
                type="number"
                min="0"
                value={projectForm.budgetMax}
                onChange={(event) => setProjectForm((current) => ({ ...current, budgetMax: event.target.value }))}
                placeholder="Budget max"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <input
                type="number"
                min="1"
                value={projectForm.deliveryDays}
                onChange={(event) => setProjectForm((current) => ({ ...current, deliveryDays: event.target.value }))}
                placeholder="Delivery days"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
            </div>
            <FilePicker
              label="Thumbnail image"
              accept="image/*"
              multiple={false}
              helper="Required. This becomes the first preview employers see."
              onSelect={(files) => setProjectMedia((current) => ({ ...current, thumbnail: files[0] ?? null }))}
            />
            <div className="grid gap-3">
              <FilePicker
                label="Supporting images"
                accept="image/*"
                helper="Add visual stills or design frames."
                onSelect={(files) => setProjectMedia((current) => ({ ...current, images: files }))}
              />
              <FilePicker
                label="Supporting videos"
                accept="video/*"
                helper="Add demos, walkthroughs, or motion samples."
                onSelect={(files) => setProjectMedia((current) => ({ ...current, videos: files }))}
              />
              <FilePicker
                label="Supporting files"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                helper="Add briefs, decks, PDFs, or source files."
                onSelect={(files) => setProjectMedia((current) => ({ ...current, documents: files }))}
              />
            </div>
            <SelectionSummary media={projectMedia} />
            <button
              type="submit"
              disabled={isProjectSubmitting || publishingBlocked}
              className="inline-flex h-11 items-center justify-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {isProjectSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : publishingBlocked ? "Complete Profile To Publish" : "Publish Project Post"}
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {projectPosts.slice(0, 3).map((post) => (
              <ContentCard
                key={post.id}
                kind="Project post"
                title={post.title}
                description={post.description}
                thumbnailUrl={post.thumbnailUrl}
                imageUrls={post.sampleImageUrls}
                videoUrls={post.sampleVideoUrls}
                documentUrls={post.sampleDocumentUrls}
                metaLine={post.category || post.status || "Published"}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[30px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Gigs</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">Publish a packaged service</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Package your offer once the identity checklist is complete, then lead with a polished media cover.
            </p>
          </div>
          {publishingBlocked ? (
            <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              Finish {publishingBlockerLabel}
              {missingReadinessItems.length > 3 ? ", and a few more checklist items" : ""} before publishing gigs.
            </div>
          ) : null}
          <form onSubmit={submitGig} className="space-y-4">
            <input
              type="text"
              value={gigForm.title}
              onChange={(event) => setGigForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Gig title"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
            />
            <textarea
              value={gigForm.description}
              onChange={(event) => setGigForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the service package, scope, and client outcome."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none resize-none"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={gigForm.skills}
                onChange={(event) => setGigForm((current) => ({ ...current, skills: event.target.value }))}
                placeholder="Skills, comma separated"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <input
                type="number"
                min="0"
                value={gigForm.price}
                onChange={(event) => setGigForm((current) => ({ ...current, price: event.target.value }))}
                placeholder="Price"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <input
                type="number"
                min="1"
                value={gigForm.deliveryDays}
                onChange={(event) => setGigForm((current) => ({ ...current, deliveryDays: event.target.value }))}
                placeholder="Delivery days"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
              />
            </div>
            <FilePicker
              label="Thumbnail image"
              accept="image/*"
              multiple={false}
              helper="Required. This is the gig card cover image."
              onSelect={(files) => setGigMedia((current) => ({ ...current, thumbnail: files[0] ?? null }))}
            />
            <div className="grid gap-3">
              <FilePicker
                label="Supporting images"
                accept="image/*"
                helper="Add screenshots, before/after frames, or deliverable previews."
                onSelect={(files) => setGigMedia((current) => ({ ...current, images: files }))}
              />
              <FilePicker
                label="Supporting videos"
                accept="video/*"
                helper="Add service reels, demo clips, or recorded walkthroughs."
                onSelect={(files) => setGigMedia((current) => ({ ...current, videos: files }))}
              />
              <FilePicker
                label="Supporting files"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                helper="Add brochures, scope files, pricing sheets, or samples."
                onSelect={(files) => setGigMedia((current) => ({ ...current, documents: files }))}
              />
            </div>
            <SelectionSummary media={gigMedia} />
            <button
              type="submit"
              disabled={isGigSubmitting || publishingBlocked}
              className="inline-flex h-11 items-center justify-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {isGigSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : publishingBlocked ? "Complete Profile To Publish" : "Publish Gig"}
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {gigs.slice(0, 3).map((gig) => (
              <ContentCard
                key={gig.id}
                kind="Gig"
                title={gig.title}
                description={gig.description}
                thumbnailUrl={gig.thumbnailUrl}
                imageUrls={gig.sampleImageUrls}
                videoUrls={gig.sampleVideoUrls}
                documentUrls={gig.sampleDocumentUrls}
                metaLine={gig.status || "Published"}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Link2 className="h-4 w-4 text-gray-700" />
          Publishing rules
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Talent stories</p>
            <p className="mt-2">Require at least one image so employers see real portfolio proof instead of text-only cards.</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Project posts</p>
            <p className="mt-2">Require a thumbnail plus at least one supporting image, video, or file before publishing.</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Gigs</p>
            <p className="mt-2">Require a thumbnail plus at least one supporting asset so the marketplace always has visual or file context.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
