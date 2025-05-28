# InvestBuddy

A web-based financial assistant application designed to help users create personalized investment portfolios based on their financial goals, risk tolerance, and personal circumstances. The application leverages a Large Language Model (LLM) to process user inputs and recommend portfolio allocations and specific securities.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Recharts
- **Backend**: Python (Flask), LLM integration
- **Database**: MySQL
- **Deployment**: Not specified yet

## Project Structure

```
InvestBuddy/
├── frontend/         # React frontend
│   ├── public/       # Static files
│   └── src/          # React source code
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page components
│       └── context/      # React Context for state management
└── backend/          # Flask backend
    └── app/          # Flask application code
```

## Setup Instructions


### Backend Setup

0. Install Ollama and do 'ollama run gemma3' in the terminal

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
    pip install -r requirements.txt
   ```

5. Set up environment variables:
   Create a `.env` file in the backend directory with the following content:
   ```
   # Ollama Configuration
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=gemma3

   # Flask Configuration
   FLASK_APP=app.main
   FLASK_ENV=development
   DEBUG=True 

   # Database Configuration
   DATABASE_URI=mysql+pymysql://root:your_password@localhost:3306/investbuddy
   SECRET_KEY=your_super_secret_key_change_in_production
   
   # Financial Modeling Prep API
   FMP_API_KEY=your_api_key
   ```
   IMPORTANT:: Replace `your_password` with your MySQL password and `your_api_key` with your Financial Modeling Prep API key

6. Create the database:
   ```
   python create_db.py
   ```
7. Start the Flask server:
   ```
   python run.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## How to launch project again(after initial setup)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`
   ```
3. Start the Flask server:
   ```
   python run.py


### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Start the development server:
   ```
   npm start
   ```


## Features

- User questionnaire for collecting financial goals and risk tolerance
- Risk profile assessment using LLM
- Portfolio allocation recommendations displayed as a pie chart
- Specific securities recommendations for each asset class
- Option to download portfolio as PDF
- Stock market data integration via Financial Modeling Prep API

## API Endpoints

### Portfolio Assessment

- **POST /api/assess**: Submit questionnaire answers and get portfolio recommendations
- **GET /api/portfolio/history**: Get user's portfolio assessment history
- **GET /api/tips**: Get financial tips for display during portfolio analysis

### Financial Market Data (via Financial Modeling Prep API)

- **GET /api/stock/list**: Get complete list of companies with their ticker symbols, exchange information, and current prices
- **GET /api/stock/symbols**: Get only the ticker symbols of all available companies
- **GET /api/stock/search**: Search for companies by name or ticker symbol
  - Query parameters:
    - `q`: Search query for company name or ticker symbol
    - `exchange`: Filter by exchange name (e.g., "NASDAQ", "NYSE")
    - `limit`: Maximum number of results to return (default: 100)

Example usage: 
```
# Get all ticker symbols
GET http://localhost:5001/api/stock/symbols

# Search for Apple Inc.
GET http://localhost:5001/api/stock/search?q=apple&exchange=NASDAQ&limit=5
```
