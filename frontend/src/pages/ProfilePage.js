import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// API base URL - adjust if needed
const API_URL = 'http://localhost:5001';

const ProfilePage = () => {
  const { currentUser, getAuthHeaders, makeAuthenticatedRequest, updateCurrentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setIs2FAEnabled(currentUser.is_two_factor_enabled === true);
      console.log('Current user 2FA status:', currentUser.is_two_factor_enabled);
    }
  }, [currentUser]);

  // Fetch latest user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user_data = await makeAuthenticatedRequest('/api/auth/user', 'GET');
        updateCurrentUser(user_data.user);
        setIs2FAEnabled(user_data.user.is_two_factor_enabled === true);
        console.log('Updated 2FA status:', user_data.user.is_two_factor_enabled);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, []);
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    // Validate password match if changing password
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }
    
    try {
      const data = await makeAuthenticatedRequest('/api/auth/profile/update', 'PUT', {
        username,
        email,
        current_password: currentPassword,
        new_password: newPassword
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Update the current user in context
      if (data.user) {
        updateCurrentUser(data.user);
      }
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const data = await makeAuthenticatedRequest('/api/auth/generate-2fa', 'POST');
      setQrCode(data.qr_code);
      setShow2FAModal(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate 2FA code.' });
    }
  };

  const handleVerify2FA = async () => {
    try {
      await makeAuthenticatedRequest('/api/auth/verify-2fa', 'POST', { token: twoFactorToken });
      setShow2FAModal(false);
      setIs2FAEnabled(true);
      setMessage({ type: 'success', text: '2FA enabled successfully!' });
      // Refresh user data
      const user_data = await makeAuthenticatedRequest('/api/auth/user', 'GET');
      updateCurrentUser(user_data.user);
      // Clear the token
      setTwoFactorToken('');
    } catch (error) {
      console.error('Verify 2FA error:', error);
      setMessage({ type: 'error', text: error.message || 'Invalid 2FA token.' });
    }
  };

  const handleDisable2FA = async () => {
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password to disable 2FA.' });
      return;
    }
    try {
      await makeAuthenticatedRequest('/api/auth/disable-2fa', 'POST', { password: currentPassword });
      setIs2FAEnabled(false);
      setMessage({ type: 'success', text: '2FA disabled successfully!' });
      // Refresh user data
      const user_data = await makeAuthenticatedRequest('/api/auth/user', 'GET');
      updateCurrentUser(user_data.user);
      // Clear the password field
      setCurrentPassword('');
    } catch (error) {
      console.error('Disable 2FA error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to disable 2FA. Please check your password and try again.' });
    }
  };
  
  // Add a useEffect to clear messages after a delay
  useEffect(() => {
    let timeoutId;
    if (message.text) {
      timeoutId = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000); // Clear message after 5 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [message]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="glass-panel rounded-xl p-6 shadow-lg dark:shadow-dark-glow">
        <h1 className="text-2xl font-display font-bold gradient-text mb-6">Profile Settings</h1>
        
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent"
              required
            />
          </div>
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent"
              required
            />
          </div>
          
          {/* Password Change Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h2>
            
            {/* Current Password */}
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent"
              />
            </div>
            
            {/* New Password */}
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent"
              />
            </div>
            
            {/* Confirm New Password */}
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent"
              />
            </div>
          </div>
          
          {/* 2FA Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h2>
            <div className="flex items-center justify-between">
              <div className="flex-grow mr-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {is2FAEnabled 
                    ? 'Two-factor authentication is currently enabled.'
                    : 'Add an extra layer of security to your account by enabling two-factor authentication.'}
                </p>
              </div>
              <div className="flex-shrink-0">
                {is2FAEnabled ? (
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnable2FA}
                    className="w-full px-6 py-2 bg-futuristic-blue dark:bg-neon-blue text-white rounded-lg hover:bg-futuristic-blue/90 dark:hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:ring-offset-2 transition-colors"
                  >
                    Enable 2FA
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-2 rounded-lg text-white font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-futuristic-blue dark:bg-neon-blue hover:bg-futuristic-blue/90 dark:hover:bg-neon-blue/90'
              } focus:outline-none focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:ring-offset-2 transition-colors`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Set Up Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Scan this QR code with your authenticator app (like Google Authenticator or Authy)
            </p>
            {qrCode && (
              <div className="mb-4 flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="mb-4">
              <label htmlFor="twoFactorToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enter 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                id="twoFactorToken"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent"
                placeholder="000000"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShow2FAModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify2FA}
                className="px-4 py-2 text-sm font-medium text-white bg-futuristic-blue dark:bg-neon-blue rounded-md hover:bg-futuristic-blue/90 dark:hover:bg-neon-blue/90 transition-colors"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 