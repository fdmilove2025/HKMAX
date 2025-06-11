import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext();

export const usePortfolio = () => useContext(PortfolioContext);

export const PortfolioProvider = ({ children }) => {
  const { getAuthHeaders, makeAuthenticatedRequest, currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    investmentGoal: '',
    timeHorizon: '',
    riskReaction: '',
    returnPreference: '',
    financialObligations: [],
    experience: ''
  });
  const [riskProfile, setRiskProfile] = useState('');
  const [portfolioAllocation, setPortfolioAllocation] = useState([]);
  const [securities, setSecurities] = useState([]);
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [financialTips, setFinancialTips] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const tipsLoaded = useRef(false);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  
  // Function to fetch portfolio history
  const fetchPortfolioHistory = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/portfolio/history', 'GET');
      setPortfolioHistory(response.history);
    } catch (err) {
      setError('Failed to fetch portfolio history');
    }
  }, [makeAuthenticatedRequest]);
  
  // Fetch financial tips when component mounts or when navigating to questionnaire
  useEffect(() => {
    if (!tipsLoaded.current) {
      fetchFinancialTips();
      tipsLoaded.current = true;
    }
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      fetchPortfolioHistory();
    }
  }, [currentUser, fetchPortfolioHistory]);
  
  // Rotate through financial tips during loading
  useEffect(() => {
    if (financialTips.length > 0) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prevIndex) => 
          prevIndex === financialTips.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [financialTips.length, currentTipIndex]);
  
  // Update answers for a specific question
  const updateAnswer = (question, answer) => {
    setAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };
  
  // Move to next question
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  // Move to previous question
  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };
  
  // Reset to beginning
  const resetQuestionnaire = () => {
    // Only reset if we're not already at the beginning
    if (currentStep !== 0) {
      setCurrentStep(0);
    }
    
    // Only reset answers if they're not already empty
    if (Object.values(answers).some(value => value !== '' && (!Array.isArray(value) || value.length > 0))) {
      setAnswers({
        investmentGoal: '',
        timeHorizon: '',
        riskReaction: '',
        returnPreference: '',
        financialObligations: [],
        experience: ''
      });
    }
    
    // Only reset other states if they're not already empty
    if (riskProfile) setRiskProfile('');
    if (portfolioAllocation.length > 0) setPortfolioAllocation([]);
    if (securities.length > 0) setSecurities([]);
    if (insights) setInsights('');
  };
  
  const fetchFinancialTips = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/portfolio/tips', 'GET');
      setFinancialTips(response.tips);
    } catch (err) {
      setError('Failed to fetch financial tips');
    }
  }, [makeAuthenticatedRequest]);
  
  // Get current financial tip
  const getCurrentTip = () => {
    if (financialTips.length === 0) {
      console.log("No tips available");
      return "Loading investment insights...";
    }
    
    const tip = financialTips[currentTipIndex];
    console.log("Getting current tip at index:", currentTipIndex, "Content:", tip);
    return tip;
  };
  
  // Submit answers to backend
  const submitQuestionnaire = async () => {
    try {
      setLoading(true);
      setError(null);

      // Process answers before sending
      const processedAnswers = {
        ...answers,
        financialObligations: Array.isArray(answers.financialObligations) 
          ? answers.financialObligations 
          : []
      };

      // Validate all required fields
      const requiredFields = ['investmentGoal', 'timeHorizon', 'riskReaction', 'returnPreference', 'experience'];
      const missingFields = requiredFields.filter(field => !processedAnswers[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const response = await makeAuthenticatedRequest(
        '/api/portfolio/submit',
        'POST',
        processedAnswers
      );

      // Update state with the response data
      setRiskProfile(response.riskProfile);
      setPortfolioAllocation(response.portfolioAllocation);
      setSecurities(response.securities);
      setInsights(response.insights);
      setPortfolioHistory(response.portfolioHistory);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    currentStep,
    answers,
    riskProfile,
    portfolioAllocation,
    securities,
    insights,
    loading,
    error,
    getCurrentTip,
    updateAnswer,
    nextStep,
    prevStep,
    resetQuestionnaire,
    submitQuestionnaire,
    portfolioHistory
  };
  
  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}; 