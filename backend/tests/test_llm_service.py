import sys
import os
import unittest
from unittest.mock import patch
import requests

# Add the parent directory to the sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.llm_service import generate_response, clean_thinking

class TestLLMService(unittest.TestCase):
    def setUp(self):
        self.test_prompt = "Test prompt"
        self.test_response = {
            "response": "Test response"
        }

    @patch('requests.post')
    def test_generate_response_success(self, mock_post):
        # Mock successful API response
        mock_post.return_value.json.return_value = self.test_response
        mock_post.return_value.raise_for_status = lambda: None

        result = generate_response(self.test_prompt)
        self.assertEqual(result, "Test response")

    @patch('requests.post')
    def test_generate_response_error(self, mock_post):
        # Mock API error
        mock_post.side_effect = requests.exceptions.RequestException("API Error")

        result = generate_response(self.test_prompt)
        self.assertIn("Error: Unable to connect to Ollama", result)

    def test_clean_thinking_json(self):
        # Test with clean JSON
        test_json = '{"key": "value"}'
        result = clean_thinking(test_json)
        self.assertEqual(result, test_json)

    def test_clean_thinking_with_tags(self):
        # Test with thinking tags
        test_text = 'Before <think>thinking</think> After'
        result = clean_thinking(test_text)
        self.assertEqual(result, 'Before  After')

    def test_clean_thinking_with_thought_markers(self):
        # Test with thought markers
        test_text = 'Before Thinking: thoughts After'
        result = clean_thinking(test_text)
        # Normalize whitespace for comparison
        self.assertEqual(' '.join(result.split()), 'Before thoughts After')

if __name__ == '__main__':
    unittest.main() 