import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import Select, { components } from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioGroup } from '@headlessui/react';
import LoadingScreen from '../components/LoadingScreen';

// Fix for React Select dropdown menu
// This creates a portal for the menu so it's not constrained by parent containers
const Menu = props => {
  return (
    <div className="select-menu-portal">
      <components.Menu {...props} className="custom-select-menu">
        {props.children}
      </components.Menu>
    </div>
  );
};

// CheckIcon component
const CheckIcon = (props) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="currentColor" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Individual question components
const InvestmentGoalQuestion = ({ updateAnswer, answer, nextStep }) => {
  const options = [
    { value: 'Retirement', label: 'Retirement' },
    { value: 'Buying a Home', label: 'Buying a Home' },
    { value: 'Wealth Growth', label: 'Wealth Growth' },
    { value: 'Education', label: 'Education' },
    { value: 'Other', label: 'Other' }
  ];
  
  // Handle selection change
  const handleSelectionChange = (selectedOption) => {
    if (selectedOption) {
      updateAnswer('investmentGoal', selectedOption.value);
    }
  };
  
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#1E293B' : provided.backgroundColor,
      borderColor: state.isFocused 
        ? document.documentElement.classList.contains('dark') ? '#00F5FF' : '#06B6D4' 
        : document.documentElement.classList.contains('dark') ? '#334155' : provided.borderColor,
      boxShadow: state.isFocused 
        ? document.documentElement.classList.contains('dark') ? '0 0 0 1px #00F5FF, 0 0 10px rgba(0, 245, 255, 0.2)' : '0 0 0 1px #06B6D4' 
        : provided.boxShadow,
      '&:hover': {
        borderColor: document.documentElement.classList.contains('dark') ? '#00F5FF' : '#06B6D4'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? document.documentElement.classList.contains('dark') ? 'linear-gradient(90deg, #00F5FF, #0EA5E9)' : 'linear-gradient(90deg, #06B6D4, #0EA5E9)'
        : state.isFocused 
          ? document.documentElement.classList.contains('dark') ? '#334155' : '#e6f0ff'
          : document.documentElement.classList.contains('dark') ? '#1E293B' : provided.backgroundColor,
      color: state.isSelected
        ? 'white'
        : document.documentElement.classList.contains('dark') ? 'white' : provided.color,
      cursor: 'pointer',
      '&:active': {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#00F5FF' : '#06B6D4'
      }
    }),
    menu: () => ({}), // Empty object to prevent default styling
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    singleValue: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? 'white' : provided.color
    }),
    input: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? 'white' : provided.color
    }),
    placeholder: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : provided.color
    }),
  };
  
  // Handle next button click
  const handleNext = () => {
    if (answer) {
      nextStep();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-display font-medium gradient-text">What are you investing for?</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Select your primary investment goal.</p>
      </div>
      
      <div className="mt-6">
        <Select
          options={options}
          value={options.find(option => option.value === answer) || null}
          onChange={handleSelectionChange}
          placeholder="Select a goal..."
          styles={customStyles}
          className="react-select-container"
          classNamePrefix="react-select"
          components={{ Menu }}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          menuPlacement="auto"
          isSearchable={false}
        />
      </div>
      
      <motion.div 
        className="mt-6 flex justify-end"
        whileHover={{ scale: answer ? 1.02 : 1 }}
        whileTap={{ scale: answer ? 0.98 : 1 }}
      >
        <motion.button
          type="button"
          onClick={handleNext}
          disabled={!answer}
          className={`btn-primary ${!answer ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const TimeHorizonQuestion = ({ updateAnswer, answer, nextStep, prevStep }) => {
  const defaultValue = 10;
  const [value, setValue] = React.useState(answer || defaultValue);
  
  // Initialize the answer with default value if not already set
  React.useEffect(() => {
    if (!answer && value) {
      updateAnswer('timeHorizon', value.toString());
    } else if (answer) {
      setValue(parseInt(answer));
    }
  }, [answer, value, updateAnswer]);
  
  const handleSliderChange = (e) => {
    const newValue = e.target.value;
    setValue(parseInt(newValue));
    updateAnswer('timeHorizon', newValue.toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-display font-medium gradient-text">Time Investment Horizon</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">How many years until you need this money?</p>
      </div>
      
      <div className="mt-10 space-y-8">
        <div className="flex justify-center">
          <motion.div 
            className="text-5xl font-display gradient-text"
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {value} <span className="text-3xl">{parseInt(value) === 1 ? 'year' : 'years'}</span>
          </motion.div>
        </div>
        
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Short-term</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Long-term</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="50"
              value={value}
              onChange={handleSliderChange}
              className="w-full cursor-pointer"
            />
            
            <div className="absolute top-1/2 left-0 right-0 -mt-1 flex justify-between px-1">
              {[0, 1, 2, 3, 4].map((mark) => (
                <div key={mark} className="h-1 w-px bg-gray-400 dark:bg-gray-500"></div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>1 year</span>
            <span>10 years</span>
            <span>20 years</span>
            <span>30 years</span>
            <span>50 years</span>
          </div>
        </div>
        
        <motion.div 
          className="glass-panel p-6 rounded-xl border-l-4 border-futuristic-cyan dark:border-neon-blue"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-futuristic-cyan dark:text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timeframe: {value} {parseInt(value) === 1 ? 'year' : 'years'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {parseInt(value) < 5 
              ? "With a shorter time horizon, we'll focus on more conservative investments to protect your capital."
              : parseInt(value) < 15
              ? "A medium-term horizon allows for a balanced approach with moderate growth potential."
              : "Your long time horizon gives you the flexibility to pursue more aggressive growth strategies."}
          </p>
        </motion.div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <motion.button
          type="button"
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-secondary"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={nextStep}
          disabled={!value}
          whileHover={{ scale: value ? 1.02 : 1 }}
          whileTap={{ scale: value ? 0.98 : 1 }}
          className={`btn-primary ${!value ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

const RiskReactionQuestion = ({ updateAnswer, answer, nextStep, prevStep }) => {
  const options = [
    { id: 'panic', name: 'Panic and Sell', description: 'I would sell my investments to prevent further losses.' },
    { id: 'worry', name: 'Worry but Hold', description: 'I would be concerned but would not change my investment strategy.' },
    { id: 'buy', name: 'Buy More', description: 'I would see this as an opportunity to buy more at lower prices.' },
    { id: 'not-bothered', name: 'Not Bothered', description: 'I understand that markets fluctuate and would not be concerned.' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-display font-medium gradient-text">Market Volatility Response</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">How would you react if your portfolio dropped 20% in a year?</p>
      </div>
      
      <div className="mt-6">
        <RadioGroup value={answer} onChange={(value) => updateAnswer('riskReaction', value)}>
          <div className="space-y-4">
            {options.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <RadioGroup.Option
                  value={option.name}
                  className={({ active, checked }) => `
                    radio-option ${checked ? 'checked' : ''} ${active ? 'active' : ''}
                  `}
                >
                  {({ active, checked }) => (
                    <>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <RadioGroup.Label
                              as="p"
                              className={`font-medium ${checked ? 'text-futuristic-blue dark:text-neon-blue' : 'text-gray-900 dark:text-white'}`}
                            >
                              {option.name}
                            </RadioGroup.Label>
                            <RadioGroup.Description
                              as="span"
                              className={`inline ${checked ? 'text-futuristic-blue/70 dark:text-neon-blue/70' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                              <span>{option.description}</span>
                            </RadioGroup.Description>
                          </div>
                        </div>
                        {checked && (
                          <div className="flex-shrink-0 text-futuristic-blue dark:text-neon-blue">
                            <CheckIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </RadioGroup.Option>
              </motion.div>
            ))}
          </div>
        </RadioGroup>
      </div>
      
      <div className="mt-8 flex justify-between">
        <motion.button
          type="button"
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-secondary"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={nextStep}
          disabled={!answer}
          whileHover={{ scale: answer ? 1.02 : 1 }}
          whileTap={{ scale: answer ? 0.98 : 1 }}
          className={`btn-primary ${!answer ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

const ReturnPreferenceQuestion = ({ updateAnswer, answer, nextStep, prevStep }) => {
  const [selectedPreference, setSelectedPreference] = React.useState(
    answer === "Higher Volatile Growth" ? true : answer === "Stable Lower Returns" ? false : null
  );
  
  // Update answer when selection changes
  const handlePreferenceChange = (isHigherGrowth) => {
    setSelectedPreference(isHigherGrowth);
    updateAnswer('returnPreference', isHigherGrowth ? "Higher Volatile Growth" : "Stable Lower Returns");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-display font-medium gradient-text">Risk vs. Return Profile</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Do you prefer stable, lower returns or higher, potentially more volatile growth?</p>
      </div>
      
      <div className="mt-8">
        <div className="glass-panel p-8 rounded-xl">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <motion.button
                type="button"
                onClick={() => handlePreferenceChange(false)}
                className={`flex flex-col items-center p-6 rounded-xl transition-all duration-300 ${
                  selectedPreference === false 
                    ? 'glow-border bg-gradient-to-br from-futuristic-blue/10 to-futuristic-cyan/10 dark:from-neon-blue/10 dark:to-futuristic-cyan/10' 
                    : 'border-2 border-gray-200 dark:border-dark-300 hover:bg-gray-50 dark:hover:bg-dark-100/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  animate={{ 
                    scale: selectedPreference === false ? 1.1 : 1,
                    opacity: selectedPreference === false ? 1 : 0.7
                  }}
                  className="mb-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${selectedPreference === false ? 'text-futuristic-cyan dark:text-neon-blue' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </motion.div>
                <div>
                  <p className={`font-medium text-center text-lg ${selectedPreference === false ? 'text-futuristic-blue dark:text-neon-blue' : 'text-gray-700 dark:text-gray-200'}`}>Stable Returns</p>
                  <p className={`text-sm mt-2 text-center ${selectedPreference === false ? 'text-futuristic-blue/70 dark:text-neon-blue/70' : 'text-gray-500 dark:text-gray-400'}`}>Lower volatility, steady growth</p>
                </div>
              </motion.button>
              
              <motion.button
                type="button"
                onClick={() => handlePreferenceChange(true)}
                className={`flex flex-col items-center p-6 rounded-xl transition-all duration-300 ${
                  selectedPreference === true 
                    ? 'glow-border bg-gradient-to-br from-futuristic-blue/10 to-futuristic-cyan/10 dark:from-neon-blue/10 dark:to-futuristic-cyan/10' 
                    : 'border-2 border-gray-200 dark:border-dark-300 hover:bg-gray-50 dark:hover:bg-dark-100/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  animate={{ 
                    scale: selectedPreference === true ? 1.1 : 1,
                    opacity: selectedPreference === true ? 1 : 0.7
                  }}
                  className="mb-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${selectedPreference === true ? 'text-futuristic-cyan dark:text-neon-blue' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </motion.div>
                <div>
                  <p className={`font-medium text-center text-lg ${selectedPreference === true ? 'text-futuristic-blue dark:text-neon-blue' : 'text-gray-700 dark:text-gray-200'}`}>Higher Growth</p>
                  <p className={`text-sm mt-2 text-center ${selectedPreference === true ? 'text-futuristic-blue/70 dark:text-neon-blue/70' : 'text-gray-500 dark:text-gray-400'}`}>More volatility, potential for higher returns</p>
                </div>
              </motion.button>
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 italic">
              {selectedPreference === null && "Please select your preference by clicking one of the options above"}
              {selectedPreference === false && "You prefer stable returns with lower risk and less volatility"}
              {selectedPreference === true && "You're comfortable with volatility for potentially higher returns"}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <motion.button
          type="button"
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-secondary"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={nextStep}
          disabled={selectedPreference === null}
          whileHover={{ scale: selectedPreference !== null ? 1.02 : 1 }}
          whileTap={{ scale: selectedPreference !== null ? 0.98 : 1 }}
          className={`btn-primary ${selectedPreference === null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

const FinancialObligationsQuestion = ({ updateAnswer, answer, nextStep, prevStep }) => {
  const options = [
    { id: 'loans', value: 'Loans', label: 'Loans (e.g., student loans, personal loans)' },
    { id: 'mortgages', value: 'Mortgages', label: 'Mortgages' },
    { id: 'dependents', value: 'Dependents', label: 'Dependents (e.g., children, elderly parents)' },
    { id: 'none', value: 'None', label: 'None' }
  ];
  
  const handleCheckboxChange = (value, checked) => {    
    if (checked) {
      if (value === 'None') {
        // If 'None' is selected, clear all other options
        updateAnswer('financialObligations', ['None']);
      } else {
        // Otherwise, add the selected option and remove 'None' if present
        const newObligations = answer.filter(item => item !== 'None');
        updateAnswer('financialObligations', [...newObligations, value]);
      }
    } else {
      // Remove the unselected option
      updateAnswer('financialObligations', answer.filter(item => item !== value));
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-display font-medium gradient-text">Financial Obligations</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Do you have debt or dependents? Select all that apply.</p>
      </div>
      
      <div className="mt-6 glass-panel p-6 rounded-xl">
        <div className="space-y-5">
          {options.map((option, index) => (
            <motion.div 
              key={option.id}
              className="relative flex items-start cursor-pointer group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="custom-checkbox">
                <button
                  type="button"
                  onClick={() => handleCheckboxChange(option.value, !answer.includes(option.value))}
                  className={`${answer.includes(option.value) ? 'checked' : ''}`}
                  aria-labelledby={`${option.id}-label`}
                >
                  {answer.includes(option.value) && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-5 w-5 text-white absolute inset-0.5"
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </motion.svg>
                  )}
                </button>
              </div>
              <div className="ml-3 text-sm">
                <label 
                  id={`${option.id}-label`}
                  className={`font-medium ${
                    answer.includes(option.value) 
                      ? 'text-futuristic-blue dark:text-neon-blue' 
                      : 'text-gray-700 dark:text-gray-200'
                  } group-hover:text-futuristic-blue dark:group-hover:text-neon-blue transition-colors duration-200`}
                >
                  {option.label}
                </label>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <motion.button
          type="button"
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-secondary"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={nextStep}
          disabled={answer.length === 0}
          whileHover={{ scale: answer.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: answer.length > 0 ? 0.98 : 1 }}
          className={`btn-primary ${answer.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

const ExperienceQuestion = ({ updateAnswer, answer, prevStep, onSubmit }) => {
  const options = [
    { 
      value: 'Beginner', 
      label: 'Beginner', 
      description: 'New to investing, just getting started',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      value: 'Intermediate', 
      label: 'Intermediate', 
      description: 'Some experience with basic investment concepts',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    { 
      value: 'Advanced', 
      label: 'Advanced', 
      description: 'Comfortable with various investment strategies and asset classes',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ) 
    }
  ];
  
  // Handle selection change
  const handleSelectionChange = (selectedOption) => {
    if (selectedOption) {
      updateAnswer('experience', selectedOption.value);
    }
  };
  
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#1E293B' : provided.backgroundColor,
      borderColor: state.isFocused 
        ? document.documentElement.classList.contains('dark') ? '#00F5FF' : '#06B6D4' 
        : document.documentElement.classList.contains('dark') ? '#334155' : provided.borderColor,
      boxShadow: state.isFocused 
        ? document.documentElement.classList.contains('dark') ? '0 0 0 1px #00F5FF, 0 0 10px rgba(0, 245, 255, 0.2)' : '0 0 0 1px #06B6D4' 
        : provided.boxShadow,
      borderRadius: '0.75rem',
      padding: '0.25rem',
      '&:hover': {
        borderColor: document.documentElement.classList.contains('dark') ? '#00F5FF' : '#06B6D4'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? document.documentElement.classList.contains('dark') ? 'linear-gradient(90deg, #00F5FF, #0EA5E9)' : 'linear-gradient(90deg, #06B6D4, #0EA5E9)'
        : state.isFocused 
          ? document.documentElement.classList.contains('dark') ? '#334155' : '#e6f0ff'
          : document.documentElement.classList.contains('dark') ? '#1E293B' : provided.backgroundColor,
      color: state.isSelected
        ? 'white'
        : document.documentElement.classList.contains('dark') ? 'white' : provided.color,
      cursor: 'pointer',
      '&:active': {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#00F5FF' : '#06B6D4'
      }
    }),
    menu: () => ({}), // Empty object to prevent default styling
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    singleValue: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? 'white' : provided.color
    })
  };
  
  // Custom option component with descriptions
  const CustomOption = ({ innerProps, label, data, isSelected }) => (
    <div 
      {...innerProps}
      className={`px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 ${
        isSelected 
          ? 'bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan text-white' 
          : 'hover:bg-futuristic-blue/10 dark:hover:bg-dark-100 text-gray-900 dark:text-white'
      }`}
    >
      <div className="flex items-center">
        <div className={`${isSelected ? 'text-white' : 'text-futuristic-blue dark:text-neon-blue'} mr-3`}>
          {data.icon}
        </div>
        <div>
          <div className="font-medium text-base">{label}</div>
          {data.description && (
            <div className={`text-sm mt-1 ${isSelected ? 'text-white opacity-90' : 'text-gray-500 dark:text-gray-400'}`}>
              {data.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Handle form submission
  const handleSubmit = () => {
    if (answer) {
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-display font-medium gradient-text">Investment Knowledge</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">How familiar are you with investing?</p>
      </div>
      
      <div className="mt-6 glass-panel p-6 rounded-xl">
        <div className="mb-6">
          <Select
            options={options}
            value={options.find(option => option.value === answer) || null}
            onChange={handleSelectionChange}
            placeholder="Select your experience level..."
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
            components={{
              Option: CustomOption,
              Menu
            }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuPlacement="auto"
            isSearchable={false}
          />
        </div>
        
        {answer && (
          <motion.div 
            className="mt-4 p-4 bg-futuristic-blue/10 dark:bg-futuristic-blue/5 rounded-lg border border-futuristic-blue/20 dark:border-neon-blue/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-futuristic-blue dark:text-neon-blue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-futuristic-blue dark:text-neon-blue">
                  {answer === 'Beginner' && "We'll provide educational resources tailored for new investors, with a focus on fundamental concepts and easier-to-understand investments."}
                  {answer === 'Intermediate' && "Your portfolio recommendations will include a mix of standard and more sophisticated investment options, along with resources to build on your existing knowledge."}
                  {answer === 'Advanced' && "Based on your expertise, we'll present more complex investment strategies and diversification methods suited to experienced investors."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="mt-8 flex justify-between">
        <motion.button
          type="button"
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-secondary"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!answer}
          whileHover={{ scale: answer ? 1.02 : 1 }}
          whileTap={{ scale: answer ? 0.98 : 1 }}
          className={`${answer ? 'bg-gradient-to-r from-neon-blue to-futuristic-cyan hover:from-futuristic-cyan hover:to-neon-green shadow-neon-glow' : 'opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-700'} inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-300`}
        >
          Generate Portfolio
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

const QuestionnairePage = () => {
  const navigate = useNavigate();
  const [showQuestionnaire, setShowQuestionnaire] = React.useState(false);
  const { 
    currentStep, 
    answers, 
    updateAnswer, 
    nextStep, 
    prevStep, 
    submitQuestionnaire,
    loading,
    setLoading
  } = usePortfolio();
  const { currentUser, loading: authLoading } = useAuth();
  
  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!currentUser && !authLoading) {
      navigate('/login', { state: { from: '/questionnaire', message: 'You must be logged in to take the questionnaire.' } });
    }
    
    // Reset any active dropdown portals when changing steps
    const portals = document.querySelectorAll('div[id^="react-select-"][id$="-portal"]');
    portals.forEach(portal => {
      portal.innerHTML = '';
    });
  }, [currentUser, authLoading, navigate, currentStep]);
  
  // If still loading auth or not authenticated, don't render the page
  if (authLoading || !currentUser) {
    return <LoadingScreen />;
  }
  
  const handleSubmit = async () => {
    console.log("Attempting to submit with answers:", answers);
    
    // Check if any critical fields are missing
    const requiredFields = ['investmentGoal', 'timeHorizon', 'riskReaction', 'returnPreference', 'experience'];
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      alert(`Please fill in all required questions: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      // No need to call setLoading here as it's handled in submitQuestionnaire
      await submitQuestionnaire();
      navigate('/results');
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      alert(`Error: ${error.message || "An unknown error occurred. Please try again."}`);
    }
  };
  
  // Define the total number of questions
  const totalSteps = 5;
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep) / totalSteps) * 100;
  
  // Render the appropriate question based on the current step
  const renderQuestion = () => {
    switch (currentStep) {
      case 0:
        return (
          <InvestmentGoalQuestion 
            key="investment-goal"
            updateAnswer={updateAnswer} 
            answer={answers.investmentGoal} 
            nextStep={nextStep} 
          />
        );
      case 1:
        return (
          <TimeHorizonQuestion 
            key="time-horizon"
            updateAnswer={updateAnswer} 
            answer={answers.timeHorizon} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 2:
        return (
          <RiskReactionQuestion 
            key="risk-reaction"
            updateAnswer={updateAnswer} 
            answer={answers.riskReaction} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 3:
        return (
          <ReturnPreferenceQuestion 
            key="return-preference"
            updateAnswer={updateAnswer} 
            answer={answers.returnPreference} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 4:
        return (
          <FinancialObligationsQuestion 
            key="financial-obligations"
            updateAnswer={updateAnswer} 
            answer={answers.financialObligations || []} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 5:
        return (
          <ExperienceQuestion 
            key="experience"
            updateAnswer={updateAnswer} 
            answer={answers.experience} 
            onSubmit={handleSubmit} 
            prevStep={prevStep} 
          />
        );
      default:
        return null;
    }
  };
  
  if (!showQuestionnaire) {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div 
          className="glass-panel shadow-lg dark:shadow-dark-glow overflow-hidden sm:rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <div className="p-8">
            <motion.div 
              className="flex items-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.div 
                className="flex-shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.5
                }}
              >
                <svg className="h-12 w-12 text-futuristic-blue dark:text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </motion.div>
              <motion.h2 
                className="ml-4 text-2xl font-display font-medium text-futuristic-blue dark:text-neon-blue"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Welcome to Your Investment Journey
              </motion.h2>
            </motion.div>
            <div className="space-y-6">
              <motion.p 
                className="text-gray-600 dark:text-gray-300 text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                We're about to ask you a series of questions to help determine your ideal investment portfolio. Your answers will help us understand your:
              </motion.p>
              <motion.ul 
                className="space-y-3 text-gray-600 dark:text-gray-300"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      delayChildren: 0.8,
                      staggerChildren: 0.2
                    }
                  }
                }}
              >
                <motion.li 
                  className="flex items-center"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <svg className="h-5 w-5 text-futuristic-blue dark:text-neon-blue mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Investment goals and timeline
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <svg className="h-5 w-5 text-futuristic-blue dark:text-neon-blue mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Risk tolerance and preferences
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <svg className="h-5 w-5 text-futuristic-blue dark:text-neon-blue mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Financial situation and experience
                </motion.li>
              </motion.ul>
              <motion.div 
                className="mt-8 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                <motion.button
                  onClick={() => setShowQuestionnaire(true)}
                  className="btn-primary text-lg px-8 py-3 relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.span
                    className="absolute w-0 h-full bg-white/10 left-0 top-0"
                    initial={false}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center">
                    Start Questionnaire
                    <motion.svg 
                      className="ml-2 h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      initial={{ x: -5 }}
                      animate={{ x: 0 }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "mirror", 
                        duration: 0.8,
                        ease: "easeInOut"
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="glass-panel p-3 rounded-xl mb-2">
          <div className="bg-gray-200 dark:bg-dark-300 rounded-full h-3 transition-all duration-300 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan h-3 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
            <span>Question {currentStep + 1}</span>
            <span className="font-medium text-futuristic-blue dark:text-neon-blue">{currentStep + 1} of {totalSteps + 1}</span>
          </p>
        </div>
      </div>
      
      {loading ? (
        <LoadingScreen />
      ) : (
        <motion.div 
          className="glass-panel shadow-lg dark:shadow-dark-glow overflow-hidden sm:rounded-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-6 py-8 sm:p-8">
            <AnimatePresence mode="wait">
              <div className="animate-slide-up">
                {renderQuestion()}
              </div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QuestionnairePage; 