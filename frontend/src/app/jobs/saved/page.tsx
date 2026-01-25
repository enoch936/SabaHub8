'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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
  status: string;
  closingDate: string;
}

interface SavedJob {
  jobId: string;
  savedAt: string;
  notes?: string;
}

export default function SavedJobsPage() {
  const router = useRouter();

  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, open, closing-soon
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load saved job IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedJobs');
    if (saved) {
      const ids = JSON.parse(saved);
      setSavedJobIds(ids);
      fetchJobDetails(ids);
    } else {
      setLoading(false);
    }

    // Load notes
    const savedNotes = localStorage.getItem('jobNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Fetch job details
  const fetchJobDetails = async (jobIds: string[]) => {
    try {
      const jobPromises = jobIds.map(id => axios.get(`/api/jobs/${id}`));
      const responses = await Promise.all(jobPromises);
      setJobs(responses.map(r => r.data));
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove from saved
  const handleRemoveSaved = (jobId: string) => {
    const updated = savedJobIds.filter(id => id !== jobId);
    setSavedJobIds(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  // Save note
  const handleSaveNote = (jobId: string, note: string) => {
    const updated = { ...notes, [jobId]: note };
    setNotes(updated);
    localStorage.setItem('jobNotes', JSON.stringify(updated));
    setEditingId(null);
  };

  // Delete note
  const handleDeleteNote = (jobId: string) => {
    const updated = { ...notes };
    delete updated[jobId];
    setNotes(updated);
    localStorage.setItem('jobNotes', JSON.stringify(updated));
  };

  // Filter jobs
  const getFilteredJobs = () => {
    const now = new Date();
    return jobs.filter(job => {
      if (filterStatus === 'open') return job.status === 'OPEN';
      if (filterStatus === 'closing-soon') {
        const closingDate = new Date(job.closingDate);
        const daysUntilClosing = Math.floor((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilClosing <= 7 && daysUntilClosing > 0;
      }
      return true;
    });
  };

  const filteredJobs = getFilteredJobs();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Saved Jobs</h1>
              <p className="text-gray-600 mt-2">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} saved</p>
            </div>
            <button
              onClick={() => router.push('/jobs/advanced-search')}
              className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Browse More Jobs
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">♥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved jobs yet</h3>
            <p className="text-gray-600 mb-6">Start saving jobs to keep track of opportunities you're interested in.</p>
            <button
              onClick={() => router.push('/jobs/advanced-search')}
              className="inline-block py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Explore Jobs
            </button>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              {[
                { value: 'all', label: 'All', icon: '📋' },
                { value: 'open', label: 'Open', icon: '🟢' },
                { value: 'closing-soon', label: 'Closing Soon', icon: '⏰' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition ${
                    filterStatus === tab.value
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const closingDate = new Date(job.closingDate);
                const now = new Date();
                const daysUntilClosing = Math.floor((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isClosingSoon = daysUntilClosing <= 7 && daysUntilClosing > 0;

                return (
                  <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Main Content */}
                      <div className="lg:col-span-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveSaved(job.id)}
                            className="text-2xl text-red-500 hover:text-red-600 ml-4 flex-shrink-0"
                          >
                            ♥
                          </button>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                            {job.deliverableType}
                          </span>
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                            {job.engagementType}
                          </span>
                          {isClosingSoon && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium animate-pulse">
                              Closing in {daysUntilClosing} days
                            </span>
                          )}
                        </div>

                        {/* Key Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div>
                            <p className="font-medium text-gray-900">${job.budgetMin?.toLocaleString()}</p>
                            <p className="text-xs">Min Budget</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">${job.budgetMax?.toLocaleString()}</p>
                            <p className="text-xs">Max Budget</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{job.slaDeliveryDays} days</p>
                            <p className="text-xs">Delivery Timeline</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{job.minYearsExperience}+ years</p>
                            <p className="text-xs">Experience</p>
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {editingId === job.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={notes[job.id] || ''}
                                onChange={(e) => setNotes({ ...notes, [job.id]: e.target.value })}
                                placeholder="Add your notes about this job..."
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveNote(job.id, notes[job.id] || '')}
                                  className="py-1 px-3 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Save Note
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="py-1 px-3 bg-gray-300 text-gray-900 rounded text-sm hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : notes[job.id] ? (
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                              <p className="font-medium text-gray-900 mb-1">Your note:</p>
                              <p className="mb-2">{notes[job.id]}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingId(job.id)}
                                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(job.id)}
                                  className="text-red-600 hover:text-red-700 text-xs font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingId(job.id)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              + Add Note
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Sidebar - Actions */}
                      <div className="lg:col-span-1 flex flex-col gap-3">
                        <button
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-center"
                        >
                          View Full Details
                        </button>
                        <button
                          onClick={() => router.push(`/jobs/${job.id}#apply`)}
                          className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-center"
                        >
                          Apply Now
                        </button>
                        <div className="text-xs text-gray-500 text-center pt-2">
                          Saved {new Date().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredJobs.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600">No jobs match this filter. Try adjusting your selection.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
