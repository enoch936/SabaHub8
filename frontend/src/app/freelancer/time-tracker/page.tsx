'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  StopCircle,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

interface TimeEntry {
  id: string;
  contractId: string;
  projectTitle: string;
  taskName: string;
  description: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  status: string;
}

interface Contract {
  id: string;
  projectTitle: string;
  hourlyRate: number;
}

export default function TimeTracker() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [selectedContract, setSelectedContract] = useState('');
  const [taskName, setTaskName] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchContracts();
    fetchTimeEntries();
  }, []);

  useEffect(() => {
    if (activeEntry) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeEntry.startTime).getTime();
        const now = Date.now();
        setCurrentTime(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setCurrentTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeEntry]);

  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/freelancer/contracts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.filter((c: Contract) => c.projectTitle.includes('HOURLY')));
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const res = await fetch('/api/freelancer/time', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTimeEntries(data);
        const active = data.find((e: TimeEntry) => !e.endTime);
        setActiveEntry(active || null);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const startTimer = async () => {
    if (!selectedContract || !taskName) {
      alert('Please select a contract and enter a task name');
      return;
    }

    try {
      const res = await fetch('/api/freelancer/time/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contractId: selectedContract,
          taskName
        })
      });

      if (res.ok) {
        const entry = await res.json();
        setActiveEntry(entry);
        setTaskName('');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      const res = await fetch(`/api/freelancer/time/${activeEntry.id}/stop`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        setActiveEntry(null);
        fetchTimeEntries();
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const submitEntries = async (entryIds: string[]) => {
    try {
      const res = await fetch('/api/freelancer/time/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(entryIds)
      });

      if (res.ok) {
        fetchTimeEntries();
      }
    } catch (error) {
      console.error('Error submitting entries:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDraftHours = timeEntries
    .filter(e => e.status === 'DRAFT')
    .reduce((sum, e) => sum + e.hours, 0);

  const totalDraftAmount = timeEntries
    .filter(e => e.status === 'DRAFT')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracker</h1>
          <p className="text-gray-600">Track your billable hours accurately</p>
        </motion.div>

        {/* Active Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white"
        >
          {activeEntry ? (
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-7xl font-bold mb-4 font-mono"
              >
                {formatTime(currentTime)}
              </motion.div>
              <p className="text-2xl font-semibold mb-2">{activeEntry.taskName}</p>
              <p className="text-blue-100 mb-6">
                ${activeEntry.hourlyRate}/hour • Started {new Date(activeEntry.startTime).toLocaleTimeString()}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="px-8 py-4 bg-white text-red-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
              >
                <StopCircle className="w-6 h-6" />
                Stop Timer
              </motion.button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-6">Start New Timer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="px-4 py-3 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="">Select Contract</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.projectTitle} (${contract.hourlyRate}/hr)
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="What are you working on?"
                  className="px-4 py-3 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startTimer}
                disabled={!selectedContract || !taskName}
                className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6" />
                Start Tracking
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-600">Draft Hours</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalDraftHours.toFixed(2)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-600">Draft Amount</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalDraftAmount.toFixed(2)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const draftIds = timeEntries.filter(e => e.status === 'DRAFT').map(e => e.id);
                if (draftIds.length > 0) submitEntries(draftIds);
              }}
              disabled={totalDraftHours === 0}
              className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              <CheckCircle className="w-8 h-8" />
              <span>Submit All</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Time Entries List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Time Entries</h2>

          <div className="space-y-4">
            {timeEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border-2 ${
                  entry.status === 'DRAFT'
                    ? 'bg-gray-50 border-gray-200'
                    : entry.status === 'SUBMITTED'
                    ? 'bg-yellow-50 border-yellow-200'
                    : entry.status === 'APPROVED'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{entry.taskName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        entry.status === 'DRAFT'
                          ? 'bg-gray-200 text-gray-700'
                          : entry.status === 'SUBMITTED'
                          ? 'bg-yellow-200 text-yellow-800'
                          : entry.status === 'APPROVED'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{entry.projectTitle}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(entry.startTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {entry.hours.toFixed(2)} hours
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${entry.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {entry.status === 'DRAFT' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => submitEntries([entry.id])}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Submit
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
