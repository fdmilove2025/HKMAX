import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';

// Pages
import HomePage from './pages/HomePage';
import QuestionnairePage from './pages/QuestionnairePage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import ExploreSecuritiesPage from './pages/ExploreSecuritiesPage';
import PortfolioHistoryPage from './pages/PortfolioHistoryPage';
import Login from './components/Login';
import Register from './components/Register';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Components
const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <button
      onClick={toggleDarkMode}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-100/30 transition-all duration-300 group"
      aria-label="Toggle dark mode"
    >
      <div className="absolute inset-0 rounded-full bg-gray-200/50 dark:bg-dark-300/50 opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10"></div>
      {darkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neon-yellow animate-glow" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-futuristic-blue" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
};

const AppContent = () => {
  const { darkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen transition-all duration-300 bg-gray-50 dark:bg-black font-sans">
      <ScrollToTop />
      <Header />
      
      <main className="animate-fade-in transition-all duration-300 pb-20 pt-16 mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/questionnaire" element={<QuestionnairePage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/explore" element={<ExploreSecuritiesPage />} />
                <Route path="/portfolio" element={<PortfolioHistoryPage />} />
              </Routes>
            </div>
          } />
        </Routes>
      </main>
      
      <footer className="glass-panel fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-dark-300/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} InvestBuddy - Eagles
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Using AI to build smarter portfolios
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <PortfolioProvider>
        <AppContent />
      </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
