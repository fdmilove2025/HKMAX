import sys
import os
import unittest

# Add the parent directory to the sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.portfolio_analyzer import analyze_risk_profile, generate_portfolio_allocation, recommend_securities

class TestPortfolioAnalyzer(unittest.TestCase):
    
    def test_conservative_risk_profile(self):
        # User input for a conservative profile
        user_data = {
            'investmentGoal': 'Buying a Home',
            'timeHorizon': '3',
            'age': '65',
            'riskReaction': 'Panic and Sell',
            'returnPreference': 'Stable Lower Returns',
            'financialObligations': ['Loans', 'Mortgages', 'Dependents'],
            'experience': 'Beginner'
        }
        
        # Calculate risk profile
        risk_profile = analyze_risk_profile(user_data)
        
        # Check if risk profile is correct
        self.assertEqual(risk_profile, 'Conservative')
        
        # Check portfolio allocation
        allocation = generate_portfolio_allocation(risk_profile)
        
        # Verify allocation percentages
        equities_allocation = next(item for item in allocation if item["name"] == "Equities")
        bonds_allocation = next(item for item in allocation if item["name"] == "Bonds")
        
        self.assertEqual(equities_allocation["value"], 20)
        self.assertEqual(bonds_allocation["value"], 50)
        
        # Check securities recommendations
        securities = recommend_securities(risk_profile, user_data['investmentGoal'], allocation)
        
        # Verify there are securities recommended
        self.assertTrue(len(securities) > 0)
        
        # Verify that all securities have the required fields
        for security in securities:
            self.assertIn("name", security)
            self.assertIn("ticker", security)
            self.assertIn("description", security)
            self.assertIn("assetClass", security)
    
    def test_moderate_risk_profile(self):
        # User input for a moderate profile
        user_data = {
            'investmentGoal': 'Retirement',
            'timeHorizon': '12',
            'age': '40',
            'riskReaction': 'Worry but Hold',
            'returnPreference': 'Higher Volatile Growth',
            'financialObligations': ['Mortgages'],
            'experience': 'Intermediate'
        }
        
        # Calculate risk profile
        risk_profile = analyze_risk_profile(user_data)
        
        # Check if risk profile is correct
        self.assertEqual(risk_profile, 'Moderate')
        
        # Check portfolio allocation
        allocation = generate_portfolio_allocation(risk_profile)
        
        # Verify allocation percentages
        equities_allocation = next(item for item in allocation if item["name"] == "Equities")
        bonds_allocation = next(item for item in allocation if item["name"] == "Bonds")
        
        self.assertEqual(equities_allocation["value"], 50)
        self.assertEqual(bonds_allocation["value"], 30)
    
    def test_aggressive_risk_profile(self):
        # User input for an aggressive profile
        user_data = {
            'investmentGoal': 'Wealth Growth',
            'timeHorizon': '20',
            'age': '25',
            'riskReaction': 'Buy More',
            'returnPreference': 'Higher Volatile Growth',
            'financialObligations': ['None'],
            'experience': 'Advanced'
        }
        
        # Calculate risk profile
        risk_profile = analyze_risk_profile(user_data)
        
        # Check if risk profile is correct
        self.assertEqual(risk_profile, 'Aggressive')
        
        # Check portfolio allocation
        allocation = generate_portfolio_allocation(risk_profile)
        
        # Verify allocation percentages
        equities_allocation = next(item for item in allocation if item["name"] == "Equities")
        bonds_allocation = next(item for item in allocation if item["name"] == "Bonds")
        
        self.assertEqual(equities_allocation["value"], 70)
        self.assertEqual(bonds_allocation["value"], 10)

if __name__ == '__main__':
    unittest.main()
