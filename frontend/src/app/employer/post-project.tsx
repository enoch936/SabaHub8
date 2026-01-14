'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface ProjectData {
  title: string;
  description: string;
  category: string;
  budgetType: 'FIXED_PRICE' | 'HOURLY';
  budget: number;
  hourlyRate: number;
  requiredSkills: string[];
  experienceLevel: string;
  duration: string;
  projectScope: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  deadline: string;
}

const ProjectPostingWizard = () => {
  const [step, setStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    category: '',
    budgetType: 'FIXED_PRICE',
    budget: 0,
    hourlyRate: 0,
    requiredSkills: [],
    experienceLevel: 'INTERMEDIATE',
    duration: '',
    projectScope: 'MEDIUM',
    visibility: 'PUBLIC',
    deadline: '',
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = [
    { name: 'Basic Info', icon: '📝' },
    { name: 'Budget & Details', icon: '💰' },
    { name: 'Skills & Requirements', icon: '🎯' },
    { name: 'Review', icon: '✅' }
  ];

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 0) setStep(step - 1);
  };

  const validateStep = () => {
    if (step === 0) {
      return projectData.title.trim().length >= 5 && projectData.description.trim().length >= 20;
    }
    if (step === 1) {
      return projectData.budget > 0 && projectData.deadline;
    }
    if (step === 2) {
      return projectData.requiredSkills.length > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employer/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = `/employer/projects/${data.data.id}`;
      }
    } catch (error) {
      console.error('Error posting project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !projectData.requiredSkills.includes(currentSkill)) {
      setProjectData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, currentSkill]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProjectData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-12"
      >
        <Link href="/employer/dashboard">
          <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors">
            ← Back to Dashboard
          </button>
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Post a New Project</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Find the perfect freelancer for your project
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto mb-12"
      >
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <motion.div
                animate={{
                  scale: step === idx ? 1.2 : 1,
                  backgroundColor: step >= idx ? '#6366f1' : '#e5e7eb'
                }}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold cursor-pointer transition-all"
                onClick={() => idx < step && setStep(idx)}
              >
                {s.icon}
              </motion.div>
              <div className="ml-3">
                <p className={`font-semibold transition-colors ${
                  step >= idx ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {s.name}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <motion.div
                  animate={{
                    scaleX: step > idx ? 1 : 0.5,
                    backgroundColor: step > idx ? '#6366f1' : '#e5e7eb'
                  }}
                  className="flex-1 h-1 mx-4 rounded origin-left transition-all"
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Tell us about your project
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      placeholder="E.g., Build a React Dashboard"
                      value={projectData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum 5 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Project Description *
                    </label>
                    <textarea
                      placeholder="Describe your project in detail..."
                      value={projectData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum 20 characters. Be clear about what you need
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Category *
                      </label>
                      <select
                        value={projectData.category}
                        onChange={(e) => handleFieldChange('category', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select Category</option>
                        <option value="WEB_DEVELOPMENT">Web Development</option>
                        <option value="MOBILE">Mobile Development</option>
                        <option value="DESIGN">Design</option>
                        <option value="WRITING">Writing</option>
                        <option value="MARKETING">Marketing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Experience Level *
                      </label>
                      <select
                        value={projectData.experienceLevel}
                        onChange={(e) => handleFieldChange('experienceLevel', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="EXPERT">Expert</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Set your budget
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                      Budget Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['FIXED_PRICE', 'HOURLY'].map((type) => (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleFieldChange('budgetType', type)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            projectData.budgetType === type
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {type === 'FIXED_PRICE' ? 'Fixed Price' : 'Hourly Rate'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {type === 'FIXED_PRICE' ? 'Total project cost' : 'Cost per hour'}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      {projectData.budgetType === 'FIXED_PRICE' ? 'Total Budget' : 'Hourly Rate'} *
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-600 dark:text-gray-400 mr-3">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={projectData.budgetType === 'FIXED_PRICE' ? projectData.budget : projectData.hourlyRate}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (projectData.budgetType === 'FIXED_PRICE') {
                            handleFieldChange('budget', value);
                          } else {
                            handleFieldChange('hourlyRate', value);
                          }
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Project Deadline *
                    </label>
                    <input
                      type="date"
                      value={projectData.deadline}
                      onChange={(e) => handleFieldChange('deadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Project Scope *
                    </label>
                    <select
                      value={projectData.projectScope}
                      onChange={(e) => handleFieldChange('projectScope', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="SMALL">Small (Less than a week)</option>
                      <option value="MEDIUM">Medium (1-4 weeks)</option>
                      <option value="LARGE">Large (More than a month)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Required skills
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Add Skills *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="E.g., React, Node.js, MongoDB"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addSkill}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Add
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Add at least 1 skill. Press Enter or click Add
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Selected Skills ({projectData.requiredSkills.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {projectData.requiredSkills.map((skill, idx) => (
                        <motion.div
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full"
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-lg hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Project Visibility
                    </label>
                    <select
                      value={projectData.visibility}
                      onChange={(e) => handleFieldChange('visibility', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="PUBLIC">Public - Visible to all freelancers</option>
                      <option value="PRIVATE">Private - Only invited freelancers</option>
                      <option value="INVITE_ONLY">Invite Only - You select who sees it</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Review your project
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Title</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{projectData.title}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{projectData.category}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${projectData.budgetType === 'FIXED_PRICE' ? projectData.budget : projectData.hourlyRate}
                        {projectData.budgetType === 'HOURLY' && '/hr'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Deadline</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(projectData.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                    <p className="text-gray-900 dark:text-white">{projectData.description}</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {projectData.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full text-sm font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevious}
              disabled={step === 0}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </motion.button>

            {step === steps.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Publishing...' : 'Publish Project'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!validateStep()}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectPostingWizard;
