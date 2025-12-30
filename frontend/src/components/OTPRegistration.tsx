'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * OTP Registration Component
 * Enterprise-level registration with email and SMS OTP verification
 */
export default function OTPRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'registration' | 'otp-verification'>('registration');
  
  // Step 1: Registration Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Step 2: OTP Verification
  const [otpData, setOtpData] = useState({
    emailOTP: '',
    smsOTP: '',
  });

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Handle registration form input
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle OTP input
  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow digits, max 6
    if (/^\d{0,6}$/.test(value)) {
      setOtpData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
        toast.error('Please fill all fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      // Request OTP from backend
      const response = await fetch('/api/auth/otp/request-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP sent to your email and phone');
        setOtpSent(true);
        setCurrentStep('otp-verification');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email OTP
  const handleVerifyEmailOTP = async () => {
    setLoading(true);

    try {
      if (!otpData.emailOTP) {
        toast.error('Please enter email OTP');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/otp/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otpCode: otpData.emailOTP,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Email verified successfully!');
        return true;
      } else {
        toast.error(data.message || 'Invalid email OTP');
        return false;
      }
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      toast.error('An error occurred during email verification');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify SMS OTP
  const handleVerifySMSOTP = async () => {
    setLoading(true);

    try {
      if (!otpData.smsOTP) {
        toast.error('Please enter SMS OTP');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/otp/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otpCode: otpData.smsOTP,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Phone verified successfully!');
        return true;
      } else {
        toast.error(data.message || 'Invalid SMS OTP');
        return false;
      }
    } catch (error) {
      console.error('Error verifying SMS OTP:', error);
      toast.error('An error occurred during SMS verification');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Complete registration
  const handleCompleteRegistration = async () => {
    setLoading(true);

    try {
      // Verify both OTPs first
      const emailVerified = await handleVerifyEmailOTP();
      if (!emailVerified) {
        setLoading(false);
        return;
      }

      const smsVerified = await handleVerifySMSOTP();
      if (!smsVerified) {
        setLoading(false);
        return;
      }

      // Complete registration
      const response = await fetch('/api/auth/register-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emailOTP: otpData.emailOTP,
          smsOTP: otpData.smsOTP,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Registration successful! Logging you in...');
        // Redirect to dashboard or login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error completing registration:', error);
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP resent successfully');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">SabaHub</h1>
          <p className="text-gray-600 mt-2">Secure Registration</p>
        </div>

        {currentStep === 'registration' ? (
          // Step 1: Registration Form
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number (+1234567890)"
              value={formData.phoneNumber}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Continue & Send OTP'}
            </button>
          </form>
        ) : (
          // Step 2: OTP Verification
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 font-semibold mb-4">
                ✉️ Email OTP (Check your email)
              </p>
              <input
                type="text"
                name="emailOTP"
                placeholder="Enter 6-digit code"
                value={otpData.emailOTP}
                onChange={handleOTPChange}
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <p className="text-gray-700 font-semibold mb-4">
                📱 SMS OTP (Check your phone)
              </p>
              <input
                type="text"
                name="smsOTP"
                placeholder="Enter 6-digit code"
                value={otpData.smsOTP}
                onChange={handleOTPChange}
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleCompleteRegistration}
              disabled={loading || otpData.emailOTP.length !== 6 || otpData.smsOTP.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2"
            >
              Resend OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep('registration');
                setOtpData({ emailOTP: '', smsOTP: '' });
              }}
              className="w-full text-gray-600 hover:text-gray-700 font-semibold py-2"
            >
              ← Back to Registration
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-semibold">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
