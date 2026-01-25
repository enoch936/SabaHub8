'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

interface SearchFilter {
  deliverableType?: string;
  engagementType?: string;
  budgetMin?: number;
  budgetMax?: number;
  minYearsExperience?: number;
  requiredSkills?: string[];
  industry?: string[];
  pricingModel?: string;
  teamSize?: string[];
  sortBy?: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilter;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  deliverableType: string;
  engagementType: string;
  budgetMin: number;
  budgetMax: number;
  slaDeliveryDays: number;
  minYearsExperience: number;
  requiredSkills: string[];
  industry: string[];
}

export default function AdvancedJobSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [filters, setFilters] = useState<SearchFilter>({
    deliverableType: searchParams.get('deliverable') || '',
    engagementType: searchParams.get('engagement') || '',
    budgetMin: searchParams.get('budgetMin') ? parseInt(searchParams.get('budgetMin')!) : undefined,
    budgetMax: searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : undefined,
    minYearsExperience: searchParams.get('experience') ? parseInt(searchParams.get('experience')!) : undefined,
    requiredSkills: searchParams.get('skills')?.split(',') || [],
    industry: searchParams.get('industry')?.split(',') || [],
    pricingModel: searchParams.get('pricing') || '',
    teamSize: searchParams.get('teamSize')?.split(',') || [],
    sortBy: searchParams.get('sort') || 'newest',
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  // Fetch jobs
  const fetchJobs = async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: pageNum, size: 12 };
      if (filters.deliverableType) params.deliverableType = filters.deliverableType;
      if (filters.engagementType) params.engagementType = filters.engagementType;
      if (filters.pricingModel) params.pricingModel = filters.pricingModel;
      if (filters.requiredSkills && filters.requiredSkills.length) params.skills = filters.requiredSkills.join(',');
      if (filters.industry && filters.industry.length) params.industry = filters.industry.join(',');
      if (filters.teamSize && filters.teamSize.length) params.teamSize = filters.teamSize.join(',');
      if (filters.budgetMin) params.budgetMin = filters.budgetMin;
      if (filters.budgetMax) params.budgetMax = filters.budgetMax;
      if (filters.minYearsExperience) params.minYearsExperience = filters.minYearsExperience;
      if (filters.sortBy) params.sort = filters.sortBy;

      const response = await axios.get('/api/v2/jobs/search', { params });
      setJobs(response.data.content || response.data);
      setTotalResults(response.data.totalElements || (response.data.content ? response.data.content.length : 0));
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load saved searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }

    const jobsSaved = localStorage.getItem('savedJobs');
    if (jobsSaved) {
      setSavedJobs(JSON.parse(jobsSaved));
    }

    // Fetch initial jobs
    fetchJobs();
  }, []);

  // Update URL on filter change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.deliverableType) params.set('deliverable', filters.deliverableType);
    if (filters.engagementType) params.set('engagement', filters.engagementType);
    if (filters.budgetMin) params.set('budgetMin', filters.budgetMin.toString());
    if (filters.budgetMax) params.set('budgetMax', filters.budgetMax.toString());
    if (filters.minYearsExperience) params.set('experience', filters.minYearsExperience.toString());
    if (filters.requiredSkills.length) params.set('skills', filters.requiredSkills.join(','));
    if (filters.industry.length) params.set('industry', filters.industry.join(','));
    if (filters.pricingModel) params.set('pricing', filters.pricingModel);
    if (filters.teamSize.length) params.set('teamSize', filters.teamSize.join(','));
    if (filters.sortBy) params.set('sort', filters.sortBy);

    router.push(`?${params.toString()}`, { scroll: false });
    setPage(0);
    fetchJobs(0);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save current search
  const handleSaveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
    setSearchName('');
    setShowSaveSearch(false);
  };

  // Load saved search
  const handleLoadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
  };

  // Delete saved search
  const handleDeleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  // Toggle saved job
  const handleToggleSaveJob = (jobId: string) => {
    let updated = [...savedJobs];
    if (updated.includes(jobId)) {
      updated = updated.filter(id => id !== jobId);
    } else {
      updated.push(jobId);
    }
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      deliverableType: '',
      engagementType: '',
      budgetMin: undefined,
      budgetMax: undefined,
      minYearsExperience: undefined,
      requiredSkills: [],
      industry: [],
      pricingModel: '',
      teamSize: [],
      sortBy: 'newest',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Advanced Job Search</h1>
          <p className="text-gray-600 mt-2">Find your perfect opportunities</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Advanced Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Deliverable Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Deliverable Type</label>
                <select
                  value={filters.deliverableType || ''}
                  onChange={(e) => handleFilterChange('deliverableType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="IMAGE_DESIGN">Image Design</option>
                  <option value="VIDEO_PRODUCTION">Video Production</option>
                  <option value="AUDIO_PRODUCTION">Audio Production</option>
                  <option value="DOCUMENT_DEVELOPMENT">Document Development</option>
                  <option value="MIXED">Mixed Media</option>
                </select>
              </div>

              {/* Engagement Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Engagement Type</label>
                <select
                  value={filters.engagementType || ''}
                  onChange={(e) => handleFilterChange('engagementType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="PROJECT_BASED">Project Based</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="LONG_TERM_PARTNERSHIP">Long-term Partnership</option>
                  <option value="RETAINER">Retainer</option>
                </select>
              </div>

              {/* Budget Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Budget Range (USD)</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.budgetMin || ''}
                    onChange={(e) => handleFilterChange('budgetMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.budgetMax || ''}
                    onChange={(e) => handleFilterChange('budgetMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Min Years Experience</label>
                <input
                  type="number"
                  value={filters.minYearsExperience || ''}
                  onChange={(e) => handleFilterChange('minYearsExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Pricing Model */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Pricing Model</label>
                <select
                  value={filters.pricingModel || ''}
                  onChange={(e) => handleFilterChange('pricingModel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Models</option>
                  <option value="FIXED_PRICE">Fixed Price</option>
                  <option value="HOURLY">Hourly</option>
                  <option value="RETAINER">Retainer</option>
                  <option value="VOLUME_BASED">Volume Based</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="highest-budget">Highest Budget</option>
                  <option value="lowest-budget">Lowest Budget</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              {/* Save Search */}
              <button
                onClick={() => setShowSaveSearch(!showSaveSearch)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
              >
                {showSaveSearch ? 'Cancel' : 'Save This Search'}
              </button>

              {showSaveSearch && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Search name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveSearch}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
                  >
                    Save
                  </button>
                </div>
              )}

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved Searches</h3>
                  <div className="space-y-2">
                    {savedSearches.map((search) => (
                      <div key={search.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                        <button
                          onClick={() => handleLoadSavedSearch(search)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex-1 text-left truncate"
                        >
                          {search.name}
                        </button>
                        <button
                          onClick={() => handleDeleteSavedSearch(search.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {totalResults} {totalResults === 1 ? 'Result' : 'Results'}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Showing {Math.min(page * 12 + 1, totalResults)} - {Math.min((page + 1) * 12, totalResults)} jobs
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow animate-pulse p-4 h-96" />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <>
                {/* Job Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {job.title}
                        </h3>
                        <button
                          onClick={() => handleToggleSaveJob(job.id)}
                          className={`text-2xl ${savedJobs.includes(job.id) ? 'text-red-500' : 'text-gray-300'} hover:text-red-500`}
                        >
                          ♥
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {job.deliverableType}
                        </span>
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {job.engagementType}
                        </span>
                      </div>

                      {/* Budget */}
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          ${job.budgetMin?.toLocaleString()} - ${job.budgetMax?.toLocaleString()}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>📅 {job.slaDeliveryDays} days delivery</p>
                        <p>👤 {job.minYearsExperience}+ years experience</p>
                        <p>🎯 {job.requiredSkills?.length || 0} skills required</p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={() => fetchJobs(page - 1)}
                    disabled={page === 0}
                    className="py-2 px-4 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  <span className="text-gray-600 font-medium">
                    Page {page + 1}
                  </span>

                  <button
                    onClick={() => fetchJobs(page + 1)}
                    disabled={(page + 1) * 12 >= totalResults}
                    className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
