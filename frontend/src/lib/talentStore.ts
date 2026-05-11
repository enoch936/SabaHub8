import { create } from 'zustand';
import type { FreelancerProfile, AvailabilityStatus } from '@/lib/types';

export interface TalentFilters {
  search?: string;
  skills?: string[];
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  availability?: AvailabilityStatus;
}

const MOCK_FREELANCERS: FreelancerProfile[] = [
  { id: 'FL001', userId: 'U001', displayName: 'Alice Chen', title: 'Senior Full-Stack Developer', bio: 'Passionate full-stack developer with 8+ years building scalable web applications. Specialized in React, Node.js, and cloud architecture.', skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL'], hourlyRate: 85, rating: 4.9, reviewCount: 127, isVerified: true, availability: 'AVAILABLE', completedJobs: 89, successRate: 98, tiers: { basic: { price: 500, description: 'Simple landing page', deliveryDays: 3 }, standard: { price: 1500, description: 'Full web app', deliveryDays: 7 }, premium: { price: 4000, description: 'Enterprise solution', deliveryDays: 21 } }, portfolio: [{ id: 'P1', title: 'E-commerce Platform', description: 'Built a full-stack e-commerce platform with React and Node.js', tags: ['React', 'Node.js'] }, { id: 'P2', title: 'Analytics Dashboard', description: 'Real-time analytics dashboard with WebSocket integration', tags: ['React', 'WebSocket'] }], timezone: 'UTC-5', languages: ['English', 'Mandarin'] },
  { id: 'FL002', userId: 'U002', displayName: 'Bob Martinez', title: 'UI/UX Designer & Brand Strategist', bio: 'Creative designer with a passion for user-centered design. I help startups and enterprises create beautiful, intuitive digital experiences.', skills: ['Figma', 'UI Design', 'UX Research', 'Branding', 'Prototyping'], hourlyRate: 65, rating: 4.8, reviewCount: 94, isVerified: true, availability: 'BUSY', completedJobs: 72, successRate: 96, tiers: { basic: { price: 300, description: 'Logo design', deliveryDays: 2 }, standard: { price: 900, description: 'Brand identity', deliveryDays: 5 }, premium: { price: 2500, description: 'Full design system', deliveryDays: 14 } }, portfolio: [{ id: 'P3', title: 'Mobile App Redesign', description: 'Complete redesign of a fintech mobile app', tags: ['Figma', 'Mobile'] }], timezone: 'UTC+1', languages: ['English', 'Spanish'] },
  { id: 'FL003', userId: 'U003', displayName: 'Carol Smith', title: 'Data Scientist & ML Engineer', bio: 'Data scientist specializing in machine learning and predictive analytics. I turn complex data into actionable business insights.', skills: ['Python', 'Machine Learning', 'TensorFlow', 'pandas', 'SQL'], hourlyRate: 95, rating: 4.7, reviewCount: 58, isVerified: true, availability: 'AVAILABLE', completedJobs: 45, successRate: 94, tiers: { basic: { price: 800, description: 'Data analysis report', deliveryDays: 5 }, standard: { price: 2000, description: 'ML model development', deliveryDays: 14 }, premium: { price: 5000, description: 'Full ML pipeline', deliveryDays: 30 } }, portfolio: [{ id: 'P4', title: 'Churn Prediction Model', description: 'Built ML model achieving 94% accuracy for customer churn prediction', tags: ['Python', 'ML'] }], timezone: 'UTC+0', languages: ['English'] },
  { id: 'FL004', userId: 'U004', displayName: 'David Lee', title: 'DevOps & Cloud Infrastructure Engineer', bio: 'DevOps engineer with expertise in AWS, Kubernetes, and CI/CD pipelines. I help teams ship faster and more reliably.', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'], hourlyRate: 110, rating: 4.9, reviewCount: 41, isVerified: false, availability: 'AVAILABLE', completedJobs: 33, successRate: 100, tiers: { basic: { price: 600, description: 'Docker setup', deliveryDays: 2 }, standard: { price: 2000, description: 'K8s cluster setup', deliveryDays: 7 }, premium: { price: 6000, description: 'Full cloud migration', deliveryDays: 30 } }, portfolio: [{ id: 'P5', title: 'Microservices Migration', description: 'Migrated monolith to microservices on AWS EKS', tags: ['AWS', 'Kubernetes'] }], timezone: 'UTC+9', languages: ['English', 'Korean'] },
  { id: 'FL005', userId: 'U005', displayName: 'Emma Wilson', title: 'Content Writer & SEO Specialist', bio: 'Professional content writer with expertise in technical writing, SEO optimization, and content strategy for B2B SaaS companies.', skills: ['Technical Writing', 'SEO', 'Content Strategy', 'Copywriting', 'WordPress'], hourlyRate: 45, rating: 4.6, reviewCount: 203, isVerified: true, availability: 'OFFLINE', completedJobs: 156, successRate: 92, tiers: { basic: { price: 150, description: '2 blog posts', deliveryDays: 3 }, standard: { price: 500, description: '8 blog posts + SEO', deliveryDays: 7 }, premium: { price: 1200, description: 'Full content strategy', deliveryDays: 14 } }, portfolio: [{ id: 'P6', title: 'SaaS Blog Growth', description: 'Grew organic traffic by 300% in 6 months through content strategy', tags: ['SEO', 'Content'] }], timezone: 'UTC-8', languages: ['English'] },
  { id: 'FL006', userId: 'U006', displayName: 'Frank Okonkwo', title: 'Mobile Developer (iOS & Android)', bio: 'Cross-platform mobile developer specializing in React Native and Flutter. I build beautiful, performant apps for both iOS and Android.', skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'], hourlyRate: 75, rating: 4.8, reviewCount: 67, isVerified: true, availability: 'AVAILABLE', completedJobs: 54, successRate: 97, tiers: { basic: { price: 1000, description: 'Simple app screen', deliveryDays: 5 }, standard: { price: 3000, description: 'Full mobile app', deliveryDays: 21 }, premium: { price: 8000, description: 'Enterprise mobile app', deliveryDays: 45 } }, portfolio: [{ id: 'P7', title: 'Fitness Tracking App', description: 'Cross-platform fitness app with 50k+ downloads', tags: ['React Native', 'Firebase'] }], timezone: 'UTC+1', languages: ['English', 'Yoruba'] },
];

interface TalentState {
  freelancers: FreelancerProfile[];
  isLoading: boolean;
  filters: TalentFilters;
  fetchFreelancers: () => Promise<void>;
  setFilters: (f: Partial<TalentFilters>) => void;
  filteredFreelancers: () => FreelancerProfile[];
}

export const useTalentStore = create<TalentState>((set, get) => ({
  freelancers: [],
  isLoading: false,
  filters: {},

  fetchFreelancers: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 600));
    set({ freelancers: MOCK_FREELANCERS, isLoading: false });
  },

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

  filteredFreelancers: () => {
    const { freelancers, filters } = get();
    return freelancers.filter((f) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          f.displayName.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.skills.some((s) => s.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filters.skills && filters.skills.length > 0) {
        const hasAll = filters.skills.every((sk) =>
          f.skills.some((s) => s.toLowerCase().includes(sk.toLowerCase()))
        );
        if (!hasAll) return false;
      }
      if (filters.minRate !== undefined && f.hourlyRate < filters.minRate) return false;
      if (filters.maxRate !== undefined && f.hourlyRate > filters.maxRate) return false;
      if (filters.minRating !== undefined && f.rating < filters.minRating) return false;
      if (filters.availability && f.availability !== filters.availability) return false;
      return true;
    });
  },
}));
