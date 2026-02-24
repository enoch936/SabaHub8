'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

interface Job {
  id: string;
  title: string;
  description: string;
  overviewText: string;
  engagementType: string;
  deliverableType: string;
  deliverableScopes: string[];
  budgetMin: number;
  budgetMax: number;
  currency: string;
  slaDeliveryDays: number;
  maxConcurrentProjects: number;
  includedRevisionRounds: number;
  qualityStandards: string[];
  requiredFormats: string[];
  minYearsExperience: number;
  requiredSkills: string[];
  requiredTools: string[];
  requiredQualifications: string[];
  preferredExperience: string[];
  requiresPortfolio: boolean;
  requiresReferences: boolean;
  minReferenceCount: number;
  requiresNDA: boolean;
  complianceRequirements: string[];
  pilotProjectRequired: boolean;
  pilotProjectScope: string;
  preferredVendorOpportunity: boolean;
  minimumMonthlyCommitment: number;
  contractTermMonths: number;
  rateStabilityGuarantee: boolean;
  evaluationProcess: string;
  closingDate: string;
  createdAt: string;
  status: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeJobId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeJobId) {
      setError('Invalid job ID');
      setLoading(false);
      return;
    }

    fetchJob(routeJobId);
  }, [routeJobId]);

  const fetchJob = async (jobId: string) => {
    try {
      const response = await axios.get(`/api/jobs/${encodeURIComponent(jobId)}`);
      setJob(response.data);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const status = requestError.response?.status;
        if (status === 404) {
          setError('Job not found');
          return;
        }
        if (status === 400) {
          setError('Invalid job ID');
          return;
        }
      }
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Job not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">{job.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-medium">
              {job.deliverableType.replace(/_/g, ' ')}
            </span>
            <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full font-medium">
              {job.engagementType.replace(/_/g, ' ')}
            </span>
            <span className="inline-block bg-purple-100 text-purple-800 px-4 py-1 rounded-full font-medium">
              {job.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {job.overviewText && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-gray-700 whitespace-pre-line">{job.overviewText}</p>
              </section>
            )}

            {/* Scope of Work */}
            {job.deliverableScopes && job.deliverableScopes.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Scope of Work</h2>
                <ul className="space-y-2">
                  {job.deliverableScopes.map((scope, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{scope}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Description */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Project Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </section>

            {/* Quality Standards */}
            {job.qualityStandards && job.qualityStandards.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Quality Standards</h2>
                <ul className="space-y-2">
                  {job.qualityStandards.map((standard, idx) => (
                    <li key={idx} className="text-gray-700">• {standard}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Required Qualifications */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Required Qualifications</h2>
              
              {job.minYearsExperience && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Experience</h3>
                  <p className="text-gray-700">Minimum {job.minYearsExperience} years of professional experience</p>
                </div>
              )}

              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.requiredTools && job.requiredTools.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Required Tools</h3>
                  <ul className="space-y-1">
                    {job.requiredTools.map((tool, idx) => (
                      <li key={idx} className="text-gray-700">• {tool}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Evaluation Process */}
            {job.evaluationProcess && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Evaluation Process</h2>
                <p className="text-gray-700">{job.evaluationProcess}</p>
                
                {job.requiresPortfolio && (
                  <p className="mt-2 text-gray-700">📁 Portfolio required</p>
                )}
                {job.requiresReferences && (
                  <p className="text-gray-700">👥 References required (minimum {job.minReferenceCount})</p>
                )}
                {job.pilotProjectRequired && (
                  <p className="text-gray-700">✓ Pilot project required</p>
                )}
              </section>
            )}

            {/* Compliance & Requirements */}
            {(job.requiresNDA || (job.complianceRequirements && job.complianceRequirements.length > 0)) && (
              <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-yellow-900">Compliance & Requirements</h2>
                {job.requiresNDA && (
                  <p className="text-yellow-800 mb-2">🔒 NDA required</p>
                )}
                {job.complianceRequirements && job.complianceRequirements.length > 0 && (
                  <div>
                    <p className="font-semibold text-yellow-900 mb-2">Compliance Standards:</p>
                    <ul className="space-y-1">
                      {job.complianceRequirements.map((req, idx) => (
                        <li key={idx} className="text-yellow-800">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Long-Term Opportunity */}
            {job.preferredVendorOpportunity && (
              <section className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-green-900">Preferred Vendor Opportunity</h2>
                <p className="text-green-800 mb-2">
                  This engagement offers potential for long-term partnership with guaranteed work opportunities
                </p>
                {job.minimumMonthlyCommitment && (
                  <p className="text-green-800">Minimum monthly commitment: {job.minimumMonthlyCommitment} hours/projects</p>
                )}
                {job.contractTermMonths && (
                  <p className="text-green-800">Contract term: {job.contractTermMonths} months</p>
                )}
                {job.rateStabilityGuarantee && (
                  <p className="text-green-800">✓ Rate stability guaranteed for contract duration</p>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4 space-y-6">
              {/* Budget */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Budget</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${job.budgetMin?.toLocaleString() || 'TBD'} - ${job.budgetMax?.toLocaleString() || 'TBD'}
                </p>
                <p className="text-sm text-gray-600">{job.currency}</p>
              </div>

              {/* Timeline */}
              {job.slaDeliveryDays && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Timeline</h3>
                  <p className="text-lg font-semibold">{job.slaDeliveryDays} days</p>
                </div>
              )}

              {/* Capacity */}
              {job.maxConcurrentProjects && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Capacity</h3>
                  <p className="text-gray-700">Up to {job.maxConcurrentProjects} concurrent projects</p>
                </div>
              )}

              {/* Revisions */}
              {job.includedRevisionRounds && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Revision Rounds</h3>
                  <p className="text-gray-700">{job.includedRevisionRounds} rounds included</p>
                </div>
              )}

              {/* Closing Date */}
              {job.closingDate && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Application Deadline</h3>
                  <p className="text-gray-700">{new Date(job.closingDate).toLocaleDateString()}</p>
                </div>
              )}

              {/* Apply Button */}
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
                Submit Application
              </button>

              {/* Posted Date */}
              <p className="text-xs text-gray-500 text-center">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
