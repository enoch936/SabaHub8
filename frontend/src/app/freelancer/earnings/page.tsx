'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  X,
  Send
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FreelancerAnalytics {
  totalEarnings: number;
  currentBalance: number;
  pendingBalance: number;
  completedProjects: number;
  monthlyEarnings: Array<{ month: string; amount: number; projectCount: number }>;
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: string;
  status: string;
  requestedAt: string;
  expectedArrivalDate?: string;
  completedAt?: string;
}

export default function EarningsPage() {
  const [analytics, setAnalytics] = useState<FreelancerAnalytics | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');
  const [accountDetails, setAccountDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    swiftCode: ''
  });

  useEffect(() => {
    fetchAnalytics();
    fetchWithdrawals();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/freelancer/analytics', { credentials: 'include' });
      if (res.ok) setAnalytics(await res.json());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/freelancer/withdrawals', { credentials: 'include' });
      if (res.ok) setWithdrawals(await res.json());
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const requestWithdrawal = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (analytics && parseFloat(withdrawAmount) > analytics.currentBalance) {
      alert('Insufficient balance');
      return;
    }

    try {
      const res = await fetch('/api/freelancer/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          currency: 'USD',
          paymentMethod,
          ...accountDetails
        })
      });

      if (res.ok) {
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchAnalytics();
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
    }
  };

  const calculateFee = (amount: number) => amount * 0.025;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Earnings & Withdrawals</h1>
              <p className="text-gray-600 mt-2">Manage your finances and track payments</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWithdrawModal(true)}
              disabled={!analytics || analytics.currentBalance === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowDownCircle className="w-5 h-5" />
              Withdraw Funds
            </motion.button>
          </div>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Available Balance',
              value: `$${analytics?.currentBalance.toLocaleString() || 0}`,
              icon: DollarSign,
              color: 'from-green-500 to-emerald-600',
              subtitle: 'Ready to withdraw'
            },
            {
              title: 'Pending Balance',
              value: `$${analytics?.pendingBalance.toLocaleString() || 0}`,
              icon: Clock,
              color: 'from-yellow-500 to-orange-600',
              subtitle: 'In escrow'
            },
            {
              title: 'Total Earnings',
              value: `$${analytics?.totalEarnings.toLocaleString() || 0}`,
              icon: TrendingUp,
              color: 'from-blue-500 to-purple-600',
              subtitle: `${analytics?.completedProjects || 0} projects`
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative overflow-hidden bg-white rounded-2xl shadow-lg p-6"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`} />
              <div className="relative">
                <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl w-fit mb-4`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-sm text-gray-500">{card.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Earnings</h2>
          <div className="h-80">
            {analytics?.monthlyEarnings && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="url(#colorGradient)" radius={[10, 10, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Withdrawal History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdrawal History</h2>

          <div className="space-y-4">
            {withdrawals.map((withdrawal, index) => (
              <motion.div
                key={withdrawal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border-2 ${
                  withdrawal.status === 'COMPLETED'
                    ? 'bg-green-50 border-green-200'
                    : withdrawal.status === 'PENDING'
                    ? 'bg-yellow-50 border-yellow-200'
                    : withdrawal.status === 'PROCESSING'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      withdrawal.status === 'COMPLETED'
                        ? 'bg-green-500'
                        : withdrawal.status === 'PENDING'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}>
                      {withdrawal.paymentMethod === 'BANK_TRANSFER' ? (
                        <Building2 className="w-6 h-6 text-white" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          ${withdrawal.amount.toLocaleString()}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          withdrawal.status === 'COMPLETED'
                            ? 'bg-green-200 text-green-800'
                            : withdrawal.status === 'PENDING'
                            ? 'bg-yellow-200 text-yellow-800'
                            : withdrawal.status === 'PROCESSING'
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {withdrawal.paymentMethod} • Fee: ${withdrawal.fee.toFixed(2)} • Net: ${withdrawal.netAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Requested: {new Date(withdrawal.requestedAt).toLocaleDateString()}
                        {withdrawal.expectedArrivalDate && ` • Expected: ${new Date(withdrawal.expectedArrivalDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  {withdrawal.status === 'COMPLETED' && (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  )}
                </div>
              </motion.div>
            ))}

            {withdrawals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <ArrowDownCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No withdrawals yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Withdraw Funds</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-600">
                      Available: ${analytics?.currentBalance.toLocaleString() || 0}
                    </span>
                    {withdrawAmount && (
                      <span className="text-gray-600">
                        Fee (2.5%): ${calculateFee(parseFloat(withdrawAmount)).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {withdrawAmount && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-semibold">
                        You will receive: ${(parseFloat(withdrawAmount) - calculateFee(parseFloat(withdrawAmount))).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {['STRIPE', 'BANK_TRANSFER', 'PAYPAL'].map((method) => (
                      <motion.button
                        key={method}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                          paymentMethod === method
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {method.replace('_', ' ')}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Bank Details (if Bank Transfer) */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      value={accountDetails.accountHolderName}
                      onChange={(e) => setAccountDetails({ ...accountDetails, accountHolderName: e.target.value })}
                      placeholder="Account Holder Name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={accountDetails.bankName}
                      onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                      placeholder="Bank Name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={accountDetails.accountNumber}
                      onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                      placeholder="Account Number"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={accountDetails.swiftCode}
                      onChange={(e) => setAccountDetails({ ...accountDetails, swiftCode: e.target.value })}
                      placeholder="SWIFT/BIC Code"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={requestWithdrawal}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Request Withdrawal
                </motion.button>

                <p className="text-sm text-gray-500 text-center">
                  Funds typically arrive within 3-5 business days
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
