'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: number;
  percentage: number;
  dueDate: string;
  deliverables: string[];
  status: 'PENDING' | 'RELEASED' | 'COMPLETED';
}

interface ContractTerms {
  projectId: string;
  freelancerId: string;
  title: string;
  description: string;
  workType: 'FIXED_PRICE' | 'HOURLY';
  contractType: 'ONE_TIME' | 'ONGOING';
  totalAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}

const ContractBuilder = ({
  projectId,
  freelancerId,
}: {
  projectId: string;
  freelancerId: string;
}) => {
  const [step, setStep] = useState(0);
  const [contract, setContract] = useState<ContractTerms>({
    projectId,
    freelancerId,
    title: '',
    description: '',
    workType: 'FIXED_PRICE',
    contractType: 'ONE_TIME',
    totalAmount: 0,
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    milestones: [],
  });
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    id: '',
    name: '',
    description: '',
    amount: 0,
    dueDate: '',
    deliverables: [],
  });
  const [currentDeliverable, setCurrentDeliverable] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = [
    { name: 'Terms', icon: '📋' },
    { name: 'Milestones', icon: '🎯' },
    { name: 'Review', icon: '✅' }
  ];

  const handleFieldChange = (field: string, value: any) => {
    setContract(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name || !newMilestone.amount || !newMilestone.dueDate) return;

    const percentage = ((newMilestone.amount as number) / contract.totalAmount) * 100;

    const milestone: Milestone = {
      id: Date.now().toString(),
      name: newMilestone.name || '',
      description: newMilestone.description || '',
      amount: newMilestone.amount || 0,
      percentage: parseFloat(percentage.toFixed(2)),
      dueDate: newMilestone.dueDate || '',
      deliverables: newMilestone.deliverables || [],
      status: 'PENDING'
    };

    setContract(prev => ({
      ...prev,
      milestones: [...prev.milestones, milestone]
    }));

    setNewMilestone({
      id: '',
      name: '',
      description: '',
      amount: 0,
      dueDate: '',
      deliverables: [],
    });
  };

  const handleRemoveMilestone = (id: string) => {
    setContract(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }));
  };

  const addDeliverable = () => {
    if (currentDeliverable.trim()) {
      setNewMilestone(prev => ({
        ...prev,
        deliverables: [...(prev.deliverables || []), currentDeliverable]
      }));
      setCurrentDeliverable('');
    }
  };

  const removeDeliverable = (idx: number) => {
    setNewMilestone(prev => ({
      ...prev,
      deliverables: prev.deliverables?.filter((_, i) => i !== idx) || []
    }));
  };

  const totalMilestoneAmount = contract.milestones.reduce((sum, m) => sum + m.amount, 0);
  const remainingAmount = contract.totalAmount - totalMilestoneAmount;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employer/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(contract)
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = `/employer/contracts/${data.data.id}`;
      }
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-12"
      >
        <Link href={`/employer/projects/${projectId}`}>
          <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors">
            ← Back to Project
          </button>
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Create Contract</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Set up terms, milestones, and payments
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto mb-12"
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
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                  Contract Terms
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Contract Title *
                    </label>
                    <input
                      type="text"
                      placeholder="E.g., React Dashboard Development"
                      value={contract.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Description *
                    </label>
                    <textarea
                      placeholder="Describe the scope of work..."
                      value={contract.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Work Type *
                      </label>
                      <select
                        value={contract.workType}
                        onChange={(e) => handleFieldChange('workType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="FIXED_PRICE">Fixed Price</option>
                        <option value="HOURLY">Hourly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Contract Type *
                      </label>
                      <select
                        value={contract.contractType}
                        onChange={(e) => handleFieldChange('contractType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="ONE_TIME">One-time Project</option>
                        <option value="ONGOING">Ongoing/Retainer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Total Amount *
                      </label>
                      <div className="flex items-center">
                        <span className="text-gray-600 dark:text-gray-400 mr-3">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={contract.totalAmount || ''}
                          onChange={(e) => handleFieldChange('totalAmount', parseFloat(e.target.value) || 0)}
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Currency
                      </label>
                      <select
                        value={contract.currency}
                        onChange={(e) => handleFieldChange('currency', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="ETB">ETB</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={contract.startDate}
                        onChange={(e) => handleFieldChange('startDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={contract.endDate}
                        onChange={(e) => handleFieldChange('endDate', e.target.value)}
                        min={contract.startDate}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
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
                  Define Milestones
                </h2>

                {/* Milestone List */}
                <div className="mb-8 space-y-3">
                  {contract.milestones.map((milestone, idx) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">{milestone.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.description}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveMilestone(milestone.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${milestone.percentage}%` }}
                              className="bg-indigo-600 h-2 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${milestone.amount} ({milestone.percentage.toFixed(1)}%)
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {milestone.deliverables.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">Deliverables:</p>
                          <div className="flex flex-wrap gap-1">
                            {milestone.deliverables.map((d, i) => (
                              <span key={i} className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {remainingAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg mb-6"
                  >
                    <p className="text-amber-800 dark:text-amber-200 font-semibold">
                      Remaining: ${remainingAmount.toFixed(2)}
                    </p>
                  </motion.div>
                )}

                {/* Add Milestone Form */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">Add Milestone</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Milestone Name *
                      </label>
                      <input
                        type="text"
                        placeholder="E.g., Design Mockups"
                        value={newMilestone.name || ''}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Description
                      </label>
                      <textarea
                        placeholder="What needs to be completed..."
                        value={newMilestone.description || ''}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Amount *
                        </label>
                        <div className="flex items-center">
                          <span className="text-gray-600 dark:text-gray-400 mr-2">$</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            max={remainingAmount}
                            value={newMilestone.amount || ''}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Due Date *
                        </label>
                        <input
                          type="date"
                          value={newMilestone.dueDate || ''}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                          min={contract.startDate}
                          max={contract.endDate}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Deliverables
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add deliverable..."
                          value={currentDeliverable}
                          onChange={(e) => setCurrentDeliverable(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addDeliverable()}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          onClick={addDeliverable}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {newMilestone.deliverables && newMilestone.deliverables.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newMilestone.deliverables.map((d, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full text-sm"
                            >
                              {d}
                              <button
                                onClick={() => removeDeliverable(i)}
                                className="text-lg hover:text-indigo-900 dark:hover:text-indigo-100"
                              >
                                ×
                              </button>
                            </motion.span>
                          ))}
                        </div>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddMilestone}
                      disabled={!newMilestone.name || !newMilestone.amount || !newMilestone.dueDate || newMilestone.amount > remainingAmount}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Add Milestone
                    </motion.button>
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
                  Review Contract
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Title</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{contract.title}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {contract.currency} ${contract.totalAmount}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Work Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{contract.workType}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                    <p className="text-gray-900 dark:text-white">{contract.description}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-4">Milestones ({contract.milestones.length})</p>
                    <div className="space-y-3">
                      {contract.milestones.map((milestone, idx) => (
                        <div key={milestone.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-indigo-600">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">{idx + 1}. {milestone.name}</h4>
                            <span className="text-lg font-bold text-indigo-600">
                              ${milestone.amount} ({milestone.percentage}%)
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{milestone.description}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
            >
              ← Previous
            </motion.button>

            {step === steps.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={loading || !contract.title || !contract.description || contract.milestones.length === 0}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all"
              >
                {loading ? 'Creating...' : 'Create Contract'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && contract.milestones.length === 0}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all"
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

export default ContractBuilder;
