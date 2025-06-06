import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';

const ExploreSecuritiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fitAnalysis, setFitAnalysis] = useState(null);
  const [isFitLoading, setIsFitLoading] = useState(false);
  const [fitError, setFitError] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [isStockInfoLoading, setIsStockInfoLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [hasQuestionnaire, setHasQuestionnaire] = useState(null);
  const [isQuestionnaireFetching, setIsQuestionnaireFetching] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const userIsTyping = useRef(false);
  const searchInputRef = useRef(null);
  
  // Define a debounced function to search for stocks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term || term.length < 2 || !userIsTyping.current) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:5001/api/stock/search?q=${term}&limit=15`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching stocks:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400),
    []
  );

  // Load watchlist from localStorage on component mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('i-buddy_watchlist');
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (error) {
        console.error('Error parsing watchlist from localStorage:', error);
        setWatchlist([]);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('i-buddy_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 2) {
      userIsTyping.current = true;
      setIsLoading(true);
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectStock = (stock) => {
    // Explicitly stop any debounce searches
    debouncedSearch.cancel();
    userIsTyping.current = false;
    
    // Update state
    setSelectedStock(stock);
    setSearchTerm(stock.symbol);
    setShowDropdown(false);
    setSearchResults([]);
    
    // Reset all analysis data
    setFitAnalysis(null);
    setFitError(null);
    setStockInfo(null);
    setShowAnalytics(false);
    
    // Fetch basic stock info first
    fetchStockInfo(stock.symbol);
    
    // Blur the input to remove focus
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const addToWatchlist = (stock) => {
    // Check if stock is already in watchlist
    if (!watchlist.some(item => item.symbol === stock.symbol)) {
      setWatchlist(prev => [...prev, stock]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(stock => stock.symbol === symbol);
  };

  const fetchStockInfo = async (ticker) => {
    try {
      setIsStockInfoLoading(true);
      
      const response = await fetch(`http://localhost:5001/api/stock/info/${ticker}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching stock info:', data.error);
      } else {
        setStockInfo(data);
      }
    } catch (error) {
      console.error('Error fetching stock info:', error);
    } finally {
      setIsStockInfoLoading(false);
    }
  };

  // Check if user has a portfolio (completed questionnaire)
  const checkQuestionnaire = async () => {
    try {
      setIsQuestionnaireFetching(true);
      const response = await fetch('http://localhost:5001/api/portfolio/history', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        // User is not authenticated
        setHasQuestionnaire(false);
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // If there are portfolios, user has completed questionnaire
      const hasPortfolio = data.portfolios && data.portfolios.length > 0;
      setHasQuestionnaire(hasPortfolio);
      return hasPortfolio;
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
      setHasQuestionnaire(false);
      return false;
    } finally {
      setIsQuestionnaireFetching(false);
    }
  };

  // Check if user is logged in
  const checkLogin = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/portfolio/history', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.status !== 401;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  };

  // Handle analytics button click
  const handleAnalyticsClick = async () => {
    setShowAnalytics(true);
    setIsFitLoading(true);
    setFitError(null);
    setFitAnalysis(null); // Clear old analysis
    
    // No need to check login status since this button is only shown to logged-in users
    // with a completed questionnaire
    
    // If they're logged in and have a portfolio, fetch the analysis
    fetchStockFitAnalysis(selectedStock.symbol);
  };

  // Check login and questionnaire status when component mounts
  useEffect(() => {
    const checkStatus = async () => {
      const loggedIn = await checkLogin();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const hasPortfolio = await checkQuestionnaire();
        
        if (hasPortfolio) {
          // If user has completed questionnaire, fetch recommended securities
          fetchRecommendedSecurities();
        }
      } else {
        setHasQuestionnaire(false);
      }
    };
    
    checkStatus();
  }, []);

  // Fetch recommended securities from portfolio history
  const fetchRecommendedSecurities = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/portfolio/history', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Get the most recent portfolio's securities
      if (data.portfolios && data.portfolios.length > 0) {
        const latestPortfolio = data.portfolios[0]; // Assuming sorted newest first
        
        if (latestPortfolio.securities && latestPortfolio.securities.length > 0) {
          // Transform portfolio securities to match watchlist format
          const recommendedSecurities = latestPortfolio.securities.map(security => ({
            symbol: security.ticker || security.symbol,
            name: security.name,
            type: security.assetClass || 'stock',
            isRecommended: true // Mark as recommended
          }));
          
          // Add recommended securities to watchlist without duplicates
          setWatchlist(prevWatchlist => {
            // Get existing symbols to avoid duplicates
            const existingSymbols = new Set(prevWatchlist.map(item => item.symbol));
            
            // Filter out securities that are already in the watchlist
            const newSecurities = recommendedSecurities.filter(
              security => !existingSymbols.has(security.symbol)
            );
            
            // Return combined list with existing watchlist items preserved
            return [...prevWatchlist, ...newSecurities];
          });
        }
      }
    } catch (error) {
      console.error('Error fetching recommended securities:', error);
    }
  };

  const fetchStockFitAnalysis = async (ticker) => {
    try {
      // Skip checks since we've already done them in handleAnalyticsClick
      
      // Check if user is authenticated first
      const response = await fetch('http://localhost:5001/api/stock/fit/' + ticker, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        setFitError(data.error);
      } else {
        setFitAnalysis(data);
      }
    } catch (error) {
      console.error('Error fetching stock fit analysis:', error);
      setFitError("Failed to load stock fit analysis. Please try again later.");
    } finally {
      setIsFitLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup function to cancel any pending debounced calls on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Function to get the appropriate badge color based on security type
  const getTypeBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'etf':
        return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'stock':
        return 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'fund':
        return 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Function to get the appropriate recommendation badge color
  const getRecommendationBadgeColor = (recommendation) => {
    switch (recommendation) {
      case 'Good Fit':
        return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'Moderate Fit':
        return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'Poor Fit':
        return 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200';
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Watchlist Sidebar */}
      <div className="md:w-72 flex-shrink-0">
        <div className="glass-panel rounded-xl p-6 sticky top-24">
          <h2 className="text-xl font-display font-medium gradient-text mb-4">Watchlist</h2>
          
          {watchlist.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <p>Your watchlist is empty</p>
              <p className="text-sm mt-2">Search for securities to add them here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {/* Sort watchlist to show recommended securities first */}
              {watchlist.some(item => item.isRecommended) && (
                <div className="pt-2 pb-1">
                  <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">From Your Portfolio</span>
                  </div>
                </div>
              )}
                
              {/* Sort and render the watchlist items */}
              {(() => {
                // Sort the watchlist
                const sortedWatchlist = [...watchlist]
                  .sort((a, b) => {
                    // Sort recommended securities to the top
                    if (a.isRecommended && !b.isRecommended) return -1;
                    if (!a.isRecommended && b.isRecommended) return 1;
                    return 0;
                  });
                
                // Find the index where recommended securities end
                const lastRecommendedIndex = sortedWatchlist.findIndex(item => !item.isRecommended);
                
                return sortedWatchlist.map((stock, index) => (
                  <React.Fragment key={stock.symbol}>
                    {/* Add a divider between recommended and user-added securities */}
                    {lastRecommendedIndex !== -1 && index === lastRecommendedIndex && (
                      <div className="my-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                          </svg>
                          <span>Your Watchlist</span>
                        </div>
                      </div>
                    )}
                    
                    <motion.div
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${selectedStock?.symbol === stock.symbol ? 'bg-futuristic-blue/10 dark:bg-neon-blue/10 shadow-md' : 'bg-white/50 dark:bg-dark-100/50'}`}
                      onClick={() => handleSelectStock(stock)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-1.5">
                            <span className="font-medium text-futuristic-blue dark:text-neon-blue">{stock.symbol}</span>
                            {stock.isRecommended && (
                              <span className="ml-1.5 text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
                                <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707.707-.707A1 1 0 0115 2h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-.707-.293L14 5.414l-.707.707A1 1 0 0112 7h-2a1 1 0 01-1-1V4a1 1 0 011-1h2zm5 10a1 1 0 01.707.293l.707.707.707-.707A1 1 0 0120 12h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-.707-.293L19 15.414l-.707.707A1 1 0 0117 17h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2z" clipRule="evenodd" />
                                </svg>
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stock.name}</p>
                          {stock.type && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full uppercase ${getTypeBadgeColor(stock.type)}`}>
                              {stock.type}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(stock.symbol);
                          }}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-200 ml-1 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  </React.Fragment>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-10">
        <section className="text-center">
          <h1 className="gradient-text mb-6">Explore Securities</h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-700 dark:text-gray-300">
            Search and discover investment opportunities from thousands of publicly traded securities and ETFs
          </p>
        </section>

        {/* Search Section */}
        <section className="glass-panel rounded-xl p-8 max-w-4xl mx-auto relative z-30">
          <div className="relative">
            <h2 className="text-2xl mb-6 gradient-text">Security Search</h2>
            <div className="relative z-40" ref={searchInputRef}>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchResults.length > 0 && userIsTyping.current) {
                    setShowDropdown(true);
                  }
                }}
                placeholder="Search for stocks, ETFs, and funds (e.g. AAPL, SPY, Vanguard)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isLoading && (
                <div className="absolute right-3 top-3">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-[999] w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto">
                  <ul className="py-1">
                    {searchResults.map((stock) => (
                      <li 
                        key={stock.symbol} 
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                        onClick={() => handleSelectStock(stock)}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="font-medium text-blue-600 dark:text-blue-400">{stock.symbol}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full uppercase ${getTypeBadgeColor(stock.type)}`}>
                              {stock.type}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</span>
                        </div>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {stock.exchangeShortName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {showDropdown && searchTerm.length >= 2 && searchResults.length === 0 && !isLoading && userIsTyping.current && (
                <div className="absolute z-[999] w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                  No securities found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="mt-4 relative z-20">
          {/* Stock Info Section - Loading */}
          {selectedStock && isStockInfoLoading && (
            <motion.section 
              className="glass-panel rounded-xl p-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl mb-6 gradient-text">Security Details</h2>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-700 dark:text-gray-300">Loading stock information...</p>
              </div>
            </motion.section>
          )}

          {/* Stock Info Section - Loaded */}
          {selectedStock && !isStockInfoLoading && stockInfo && (
            <motion.section 
              className="glass-panel rounded-xl p-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl gradient-text">Security Details</h2>
                <button
                  onClick={() => isInWatchlist(selectedStock.symbol) 
                    ? removeFromWatchlist(selectedStock.symbol) 
                    : addToWatchlist(selectedStock)
                  }
                  className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
                    isInWatchlist(selectedStock.symbol)
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400'
                  }`}
                >
                  {isInWatchlist(selectedStock.symbol) ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>Add to Watchlist</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mr-2">{stockInfo.name || selectedStock.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase ${getTypeBadgeColor(stockInfo.type || selectedStock.type)}`}>
                      {stockInfo.type || selectedStock.type}
                    </span>
                  </div>
                  <p className="text-3xl font-medium text-blue-600 dark:text-blue-400 mt-2">
                    {selectedStock.symbol}
                  </p>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Exchange: </span>
                    <span className="text-gray-900 dark:text-white">{stockInfo.exchange || selectedStock.exchange}</span>
                  </div>
                  {stockInfo.sector && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sector: </span>
                      <span className="text-gray-900 dark:text-white">{stockInfo.sector}</span>
                    </div>
                  )}
                  {stockInfo.industry && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry: </span>
                      <span className="text-gray-900 dark:text-white">{stockInfo.industry}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center items-center md:items-end">
                  <div className="text-center md:text-right">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Price</span>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stockInfo.price ? `$${stockInfo.price.toFixed(2)}` : 'N/A'}
                    </p>
                    
                    {stockInfo.priceChange && (
                      <div className={`mt-2 ${stockInfo.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stockInfo.priceChange >= 0 ? '▲' : '▼'} ${Math.abs(stockInfo.priceChange).toFixed(2)} ({Math.abs(stockInfo.priceChangePercentage).toFixed(2)}%)
                      </div>
                    )}
                    
                    {stockInfo.marketCap && (
                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Market Cap: ${(stockInfo.marketCap / 1000000000).toFixed(2)}B
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional metrics if available */}
              {stockInfo && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">P/E Ratio</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stockInfo.peRatio ? stockInfo.peRatio.toFixed(2) : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Beta</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stockInfo.beta ? stockInfo.beta.toFixed(2) : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Volatility</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stockInfo.volatility ? stockInfo.volatility.toFixed(2) + '%' : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Earnings Per Share Growth</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stockInfo.earningsGrowth ? stockInfo.earningsGrowth.toFixed(2) + '%' : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dividend Yield</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stockInfo.dividendYield ? stockInfo.dividendYield.toFixed(2) + '%' : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">52 Week Range</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stockInfo.fiftyTwoWeekLow && stockInfo.fiftyTwoWeekHigh ? `$${stockInfo.fiftyTwoWeekLow.toFixed(2)} - $${stockInfo.fiftyTwoWeekHigh.toFixed(2)}` : 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Portfolio fit analysis button for logged in users */}
              {isLoggedIn && hasQuestionnaire && !showAnalytics && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleAnalyticsClick}
                    className="btn-primary"
                  >
                    Analyze fit with your portfolio
                  </button>
                </div>
              )}

              {/* Portfolio Fit Analysis Section */}
              {showAnalytics && (
                <div className="mt-8 glass-panel p-6 rounded-lg">
                  <h3 className="text-lg font-medium gradient-text mb-4">Portfolio Fit Analysis</h3>
                  
                  {isFitLoading && (
                    <div className="py-10 flex justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {!isFitLoading && fitError && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                      <p>{fitError}</p>
                    </div>
                  )}
                  
                  {!isFitLoading && !fitError && fitAnalysis && (
                    <div className="space-y-6">
                      <div className="flex items-center">
                        <div className="mr-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationBadgeColor(fitAnalysis.recommendation)}`}>
                            {fitAnalysis.recommendation}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>
                            {fitAnalysis.recommendation === 'Good Fit' && 'This security aligns well with your investment goals and risk profile.'}
                            {fitAnalysis.recommendation === 'Moderate Fit' && 'This security partially aligns with your investment strategy but has some considerations.'}
                            {fitAnalysis.recommendation === 'Poor Fit' && 'This security may not align well with your current investment strategy or risk tolerance.'}
                          </p>
                        </div>
                      </div>
                      
                      {fitAnalysis.explanation && (
                        <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analysis</h4>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{fitAnalysis.explanation}</p>
                        </div>
                      )}
                      
                      {fitAnalysis.keyFactors && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">Key Factors</h4>
                          
                          {fitAnalysis.keyFactors.riskAlignment && (
                            <div className="bg-gray-50 dark:bg-dark-200 p-3 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Alignment</h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{fitAnalysis.keyFactors.riskAlignment}</p>
                            </div>
                          )}
                          
                          {fitAnalysis.keyFactors.growthPotential && (
                            <div className="bg-gray-50 dark:bg-dark-200 p-3 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Growth Potential</h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{fitAnalysis.keyFactors.growthPotential}</p>
                            </div>
                          )}
                          
                          {fitAnalysis.keyFactors.portfolioDiversification && (
                            <div className="bg-gray-50 dark:bg-dark-200 p-3 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio Diversification</h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{fitAnalysis.keyFactors.portfolioDiversification}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {fitAnalysis.suggestedAllocation && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border-l-4 border-blue-400 dark:border-blue-600">
                          <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Suggested Allocation</h4>
                          <p className="text-blue-600 dark:text-blue-300 whitespace-pre-line">{fitAnalysis.suggestedAllocation}</p>
                        </div>
                      )}
                      
                      {fitAnalysis.riskFactors && fitAnalysis.riskFactors.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Factors</h4>
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                            {fitAnalysis.riskFactors.map((factor, index) => (
                              <li key={index}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {fitAnalysis.alternatives && Array.isArray(fitAnalysis.alternatives) && fitAnalysis.alternatives.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Alternative Options</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {fitAnalysis.alternatives.map((alt, index) => (
                              <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                  <span className="font-medium text-blue-600 dark:text-blue-400">{alt.symbol}</span>
                                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{alt.name}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alt.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          )}

          {/* No stock selected state */}
          {!selectedStock && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Search for a security</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Use the search bar above or select from your watchlist to view details
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreSecuritiesPage; 