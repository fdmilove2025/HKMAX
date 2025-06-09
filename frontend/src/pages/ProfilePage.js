import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// API base URL - adjust if needed
const API_URL = 'http://localhost:5001';

const ProfilePage = () => {
  const { currentUser, getAuthHeaders, setCurrentUser, makeAuthenticatedRequest } = useAuth();
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
  const [is2FAEnabled, setIs2FAEnabled] = useState(currentUser?.is_two_factor_enabled || false);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setIs2FAEnabled(currentUser.is_two_factor_enabled || false);
    }
  }, [currentUser]);
  
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
      console.log('Sending profile update request...');
      // Make sure we're using the correct endpoint
      const endpoint = '/api/auth/profile/update';
      const url = `${API_URL}${endpoint}`;
      console.log('Using URL:', url);
      
      const requestData = {
        username,
        email,
        current_password: currentPassword,
        new_password: newPassword
      };
      console.log('Request data:', requestData);
      
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token);
      
      // Log the full request details
      console.log('Making request to:', url);
      console.log('With method:', 'PUT');
      console.log('With headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      });
      console.log('With body:', requestData);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Update the current user in context
      if (data.user) {
        setCurrentUser(data.user);
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
      setCurrentUser(user_data.user);
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid 2FA token.' });
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
       setCurrentUser(user_data.user);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disable 2FA. Check your password.' });
    }
  };
  
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication (2FA)</h2>
            {is2FAEnabled ? (
              <div>
                <p className="text-green-600 dark:text-green-400 mb-4">2FA is currently enabled on your account.</p>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">To disable 2FA, please enter your current password and click the button below.</p>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent mb-4"
                />
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="w-full py-2 px-4 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Disable 2FA
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Enhance your account security by enabling 2FA.</p>
                <button
                  type="button"
                  onClick={handleEnable2FA}
                  className="w-full py-2 px-4 rounded-lg text-white font-medium bg-futuristic-blue dark:bg-neon-blue hover:bg-futuristic-blue/90 dark:hover:bg-neon-blue/90 transition-colors"
                >
                  Enable 2FA
                </button>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium
                     ${loading 
                       ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                       : 'bg-futuristic-blue dark:bg-neon-blue hover:bg-futuristic-blue/90 dark:hover:bg-neon-blue/90'
                     } transition-colors duration-200`}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-xl font-bold mb-4">Enable Two-Factor Authentication</h2>
            <p className="mb-4">Scan this QR code with your authenticator app (e.g., Google Authenticator).</p>
            <img src={qrCode} alt="2FA QR Code" className="mx-auto mb-4" />
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent mb-4"
            />
            <div className="flex justify-center space-x-4">
              <button onClick={handleVerify2FA} className="bg-green-500 text-white px-4 py-2 rounded-lg">Verify & Enable</button>
              <button onClick={() => setShow2FAModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 