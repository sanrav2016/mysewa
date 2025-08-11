import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotification();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        addNotification('success', 'Email Sent', 'If an account with that email exists, a password reset link has been sent.', false);
      } else {
        addNotification('error', 'Error', data.message || 'Failed to send reset email', false);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      addNotification('error', 'Error', 'Failed to send reset email. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
                Check Your Email
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                We've sent a password reset link to your email address.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm">
                <p className="mb-2">
                  <strong>What's next?</strong>
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the reset link in the email</li>
                  <li>• Create a new password</li>
                  <li>• Sign in with your new password</li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                >
                  Try again
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg hover:scale-105 transition-all">
              <img src="/sewa_bird_white.svg" className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
              Forgot Password?
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all text-sm"
                placeholder="Enter your email address"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 