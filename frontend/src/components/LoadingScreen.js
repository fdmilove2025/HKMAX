import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  const { financialTips } = usePortfolio();
  const [tipIndex, setTipIndex] = useState(0);
  
  // Simple tip rotation every 7 seconds
  useEffect(() => {
    if (!financialTips || financialTips.length <= 1) return;
    
    const interval = setInterval(() => {
      setTipIndex(prevIndex => (prevIndex + 1) % financialTips.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [financialTips]);
  
  // Current tip to display
  const currentTip = financialTips && financialTips.length > 0 
    ? financialTips[tipIndex] 
    : "Analyzing your investment profile...";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-dark-100/95 backdrop-blur-md">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-white dark:bg-dark-100 shadow-xl glass-panel">
        <div className="flex flex-col items-center">
          {/* Centered circle animation */}
          <div className="flex justify-center items-center w-full mb-8">
            <div className="relative w-40 h-40">
              {/* Outer circle */}
              <div className="absolute inset-0 rounded-full border-8 border-futuristic-blue/10 dark:border-neon-blue/10"></div>
              
              {/* Spinning arc */}
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-futuristic-blue dark:border-t-neon-blue animate-spin"></div>
              
              {/* Blue glowing circle in center */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan shadow-glow">
                {/* Dollar sign icon */}
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-display font-bold gradient-text mb-4">Analyzing Your Portfolio</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
            We're generating personalized investment recommendations just for you
          </p>
          
          {/* Simplified financial tip display */}
          <div className="w-full p-6 rounded-xl bg-futuristic-blue/5 dark:bg-neon-blue/5 border border-futuristic-blue/20 dark:border-neon-blue/20 mb-6">
            <motion.div
              key={tipIndex} // Change key to force re-render and animation
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-gray-600 dark:text-gray-300 italic">
                {currentTip}
              </p>
            </motion.div>
          </div>
          
          {/* Tip progress indicators */}
          {financialTips && financialTips.length > 1 && (
            <div className="flex justify-center space-x-1 mb-6">
              {financialTips.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === tipIndex 
                      ? 'bg-futuristic-blue dark:bg-neon-blue' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center w-full">
            This may take a moment as our AI works on your personalized insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 