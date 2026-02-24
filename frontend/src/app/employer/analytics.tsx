'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface AnalyticsData {
  totalSpent: number;
  projectsPosted: number;
  activeContracts: number;
  completedProjects: number;
  successRate: number;
  averageRating: number;
  monthlySpend: Array<{ month: string; amount: number }>;
  categoryBreakdown: Record<string, number>;
  performanceMetrics: {
    onTimeDeliveryRate: number;
    averageProjectDuration: number;
    freelancerRetentionRate: number;
    projectSuccessRate: number;
  };
  topSkillsRequested: Array<{ skill: string; count: number }>;
  spendingTrends: Array<{ week: string; amount: number }>;
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('3months');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/employer/analytics?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <p className="text-center text-gray-600 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e'];

  type StatCardProps = {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    subtitle?: string;
    trend?: number;
    color: string;
  };

  const StatCard = ({ title, value, icon, subtitle, trend, color }: StatCardProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`text-4xl ${color} opacity-20`}>{icon}</div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Your hiring performance and spending insights</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard
          title="Total Spent"
          value={`$${analytics.totalSpent.toLocaleString()}`}
          icon="💰"
          color="text-indigo-600"
          trend={12}
        />
        <StatCard
          title="Projects Posted"
          value={analytics.projectsPosted}
          icon="📊"
          color="text-pink-600"
          trend={5}
        />
        <StatCard
          title="Active Contracts"
          value={analytics.activeContracts}
          icon="📝"
          color="text-blue-600"
          trend={3}
        />
        <StatCard
          title="Completed Projects"
          value={analytics.completedProjects}
          icon="✅"
          color="text-green-600"
          trend={8}
        />
        <StatCard
          title="Success Rate"
          value={`${analytics.successRate.toFixed(1)}%`}
          icon="🎯"
          color="text-amber-600"
        />
        <StatCard
          title="Average Rating"
          value={`${analytics.averageRating.toFixed(1)}/5`}
          icon="⭐"
          color="text-yellow-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Spending */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Monthly Spending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.monthlySpend}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(analytics.categoryBreakdown).map(([name, value]) => ({
                  name,
                  value
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(analytics.categoryBreakdown).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Spending Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Weekly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.spendingTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Skills */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Skills Requested</h3>
          <div className="space-y-4">
            {analytics.topSkillsRequested.map((skill, idx) => (
              <motion.div
                key={skill.skill}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">{skill.skill}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{skill.count} projects</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(skill.count / (analytics.topSkillsRequested[0]?.count || 1)) * 100}%`
                    }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-pink-600"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">On-Time Delivery</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-green-600">{analytics.performanceMetrics.onTimeDeliveryRate.toFixed(1)}%</p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-green-600"
                style={{ width: `${analytics.performanceMetrics.onTimeDeliveryRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg. Project Duration</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-blue-600">
              {analytics.performanceMetrics.averageProjectDuration.toFixed(0)} days
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Average completion time</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Freelancer Retention</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-purple-600">{analytics.performanceMetrics.freelancerRetentionRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Repeat hires</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Project Success Rate</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-indigo-600">{analytics.performanceMetrics.projectSuccessRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Completed successfully</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
