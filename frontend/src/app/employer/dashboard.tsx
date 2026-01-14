'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import Link from 'next/link';

const EmployerDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchProjects();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/employer/analytics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/employer/projects?page=0&size=10', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];

  const StatCard = ({ icon, title, value, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
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
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Employer Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back! Here's your hiring overview
            </p>
          </div>
          <Link href="/employer/post-project">
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              + Post New Project
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Active Projects"
          value={analytics?.activeProjects || 0}
          color="text-indigo-600"
          icon="📊"
          trend={12}
        />
        <StatCard
          title="Total Hired"
          value={analytics?.totalHired || 0}
          color="text-pink-600"
          icon="👥"
          trend={8}
        />
        <StatCard
          title="Completed Projects"
          value={analytics?.completedProjects || 0}
          color="text-green-600"
          icon="✓"
          trend={5}
        />
        <StatCard
          title="Total Spent"
          value={`$${(analytics?.totalSpent || 0).toFixed(0)}`}
          color="text-amber-600"
          icon="💰"
          trend={15}
        />
        <StatCard
          title="Avg. Rating"
          value={`${(analytics?.averageRating || 0).toFixed(1)}/5`}
          color="text-blue-600"
          icon="⭐"
          trend={3}
        />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-4 border-b border-gray-200 dark:border-gray-700">
        {['overview', 'projects', 'finances', 'team'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Spending Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Spending Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.activityOverTime || []}>
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Skills Breakdown
            </h3>
            <div className="space-y-3">
              {analytics?.topSkillsRequested?.slice(0, 5).map((skill, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-pink-600"
                      style={{ width: `${(5 - idx) * 20}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {projects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </motion.div>
      )}

      {/* Finances Tab */}
      {activeTab === 'finances' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
            <p className="text-gray-600 dark:text-gray-400">Manage your payment methods and billing</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Transaction History</h3>
            <p className="text-gray-600 dark:text-gray-400">View all your payments and transactions</p>
          </div>
        </motion.div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Freelancers</h3>
          <p className="text-gray-600 dark:text-gray-400">Manage your favorite freelancers and team</p>
        </motion.div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{project.title}</h4>
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            project.status === 'OPEN' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {project.status}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Budget: ${project.budget}</span>
        </div>
      </div>
      <Link href={`/employer/projects/${project.id}`}>
        <button className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
          View
        </button>
      </Link>
    </div>
    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{project.description}</p>
  </motion.div>
);

export default EmployerDashboard;
