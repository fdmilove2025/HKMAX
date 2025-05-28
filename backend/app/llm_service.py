import os
import requests
import json
import re

# Ollama settings
OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL')

def generate_response(prompt, max_tokens=1000):
    """
    Generate a response from the Ollama LLM with Gemma 3 model.
    
    Args:
        prompt (str): The prompt to send to the model
        max_tokens (int): Maximum number of tokens to generate
        
    Returns:
        str: The generated response with thinking sections removed
    """
    url = f"{OLLAMA_HOST}/api/generate"
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": max_tokens
        }
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        result = response.json()
        raw_response = result.get('response', '')
        
        # Clean up the response by removing thinking sections
        cleaned_response = clean_thinking(raw_response)
        return cleaned_response
    except requests.exceptions.RequestException as e:
        print(f"Error calling Ollama API: {e}")
        return f"Error: Unable to connect to Ollama. Please make sure Ollama is running at {OLLAMA_HOST} with model {OLLAMA_MODEL}."

def clean_thinking(text):
    """
    Remove thinking sections from the model output while preserving JSON structure.
    
    Args:
        text (str): The raw model output
        
    Returns:
        str: Clean output with thinking sections removed
    """
    try:
        # First check if the text is a JSON object
        if text.strip().startswith('{') and text.strip().endswith('}'):
            return text.strip()
            
        # Remove content between <think> and </think> tags - properly escaped
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        
        # Remove any instances of the word "think" by itself
        cleaned = re.sub(r'\bthink\b', '', cleaned)
        
        # Handle other potential thought markers
        cleaned = re.sub(r'Thinking:|Thoughts?:|Let me think:', '', cleaned)
        
        # Clean up any extra whitespace
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        cleaned = cleaned.strip()
        
        # If the cleaned text starts with { and ends with }, return it
        if cleaned.startswith('{') and cleaned.endswith('}'):
            return cleaned
            
        # Otherwise, try to find a JSON object in the text
        json_match = re.search(r'({[\s\S]*})', cleaned)
        if json_match:
            return json_match.group(1)
            
        return cleaned
    except re.error as e:
        # If regex error occurs, return original text with error message in logs
        print(f"Regex error in clean_thinking: {e}")
        return text
