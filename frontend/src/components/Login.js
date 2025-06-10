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
    // Check if there's a message from the redirect
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // If 2FA input is shown, verify 2FA
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

      // Regular login attempt
      const result = await login(email, password);
      console.log("Login result:", result);

      if (result.success) {
        // Wait a moment to ensure state is updated
        setTimeout(() => {
          navigate('/', { replace: true });
          window.scrollTo(0, 0);
        }, 100);
      } else if (result.twofa_required) {
        console.log("2FA required, showing 2FA input");
        setTempAuthToken(result.temp_access_token);
        setShow2FAInput(true);
        setMessage(result.message || "Please enter your 2FA code");
        setError("");
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacialLogin = () => {
    navigate("/facial-login");
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Start building your smarter investment portfolio
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
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
              className="mb-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-md relative"
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
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-futuristic-blue dark:bg-neon-blue hover:bg-futuristic-blue/90 dark:hover:bg-neon-blue/90"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue transition-colors duration-200`}
              >
                {loading ? (show2FAInput ? "Verifying..." : "Signing in...") : (show2FAInput ? "Verify" : "Sign in")}
              </button>
            </div>

            {!show2FAInput && (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-futuristic-blue dark:text-neon-blue hover:text-futuristic-blue/90 dark:hover:text-neon-blue/90"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={handleFacialLogin}
                    className="font-medium text-futuristic-blue dark:text-neon-blue hover:text-futuristic-blue/90 dark:hover:text-neon-blue/90"
                  >
                    Login with Face ID
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
