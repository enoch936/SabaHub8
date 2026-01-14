'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  Send,
  CheckCircle,
  TrendingUp,
  Star,
  Award
} from 'lucide-react';

interface FreelancerAnalytics {
  totalEarnings: number;
  currentBalance: number;
  pendingBalance: number;
  completedProjects: number;
  activeProjects: number;
  totalProposals: number;
  acceptedProposals: number;
  successRate: number;
  rating: number;
  reviewCount: number;
  jobSuccessScore: number;
  monthlyEarnings: Array<{ month: string; amount: number; projectCount: number }>;
  topProjects: Array<{ projectTitle: string; earnings: number; status: string; rating: number }>;
}

interface Contract {
  id: string;
  projectTitle: string;
  employerName: string;
  status: string;
  totalAmount: number;
  startDate: string;
  deadline: string;
  workType: string;
}

interface Proposal {
  id: string;
  projectTitle: string;
  bidAmount: number;
  status: string;
  submittedAt: string;
}

export default function FreelancerDashboard() {
  const [analytics, setAnalytics] = useState<FreelancerAnalytics | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, contractsRes, proposalsRes] = await Promise.all([
        fetch('/api/freelancer/analytics', { credentials: 'include' }),
        fetch('/api/freelancer/contracts', { credentials: 'include' }),
        fetch('/api/freelancer/proposals', { credentials: 'include' })
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (proposalsRes.ok) setProposals(await proposalsRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Earnings',
      value: `$${analytics?.totalEarnings.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      change: '+12.5%'
    },
    {
      title: 'Current Balance',
      value: `$${analytics?.currentBalance.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      change: '+$2,450'
    },
    {
      title: 'Active Projects',
      value: analytics?.activeProjects || 0,
      icon: Briefcase,
      color: 'from-purple-500 to-pink-600',
      change: `${analytics?.completedProjects || 0} completed`
    },
    {
      title: 'Success Rate',
      value: `${analytics?.successRate.toFixed(1) || 0}%`,
      icon: CheckCircle,
      color: 'from-orange-500 to-red-600',
      change: `${analytics?.rating.toFixed(1) || 0}⭐ rating`
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Freelancer Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back! Here's your performance overview
              </p>
            </div>
            <Link href="/freelancer/projects/search">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Find Projects
                </span>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative overflow-hidden bg-white rounded-2xl shadow-lg p-6"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Active Contracts
            </h2>
            <Link href="/freelancer/contracts">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                View All →
              </span>
            </Link>
          </div>

          <div className="space-y-4">
            {contracts.filter(c => c.status === 'ACTIVE').slice(0, 3).map((contract, index) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ x: 5 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {contract.projectTitle.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{contract.projectTitle}</h3>
                    <p className="text-sm text-gray-600">{contract.employerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${contract.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{contract.workType}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Proposals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              Recent Proposals
            </h2>
            <Link href="/freelancer/proposals">
              <span className="text-purple-600 hover:text-purple-700 font-medium">
                View All →
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proposals.slice(0, 3).map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{proposal.projectTitle}</h3>
                <p className="text-2xl font-bold text-purple-600 mb-2">
                  ${proposal.bidAmount.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full ${
                    proposal.status === 'ACCEPTED'
                      ? 'bg-green-100 text-green-700'
                      : proposal.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {proposal.status}
                  </span>
                  <span className="text-gray-600">
                    {new Date(proposal.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { title: 'Profile', icon: User, link: '/freelancer/profile', color: 'blue' },
            { title: 'Time Tracker', icon: Clock, link: '/freelancer/time-tracker', color: 'green' },
            { title: 'Invoices', icon: FileText, link: '/freelancer/invoices', color: 'purple' },
            { title: 'Earnings', icon: DollarSign, link: '/freelancer/earnings', color: 'orange' }
          ].map((action, index) => (
            <Link key={action.title} href={action.link}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`p-6 bg-gradient-to-br from-${action.color}-500 to-${action.color}-600 rounded-2xl shadow-lg hover:shadow-xl text-white cursor-pointer`}
              >
                <action.icon className="w-8 h-8 mb-3" />
                <h3 className="text-lg font-bold">{action.title}</h3>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
