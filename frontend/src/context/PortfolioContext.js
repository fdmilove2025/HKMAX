import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext();

export const usePortfolio = () => useContext(PortfolioContext);

export const PortfolioProvider = ({ children }) => {
  const { getAuthHeaders } = useAuth();
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
  const [financialTips, setFinancialTips] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const tipsLoaded = useRef(false);
  
  // Fetch financial tips when component mounts or when navigating to questionnaire
  useEffect(() => {
    if (!tipsLoaded.current) {
      fetchFinancialTips();
      tipsLoaded.current = true;
    }
  }, []);
  
  // Rotate through financial tips during loading
  useEffect(() => {
    let tipInterval;
    
    if (loading && financialTips.length > 0) {
      console.log("Setting up tip rotation. Current index:", currentTipIndex);
      console.log("First tip:", financialTips[0]);
      
      // Reset to the first tip when loading starts
      setCurrentTipIndex(0);
      
      tipInterval = setInterval(() => {
        setCurrentTipIndex(prevIndex => {
          const newIndex = prevIndex === financialTips.length - 1 ? 0 : prevIndex + 1;
          console.log("Rotating to tip index:", newIndex, "Content:", financialTips[newIndex]);
          return newIndex;
        });
      }, 8000); // Change tip every 8 seconds
    }
    
    return () => {
      if (tipInterval) {
        console.log("Clearing tip rotation interval");
        clearInterval(tipInterval);
      }
    };
  }, [loading, financialTips]);
  
  // Pre-fetch tips so they're ready when needed
  const fetchFinancialTips = async () => {
    try {
      console.log("Fetching financial tips...");
      const response = await fetch('http://localhost:5001/api/tips', {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch tips: ${response.status}`);
      }
      const data = await response.json();
      console.log("Financial tips loaded:", data.tips?.length || 0);
      console.log("Sample tip:", data.tips?.[0] || "No tips available");
      
      if (data.tips && data.tips.length > 0) {
        setFinancialTips(data.tips);
        return data.tips;
      } else {
        throw new Error("No tips returned from API");
      }
    } catch (error) {
      console.error('Error fetching financial tips:', error);
      throw error;
    }
  };
  
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
  
  // Submit answers to backend
  const submitQuestionnaire = async () => {
    try {
      // Make sure we have tips ready before starting the loading process
      if (financialTips.length === 0) {
        console.log("No financial tips loaded yet, fetching them now...");
        await fetchFinancialTips();
      } else {
        console.log("Financial tips already loaded:", financialTips.length);
      }
      
      // Reset the current tip index to start from the beginning
      setCurrentTipIndex(0);
      
      setLoading(true);
      console.log("Original answers before submission:", answers);
      
      // Ensure all fields have values and convert to correct types
      const processedAnswers = {
        ...answers,
        timeHorizon: answers.timeHorizon ? answers.timeHorizon.toString() : "10"
      };
      
      // Validate all required fields
      const requiredFields = ['investmentGoal', 'timeHorizon', 'riskReaction', 'returnPreference', 'experience'];
      const missingFields = requiredFields.filter(field => !processedAnswers[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        setLoading(false);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Ensure financialObligations is an array
      if (!Array.isArray(processedAnswers.financialObligations) || processedAnswers.financialObligations.length === 0) {
        processedAnswers.financialObligations = ['None'];
      }
      
      console.log("Submitting questionnaire with processed answers:", processedAnswers);
      
      // Add artificial delay to show loading screen during development
      // Remove this in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const response = await fetch('http://localhost:5001/api/assess', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(processedAnswers),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        console.error('Server error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`Failed to process questionnaire: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state with the response data
      setRiskProfile(data.riskProfile);
      setPortfolioAllocation(data.portfolioAllocation);
      setSecurities(data.securities);
      setInsights(data.insights);
      
      return data;
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      throw error;
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
    getCurrentTip,
    updateAnswer,
    nextStep,
    prevStep,
    resetQuestionnaire,
    submitQuestionnaire
  };
  
  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}; 