import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import LoadingScreen from '../components/LoadingScreen';

const PortfolioHistoryPage = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  
  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  useEffect(() => {
    fetchPortfolioHistory();
  }, []);
  
  const fetchPortfolioHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/portfolio/history', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio history: ${response.status}`);
      }
      
      const data = await response.json();
      setPortfolios(data.portfolios || []);
      
      // Set the most recent portfolio as selected by default
      if (data.portfolios && data.portfolios.length > 0) {
        setSelectedPortfolio(data.portfolios[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Show loading screen while waiting for results
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-panel rounded-xl mb-8 transition-all duration-300 animate-fade-in shadow-lg dark:shadow-dark-glow">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-display font-bold gradient-text mb-6 animate-slide-up">Your Portfolio History</h2>
          
          {portfolios.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No portfolio history</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">You haven't created any portfolios yet.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/questionnaire')}
                  className="btn-primary"
                >
                  Create Your First Portfolio
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Portfolio List */}
              <div className="md:col-span-1">
                <div className="glass-panel p-4 rounded-xl h-full">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Portfolios</h3>
                  <ul className="space-y-2 max-h-[500px] overflow-y-auto">
                    {portfolios.map((portfolio, index) => (
                      <li 
                        key={portfolio.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          selectedPortfolio?.id === portfolio.id 
                            ? 'bg-futuristic-blue/20 dark:bg-neon-blue/20 border-l-4 border-futuristic-blue dark:border-neon-blue' 
                            : 'hover:bg-gray-50 dark:hover:bg-dark-100/50'
                        }`}
                        onClick={() => setSelectedPortfolio(portfolio)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Portfolio {portfolios.length - index}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(portfolio.created_at)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          Risk Profile: <span className="font-medium">{portfolio.risk_profile}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Portfolio Details */}
              {selectedPortfolio && (
                <div className="md:col-span-2">
                  <div className="glass-panel p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Portfolio Details
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(selectedPortfolio.created_at)}
                      </span>
                    </div>
                    
                    {/* Risk Profile */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Risk Profile</h4>
                      <div className="p-3 bg-futuristic-blue/10 dark:bg-neon-blue/10 rounded-lg">
                        <span className="font-medium text-futuristic-blue dark:text-neon-blue">
                          {selectedPortfolio.risk_profile}
                        </span>
                      </div>
                    </div>
                    
                    {/* Portfolio Allocation */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Portfolio Allocation</h4>
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={selectedPortfolio.portfolio_allocation}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                label={false}
                              >
                                {selectedPortfolio.portfolio_allocation.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value, name) => [`${value}%`, name]} 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                  borderRadius: '0.75rem', 
                                  border: 'none', 
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                  backdropFilter: 'blur(10px)'
                                }} 
                              />
                              <Legend 
                                layout="horizontal" 
                                verticalAlign="bottom" 
                                align="center"
                                wrapperStyle={{
                                  paddingTop: '20px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-4">
                          <ul className="space-y-2">
                            {selectedPortfolio.portfolio_allocation.map((item, index) => (
                              <li key={index} className="flex items-center p-2 rounded-lg">
                                <div 
                                  className="w-4 h-4 mr-2 rounded-md" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-gray-800 dark:text-gray-300">{item.name}: <span className="font-medium text-futuristic-blue dark:text-neon-blue">{item.value}%</span></span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Insights */}
                    {selectedPortfolio.insights && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Investment Insights</h4>
                        <div className="p-4 bg-white/50 dark:bg-dark-100/50 rounded-lg backdrop-blur-sm">
                          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                            {selectedPortfolio.insights}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Securities */}
                    {selectedPortfolio.securities && selectedPortfolio.securities.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Recommended Securities</h4>
                        <div className="space-y-4">
                          {[...new Set(selectedPortfolio.securities.map(sec => sec.assetClass))].map((assetClass) => (
                            <div key={assetClass} className="border border-gray-200 dark:border-dark-300/30 rounded-lg overflow-hidden">
                              <div className="bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan px-3 py-2">
                                <h5 className="text-white font-medium">{assetClass}</h5>
                              </div>
                              <ul className="divide-y divide-gray-200 dark:divide-dark-300/30">
                                {selectedPortfolio.securities
                                  .filter(sec => sec.assetClass === assetClass)
                                  .map((security, index) => (
                                    <li key={index} className="p-3">
                                      <h6 className="font-medium text-gray-900 dark:text-white">{security.name}</h6>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">{security.description}</p>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioHistoryPage; 