'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Proposal {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerRating: number;
  freelancerReviewCount: number;
  bidAmount: number;
  currency: string;
  bidDuration: string;
  coverLetter: string;
  attachments: string[];
  status: 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';
  submittedAt: string;
  freelancerExperience: number;
  freelancerSkills: string[];
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
}

const ProposalReview = ({ projectId }: { projectId: string }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'price'>('recent');
  const [shortlistedProposals, setShortlistedProposals] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProposals();
    fetchProjectDetails();
  }, [projectId]);

  const fetchProposals = async () => {
    try {
      const response = await fetch(`/api/employer/projects/${projectId}/proposals`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setProposals(data.data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/api/employer/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjectDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async (proposalId: string) => {
    try {
      const response = await fetch(
        `/api/employer/projects/${projectId}/shortlist/${proposals.find(p => p.id === proposalId)?.freelancerId}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        setShortlistedProposals(prev => new Set([...prev, proposalId]));
        setProposals(prev =>
          prev.map(p => p.id === proposalId ? { ...p, status: 'SHORTLISTED' } : p)
        );
      }
    } catch (error) {
      console.error('Error shortlisting proposal:', error);
    }
  };

  const handleHire = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      window.location.href = `/employer/contracts/create?projectId=${projectId}&freelancerId=${proposal.freelancerId}`;
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      const response = await fetch(
        `/api/employer/projects/${projectId}/proposals/${proposalId}/reject`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        setProposals(prev =>
          prev.map(p => p.id === proposalId ? { ...p, status: 'REJECTED' } : p)
        );
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
    }
  };

  const filteredProposals = proposals
    .filter(p => filterStatus === 'ALL' || p.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'rating') return b.freelancerRating - a.freelancerRating;
      if (sortBy === 'price') return a.bidAmount - b.bidAmount;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <Link href={`/employer/projects/${projectId}`}>
          <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors">
            ← Back to Project
          </button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {projectDetails?.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {filteredProposals.length} proposal{filteredProposals.length !== 1 ? 's' : ''} received
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* List View */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Filters & Sort */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Proposals</option>
              <option value="PENDING">Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="REJECTED">Rejected</option>
              <option value="ACCEPTED">Accepted</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>

          {/* Proposals List */}
          <AnimatePresence>
            {filteredProposals.map((proposal, idx) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                index={idx}
                onSelect={() => {
                  setSelectedProposal(proposal);
                  setViewMode('detail');
                }}
                onShortlist={() => handleShortlist(proposal.id)}
                onHire={() => handleHire(proposal.id)}
                onReject={() => handleReject(proposal.id)}
                isShortlisted={shortlistedProposals.has(proposal.id) || proposal.status === 'SHORTLISTED'}
              />
            ))}
          </AnimatePresence>

          {filteredProposals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-600 dark:text-gray-400">No proposals found</p>
            </motion.div>
          )}
        </motion.div>

        {/* Detail Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 20 }}
          className="lg:col-span-1"
        >
          <AnimatePresence mode="wait">
            {selectedProposal ? (
              <ProposalDetail
                key={selectedProposal.id}
                proposal={selectedProposal}
                onClose={() => setSelectedProposal(null)}
                onShortlist={() => handleShortlist(selectedProposal.id)}
                onHire={() => handleHire(selectedProposal.id)}
                onReject={() => handleReject(selectedProposal.id)}
                isShortlisted={shortlistedProposals.has(selectedProposal.id) || selectedProposal.status === 'SHORTLISTED'}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center"
              >
                <p className="text-gray-600 dark:text-gray-400">Select a proposal to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

const ProposalCard = ({
  proposal,
  index,
  onSelect,
  onShortlist,
  onHire,
  onReject,
  isShortlisted,
}: {
  proposal: Proposal;
  index: number;
  onSelect: () => void;
  onShortlist: () => void;
  onHire: () => void;
  onReject: () => void;
  isShortlisted: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ delay: index * 0.1 }}
    onClick={onSelect}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg cursor-pointer transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
          {proposal.freelancerName.charAt(0)}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white">{proposal.freelancerName}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>⭐ {proposal.freelancerRating.toFixed(1)}</span>
            <span>•</span>
            <span>{proposal.freelancerReviewCount} reviews</span>
            <span>•</span>
            <span>{proposal.freelancerExperience}y exp</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          ${proposal.bidAmount}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.bidDuration}</p>
      </div>
    </div>

    <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">{proposal.coverLetter}</p>

    <div className="flex items-center justify-between">
      <div className="flex gap-2 flex-wrap">
        {proposal.freelancerSkills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold"
          >
            {skill}
          </span>
        ))}
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        proposal.status === 'SHORTLISTED' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' :
        proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
        proposal.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      }`}>
        {proposal.status}
      </span>
    </div>
  </motion.div>
);

const ProposalDetail = ({
  proposal,
  onClose,
  onShortlist,
  onHire,
  onReject,
  isShortlisted,
}: {
  proposal: Proposal;
  onClose: () => void;
  onShortlist: () => void;
  onHire: () => void;
  onReject: () => void;
  isShortlisted: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-8"
  >
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {proposal.freelancerName.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{proposal.freelancerName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">⭐ {proposal.freelancerRating.toFixed(1)} ({proposal.freelancerReviewCount})</p>
        </div>
      </div>
    </div>

    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Bid Amount</p>
        <p className="text-3xl font-bold text-indigo-600">${proposal.bidAmount}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.bidDuration}</p>
      </div>

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cover Letter</p>
        <p className="text-gray-900 dark:text-white text-sm leading-relaxed">{proposal.coverLetter}</p>
      </div>

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Skills</p>
        <div className="flex flex-wrap gap-2">
          {proposal.freelancerSkills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full text-xs font-semibold"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-6 space-y-2 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onHire}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          Hire
        </motion.button>
        {!isShortlisted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShortlist}
            className="w-full px-4 py-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-semibold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
          >
            Shortlist
          </motion.button>
        )}
        {proposal.status !== 'REJECTED' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReject}
            className="w-full px-4 py-3 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 font-semibold rounded-lg transition-colors"
          >
            Reject
          </motion.button>
        )}
      </div>
    </div>
  </motion.div>
);

export default ProposalReview;
