import React from 'react';

const AboutPage = () => {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="gradient-text mb-6">About I-Buddy</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          I-Buddy was created to democratize investment advice and portfolio optimization.
        </p>
      </section>

      <section className="glass-panel rounded-xl p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl mb-4 gradient-text">Our Mission</h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          I-Buddy was created to democratize investment advice and portfolio optimization. 
          We believe everyone deserves access to sophisticated investment tools that were previously 
          only available to professional investors.
        </p>
        
        <h2 className="text-2xl mb-4 gradient-text">How It Works</h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          Our platform uses advanced algorithms and AI to analyze your risk tolerance, 
          investment goals, and market conditions to create personalized investment 
          recommendations. We continuously monitor market trends and adjust our advice 
          to help you make informed decisions.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="glass-panel rounded-lg p-6 transition-transform hover:scale-105">
            <div className="text-futuristic-blue dark:text-neon-blue text-4xl mb-4">
              <i className="fas fa-robot"></i>
            </div>
            <h3 className="text-xl mb-2">AI-Powered</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced algorithms analyze market data and your preferences to provide personalized recommendations.
            </p>
          </div>
          
          <div className="glass-panel rounded-lg p-6 transition-transform hover:scale-105">
            <div className="text-futuristic-blue dark:text-neon-blue text-4xl mb-4">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="text-xl mb-2">Risk Management</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Sophisticated risk assessment to help you build a portfolio aligned with your risk tolerance.
            </p>
          </div>
          
          <div className="glass-panel rounded-lg p-6 transition-transform hover:scale-105">
            <div className="text-futuristic-blue dark:text-neon-blue text-4xl mb-4">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h3 className="text-xl mb-2">Educational</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Learn about investment strategies and concepts through our comprehensive resources.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-xl p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl mb-6 gradient-text">The Team</h2>
        <p className="mb-8 text-gray-700 dark:text-gray-300">
          Our team consists of financial experts, data scientists, and software engineers 
          passionate about making investment advice accessible to everyone.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-futuristic-blue to-futuristic-cyan"></div>
            <div>
              <h3 className="text-xl font-medium">John Tsoi Tsui Kun</h3>
              <p className="text-futuristic-blue dark:text-neon-blue">CEO & Financial Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-futuristic-blue to-futuristic-cyan"></div>
            <div>
              <h3 className="text-xl font-medium">Code Baggers</h3>
              <p className="text-futuristic-blue dark:text-neon-blue">Lead Developer</p>
            </div>
          </div>
        </div>
      </section>

      <section className="text-center max-w-4xl mx-auto">
        <h2 className="text-2xl mb-6 gradient-text">Start Your Investment Journey Today</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          Join thousands of users who have already optimized their investment portfolios with I-Buddy.
        </p>
        
        <button className="btn-primary">
          Begin Questionnaire
        </button>
      </section>
    </div>
  );
};

export default AboutPage; 