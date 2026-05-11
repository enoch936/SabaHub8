"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  DollarSign,
  Layers3,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import JobCategoryPicker from "@/components/JobCategoryPicker";
import {
  EMPTY_JOB_MEDIA_DRAFT,
  JobMediaComposer,
  type JobMediaDraft,
  hasSupportingJobMedia,
} from "@/components/jobs/JobMediaComposer";
import { Button, Input, Textarea, cn } from "@/components/ui";
import {
  createJob,
  suggestJobTaxonomy,
  uploadJobSampleDocuments,
  uploadJobSampleImages,
  uploadJobSampleVideos,
  type TaxonomySuggestion,
} from "@/lib/api";
import {
  DELIVERABLE_TYPE_OPTIONS,
  ENGAGEMENT_TYPE_OPTIONS,
  EXPERIENCE_BAND_OPTIONS,
  INDUSTRY_OPTIONS,
  PRICING_MODEL_OPTIONS,
  TEAM_SIZE_OPTIONS,
  WORK_LOCATION_OPTIONS,
  getSuggestedDeliverableTypes,
  getSuggestedIndustries,
  getSuggestedProjectTypes,
  getSuggestedSkills,
  getSuggestedTools,
  getSuggestedWorkModes,
  getTechnologyGroupsForCategory,
} from "@/lib/enterpriseJobCatalog";
import { findJobCategoryIdByDisplay, getJobCategoryDisplay } from "@/lib/jobTaxonomy";
import { workspaceRoutes } from "@/lib/workspace-routes";

type ExperienceBand = (typeof EXPERIENCE_BAND_OPTIONS)[number]["value"];

type JobComposerState = {
  title: string;
  description: string;
  categoryId: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  freelancersNeeded: string;
  engagementType: string;
  pricingModel: string;
  deliverableType: string;
  workLocation: string;
  experienceBand: ExperienceBand;
  skills: string[];
  tools: string[];
  industries: string[];
  teamSize: string[];
};

const INITIAL_STATE: JobComposerState = {
  title: "",
  description: "",
  categoryId: "",
  budgetMin: "1500",
  budgetMax: "6000",
  currency: "USD",
  freelancersNeeded: "1",
  engagementType: "PROJECT_BASED",
  pricingModel: "FIXED_PRICE",
  deliverableType: "MIXED",
  workLocation: "REMOTE",
  experienceBand: "MID",
  skills: [],
  tools: [],
  industries: [],
  teamSize: ["Solo Specialist"],
};

function uniqueValues(values: string[]) {
  const next: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || next.includes(trimmed)) continue;
    next.push(trimmed);
  }

  return next;
}

function toggleSelection(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function TagComposer({
  label,
  helperText,
  placeholder,
  values,
  suggestions,
  onChange,
  accent = "sky",
}: {
  label: string;
  helperText?: string;
  placeholder: string;
  values: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
  accent?: "sky" | "amber";
}) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const next = uniqueValues([
      ...values,
      ...raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ]);

    onChange(next);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    if (!draft.trim()) return;
    commit(draft);
  };

  const accentClasses =
    accent === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300"
      : "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-300";

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {helperText ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">{helperText}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {values.length === 0 ? (
          <span className="rounded-full border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-400">
            Nothing selected yet
          </span>
        ) : (
          values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
            >
              {value} x
            </button>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!draft.trim()) return;
            commit(draft);
          }}
        >
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const active = values.includes(suggestion);
          return (
            <button
              key={suggestion}
              type="button"
              onClick={() =>
                onChange(
                  active
                    ? values.filter((item) => item !== suggestion)
                    : uniqueValues([...values, suggestion])
                )
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? accentClasses
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              {suggestion}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PostJobPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_STATE);
  const [media, setMedia] = useState<JobMediaDraft>(EMPTY_JOB_MEDIA_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [taxonomySuggestion, setTaxonomySuggestion] = useState<TaxonomySuggestion | null>(null);

  const suggestedSkills = useMemo(
    () => getSuggestedSkills(form.categoryId),
    [form.categoryId]
  );
  const suggestedTools = useMemo(
    () => getSuggestedTools(form.categoryId),
    [form.categoryId]
  );
  const suggestedIndustries = useMemo(
    () => getSuggestedIndustries(form.categoryId),
    [form.categoryId]
  );
  const suggestedProjectTypes = useMemo(
    () => getSuggestedProjectTypes(form.categoryId),
    [form.categoryId]
  );
  const suggestedWorkModes = useMemo(
    () => getSuggestedWorkModes(form.categoryId),
    [form.categoryId]
  );
  const suggestedDeliverables = useMemo(
    () => getSuggestedDeliverableTypes(form.categoryId),
    [form.categoryId]
  );
  const technologyGroups = useMemo(
    () => getTechnologyGroupsForCategory(form.categoryId),
    [form.categoryId]
  );

  const minYearsExperience =
    EXPERIENCE_BAND_OPTIONS.find((option) => option.value === form.experienceBand)
      ?.minYears ?? 3;

  const primarySuggestedCategory =
    taxonomySuggestion?.recommendations?.suggested_categories?.[0] ?? "";

  const uploadMediaDraft = async () => {
    if (!media.thumbnail) {
      throw new Error("Add a thumbnail.");
    }

    if (!hasSupportingJobMedia(media)) {
      throw new Error("Add at least one image, video, or file.");
    }

    const [thumbnailUrls, imageUrls, videoUrls, documentUrls] = await Promise.all([
      uploadJobSampleImages([media.thumbnail]),
      uploadJobSampleImages(media.images),
      uploadJobSampleVideos(media.videos),
      uploadJobSampleDocuments(media.documents),
    ]);

    return {
      sampleImageUrls: [...thumbnailUrls, ...imageUrls],
      sampleVideoUrls: videoUrls,
      sampleDocumentUrls: documentUrls,
    };
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const budgetMin = Number(form.budgetMin);
    const budgetMax = Number(form.budgetMax);
    const freelancersNeeded = Number(form.freelancersNeeded);
    const skills = uniqueValues(form.skills);
    const tools = uniqueValues(form.tools);

    if (!title) {
      toast.error("Add a job title before posting.");
      return;
    }

    if (!description) {
      toast.error("Add a professional project description.");
      return;
    }

    if (!form.categoryId) {
      toast.error("Choose a category and specialization.");
      return;
    }

    if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax)) {
      toast.error("Enter a valid budget range.");
      return;
    }

    if (budgetMin <= 0 || budgetMax <= 0 || budgetMax < budgetMin) {
      toast.error("Budget max must be greater than or equal to budget min.");
      return;
    }

    if (!Number.isInteger(freelancersNeeded) || freelancersNeeded < 1) {
      toast.error("Freelancers needed must be at least 1.");
      return;
    }

    if (skills.length === 0) {
      toast.error("Select at least one required skill.");
      return;
    }

    setIsSubmitting(true);

    try {
      const mediaPayload = await uploadMediaDraft();
      await createJob({
        title,
        description,
        categoryId: form.categoryId,
        budgetMin,
        budgetMax,
        currency: form.currency.trim().toUpperCase() || "USD",
        maxConcurrentProjects: freelancersNeeded,
        engagementType: form.engagementType,
        pricingModel: form.pricingModel,
        deliverableType: form.deliverableType,
        workLocation: form.workLocation,
        minYearsExperience,
        skills,
        requiredSkills: skills,
        requiredTools: tools,
        industry: form.industries,
        teamSize: form.teamSize,
        ...mediaPayload,
      });

      toast.success("Job posted.");
      setMedia(EMPTY_JOB_MEDIA_DRAFT);
      router.push(workspaceRoutes.home);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't post the job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestTaxonomy = async () => {
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title && !description) {
      toast.error("Add a title or description so AI has something to classify.");
      return;
    }

    setIsSuggesting(true);

    try {
      const suggestion = await suggestJobTaxonomy({
        title,
        description,
        categoryId: form.categoryId,
        skills: uniqueValues(form.skills),
        requiredSkills: uniqueValues(form.skills),
        requiredTools: uniqueValues(form.tools),
        industry: form.industries,
        minYearsExperience,
        engagementType: form.engagementType,
        pricingModel: form.pricingModel,
        deliverableType: form.deliverableType,
        workLocation: form.workLocation,
      });
      setTaxonomySuggestion(suggestion);
      toast.success("AI taxonomy suggestion is ready.");
    } catch {
      toast.error("We couldn't generate a taxonomy suggestion right now.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!taxonomySuggestion) return;

    const nextCategoryId = findJobCategoryIdByDisplay(primarySuggestedCategory);
    const nextSkills = uniqueValues([
      ...form.skills,
      ...taxonomySuggestion.skills.slice(0, 6),
    ]);

    setForm((current) => ({
      ...current,
      categoryId: nextCategoryId ?? current.categoryId,
      skills: nextSkills,
    }));

    if (!nextCategoryId && primarySuggestedCategory) {
      toast("AI suggested a category path, but it could not be mapped to a picker ID automatically.");
      return;
    }

    toast.success("AI suggestion applied to the form.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <Sparkles className="h-3.5 w-3.5" />
              Job post
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
              Post clean, media-rich jobs
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Add the role, budget, skills, and media in one clean form.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Category
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Smart</p>
            </div>
            <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Media
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Ready</p>
            </div>
            <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Matching
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Sharper</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-[28px] bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Basics</h2>
                <p className="text-sm text-slate-500">
                  Title, category, budget, and level.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Job title
                </label>
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="e.g. Senior Design Systems Lead for B2B Platform Redesign"
                />
              </div>

              <div className="md:col-span-2">
                <JobCategoryPicker
                  value={form.categoryId}
                  onChange={(categoryId) =>
                    setForm((current) => ({ ...current, categoryId }))
                  }
                  label="Category and specialization"
                  helperText="Choose the most specific specialization that matches the outcome you expect."
                  placeholder="Select an enterprise-ready category"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">AI help</div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Suggest category and skills from your draft.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  isLoading={isSuggesting}
                  onClick={handleSuggestTaxonomy}
                >
                  Suggest with AI
                </Button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Budget min
                </label>
                <Input
                  type="number"
                  value={form.budgetMin}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, budgetMin: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Budget max
                </label>
                <Input
                  type="number"
                  value={form.budgetMax}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, budgetMax: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Currency
                </label>
                <Input
                  value={form.currency}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
                  }
                  placeholder="USD"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Freelancers needed
                </label>
                <Input
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.freelancersNeeded}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      freelancersNeeded: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Experience band
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_BAND_OPTIONS.map((option) => {
                    const active = form.experienceBand === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            experienceBand: option.value as ExperienceBand,
                          }))
                        }
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-left transition",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <div className="text-sm font-semibold">{option.label}</div>
                        <div
                          className={cn(
                            "mt-1 text-xs leading-5",
                            active ? "text-slate-200" : "text-slate-500"
                          )}
                        >
                          {option.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Work setup</h2>
                <p className="text-sm text-slate-500">
                  Choose how the work will run.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Project type
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {ENGAGEMENT_TYPE_OPTIONS.map((option) => {
                    const active = form.engagementType === option.value;
                    const recommended = suggestedProjectTypes.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, engagementType: option.value }))
                        }
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{option.label}</span>
                          {recommended ? (
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                active
                                  ? "bg-white/10 text-slate-200"
                                  : "bg-emerald-50 text-emerald-700"
                              )}
                            >
                              Recommended
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-2 text-xs leading-5",
                            active ? "text-slate-200" : "text-slate-500"
                          )}
                        >
                          {option.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Pricing model
                  </label>
                  <div className="space-y-2">
                    {PRICING_MODEL_OPTIONS.map((option) => {
                      const active = form.pricingModel === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({ ...current, pricingModel: option.value }))
                          }
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 text-left transition",
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                          )}
                        >
                          <div className="text-sm font-semibold">{option.label}</div>
                          <div
                            className={cn(
                              "mt-1 text-xs leading-5",
                              active ? "text-slate-200" : "text-slate-500"
                            )}
                          >
                            {option.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Deliverable profile
                  </label>
                  <div className="space-y-2">
                    {DELIVERABLE_TYPE_OPTIONS.map((option) => {
                      const active = form.deliverableType === option.value;
                      const recommended = suggestedDeliverables.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              deliverableType: option.value,
                            }))
                          }
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 text-left transition",
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">{option.label}</span>
                            {recommended ? (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                  active
                                    ? "bg-white/10 text-slate-200"
                                    : "bg-sky-50 text-sky-700"
                                )}
                              >
                                Match
                              </span>
                            ) : null}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-xs leading-5",
                              active ? "text-slate-200" : "text-slate-500"
                            )}
                          >
                            {option.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Work model
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {WORK_LOCATION_OPTIONS.map((option) => {
                    const active = form.workLocation === option.value;
                    const recommended = suggestedWorkModes.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, workLocation: option.value }))
                        }
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{option.label}</span>
                          {recommended ? (
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                active
                                  ? "bg-white/10 text-slate-200"
                                  : "bg-emerald-50 text-emerald-700"
                              )}
                            >
                              Fit
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-2 text-xs leading-5",
                            active ? "text-slate-200" : "text-slate-500"
                          )}
                        >
                          {option.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Scope</h2>
                <p className="text-sm text-slate-500">
                  Keep the brief clear and specific.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Project description
                </label>
                <Textarea
                  minRows={7}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Describe the work, outcome, and success."
                />
              </div>

              <TagComposer
                label="Required skills"
                helperText="Used for matching."
                placeholder="Type a skill and press Enter"
                values={form.skills}
                suggestions={suggestedSkills}
                onChange={(skills) => setForm((current) => ({ ...current, skills }))}
              />

              <TagComposer
                label="Preferred tools and platforms"
                helperText="Add the main stack."
                placeholder="Type a tool and press Enter"
                values={form.tools}
                suggestions={suggestedTools}
                onChange={(tools) => setForm((current) => ({ ...current, tools }))}
                accent="amber"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-800">
                    Industries
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_OPTIONS.map((option) => {
                      const active = form.industries.includes(option.value);
                      const recommended = suggestedIndustries.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              industries: toggleSelection(current.industries, option.value),
                            }))
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {option.label}
                          {recommended ? " *" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-800">
                    Preferred delivery shape
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_SIZE_OPTIONS.map((option) => {
                      const active = form.teamSize.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              teamSize: toggleSelection(current.teamSize, option.value),
                            }))
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <JobMediaComposer value={media} onChange={setMedia} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Building2 className="h-4 w-4" />
              Summary
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Category
                </div>
                <div className="mt-1 text-sm font-medium text-white">
                  {form.categoryId
                    ? getJobCategoryDisplay(form.categoryId, {
                        separator: " / ",
                        unknownFallback: form.categoryId,
                      })
                    : "Select a category"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Project
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {getOptionLabel(ENGAGEMENT_TYPE_OPTIONS, form.engagementType)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Pricing
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {getOptionLabel(PRICING_MODEL_OPTIONS, form.pricingModel)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Work
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {getOptionLabel(WORK_LOCATION_OPTIONS, form.workLocation)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Deliverable
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {getOptionLabel(DELIVERABLE_TYPE_OPTIONS, form.deliverableType)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Budget range</span>
                  <span className="text-sm font-semibold text-white">
                    {form.currency || "USD"} {form.budgetMin || "0"} - {form.budgetMax || "0"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Media</span>
                  <span className="text-sm font-semibold text-white">
                    {media.thumbnail ? "1 thumb" : "0 thumb"} / {media.images.length} images / {media.videos.length} videos / {media.documents.length} files
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-xl font-semibold">{form.skills.length}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Skills
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-xl font-semibold">{form.tools.length}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Tools
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-xl font-semibold">{form.industries.length}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Industries
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-sky-600" />
              Tech references
            </div>
            <div className="mt-4 space-y-4">
              {technologyGroups.map((group) => (
                <div key={group.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{group.label}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-[0_10px_26px_rgba(15,23,42,0.05)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {taxonomySuggestion ? (
            <section className="rounded-[28px] bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_18px_45px_rgba(14,165,233,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  AI suggestion
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 shadow-[0_10px_26px_rgba(14,165,233,0.08)]">
                  {Math.round((taxonomySuggestion.confidence || 0) * 100)}% confidence
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Suggested path
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {primarySuggestedCategory || "No category path suggested yet"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Suggested skills
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {taxonomySuggestion.skills.slice(0, 8).map((skill) => (
                      <span key={skill} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-[0_10px_26px_rgba(14,165,233,0.08)]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {taxonomySuggestion.is_new_category && taxonomySuggestion.suggested_new_category.name ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Emerging signal: {taxonomySuggestion.suggested_new_category.name}
                  </div>
                ) : null}

                <Button type="button" className="w-full" onClick={handleApplySuggestion}>
                  Apply suggestion
                </Button>
              </div>
            </section>
          ) : null}

          <section className="rounded-[28px] bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Publish
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your post will include job details, matching signals, and media.
            </p>

            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                className="flex-1"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={handleSubmit}
              >
                Publish
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(workspaceRoutes.home)}
              >
                Cancel
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
