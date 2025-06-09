import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { isDarkMode } = useTheme();

    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [tempAuthToken, setTempAuthToken] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await login(email, password);

            if (data.twofa_required) {
                setTempAuthToken(data.temp_access_token);
                setShow2FAModal(true);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/auth/verify-2fa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempAuthToken}`,
                },
                body: JSON.stringify({ token: twoFactorToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify 2FA token.');
            }

            localStorage.setItem('authToken', data.access_token);
            window.location.href = '/';
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-900">
            <div className="w-full max-w-md p-8 space-y-8 glass-panel rounded-xl shadow-lg dark:shadow-dark-glow">
                <div className="text-center">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                                isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                : 'bg-futuristic-blue dark:bg-neon-blue hover:bg-futuristic-blue/90 dark:hover:bg-neon-blue/90'
                            } transition-colors duration-200`}
                        >
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-futuristic-blue dark:text-neon-blue hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>

            {show2FAModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-dark-200 p-8 rounded-lg shadow-xl text-center">
                        <h2 className="text-xl font-bold mb-4">Enter 2FA Code</h2>
                        <p className="mb-4">Enter the 6-digit code from your authenticator app.</p>
                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={twoFactorToken}
                            onChange={(e) => setTwoFactorToken(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     bg-white dark:bg-dark-100 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-transparent mb-4"
                        />
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                        <div className="flex justify-center space-x-4">
                            <button onClick={handleVerify2FA} disabled={isLoading} className="bg-green-500 text-white px-4 py-2 rounded-lg">
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </button>
                            <button onClick={() => setShow2FAModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage; 