class MockLLMService:
    def __init__(self):
        self.responses = {
            "analyze_portfolio": {
                "risk_level": "moderate",
                "suggestions": ["Consider diversifying into emerging markets", "Increase allocation to fixed income"],
                "market_analysis": "Current market conditions suggest a balanced approach",
            },
            "get_investment_advice": {
                "recommendations": [
                    {
                        "ticker": "AAPL",
                        "action": "buy",
                        "confidence": 0.85,
                        "reason": "Strong fundamentals and growth potential",
                    },
                    {
                        "ticker": "MSFT",
                        "action": "hold",
                        "confidence": 0.75,
                        "reason": "Stable performance but fully valued",
                    },
                ]
            },
        }

    def analyze_portfolio(self, portfolio_data):
        return self.responses["analyze_portfolio"]

    def get_investment_advice(self, market_data):
        return self.responses["get_investment_advice"]

    def set_response(self, method, response):
        self.responses[method] = response


# Global instance for unittest
mock_llm = MockLLMService()
