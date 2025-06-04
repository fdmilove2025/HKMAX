import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaChartPie, 
  FaCog, 
  FaSignOutAlt, 
  FaUserCircle,
  FaBell,
  FaShieldAlt,
  FaChartLine,
  FaGlobe,
  FaLock,
  FaEnvelope
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { riskProfile, portfolioAllocation } = usePortfolio();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    marketUpdates: true,
    portfolioAlerts: true,
    securityAlerts: true,
    weeklyReports: false
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderSettingsContent = () => (
    <div className="space-y-6">
      {/* Investment Preferences */}
      <div className="p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaChartLine className="mr-2" /> Investment Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Default Currency</h4>
              <p className="text-sm text-muted-foreground">Set your preferred currency for investments</p>
            </div>
            <select className="px-3 py-2 rounded-md border bg-background">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Risk Tolerance Updates</h4>
              <p className="text-sm text-muted-foreground">Allow automatic portfolio rebalancing</p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaBell className="mr-2" /> Notification Settings
        </h3>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                <p className="text-sm text-muted-foreground">
                  {key === 'marketUpdates' && 'Receive real-time market updates'}
                  {key === 'portfolioAlerts' && 'Get alerts about your portfolio performance'}
                  {key === 'securityAlerts' && 'Important security notifications'}
                  {key === 'weeklyReports' && 'Weekly investment performance reports'}
                </p>
              </div>
              <button
                onClick={() => toggleNotification(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  value ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Security */}
      <div className="p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaShieldAlt className="mr-2" /> Account Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
              Enable 2FA
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaGlobe className="mr-2" /> Display Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Dark Mode</h4>
              <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64">
          <div className="p-4 rounded-lg border bg-card">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <FaUser className="mr-3" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <FaCog className="mr-3" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <FaSignOutAlt className="mr-3" />
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6 rounded-lg border bg-card">
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <FaUserCircle className="w-16 h-16 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg border bg-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FaChartPie className="mr-2" /> Portfolio Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risk Profile</span>
                        <span className="font-medium">{riskProfile || 'Not assessed'}</span>
                      </div>
                      {portfolioAllocation.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Asset Allocation</h4>
                          <div className="space-y-2">
                            {portfolioAllocation.map((allocation, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm">{allocation.asset}</span>
                                <span className="text-sm font-medium">{allocation.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              renderSettingsContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 