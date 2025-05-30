import sys
import os
import unittest
import json
from unittest.mock import patch, MagicMock

# Add the parent directory to the sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.portfolio_analyzer import analyze_portfolio_combined, recommend_securities

class TestPortfolioAnalyzer(unittest.TestCase):
    def setUp(self):
        self.mock_llm_response = {
            "riskProfile": "Conservative",
            "portfolioAllocation": [
                {"name": "Equities", "value": 20},
                {"name": "Bonds", "value": 50},
                {"name": "Cash", "value": 10},
                {"name": "Real Estate", "value": 10},
                {"name": "Commodities", "value": 5},
                {"name": "Alternative Investments", "value": 5}
            ],
            "insights": "Based on your conservative profile, focus on stable investments."
        }
    
    @patch('app.llm_service.generate_response')
    def test_conservative_risk_profile(self, mock_generate_response):
        # Mock LLM response
        mock_generate_response.return_value = json.dumps(self.mock_llm_response)
        
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
        
        # Calculate risk profile and allocation
        result = analyze_portfolio_combined(user_data)
        
        # Check if risk profile is correct
        self.assertEqual(result["riskProfile"], 'Conservative')
        
        # Check portfolio allocation
        allocation = result["portfolioAllocation"]
        
        # Verify allocation percentages
        equities_allocation = next(item for item in allocation if item["name"] == "Equities")
        bonds_allocation = next(item for item in allocation if item["name"] == "Bonds")
        
        self.assertEqual(equities_allocation["value"], 20)
        self.assertEqual(bonds_allocation["value"], 50)
        
        # Check securities recommendations
        securities = recommend_securities(user_data, allocation)
        
        # Verify there are securities recommended
        self.assertTrue(len(securities) > 0)
        
        # Verify that all securities have the required fields
        for security in securities:
            self.assertIn("name", security)
            self.assertIn("ticker", security)
            self.assertIn("description", security)
            self.assertIn("assetClass", security)
    
    @patch('app.llm_service.generate_response')
    def test_moderate_risk_profile(self, mock_generate_response):
        # Mock LLM response
        mock_response = self.mock_llm_response.copy()
        mock_response["riskProfile"] = "Moderate"
        mock_response["portfolioAllocation"][0]["value"] = 50  # Equities
        mock_response["portfolioAllocation"][1]["value"] = 30  # Bonds
        mock_generate_response.return_value = json.dumps(mock_response)
        
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
        
        # Calculate risk profile and allocation
        result = analyze_portfolio_combined(user_data)
        
        # Check if risk profile is correct
        self.assertEqual(result["riskProfile"], 'Moderate')
        
        # Check portfolio allocation
        allocation = result["portfolioAllocation"]
        
        # Verify allocation percentages
        equities_allocation = next(item for item in allocation if item["name"] == "Equities")
        bonds_allocation = next(item for item in allocation if item["name"] == "Bonds")
        
        self.assertEqual(equities_allocation["value"], 50)
        self.assertEqual(bonds_allocation["value"], 30)
    
    @patch('app.llm_service.generate_response')
    def test_aggressive_risk_profile(self, mock_generate_response):
        # Mock LLM response
        mock_response = self.mock_llm_response.copy()
        mock_response["riskProfile"] = "Aggressive"
        mock_response["portfolioAllocation"][0]["value"] = 70  # Equities
        mock_response["portfolioAllocation"][1]["value"] = 10  # Bonds
        mock_generate_response.return_value = json.dumps(mock_response)
        
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
        
        # Calculate risk profile and allocation
        result = analyze_portfolio_combined(user_data)
        
        # Check if risk profile is correct
        self.assertEqual(result["riskProfile"], 'Aggressive')
        
        # Check portfolio allocation
        allocation = result["portfolioAllocation"]
        
        # Verify allocation percentages
        equities_allocation = next(item for item in allocation if item["name"] == "Equities")
        bonds_allocation = next(item for item in allocation if item["name"] == "Bonds")
        
        self.assertEqual(equities_allocation["value"], 70)
        self.assertEqual(bonds_allocation["value"], 10)

if __name__ == '__main__':
    unittest.main()
