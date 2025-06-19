import os
import requests
import json
import time
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Financial Modeling Prep API settings
FMP_BASE_URL = "https://financialmodelingprep.com/api/v3"
FMP_API_KEY = os.environ.get("FMP_API_KEY", "fDAjqp9Zva5kawwUoLPl5TyswXr7tm7Y")  # Default to the provided key

# Simple in-memory cache
_cache = {}
# Cache expiration time in seconds (1 hour)
CACHE_EXPIRATION = 3600


def get_stock_list():
    """
    Retrieve a list of all company ticker symbols from Financial Modeling Prep API.
    Uses in-memory caching to avoid repeated API calls.

    Returns:
        list: A list of dictionaries containing company information
        or None if the request fails
    """
    cache_key = "stock_list"

    # Check if we have a valid cached response
    if cache_key in _cache:
        cached_data = _cache[cache_key]
        if cached_data["timestamp"] + CACHE_EXPIRATION > time.time():
            return cached_data["data"]

    # If no valid cache, make the API call
    endpoint = f"{FMP_BASE_URL}/stock/list"
    params = {"apikey": FMP_API_KEY}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()

        # Store in cache
        _cache[cache_key] = {"timestamp": time.time(), "data": data}

        return data
    except requests.exceptions.RequestException as e:
        print(f"Error calling Financial Modeling Prep API: {e}")
        return None


def filter_stocks(query=None, exchange=None, limit=100):
    """
    Filter stocks by search query and/or exchange.

    Parameters:
        query (str): Optional search string to filter by symbol or name
        exchange (str): Optional exchange name to filter by
        limit (int): Maximum number of results to return (default: 100)

    Returns:
        list: A filtered list of stock dictionaries
    """
    # Get the full stock list
    stocks = get_stock_list()

    if not stocks:
        return []

    filtered_stocks = stocks

    # Filter by query if provided
    if query:
        query = query.lower()
        filtered_stocks = [
            stock
            for stock in filtered_stocks
            if (stock.get("symbol") is not None and query in stock.get("symbol", "").lower())
            or (stock.get("name") is not None and query in stock.get("name", "").lower())
        ]

    # Filter by exchange if provided
    if exchange:
        exchange = exchange.lower()
        filtered_stocks = [
            stock
            for stock in filtered_stocks
            if (stock.get("exchange") is not None and exchange in stock.get("exchange", "").lower())
            or (stock.get("exchangeShortName") is not None and exchange in stock.get("exchangeShortName", "").lower())
        ]

    # Limit the number of results
    return filtered_stocks[:limit]


def get_symbols_only():
    """
    Retrieve only the ticker symbols from all companies.

    Returns:
        list: A list of ticker symbols
    """
    stocks = get_stock_list()

    if not stocks:
        return []

    # Extract only the 'symbol' field from each stock
    symbols = [stock.get("symbol") for stock in stocks if "symbol" in stock]

    return symbols


def get_stock_quote(ticker):
    """
    Get current stock quote data including price, market cap, PE ratio

    Parameters:
        ticker (str): Stock ticker symbol (e.g., 'AAPL')

    Returns:
        dict: Dictionary with stock quote data or None if request fails
    """
    cache_key = f"quote_{ticker}"

    # Check cache first
    if cache_key in _cache:
        cached_data = _cache[cache_key]
        if cached_data["timestamp"] + CACHE_EXPIRATION > time.time():
            return cached_data["data"][0] if cached_data["data"] else None

    # If no valid cache, make the API call
    endpoint = f"{FMP_BASE_URL}/quote/{ticker}"
    params = {"apikey": FMP_API_KEY}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()

        # Store in cache
        _cache[cache_key] = {"timestamp": time.time(), "data": data}

        return data[0] if data else None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching stock quote for {ticker}: {e}")
        return None


def get_company_profile(ticker):
    """
    Get detailed company profile including beta, sector, and dividend yield

    Parameters:
        ticker (str): Stock ticker symbol

    Returns:
        dict: Dictionary with company profile data or None if request fails
    """
    cache_key = f"profile_{ticker}"

    # Check cache first
    if cache_key in _cache:
        cached_data = _cache[cache_key]
        if cached_data["timestamp"] + CACHE_EXPIRATION > time.time():
            return cached_data["data"][0] if cached_data["data"] else None

    # If no valid cache, make the API call
    endpoint = f"{FMP_BASE_URL}/profile/{ticker}"
    params = {"apikey": FMP_API_KEY}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()

        # Store in cache
        _cache[cache_key] = {"timestamp": time.time(), "data": data}

        return data[0] if data else None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching company profile for {ticker}: {e}")
        return None


def get_financial_ratios(ticker):
    """
    Get key financial ratios including P/E ratio and earnings per share growth

    Parameters:
        ticker (str): Stock ticker symbol

    Returns:
        dict: Dictionary with financial ratios or None if request fails
    """
    cache_key = f"ratios_{ticker}"

    # Check cache first
    if cache_key in _cache:
        cached_data = _cache[cache_key]
        if cached_data["timestamp"] + CACHE_EXPIRATION > time.time():
            return cached_data["data"]

    # If no valid cache, make the API call
    endpoint = f"{FMP_BASE_URL}/ratios/{ticker}"
    params = {"apikey": FMP_API_KEY, "limit": 5}  # Get last 5 years for growth calculation

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()

        # Store in cache
        _cache[cache_key] = {"timestamp": time.time(), "data": data}

        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching financial ratios for {ticker}: {e}")
        return None


def get_historical_prices(ticker, days=365):
    """
    Get historical price data for a stock

    Parameters:
        ticker (str): Stock ticker symbol
        days (int): Number of days of historical data to retrieve

    Returns:
        dict: Dictionary with historical price data or None if request fails
    """
    cache_key = f"history_{ticker}_{days}"

    # Check cache first
    if cache_key in _cache:
        cached_data = _cache[cache_key]
        if cached_data["timestamp"] + CACHE_EXPIRATION > time.time():
            return cached_data["data"]

    # If no valid cache, make the API call
    endpoint = f"{FMP_BASE_URL}/historical-price-full/{ticker}"
    params = {
        "apikey": FMP_API_KEY,
        "from": (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d"),
        "to": datetime.now().strftime("%Y-%m-%d"),
    }

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()

        # Verify data structure
        if not data or "historical" not in data or not data["historical"]:
            print(f"Invalid or empty historical data for {ticker}")
            return None

        # Store in cache
        _cache[cache_key] = {"timestamp": time.time(), "data": data}

        return data
    except requests.exceptions.RequestException as e:
        print(f"API error fetching historical prices for {ticker}: {e}")
        return None
    except ValueError as e:
        print(f"JSON parsing error for historical prices for {ticker}: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error fetching historical prices for {ticker}: {e}")
        return None


def calculate_volatility(historical_data, period=252):
    """
    Calculate annualized volatility from historical price data

    Parameters:
        historical_data (dict): Historical price data from get_historical_prices
        period (int): Trading days in a year (default: 252)

    Returns:
        float: Annualized volatility as a percentage or None if calculation fails
    """
    try:
        if not historical_data or "historical" not in historical_data:
            print("Missing 'historical' key in historical data")
            return None

        # Extract closing prices
        prices = []
        for item in historical_data["historical"]:
            if "close" in item and item["close"] is not None and item["close"] > 0:
                prices.append(item["close"])

        if len(prices) < 2:
            print(f"Not enough valid price data points (found {len(prices)}, need at least 2)")
            return None

        # Calculate daily returns
        returns = []
        for i in range(1, len(prices)):
            if prices[i - 1] > 0:  # Avoid division by zero
                returns.append(np.log(prices[i] / prices[i - 1]))

        if not returns:
            print("Could not calculate any valid returns")
            return None

        # Calculate annualized volatility (standard deviation of returns * sqrt(trading days per year))
        volatility = np.std(returns) * np.sqrt(period) * 100

        return round(volatility, 2)
    except Exception as e:
        print(f"Error calculating volatility: {e}")
        return None


def get_52_week_high_low(historical_data):
    """
    Extract 52-week high and low prices from historical data

    Parameters:
        historical_data (dict): Historical price data from get_historical_prices

    Returns:
        dict: Dictionary with 'high' and 'low' values or None if calculation fails
    """
    try:
        if not historical_data or "historical" not in historical_data:
            print("Missing 'historical' key in historical data")
            return {"high": None, "low": None}

        # Extract all prices from the past year
        prices = []
        for item in historical_data["historical"]:
            if "close" in item and item["close"] is not None and item["close"] > 0:
                prices.append(item["close"])

        if not prices:
            print("No valid closing prices found in historical data")
            return {"high": None, "low": None}

        return {"high": max(prices), "low": min(prices)}
    except Exception as e:
        print(f"Error calculating 52-week high/low: {e}")
        return {"high": None, "low": None}


def calculate_earnings_growth(financial_ratios, years=5):
    """
    Calculate average earnings per share growth over a period

    Parameters:
        financial_ratios (list): List of financial ratios from get_financial_ratios
        years (int): Number of years to calculate growth over

    Returns:
        float: Average earnings per share growth as a percentage or None if calculation fails
    """
    try:
        if not financial_ratios or len(financial_ratios) < 2:
            return None

        # Limit to specified number of years
        ratios = financial_ratios[: min(years, len(financial_ratios))]

        # Extract EPS growth rates if available
        growth_rates = []
        for ratio in ratios:
            if "epsgrowth" in ratio and ratio["epsgrowth"] is not None:
                growth_rates.append(ratio["epsgrowth"] * 100)  # Convert to percentage

        if not growth_rates:
            return None

        # Calculate average growth rate
        avg_growth = sum(growth_rates) / len(growth_rates)

        return round(avg_growth, 2)
    except Exception as e:
        print(f"Error calculating earnings per share growth: {e}")
        return None


def get_earnings_growth(ticker):
    """
    Get earnings per share growth directly from the income-statement-growth API endpoint

    Parameters:
        ticker (str): Stock ticker symbol

    Returns:
        float: Earnings per share growth as a percentage or None if request fails
    """
    cache_key = f"earnings_growth_{ticker}"

    # Check cache first
    if cache_key in _cache:
        cached_data = _cache[cache_key]
        if cached_data["timestamp"] + CACHE_EXPIRATION > time.time():
            return cached_data["data"]

    # If no valid cache, make the API call
    endpoint = f"{FMP_BASE_URL}/income-statement-growth/{ticker}"
    params = {"apikey": FMP_API_KEY, "limit": 1}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()

        if not data or len(data) == 0:
            print(f"No income statement growth data available for {ticker}")
            return None

        # Extract earnings per share growth from the response
        # Use growthEPS instead of epsgrowth
        eps_growth = None
        if "growthEPS" in data[0] and data[0]["growthEPS"] is not None:
            eps_growth = data[0]["growthEPS"] * 100  # Convert to percentage
            eps_growth = round(eps_growth, 2)

        # Store in cache
        _cache[cache_key] = {"timestamp": time.time(), "data": eps_growth}

        return eps_growth
    except requests.exceptions.RequestException as e:
        print(f"Error fetching earnings per share growth for {ticker}: {e}")
        return None


def analyze_stock_fit(ticker, user_id):
    """
    Comprehensive analysis of whether a stock is a good fit for a user's portfolio

    Parameters:
        ticker (str): Stock ticker symbol
        user_id (int): User ID for retrieving portfolio information

    Returns:
        dict: Stock fit analysis results including recommendation and explanation
    """
    from app.models import Portfolio
    from app.llm_service import generate_response
    import json

    try:
        print(f"Starting stock fit analysis for ticker: {ticker}, user_id: {user_id}")

        # Step 1: Get all stock metrics
        metrics = get_stock_metrics(ticker)
        if not metrics:
            print(f"Could not retrieve metrics for {ticker}")
            return {
                "error": f"Could not retrieve metrics for {ticker}. This symbol may not be supported or may be delisted."
            }

        # Step 2: Get user's most recent portfolio data
        try:
            portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(Portfolio.created_at.desc()).first()
            if not portfolio:
                print(f"No portfolio found for user_id: {user_id}")
                return {"error": "No portfolio found for your account. Please complete the questionnaire first."}
        except Exception as e:
            print(f"Database error retrieving portfolio for user_id {user_id}: {e}")
            return {"error": "Failed to retrieve your portfolio data. Please try again later."}

        # Step 3: Prepare inputs for LLM
        prompt = create_stock_fit_prompt(ticker, metrics, portfolio)

        # Step 4: Generate recommendation with LLM
        try:
            print(f"Sending prompt to LLM for {ticker}")
            llm_response = generate_response(prompt)
            if not llm_response or len(llm_response) < 10:  # Verify we got a meaningful response
                print(f"Empty or very short LLM response for {ticker}: {llm_response}")
                return {"error": "Analysis service returned an empty response. Please try again later."}
        except Exception as e:
            print(f"LLM API error for {ticker}: {e}")
            return {"error": "Analysis service is currently unavailable. Please try again later."}

        # Step 5: Parse response
        try:
            # First try to find a JSON object in the response
            json_match = re.search(r"({[\s\S]*})", llm_response)
            if json_match:
                json_str = json_match.group(1)
                result = json.loads(json_str)

                # Add the stock metrics to the result
                result["metrics"] = metrics

                # Verify the required fields are present
                required_fields = ["recommendation", "explanation", "keyFactors"]
                missing_fields = [field for field in required_fields if field not in result]

                if missing_fields:
                    print(f"Missing required fields in LLM response: {missing_fields}")
                    return {"error": f"Analysis is incomplete. Please try again later."}

                print(f"Successfully completed stock fit analysis for {ticker}")
                return result
            else:
                print(f"No JSON found in LLM response for {ticker}: {llm_response[:100]}...")
                return {"error": "Could not extract valid response from analysis service. Please try again later."}
        except json.JSONDecodeError as e:
            print(f"JSON parse error for {ticker}: {e}")
            print(f"Raw LLM response: {llm_response[:300]}...")
            return {"error": "Failed to parse analysis results. Please try again later."}
    except Exception as e:
        print(f"Unexpected error in stock fit analysis for {ticker}: {e}")
        return {"error": f"An unexpected error occurred while analyzing {ticker}. Please try again later."}


def create_stock_fit_prompt(ticker, metrics, portfolio):
    """
    Create a prompt for the LLM to analyze if a stock is a good fit

    Parameters:
        ticker (str): Stock ticker symbol
        metrics (dict): Stock metrics data
        portfolio (Portfolio): User's portfolio data

    Returns:
        str: Formatted prompt for the LLM
    """
    # Format portfolio allocation for display
    portfolio_allocation = ""
    for asset in portfolio.portfolio_allocation:
        portfolio_allocation += f"- {asset['name']}: {asset['value']}% (recommended allocation)"
        if asset["name"] == "Equities":
            # Add details about existing securities if they're available
            equity_securities = [s for s in portfolio.securities if s.get("assetClass") == "Equities"]
            if equity_securities:
                portfolio_allocation += " ("
                portfolio_allocation += ", ".join([s.get("name", "") for s in equity_securities])
                portfolio_allocation += ")"
        portfolio_allocation += "\n"

    # Handle cases where marketCap might be None or 0
    market_cap_str = "N/A"
    try:
        if metrics["marketCap"] and metrics["marketCap"] > 0:
            market_cap_str = f"${metrics['marketCap'] / 1000000000:.1f}B"
    except (TypeError, ValueError):
        pass

    # Format the metrics data with safe formatting
    metrics_str = f"""
- Ticker: {metrics['ticker']}
- Company Name: {metrics['companyName']}
- Current Price: ${metrics['price']}
- Market Cap: {market_cap_str}
- Beta: {metrics['beta']}
- P/E Ratio: {metrics['peRatio']}
- Dividend Yield: {metrics['dividendYield']}%
- 52-Week High/Low: ${metrics['yearHigh']} / ${metrics['yearLow']}
- Sector: {metrics['sector']}
- Volatility: {metrics['volatility']}%
- Earnings Per Share Growth (Annual): {metrics['earningsGrowth']}%
- Security Type: {"ETF/Fund" if metrics['isETF'] else "Individual Stock"}
"""

    # Create the appropriate prompt based on security type
    if metrics["isETF"]:
        prompt = f"""You are a professional investment analyst. Analyze whether the ETF {ticker} is a good fit for a user's portfolio 
based on their risk profile, investment goals, and the ETF's metrics.

USER QUESTIONNAIRE AND PROFILE:
- Risk Profile: {portfolio.risk_profile}
- Investment Goal: {portfolio.investment_goal}
- Time Horizon: {portfolio.time_horizon} years

CURRENT PORTFOLIO ALLOCATION:
{portfolio_allocation}

SECURITY METRICS:
{metrics_str}

EVALUATION CRITERIA FOR ETFs:
1. Risk Profile Alignment:
   - For "Moderately Aggressive" profiles, ETFs with moderate to high-growth potential and moderate volatility (typically 10%-20%)
   - For "Moderate" profiles, ETFs with balanced exposure and moderate volatility (typically 8%-15%)
   - For "Conservative" profiles, ETFs with lower volatility and more stable returns (typically <10%)
   - For "Aggressive" profiles, ETFs with higher-growth focus and higher volatility (typically >20%)

2. Portfolio Diversification:
   - Consider sector diversification within the equity portion of the portfolio
   - Consider market cap exposure (large-cap, mid-cap, small-cap)
   - Recommend what percentage of the equity allocation this ETF should represent
   - Suggest complementary investments to achieve proper diversification

3. Cost Efficiency:
   - ETFs are typically chosen for their low expense ratios and tax efficiency
   - Consider how this ETF's dividend yield aligns with the overall portfolio strategy

Return your analysis in this JSON format:
{{
  "recommendation": "Good Fit" | "Moderate Fit" | "Poor Fit",
  "explanation": "Detailed explanation of the ETF's fit with the user's profile and portfolio",
  "keyFactors": {{
    "riskAlignment": "Explanation of how the ETF's risk metrics align with user's profile",
    "growthPotential": "Analysis of growth metrics and alignment with goals",
    "portfolioDiversification": "What percentage of the equity allocation should go to this ETF and why"
  }},
  "suggestedAllocation": "Specific percentage of the total portfolio and percentage of the equity allocation this ETF should represent",
  "alternatives": "If poor fit, suggest alternatives" 
}}

RECOMMENDATION GUIDELINES:
Use "Good Fit" when:
- The ETF's risk metrics (beta, volatility) strongly align with the user's risk profile
- The market cap and growth metrics clearly support the user's investment goals
- The ETF would meaningfully contribute to portfolio diversification
- You are confident in recommending a substantial allocation

Use "Poor Fit" when:
- The ETF's risk metrics significantly deviate from the user's risk profile
- The market cap or growth characteristics conflict with the user's goals
- The ETF would create portfolio imbalance or concentration risk
- You have strong reservations about recommending any allocation

Only use "Moderate Fit" when:
- The ETF has a fairly even mix of positive and negative factors
- You cannot make a strong case for either "Good Fit" or "Poor Fit"
- The ETF could work but only with a very specific, limited allocation

When suggesting allocation amounts, be specific about the recommended percentages. For example: "Allocate 10% of total portfolio (which is 25% of the 40% equity allocation) to this ETF."

Be specific and thorough in your analysis, focusing on how the ETF fits within a diversified portfolio."""
    else:
        prompt = f"""You are a professional investment analyst. Analyze whether the stock {ticker} is a good fit for a user's portfolio 
based on their risk profile, investment goals, and the stock's metrics.

USER QUESTIONNAIRE AND PROFILE:
- Risk Profile: {portfolio.risk_profile}
- Investment Goal: {portfolio.investment_goal}
- Time Horizon: {portfolio.time_horizon} years

CURRENT PORTFOLIO ALLOCATION:
{portfolio_allocation}

SECURITY METRICS:
{metrics_str}

EVALUATION CRITERIA:
1. Risk Profile Alignment:
   - For "Moderately Aggressive" profiles, beta should be 1.0-1.5, volatility 15%-25%
   - For "Moderate" profiles, beta should be 0.8-1.2, volatility 10%-20% 
   - For "Conservative" profiles, beta should be <0.8, volatility <15%
   - For "Aggressive" profiles, beta can be >1.5, volatility >20%

2. Market Cap and Size:
   - Consider the company's market capitalization in relation to the user's risk profile
   - Analyze how the market cap affects stability and growth potential
   - Evaluate market cap in context of the overall sector and market conditions

3. Growth Potential:
   - Higher P/E ratios may indicate overvaluation
   - Strong earnings per share growth is positive (>10% for growth-oriented portfolios)
   - Consider growth metrics in context of market cap and sector

4. Income Needs:
   - Higher dividend yield is important for income-focused portfolios
   - For growth-focused portfolios, dividends are less critical

5. Portfolio Diversification:
   - Consider sector diversification within the equity portion of the portfolio
   - Consider market cap diversification
   - Recommend what percentage of the equity allocation this stock should represent
   - Suggest complementary investments to achieve proper diversification

Return your analysis in this JSON format:
{{
  "recommendation": "Good Fit" | "Moderate Fit" | "Poor Fit",
  "explanation": "Detailed explanation of the stock's fit with the user's profile and portfolio",
  "keyFactors": {{
    "riskAlignment": "Explanation of how the stock's risk metrics align with user's profile",
    "growthPotential": "Analysis of growth metrics and alignment with goals",
    "portfolioDiversification": "What percentage of the equity allocation should go to this stock and why"
  }},
  "suggestedAllocation": "Specific percentage of the total portfolio and percentage of the equity allocation this stock should represent",
  "alternatives": "If poor fit, suggest alternatives" 
}}

RECOMMENDATION GUIDELINES:
Use "Good Fit" when:
- The security's risk metrics (beta, volatility) strongly align with the user's risk profile
- The market cap and growth metrics clearly support the user's investment goals
- The security would meaningfully contribute to portfolio diversification
- You are confident in recommending a substantial allocation

Use "Poor Fit" when:
- The security's risk metrics significantly deviate from the user's risk profile
- The market cap or growth characteristics conflict with the user's goals
- The security would create portfolio imbalance or concentration risk
- You have strong reservations about recommending any allocation

Only use "Moderate Fit" when:
- The security has a fairly even mix of positive and negative factors
- You cannot make a strong case for either "Good Fit" or "Poor Fit"
- The security could work but only with a very specific, limited allocation

When suggesting allocation amounts, be specific about the recommended percentages. For example: "Allocate 3% of total portfolio (which is 7.5% of the 40% equity allocation) to this stock."

Be specific and thorough in your analysis, focusing on how the stock fits within a diversified portfolio."""
    return prompt


def get_stock_metrics(ticker):
    """
    Gather all metrics needed for stock fit analysis

    Parameters:
        ticker (str): Stock ticker symbol

    Returns:
        dict: Comprehensive stock metrics
    """
    try:
        # Get basic quote data
        quote = get_stock_quote(ticker)
        if not quote:
            print(f"Failed to retrieve quote data for {ticker}")
            return None

        # Get company profile
        profile = get_company_profile(ticker)
        if not profile:
            print(f"Failed to retrieve company profile for {ticker}")
            return None

        # Get historical prices for volatility and 52-week high/low
        historical_data = get_historical_prices(ticker)
        if not historical_data:
            print(f"Failed to retrieve historical prices for {ticker}")
            return None

        # Get financial ratios - this may be null for some stocks like ETFs
        ratios = get_financial_ratios(ticker)
        if not ratios:
            print(f"Note: No financial ratios available for {ticker}, likely an ETF or fund")

        # Calculate volatility with safety check
        volatility = 0
        try:
            volatility = calculate_volatility(historical_data) or 0
        except Exception as e:
            print(f"Error calculating volatility for {ticker}: {e}")

        # Calculate 52-week high/low with safety check
        high_low = {"high": 0, "low": 0}
        try:
            high_low = get_52_week_high_low(historical_data)
            if not high_low or high_low.get("high") is None:
                high_low = {"high": 0, "low": 0}
        except Exception as e:
            print(f"Error calculating 52-week high/low for {ticker}: {e}")

        # Get earnings per share growth with safety check
        earnings_growth = 0
        try:
            # First try to get earnings per share growth directly from the API
            earnings_growth = get_earnings_growth(ticker)

            # Fallback to calculated earnings per share growth if direct API call fails
            if earnings_growth is None and ratios:
                earnings_growth = calculate_earnings_growth(ratios) or 0
        except Exception as e:
            print(f"Error getting earnings per share growth for {ticker}: {e}")

        # Special handling for ETFs and funds which may lack some metrics
        is_etf = (
            profile.get("industry") == "ETF"
            or "ETF" in profile.get("companyName", "")
            or "ETF" in quote.get("name", "")
            or quote.get("name", "").endswith("ETF")
        )

        if is_etf:
            print(f"{ticker} appears to be an ETF or fund, using adjusted metrics")

        # Compile all metrics with safety defaults
        metrics = {
            "ticker": ticker,
            "companyName": quote.get("name", "Unknown"),
            "price": quote.get("price", 0) or 0,
            "marketCap": quote.get("marketCap", 0) or 0,
            "beta": profile.get("beta", 1.0) or 1.0,  # Default to market beta
            "peRatio": quote.get("pe", 0) or 0,
            "dividendYield": 0,
            "yearHigh": high_low.get("high") or quote.get("yearHigh", 0) or 0,
            "yearLow": high_low.get("low") or quote.get("yearLow", 0) or 0,
            "sector": profile.get("sector", "Unknown") or "Unknown",
            "volatility": volatility or 0,
            "earningsGrowth": earnings_growth or 0,
            "isETF": is_etf,
        }

        # Calculate dividend yield safely
        if quote.get("price", 0) and quote.get("price", 0) > 0:
            metrics["dividendYield"] = (profile.get("lastDiv", 0) / quote.get("price", 1)) * 100

        print(f"Successfully compiled metrics for {ticker}")
        return metrics

    except Exception as e:
        print(f"Unexpected error in get_stock_metrics for {ticker}: {e}")
        return None
