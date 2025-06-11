import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tempAuthToken, setTempAuthToken] = useState("");
  const [show2FAInput, setShow2FAInput] = useState(false);
  const { login, verify2FA } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (show2FAInput) {
        const result = await verify2FA(twoFactorToken, tempAuthToken);
        
        if (result.success) {
          navigate('/', { replace: true });
          return;
        } else {
          setError(result.error);
          return;
        }
      }

      const result = await login(email, password);

      if (result.success) {
        setTimeout(() => {
          navigate('/', { replace: true });
          window.scrollTo(0, 0);
        }, 100);
      } else if (result.twofa_required) {
        setTempAuthToken(result.temp_access_token);
        setShow2FAInput(true);
        setMessage(result.message || "Please enter your 2FA code");
        setError("");
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacialLogin = () => {
    navigate("/facial-login");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 pt-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-futuristic-blue dark:text-neon-blue hover:underline"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel bg-white/80 dark:bg-dark-100/70 py-8 px-4 shadow sm:rounded-lg sm:px-10 backdrop-blur-md border border-gray-200 dark:border-dark-300/50 transition-all duration-300">
          {error && (
            <div
              className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md relative"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {message && (
            <div
              className="mb-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-md relative"
              role="alert"
            >
              <span className="block sm:inline">{message}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!show2FAInput ? (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-300 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-dark-200 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-futuristic-blue dark:focus:border-neon-blue sm:text-sm transition-all duration-200"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-300 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-dark-200 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-futuristic-blue dark:focus:border-neon-blue sm:text-sm transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label
                  htmlFor="twoFactorToken"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Two-Factor Authentication Code
                </label>
                <div className="mt-1">
                  <input
                    id="twoFactorToken"
                    name="twoFactorToken"
                    type="text"
                    required
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-300 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-dark-200 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue focus:border-futuristic-blue dark:focus:border-neon-blue sm:text-sm transition-all duration-200"
                    placeholder="Enter 6-digit code"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan hover:from-futuristic-cyan hover:to-futuristic-blue dark:hover:from-futuristic-cyan dark:hover:to-neon-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-dark-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-dark-100 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleFacialLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-200 hover:bg-gray-50 dark:hover:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue transition-all duration-200"
              >
                Facial Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

