import React, { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { user, loginWithToken } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + `/api/auth/verify-reset-token/${token}`);
        const data = await response.json();

        if (response.ok) {
          setIsValid(true);
        } else {
          setError(data.message || 'Invalid or expired reset token');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setError('Failed to validate reset token');
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setIsValidating(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      addNotification('error', 'Error', 'Passwords do not match', false);
      return;
    }

    if (newPassword.length < 6) {
      addNotification('error', 'Error', 'Password must be at least 6 characters long', false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        addNotification('success', 'Success', 'Password reset successfully! You have been automatically logged in.', false);
        // Automatically log in the user after successful password reset
        if (data.user && data.token) {
          loginWithToken(data.user, data.token);
        }
      } else {
        addNotification('error', 'Error', data.message || 'Failed to reset password', false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      addNotification('error', 'Error', 'Failed to reset password. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  // Early returns after all hooks
  if (user) {
    return <Navigate to="/" replace />;
  }

  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                Validating Reset Link
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Please wait while we verify your reset link...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
                Invalid Reset Link
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                {error}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                <p className="mb-2">
                  <strong>Possible reasons:</strong>
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• The link has expired (links expire after 3 hours)</li>
                  <li>• The link has already been used</li>
                  <li>• The link is invalid or corrupted</li>
                </ul>
              </div>

              <Link
                to="/forgot-password"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm text-center block"
              >
                Request New Reset Link
              </Link>

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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
                Password Reset Successfully!
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Your password has been updated and you have been automatically logged in.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                <p className="mb-2">
                  <strong>What's next?</strong>
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• Your password has been successfully updated</li>
                  <li>• You have been automatically logged in</li>
                  <li>• Check your notifications for security alerts</li>
                  <li>• The reset link has been deactivated for security</li>
                </ul>
              </div>

              <Link
                to="/"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm text-center block"
              >
                Go to Dashboard
              </Link>
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
              Reset Your Password
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all text-sm"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:scale-105 transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all text-sm"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:scale-105 transition-all"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
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