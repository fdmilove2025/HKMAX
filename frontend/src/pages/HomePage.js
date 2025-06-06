import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const FeatureCard = ({ icon, title, description, delay }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div 
      ref={ref}
      className="pt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.7,
          delay: delay,
          ease: [0.22, 1, 0.36, 1]
        }
      } : {}}
    >
      <motion.div 
        className="h-full futuristic-card p-6 backdrop-blur-sm transition-all duration-300"
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 20px 30px -10px rgba(var(--color-futuristic-blue-rgb), 0.2)",
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col h-full items-center text-center">
          <motion.div 
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={isInView ? { 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: delay + 0.2
              }
            } : {}}
          >
            <motion.div 
              className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan rounded-xl shadow-lg"
              whileHover={{ 
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 0.5 }
              }}
            >
              {icon}
            </motion.div>
          </motion.div>
          <motion.h3 
            className="mt-6 text-lg font-display font-medium text-gray-900 dark:text-white tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.5,
                delay: delay + 0.3
              }
            } : {}}
          >
            {title}
          </motion.h3>
          <motion.p 
            className="mt-3 text-base text-gray-500 dark:text-gray-400 flex-grow"
            initial={{ opacity: 0 }}
            animate={isInView ? { 
              opacity: 1,
              transition: {
                duration: 0.5,
                delay: delay + 0.4
              }
            } : {}}
          >
            {description}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FloatingElement = ({ children, yOffset = 20, duration = 3 }) => {
  return (
    <motion.div
      animate={{
        y: [-yOffset/2, yOffset/2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

const DisclaimerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      <motion.div 
        className="glass-panel relative z-[110] max-w-xl w-full mx-4 rounded-xl overflow-hidden shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-display font-bold gradient-text">Financial Disclaimer</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="text-gray-700 dark:text-gray-300 text-sm space-y-3">
            <p><span className="font-semibold">Investment Risk:</span> All investment strategies have the potential for profit or loss. InvestBuddy makes no representations or warranties regarding the accuracy or completeness of information provided.</p>
            
            <p><span className="font-semibold">Not Financial Advice:</span> The content on this site is for informational purposes only. InvestBuddy is not a registered investment, legal, or tax advisor or broker/dealer, and this platform does not provide individualized investment advice.</p>
            
            <p><span className="font-semibold">AI Limitations:</span> While our AI-powered tools use sophisticated algorithms, they are not infallible. Recommendations should be evaluated in the context of your personal financial situation and goals.</p>
            
            <p><span className="font-semibold">Past Performance:</span> Past performance is not indicative of future results. Actual investment results will fluctuate with market conditions.</p>
            
            <p className="mt-4">By using InvestBuddy, you acknowledge that you have read this disclaimer and understand the inherent risks associated with investing.</p>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="btn-primary"
            >
              I Understand
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HomePage = () => {
  const { resetQuestionnaire, currentStep } = usePortfolio();
  const { scrollY } = useScroll();
  const bannerScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const bannerOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const heroRef = React.useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
  // Reset the questionnaire when starting from the homepage
  React.useEffect(() => {
    // Only reset if we're not already at the beginning
    if (currentStep !== 0) {
      resetQuestionnaire();
    }
  }, []); // Empty dependency array since we only want to run this once on mount
  
  // Check if user has seen the disclaimer before
  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('disclaimerAcknowledged');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);
  
  // Handle disclaimer close
  const handleDisclaimerClose = () => {
    localStorage.setItem('disclaimerAcknowledged', 'true');
    setShowDisclaimer(false);
  };
  
  return (
    <>
      {/* Disclaimer Modal */}
      <DisclaimerModal 
        isOpen={showDisclaimer} 
        onClose={handleDisclaimerClose}
      />
      
      {/* Full Width Banner - Fixed to truly cover full width without affecting layout */}
      <div className="relative w-full mb-12">
        <motion.div
          className="w-full h-[60vh] overflow-hidden relative shadow-xl banner-zoom transition-all duration-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ 
            width: '100vw', 
            marginLeft: 'calc(50% - 50vw)',
            marginRight: 'calc(50% - 50vw)',
            scale: bannerScale,
            opacity: bannerOpacity
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-futuristic-blue/40 to-futuristic-cyan/30 dark:from-neon-blue/40 dark:to-futuristic-cyan/30 mix-blend-overlay z-10"></div>
          <div className="absolute inset-0 bg-black/30 z-10"></div>
          <motion.img 
            src="/images/investment-banner.jpg" 
            alt="Investment Dashboard" 
            className="w-full h-full object-cover object-center"
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
            <div className="text-center max-w-4xl px-6">
              <motion.h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <FloatingElement yOffset={10} duration={4}>
                  <span className="animate-text-gradient bg-gradient-to-r from-white via-futuristic-cyan to-white bg-clip-text text-transparent bg-300% font-display">
                    Intelligent Investing
                  </span>
                  <br />
                  <span className="animate-text-reveal">for Your Future</span>
                </FloatingElement>
              </motion.h2>
              
              <motion.p 
                className="text-white/90 mt-6 text-xl md:text-2xl max-w-2xl mx-auto drop-shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                Professional portfolio management powered by 
                <motion.span 
                  className="ml-2 text-futuristic-cyan font-medium inline-block"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [1, 0.8, 1] 
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  artificial intelligence
                </motion.span>
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="mt-8"
              >
                <Link 
                  to="/questionnaire" 
                  className="group relative inline-flex items-center justify-center px-8 py-4 font-display font-medium text-white bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan rounded-full overflow-hidden transition-all duration-300 hover:from-futuristic-cyan hover:to-futuristic-teal dark:hover:from-futuristic-cyan dark:hover:to-neon-green shadow-md hover:shadow-xl hover:shadow-futuristic-cyan/20 dark:hover:shadow-neon-blue/20 dark:text-white"
                >
                  <motion.span 
                    className="relative z-10 flex items-center"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Start Building Your Portfolio
                    <motion.svg 
                      className="w-5 h-5 ml-2"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </motion.span>
                </Link>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                  className="mt-3 text-xs text-white/80 max-w-lg mx-auto"
                >
                  * For educational purposes only. Investments involve risk and are not guaranteed. Past performance is not indicative of future results.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          {/* Hero Section */}
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative mb-8"
          >
            <motion.div 
              className="absolute inset-0 -z-10 bg-gradient-to-b from-futuristic-blue/5 to-transparent dark:from-neon-blue/5 rounded-3xl"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [0.98, 1, 0.98],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.h1 
              className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="gradient-text">AI-Powered Investment</span>
              <br />
              <span className="text-gray-900 dark:text-white">Portfolio Builder</span>
            </motion.h1>
            
            <motion.p 
              className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={isHeroInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Answer a few questions, and our AI will craft a portfolio
              <br className="hidden md:block" /> tailored to your financial goals and risk tolerance.
            </motion.p>
          </motion.div>
        </div>
        
        {/* Features Section */}
        <div className="mt-10 mb-16 grid grid-cols-1 gap-8 sm:grid-cols-3 px-6 sm:px-0">
          <FeatureCard 
            icon={
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="Personalized Analysis"
            description="Our AI analyzes your financial goals, risk tolerance, and time horizon to create a tailored investment strategy unique to your needs."
            delay={0.4}
          />
          
          <FeatureCard 
            icon={
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Portfolio Visualization"
            description="See your recommended asset allocation with interactive visualizations and detailed explanations of the investment rationale."
            delay={0.5}
          />
          
          <FeatureCard 
            icon={
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            }
            title="Actionable Recommendations"
            description="Get specific investment recommendations and implementation steps to put your personalized strategy into action."
            delay={0.6}
          />
        </div>
      </div>
      
      {/* Bottom Section */}
      <motion.div 
        className="glass-panel rounded-xl p-8 text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(var(--color-futuristic-blue-rgb), 0)",
              "0 0 20px 10px rgba(var(--color-futuristic-blue-rgb), 0.1)",
              "0 0 0 0 rgba(var(--color-futuristic-blue-rgb), 0)"
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="rounded-xl"
        >
          <h2 className="text-2xl font-display font-medium text-gray-900 dark:text-white mb-4">Start your investment journey today</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our AI-driven approach combines modern portfolio theory with cutting-edge machine learning to provide personalized, data-driven investment advice.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/questionnaire" 
              className="btn-primary inline-flex items-center group"
            >
              <span>Build Your Portfolio</span>
              <motion.svg 
                className="w-5 h-5 ml-2"
                initial={{ x: 0 }}
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </Link>
          </motion.div>
          
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            * Investment recommendations are simulations and not financial advice. Always consult with a qualified financial advisor.
          </p>
        </motion.div>
      </motion.div>
    </>
  );
};

export default HomePage; 