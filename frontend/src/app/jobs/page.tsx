'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

interface Job {
  id: string;
  title: string;
  description: string;
  engagementType: string;
  deliverableType: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  slaDeliveryDays: number;
  requiredSkills: string[];
  minYearsExperience: number;
  createdAt: string;
  status: string;
}

export default function JobListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    deliverableType: searchParams.get('type') || '',
    engagementType: '',
    pricingModel: '',
    industry: '',
    skills: '',
    budgetMin: '',
    budgetMax: '',
    minYearsExperience: '',
    enterpriseOnly: false,
  });

  useEffect(() => {
    fetchJobs();
  }, [page, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, size: 20 };
      if (filters.deliverableType) params.deliverableType = filters.deliverableType;
      if (filters.engagementType) params.engagementType = filters.engagementType;
      if (filters.pricingModel) params.pricingModel = filters.pricingModel;
      if (filters.industry) params.industry = filters.industry;
      if (filters.skills) params.skills = filters.skills;
      if (filters.budgetMin) params.budgetMin = filters.budgetMin;
      if (filters.budgetMax) params.budgetMax = filters.budgetMax;
      if (filters.minYearsExperience) params.minYearsExperience = filters.minYearsExperience;
      if (filters.enterpriseOnly) params.enterpriseOnly = filters.enterpriseOnly;

      const response = await axios.get('/api/v2/jobs/search', { params });
      setJobs(response.data.content || response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Job Listings</h1>
          <p className="mt-2 text-gray-600">Professional opportunities for studios, agencies, and vendors</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deliverable Type
                  </label>
                  <select
                    name="deliverableType"
                    value={filters.deliverableType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="IMAGE_DESIGN">Image & Design</option>
                    <option value="VIDEO_PRODUCTION">Video Production</option>
                    <option value="AUDIO_PRODUCTION">Audio Production</option>
                    <option value="DOCUMENT_DEVELOPMENT">Documents</option>
                    <option value="MIXED">Mixed Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Engagement Type
                  </label>
                  <select
                    name="engagementType"
                    value={filters.engagementType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="PROJECT_BASED">Project-Based</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="LONG_TERM_PARTNERSHIP">Long-Term</option>
                    <option value="RETAINER">Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="budgetMin"
                      placeholder="Min"
                      value={filters.budgetMin}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      name="budgetMax"
                      placeholder="Max"
                      value={filters.budgetMax}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. Experience (years)
                  </label>
                  <input
                    type="number"
                    name="minYearsExperience"
                    value={filters.minYearsExperience}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Model
                  </label>
                  <select
                    name="pricingModel"
                    value={filters.pricingModel}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Models</option>
                    <option value="FIXED_PRICE">Fixed Price</option>
                    <option value="HOURLY">Hourly Rate</option>
                    <option value="RETAINER">Retainer</option>
                    <option value="VOLUME_BASED">Volume-Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    placeholder="e.g. saas,finance"
                    value={filters.industry}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <input
                    type="text"
                    name="skills"
                    placeholder="e.g. photoshop,figma"
                    value={filters.skills}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="enterpriseOnly"
                      checked={filters.enterpriseOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, enterpriseOnly: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enterprise Only</span>
                  </label>
                </div>

                <button
                  onClick={() => setFilters({
                    deliverableType: '',
                    engagementType: '',
                    pricingModel: '',
                    industry: '',
                    skills: '',
                    budgetMin: '',
                    budgetMax: '',
                    minYearsExperience: '',
                    enterpriseOnly: false,
                  })}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-md"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No jobs found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{job.description}</p>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            {job.deliverableType.replace(/_/g, ' ')}
                          </span>
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                            {job.engagementType.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="mt-4 flex gap-4 text-sm text-gray-600">
                          <span>Budget: ${job.budgetMin?.toLocaleString() || 'TBD'} - ${job.budgetMax?.toLocaleString() || 'TBD'} {job.currency}</span>
                          <span>Delivery: {job.slaDeliveryDays} days</span>
                          {job.minYearsExperience && (
                            <span>Experience: {job.minYearsExperience}+ years</span>
                          )}
                        </div>

                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                            {job.requiredSkills.length > 3 && (
                              <span className="text-xs text-gray-600">+{job.requiredSkills.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <p className="text-xs text-gray-500">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {jobs.length > 0 && (
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">Page {page + 1}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
