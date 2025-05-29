import unittest
from unittest.mock import patch
from tests.mock_llm import mock_llm
from llm_service import LLMService

class TestLLMService(unittest.TestCase):
    def setUp(self):
        self.llm_service = LLMService()
        # Patch the LLM service methods with our mock
        self.llm_service.analyze_portfolio = mock_llm.analyze_portfolio
        self.llm_service.get_investment_advice = mock_llm.get_investment_advice

    def test_analyze_portfolio(self):
        portfolio_data = {
            "stocks": ["AAPL", "MSFT"],
            "bonds": ["AGG"],
            "cash": 10000
        }
        
        result = self.llm_service.analyze_portfolio(portfolio_data)
        
        self.assertEqual(result["risk_level"], "moderate")
        self.assertIn("suggestions", result)
        self.assertIn("market_analysis", result)
        self.assertEqual(len(result["suggestions"]), 2)

    def test_get_investment_advice(self):
        market_data = {
            "market_trend": "bullish",
            "volatility": "moderate"
        }
        
        result = self.llm_service.get_investment_advice(market_data)
        
        self.assertIn("recommendations", result)
        self.assertEqual(len(result["recommendations"]), 2)
        
        # Check first recommendation
        first_rec = result["recommendations"][0]
        self.assertEqual(first_rec["ticker"], "AAPL")
        self.assertEqual(first_rec["action"], "buy")
        self.assertIn("confidence", first_rec)
        self.assertIn("reason", first_rec)

if __name__ == '__main__':
    unittest.main() 