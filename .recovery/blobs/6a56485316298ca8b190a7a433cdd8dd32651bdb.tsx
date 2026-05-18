"use client";

import { create } from 'zustand';
import { toast } from 'sonner';
import { deleteJob as deleteJobApi, listOpenJobsPage, submitProposal as submitJobProposal, type Job as ApiJob } from './api';
import type { Job, JobFilters, FreelancerProfile, ProposalPayload, FilterPreset } from './types';

function normalizeEmployerName(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveEmployerDisplayName(job: ApiJob | Job): string {
  const record = job as ApiJob & {
    employer?: {
      companyName?: string | null;
      fullName?: string | null;
      name?: string | null;
    };
    employerProfile?: {
      companyName?: string | null;
    };
    postedByName?: string | null;
    posterName?: string | null;
  };

  return (
    normalizeEmployerName('employerName' in record ? record.employerName : undefined)
    ?? normalizeEmployerName(record.companyName)
    ?? normalizeEmployerName(record.employer?.companyName)
    ?? normalizeEmployerName(record.employerProfile?.companyName)
    ?? normalizeEmployerName(record.employer?.fullName)
    ?? normalizeEmployerName(record.employer?.name)
    ?? normalizeEmployerName(record.postedByName)
    ?? normalizeEmployerName(record.posterName)
    ?? 'Employer'
  );
}

function mapApiJobToUiJob(job: ApiJob, savedJobs: Set<string>): Job {
  const anyJob = job as ApiJob & {
    sampleImages?: string[];
    sampleVideos?: string[];
    sampleDocuments?: string[];
    sampleAudios?: string[];
    imageUrls?: string[];
    videoUrls?: string[];
    documentUrls?: string[];
    audioUrls?: string[];
  };

  const imageUrls = Array.isArray(job.sampleImageUrls) && job.sampleImageUrls.length > 0
    ? job.sampleImageUrls
    : Array.isArray(anyJob.sampleImages) && anyJob.sampleImages.length > 0
      ? anyJob.sampleImages
      : (anyJob.imageUrls ?? []);

  const videoUrls = Array.isArray(job.sampleVideoUrls) && job.sampleVideoUrls.length > 0
    ? job.sampleVideoUrls
    : Array.isArray(anyJob.sampleVideos) && anyJob.sampleVideos.length > 0
      ? anyJob.sampleVideos
      : (anyJob.videoUrls ?? []);

  const documentUrls = Array.isArray(job.sampleDocumentUrls) && job.sampleDocumentUrls.length > 0
    ? job.sampleDocumentUrls
    : Array.isArray(anyJob.sampleDocuments) && anyJob.sampleDocuments.length > 0
      ? anyJob.sampleDocuments
      : (anyJob.documentUrls ?? []);

  const audioUrls = Array.isArray(job.sampleAudioUrls) && job.sampleAudioUrls.length > 0
    ? job.sampleAudioUrls
    : Array.isArray(anyJob.sampleAudios) && anyJob.sampleAudios.length > 0
      ? anyJob.sampleAudios
      : (anyJob.audioUrls ?? []);

  const minBudget = typeof job.budgetMin === 'number' ? job.budgetMin : (job.budget?.min ?? 0);
  const maxBudget = typeof job.budgetMax === 'number' ? job.budgetMax : (job.budget?.max ?? minBudget);
  const pricing = (job.pricingModel ?? '').toUpperCase();
  const budgetType = pricing === 'HOURLY' ? 'HOURLY' : 'FIXED';
  const postedAt = job.createdAt ?? new Date().toISOString();

  return {
    id: job.id,
    title: job.title,
    description: job.description ?? job.overviewText ?? 'No description provided.',
    category: job.categoryId,
    sampleImageUrls: imageUrls,
    sampleVideoUrls: videoUrls,
    sampleDocumentUrls: documentUrls,
    sampleAudioUrls: audioUrls,
    budget: {
      min: minBudget,
      max: maxBudget,
      type: budgetType,
    },
    duration: job.slaDeliveryDays ? `${job.slaDeliveryDays} days` : 'Flexible',
    skills: Array.isArray(job.skills) ? job.skills : [],
    experienceLevel: (job.minYearsExperience ?? 0) >= 5 ? 'EXPERT' : (job.minYearsExperience ?? 0) >= 2 ? 'INTERMEDIATE' : 'ENTRY',
    status: (job.status as Job['status']) ?? 'OPEN',
    employerId: job.employerId ?? '',
    employerName: resolveEmployerDisplayName(job),
    employerVerified: Boolean(job.isEnterpriseOnly),
    applicantCount: 0,
    maxApplicants: 24,
    postedAt,
    isRemote: !job.workLocation || job.workLocation.toLowerCase().includes('remote'),
    isSaved: savedJobs.has(job.id),
    timezone: 'UTC',
    workLocation: job.workLocation,
    locationLabel: job.workLocation ?? 'Remote',
  };
}

export function computeSkillOverlap(jobSkills: string[], userSkills: string[]): number {
  if (!jobSkills.length || !userSkills.length) return 0;
  const jobLower = jobSkills.map((s) => s.toLowerCase());
  const userLower = userSkills.map((s) => s.toLowerCase());
  const overlap = jobLower.filter((s) => userLower.includes(s)).length;
  return overlap / jobSkills.length;
}

export function computeRateMatch(budgetMax: number, hourlyRate: number): number {
  return budgetMax >= hourlyRate ? 1 : 0;
}

export function computeExpMatch(experienceLevel: string, completedJobs: number): number {
  if (experienceLevel === 'ENTRY') return completedJobs >= 0 ? 1 : 0;
  if (experienceLevel === 'INTERMEDIATE') return completedJobs >= 5 ? 1 : completedJobs >= 2 ? 0.5 : 0;
  if (experienceLevel === 'EXPERT') return completedJobs >= 20 ? 1 : completedJobs >= 10 ? 0.5 : 0;
  return 0.5;
}

export function computeAIMatchScore(job: Job, userProfile: FreelancerProfile): number {
  if (!job.skills.length || !userProfile.skills.length) return 50;
  const skillOverlap = computeSkillOverlap(job.skills, userProfile.skills);
  const rateMatch = computeRateMatch(job.budget.max, userProfile.hourlyRate);
  const expMatch = computeExpMatch(job.experienceLevel, userProfile.completedJobs);
  const score = Math.round((skillOverlap * 0.6 + rateMatch * 0.2 + expMatch * 0.2) * 100);
  return Math.max(0, Math.min(100, score));
}

interface JobStore {
  jobs: Job[];
  filters: JobFilters;
  savedJobs: Set<string>;
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  savedPresets: FilterPreset[];
  fetchJobs: (filters?: JobFilters) => Promise<void>;
  toggleSave: (jobId: string) => void;
  removeJob: (jobId: string) => Promise<void>;
  applyToJob: (jobId: string, proposal: ProposalPayload) => Promise<void>;
  setFilters: (filters: Partial<JobFilters>) => void;
  savePreset: (name: string) => void;
  loadPreset: (preset: FilterPreset) => void;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  filters: { page: 1, pageSize: 12, mediaFilter: 'ALL' },
  savedJobs: new Set<string>(),
  isLoading: false,
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  savedPresets: [],

  fetchJobs: async (filters) => {
    const existing = get().filters;
    const nextFilters = { ...existing, ...(filters ?? {}) };
    set({ isLoading: true, filters: nextFilters });

    try {
      const { savedJobs } = get();
      const page = Math.max(0, (nextFilters.page ?? 1) - 1);
      const size = Math.max(1, nextFilters.pageSize ?? 12);
      const primaryCategoryId = nextFilters.categories?.[0];
      const result = await listOpenJobsPage({
        page,
        size,
        q: nextFilters.search,
        categoryId: primaryCategoryId,
        sortBy: nextFilters.sortBy,
        skills: nextFilters.skills,
        mediaFilter: nextFilters.mediaFilter && nextFilters.mediaFilter !== 'ALL' ? nextFilters.mediaFilter : undefined,
      });

      let mapped = result.items.map((job) => mapApiJobToUiJob(job, savedJobs));

      if (nextFilters.categories?.length) {
        mapped = mapped.filter((job) => {
          const category = job.category;
          if (!category) return false;
          return nextFilters.categories!.some((categoryId) => (
            category === categoryId || category.startsWith(`${categoryId}.`)
          ));
        });
      }
      if (nextFilters.jobType) mapped = mapped.filter((job) => job.budget.type === nextFilters.jobType);
      if (nextFilters.experienceLevel) mapped = mapped.filter((job) => job.experienceLevel === nextFilters.experienceLevel);
      if (nextFilters.isRemote !== undefined) mapped = mapped.filter((job) => job.isRemote === nextFilters.isRemote);
      if (nextFilters.employerVerified) mapped = mapped.filter((job) => job.employerVerified);
      if (nextFilters.savedOnly) mapped = mapped.filter((job) => savedJobs.has(job.id));
      const budgetMin = nextFilters.budgetMin;
      if (budgetMin !== undefined) mapped = mapped.filter((job) => job.budget.max >= budgetMin);
      const budgetMax = nextFilters.budgetMax;
      if (budgetMax !== undefined) mapped = mapped.filter((job) => job.budget.min <= budgetMax);
      if (nextFilters.mediaFilter === 'VISUAL') {
        mapped = mapped.filter((job) => (job.sampleImageUrls?.length ?? 0) > 0 || (job.sampleVideoUrls?.length ?? 0) > 0);
      }
      if (nextFilters.mediaFilter === 'VIDEO') {
        mapped = mapped.filter((job) => (job.sampleVideoUrls?.length ?? 0) > 0);
      }
      if (nextFilters.mediaFilter === 'DOCUMENT') {
        mapped = mapped.filter((job) => (job.sampleDocumentUrls?.length ?? 0) > 0);
      }

      set({
        jobs: mapped,
        totalCount: result.total,
        totalPages: result.totalPages,
        currentPage: result.page + 1,
        hasNextPage: result.hasNext,
        hasPreviousPage: result.hasPrevious,
        isLoading: false,
      });
    } catch (error) {
      set({
        jobs: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        isLoading: false,
      });
      toast.error('Failed to load jobs from backend');
    }
  },

  toggleSave: (jobId) => {
    const wasSaved = get().savedJobs.has(jobId);
    set((state) => {
      const next = new Set(state.savedJobs);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      const jobs = state.jobs.map((j) => j.id === jobId ? { ...j, isSaved: next.has(jobId) } : j);
      return { savedJobs: next, jobs };
    });
    // Fire-and-forget API sync
    import('@/lib/api').then(({ api }) => {
      api.post('/jobs/saved', { jobId, saved: !wasSaved }).catch(() => {});
    }).catch(() => {});
  },

  removeJob: async (jobId) => {
    try {
      await deleteJobApi(jobId);
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== jobId),
        totalCount: Math.max(0, state.totalCount - 1),
      }));
      toast.success('Job removed successfully');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  },

  applyToJob: async (jobId, proposal) => {
    await submitJobProposal(jobId, proposal);
    toast.success('Application submitted successfully!');
    set((state) => ({
      jobs: state.jobs.map((j) => j.id === jobId ? { ...j, applicantCount: j.applicantCount + 1 } : j),
    }));
  },

  setFilters: (filters) => {
    const merged = { ...get().filters, ...filters };
    // Validate budget range
    if (merged.budgetMin !== undefined && merged.budgetMax !== undefined && merged.budgetMin > merged.budgetMax) {
      toast.error('Budget minimum cannot exceed maximum');
      return;
    }
    set({ filters: merged });
  },

  savePreset: (name) => {
    const { filters } = get();
    const preset: FilterPreset = { id: `preset-${Date.now()}`, name, filters: { ...filters } };
    set((state) => ({ savedPresets: [...state.savedPresets, preset] }));
    toast.success(`Filter preset "${name}" saved`);
  },

  loadPreset: (preset) => {
    set({ filters: { ...preset.filters } });
    toast.success(`Loaded preset "${preset.name}"`);
  },
}));
