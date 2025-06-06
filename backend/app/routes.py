from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.portfolio_analyzer import analyze_portfolio_combined, recommend_securities, get_financial_tips
from app.models import db, Portfolio, User
from app.api_service import get_stock_list, filter_stocks, get_symbols_only, analyze_stock_fit, get_stock_metrics

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/assess', methods=['POST'])
@jwt_required()
def assess_portfolio():
    """
    Endpoint to assess risk profile and generate portfolio recommendations
    based on questionnaire answers. Saves results to database.
    """
    # Get current user
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get data from request
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Required fields
    required_fields = [
        'investmentGoal', 'timeHorizon', 
        'riskReaction', 'returnPreference', 'financialObligations', 'experience'
    ]
    
    # Check if all required fields are present
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
    
    try:
        print(f"Starting portfolio assessment for user {user.id}")
        print(f"User data: {data}")
        
        # Use the combined function to reduce LLM calls
        print("Calling analyze_portfolio_combined...")
        combined_results = analyze_portfolio_combined(data)
        print(f"Combined results: {combined_results}")
        
        # Recommend specific securities based on user data and the allocation from combined results
        print("Calling recommend_securities...")
        securities = recommend_securities(data, combined_results["portfolioAllocation"])
        print(f"Securities recommendations: {securities}")
        
        # Create new portfolio record
        print("Creating portfolio record...")
        portfolio = Portfolio(
            user_id=user.id,
            investment_goal=data['investmentGoal'],
            time_horizon=int(data['timeHorizon']),
            risk_reaction=data['riskReaction'],
            return_preference=data['returnPreference'],
            financial_obligations=data['financialObligations'],
            experience=data['experience'],
            risk_profile=combined_results["riskProfile"],
            portfolio_allocation=combined_results["portfolioAllocation"],
            securities=securities,
            insights=combined_results["insights"]
        )
        
        # Save to database
        print("Saving portfolio to database...")
        db.session.add(portfolio)
        db.session.commit()
        print("Portfolio saved successfully")
        
        return jsonify({
            'riskProfile': combined_results["riskProfile"],
            'portfolioAllocation': combined_results["portfolioAllocation"],
            'securities': securities,
            'insights': combined_results["insights"]
        })
        
    except Exception as e:
        print(f"Error in assess_portfolio: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/portfolio/history', methods=['GET'])
@jwt_required()
def get_portfolio_history():
    """
    Get the user's portfolio assessment history
    """
    try:
        current_user_id = get_jwt_identity()
        portfolios = Portfolio.query.filter_by(user_id=current_user_id).order_by(Portfolio.created_at.desc()).all()
        
        return jsonify({
            'portfolios': [{
                'id': p.id,
                'created_at': p.created_at.isoformat(),
                'risk_profile': p.risk_profile,
                'portfolio_allocation': p.portfolio_allocation,
                'securities': p.securities,
                'insights': p.insights
            } for p in portfolios]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/tips', methods=['GET'])
def get_tips():
    """
    Endpoint to get financial tips to display while waiting for analysis.
    """
    try:
        tips = get_financial_tips()
        return jsonify({
            'tips': tips
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/stock/list', methods=['GET'])
def stocks_list():
    """
    Endpoint to get a list of all company ticker symbols from Financial Modeling Prep API.
    """
    try:
        stocks = get_stock_list()
        if stocks is None:
            return jsonify({'error': 'Failed to retrieve stock list from Financial Modeling Prep API'}), 500
        return jsonify(stocks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/stock/search', methods=['GET'])
def search_stocks():
    """
    Endpoint to search and filter stocks by query parameters.
    
    Query parameters:
    - q: Search query for symbol or name
    - exchange: Filter by exchange name
    - limit: Maximum number of results to return (default: 100)
    """
    try:
        query = request.args.get('q')
        exchange = request.args.get('exchange')
        limit = request.args.get('limit', 100, type=int)
        
        stocks = filter_stocks(query, exchange, limit)
        
        return jsonify(stocks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/stock/symbols', methods=['GET'])
def get_symbols():
    """
    Endpoint to get just the ticker symbols from all companies.
    """
    try:
        symbols = get_symbols_only()
        return jsonify(symbols)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/stock/fit/<ticker>', methods=['GET'])
@jwt_required()
def analyze_stock_portfolio_fit(ticker):
    """
    Endpoint to analyze whether a stock is a good fit for the user's portfolio
    based on their risk profile, current portfolio allocation, and stock metrics.
    
    Parameters:
    - ticker: Stock ticker symbol (e.g., AAPL)
    
    Returns:
    - JSON with stock fit analysis including recommendation, explanation, and metrics
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Validate ticker - ensure it's uppercase for consistency with the FMP API
        ticker = ticker.strip().upper()
        if not ticker or len(ticker) > 10:
            return jsonify({"error": "Invalid ticker symbol"}), 400
            
        # Call the analyze_stock_fit function with the ticker and user_id
        analysis = analyze_stock_fit(ticker, current_user_id)
        
        if analysis is None:
            return jsonify({"error": f"Could not analyze {ticker}. Please try again later."}), 500
            
        if "error" in analysis:
            # Return a 400 status for user-facing errors (invalid ticker, no portfolio)
            # but a 500 for service errors (API issues, LLM problems)
            if "not supported" in analysis["error"] or "No portfolio found" in analysis["error"]:
                return jsonify({"error": analysis["error"]}), 400
            else:
                return jsonify({"error": analysis["error"]}), 500
            
        return jsonify(analysis)
    except Exception as e:
        print(f"Unhandled error in analyze_stock_portfolio_fit for {ticker}: {e}")
        return jsonify({'error': f"An error occurred while analyzing {ticker}. Please try again later."}), 500

@api_bp.route('/stock/info/<ticker>', methods=['GET'])
def get_stock_info(ticker):
    """
    Endpoint to get basic stock information without requiring login.
    This allows users to search for stocks and see basic information before deciding
    to view analytics (which requires login).
    
    Parameters:
    - ticker: Stock ticker symbol (e.g., AAPL)
    
    Returns:
    - JSON with stock information including quote, profile, and metrics
    """
    try:
        # Validate ticker - ensure it's uppercase for consistency with the FMP API
        ticker = ticker.strip().upper()
        if not ticker or len(ticker) > 10:
            return jsonify({"error": "Invalid ticker symbol"}), 400
            
        # Get stock metrics (includes quote and profile data)
        metrics = get_stock_metrics(ticker)
        
        if metrics is None or "error" in metrics:
            error_msg = metrics.get("error", f"Could not retrieve information for {ticker}") if metrics else f"Could not retrieve information for {ticker}"
            return jsonify({"error": error_msg}), 404
            
        return jsonify(metrics)
    except Exception as e:
        print(f"Unhandled error in get_stock_info for {ticker}: {e}")
        return jsonify({'error': f"An error occurred while retrieving information for {ticker}. Please try again later."}), 500

# Preload tips at module initialization to avoid delay when first requested
_preloaded_tips = get_financial_tips()
