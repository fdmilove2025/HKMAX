import os
import json
import re
from datetime import datetime
from app.llm_service import generate_response
from flask_login import current_user


def analyze_portfolio_combined(user_data):
    """
    Unified function to analyze user data and generate all necessary outputs with a single LLM call.
    This reduces the number of separate LLM calls by combining risk profile, allocation, and insights.

    Parameters:
    - user_data: Dictionary with user questionnaire answers

    Returns:
    - Dictionary with riskProfile, portfolioAllocation, and insights
    """
    from app.llm_service import generate_response

    # Extract user inputs
    investment_goal = user_data.get("investmentGoal", "Growth")
    time_horizon = user_data.get("timeHorizon", 10)
    # Get age from the current user instead of questionnaire data
    age = getattr(current_user, "age", None)
    if age is None:
        # If age is not set, use a default value based on time horizon
        age = 30 if int(time_horizon) > 10 else 50
    risk_reaction = user_data.get("riskReaction", "Moderate")
    return_preference = user_data.get("returnPreference", "Balanced")
    financial_obligations = user_data.get("financialObligations", ["None"])
    investment_experience = user_data.get("experience", "Intermediate")

    # Format the obligations as a string
    if isinstance(financial_obligations, list):
        obligations_str = ", ".join(financial_obligations)
    else:
        obligations_str = str(financial_obligations)

    # Create a comprehensive prompt that asks for all the information we need
    prompt = f"""You are a sophisticated investment advisor. Based on the following user input, provide the following:
1. Risk profile classification (Conservative, Moderately Conservative, Moderate, Moderately Aggressive, or Aggressive)
2. Recommended portfolio allocation with percentages for these asset classes: Equities, Bonds, Cash, Real Estate, Commodities, Alternative Investments
3. Personalized investment insights and recommendations

Here is the user's information:
- Investment Goal: {investment_goal}
- Time Horizon: {time_horizon} years
- Age: {age} years
- Risk Reaction: {risk_reaction}
- Return Preference: {return_preference}
- Financial Obligations: {obligations_str}
- Investment Experience: {investment_experience}

Return your response in this JSON format:
{{
  "riskProfile": "one of [Conservative, Moderately Conservative, Moderate, Moderately Aggressive, Aggressive]",
  "portfolioAllocation": [
    {{"name": "Equities", "value": percentage}},
    {{"name": "Bonds", "value": percentage}},
    {{"name": "Cash", "value": percentage}},
    {{"name": "Real Estate", "value": percentage}},
    {{"name": "Commodities", "value": percentage}},
    {{"name": "Alternative Investments", "value": percentage}}
  ],
  "insights": "Detailed personalized investment insights and recommendations based on the provided information."
}}

IMPORTANT: 
1. Ensure all percentages add up to 100 and don't use any fields outside the specified format.
2. When suggesting the Equities allocation, keep in mind that this is a high-level recommendation. The user will need to further allocate within this category across different stocks, ETFs, and sectors.
3. For example, if you recommend 40% in Equities, your insights should include guidance on how to diversify within that equity allocation (e.g., large cap, small cap, international, different sectors, etc.).
4. Return ONLY the JSON object, with no additional text or explanation before or after it.
5. Ensure all strings are properly escaped and closed.
6. Do not include any text before or after the JSON object.
7. The response must be a single valid JSON object.
8. Do not include any thinking or explanation text.
"""

    # Generate response from LLM
    llm_response = generate_response(prompt)
    print("=" * 50)
    print("DEBUG: Raw LLM Response")
    print("=" * 50)
    print(llm_response)
    print("=" * 50)

    try:
        # First try to parse the response directly as JSON
        try:
            result = json.loads(llm_response)
            return result
        except json.JSONDecodeError:
            # If direct parsing fails, try to find JSON object
            json_pattern = r'{\s*"riskProfile"\s*:\s*"[^"]*"\s*,\s*"portfolioAllocation"\s*:\s*\[.*?\]\s*,\s*"insights"\s*:\s*"[^"]*"\s*}'
            json_match = re.search(json_pattern, llm_response, re.DOTALL)

            if json_match:
                json_str = json_match.group(0)
                print("=" * 50)
                print("DEBUG: Extracted JSON String")
                print("=" * 50)
                print(json_str)
                print("=" * 50)

                # Clean the JSON string
                json_str = re.sub(r"\n\s*", " ", json_str)  # Replace newlines and spaces with single space
                json_str = re.sub(r"\\[rn]", "", json_str)  # Remove escaped newlines
                json_str = re.sub(r'\\"', '"', json_str)  # Fix escaped quotes
                json_str = re.sub(r"\\t", " ", json_str)  # Replace tabs with spaces
                json_str = re.sub(r"\\u[0-9a-fA-F]{4}", "", json_str)  # Remove unicode escapes
                json_str = re.sub(r",\s*]", "]", json_str)  # Remove trailing commas
                json_str = re.sub(r"//.*?\n", "\n", json_str)  # Remove comments
                # Fix unclosed strings
                json_str = re.sub(r'([^\\])"([^"]*?)(?:\n|$)', r'\1"\2"', json_str)

                print("=" * 50)
                print("DEBUG: Cleaned JSON String")
                print("=" * 50)
                print(json_str)
                print("=" * 50)

                # Try to parse the JSON
                try:
                    result = json.loads(json_str)
                    return result
                except json.JSONDecodeError as e:
                    print("=" * 50)
                    print("DEBUG: JSON Parse Error")
                    print("=" * 50)
                    print(f"Error message: {str(e)}")
                    print(f"Error position: {e.pos}")
                    print(f"Error line: {e.lineno}")
                    print(f"Error column: {e.colno}")
                    print("=" * 50)
                    raise ValueError(f"Could not parse cleaned JSON: {str(e)}")
            else:
                # If no JSON found, try to extract just the portfolio allocation
                allocation_pattern = r'"portfolioAllocation"\s*:\s*\[(.*?)\]'
                allocation_match = re.search(allocation_pattern, llm_response, re.DOTALL)
                if allocation_match:
                    # Create a minimal valid JSON structure
                    json_str = f'{{"riskProfile": "Moderate", "portfolioAllocation": [{allocation_match.group(1)}], "insights": "Based on your profile, a balanced approach is recommended."}}'
                    try:
                        result = json.loads(json_str)
                        return result
                    except json.JSONDecodeError:
                        pass

                raise ValueError("Could not find valid JSON object in LLM response")
    except Exception as e:
        print("=" * 50)
        print("DEBUG: Unexpected Error")
        print("=" * 50)
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("=" * 50)
        raise ValueError(f"Error processing LLM response: {str(e)}")


def recommend_securities(user_data, portfolio_allocation):
    """
    Recommend specific securities based directly on user data and portfolio allocation.

    Parameters:
    - user_data: Dictionary with questionnaire answers
    - portfolio_allocation: List of dictionaries with asset class allocations

    Returns:
    - securities: List of dictionaries with security recommendations
    """
    # Convert portfolio allocation to a formatted string for the prompt
    allocation_str = ""
    for item in portfolio_allocation:
        allocation_str += f"- {item['name']}: {item['value']}% (recommended allocation)\n"

    # Determine risk profile from user data for more tailored suggestions
    risk_level = "unknown"
    if user_data.get("riskReaction") == "Buy More":
        risk_level = "aggressive"
    elif user_data.get("riskReaction") == "Hold" and user_data.get("returnPreference") == "Higher Volatile Growth":
        risk_level = "moderately aggressive"
    elif user_data.get("experience") == "Advanced" and int(user_data.get("timeHorizon", 0)) > 10:
        risk_level = "aggressive"
    elif user_data.get("returnPreference") == "Stable Predictable Returns":
        risk_level = "conservative"
    else:
        risk_level = "moderate"

    # Include user's age in the recommendation context
    age = getattr(current_user, "age", None)
    if age is None:
        # If age is not set, use a default value based on time horizon
        age = 30 if int(user_data.get("timeHorizon", 10)) > 10 else 50

    prompt = f"""You are an expert investment advisor. Based on the following user information and portfolio allocation, 
recommend specific securities (such as ETFs, mutual funds, stocks, bonds, etc.) appropriate for each asset class.

User information:
- Age: {age} years
- Risk profile: {risk_level}
- Time horizon: {user_data.get('timeHorizon', 10)} years
- Investment goal: {user_data.get('investmentGoal', 'Growth')}
- Experience level: {user_data.get('experience', 'Intermediate')}

Recommended portfolio allocation:
{allocation_str}

For each asset class with an allocation > 0%, recommend 1-3 specific securities with these details:
1. Ticker/symbol (if applicable)
2. Name
3. Brief description (1-2 sentences)
4. Why it's appropriate for this investor

Return your response in this JSON array format:
[
  {{
    "assetClass": "Asset class name",
    "ticker": "Symbol",
    "name": "Security name",
    "description": "Brief description of the security",
    "rationale": "Why this is appropriate for the investor"
  }},
  // More securities...
]

NOTES:
- Focus on low-cost, diversified options when possible (e.g., index funds, ETFs)
- Include a mix of securities for each asset class with allocation > 5%
- Be specific with actual ticker symbols and real securities
- Don't include securities that don't match the specified asset classes
- No need to recommend securities for asset classes with 0% allocation
- When recommending equities, ensure appropriate diversification across market caps, sectors, and geographic regions
- Ensure all tickers are valid and not "N/A"
- The response must start with [ and end with ]
- Return a valid JSON array, not a sequence of individual objects
"""

    # Generate response from LLM
    llm_response = generate_response(prompt)
    print("=" * 50)
    print("DEBUG: Raw LLM Response for Securities")
    print("=" * 50)
    print(llm_response)
    print("=" * 50)

    try:
        # Function to convert individual JSON objects into a JSON array
        def convert_objects_to_array(text):
            # Find all JSON objects
            objects = re.findall(r'{\s*"assetClass".*?}', text, re.DOTALL)
            if objects:
                # Combine objects into a JSON array
                array_str = "[\n" + ",\n".join(objects) + "\n]"
                return array_str
            return None

        # First try to parse the response directly as JSON
        try:
            # Check if response starts with [ for a JSON array
            if llm_response.strip().startswith("["):
                securities = json.loads(llm_response)
                if isinstance(securities, list):
                    print("=" * 50)
                    print("DEBUG: Successfully parsed JSON array")
                    print("=" * 50)
                    print(securities)
                    print("=" * 50)
                    return securities
        except json.JSONDecodeError:
            pass

        # If not a JSON array, try to extract individual JSON objects
        array_str = convert_objects_to_array(llm_response)
        if array_str:
            print("=" * 50)
            print("DEBUG: Converted individual objects to array")
            print("=" * 50)
            print(array_str)
            print("=" * 50)

            try:
                securities = json.loads(array_str)
                if isinstance(securities, list):
                    return securities
            except json.JSONDecodeError as e:
                print(f"Error parsing converted array: {str(e)}")

        # If still not successful, try to find an array pattern
        json_match = re.search(r"\[\s*{[\s\S]*}\s*\]", llm_response)
        if json_match:
            json_str = json_match.group(0)
            print("=" * 50)
            print("DEBUG: Extracted JSON String")
            print("=" * 50)
            print(json_str)
            print("=" * 50)

            # Clean the JSON string
            json_str = re.sub(r"\n\s*", " ", json_str)  # Replace newlines and spaces with single space
            json_str = re.sub(r"\\[rn]", "", json_str)  # Remove escaped newlines
            json_str = re.sub(r'\\"', '"', json_str)  # Fix escaped quotes
            json_str = re.sub(r"\\t", " ", json_str)  # Replace tabs with spaces
            json_str = re.sub(r"\\u[0-9a-fA-F]{4}", "", json_str)  # Remove unicode escapes
            json_str = re.sub(r",\s*]", "]", json_str)  # Remove trailing commas
            json_str = re.sub(r"//.*?\n", "\n", json_str)  # Remove comments
            # Fix unclosed strings
            json_str = re.sub(r'([^\\])"([^"]*?)(?:\n|$)', r'\1"\2"', json_str)

            try:
                securities = json.loads(json_str)
                if isinstance(securities, list):
                    print("=" * 50)
                    print("DEBUG: Successfully parsed JSON array")
                    print("=" * 50)
                    print(securities)
                    print("=" * 50)
                    return securities
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {str(e)}")
                print(f"Problematic JSON string: {json_str}")

        # If all parsing attempts fail, manually extract individual securities
        securities = []
        asset_class_pattern = r'"assetClass"\s*:\s*"([^"]+)"'
        ticker_pattern = r'"ticker"\s*:\s*"([^"]+)"'
        name_pattern = r'"name"\s*:\s*"([^"]+)"'
        desc_pattern = r'"description"\s*:\s*"([^"]+)"'
        rationale_pattern = r'"rationale"\s*:\s*"([^"]+)"'

        # Find all asset classes
        asset_classes = re.findall(asset_class_pattern, llm_response)
        tickers = re.findall(ticker_pattern, llm_response)
        names = re.findall(name_pattern, llm_response)
        descs = re.findall(desc_pattern, llm_response)
        rationales = re.findall(rationale_pattern, llm_response)

        # If we have matches for all fields and the same count, create securities
        if (
            asset_classes
            and tickers
            and names
            and descs
            and len(asset_classes) == len(tickers) == len(names) == len(descs)
        ):
            for i in range(len(asset_classes)):
                security = {
                    "assetClass": asset_classes[i],
                    "ticker": tickers[i],
                    "name": names[i],
                    "description": descs[i],
                }
                if i < len(rationales):
                    security["rationale"] = rationales[i]
                securities.append(security)

            if securities:
                print("=" * 50)
                print("DEBUG: Manually extracted securities")
                print("=" * 50)
                print(securities)
                print("=" * 50)
                return securities

        # If we still don't have valid securities, try the existing extract_securities_from_text
        securities = extract_securities_from_text(llm_response, portfolio_allocation)
        if securities:
            print("=" * 50)
            print("DEBUG: Extracted securities from text")
            print("=" * 50)
            print(securities)
            print("=" * 50)
            return securities

        # If all else fails, raise an error
        raise ValueError("Could not parse securities recommendations from LLM response")

    except Exception as e:
        print(f"Error in recommend_securities: {str(e)}")
        raise ValueError(f"Error processing securities recommendations: {str(e)}")


def generate_dynamic_securities_with_llm(user_data, portfolio_allocation):
    """
    Generate security recommendations using LLM when the primary method fails.
    This is a fallback that still uses the LLM but with a simplified approach.

    Parameters:
    - user_data: Dictionary with user data
    - portfolio_allocation: List of dictionaries with asset class allocations

    Returns:
    - securities: List of dictionaries with security recommendations
    """
    try:
        # Create a simpler prompt
        risk_profile = "moderate"  # Default
        if user_data.get("riskReaction") == "Buy More" or user_data.get("returnPreference") == "Higher Volatile Growth":
            risk_profile = "aggressive"
        elif (
            user_data.get("riskReaction") == "Panic and Sell"
            or user_data.get("returnPreference") == "Stable Predictable Returns"
        ):
            risk_profile = "conservative"

        asset_classes = [item["name"] for item in portfolio_allocation if item["value"] > 0]
        asset_classes_str = ", ".join(asset_classes)

        # Simplified prompt for fallback
        prompt = f"""
        Recommend investment securities for a {risk_profile} investor with these asset classes: {asset_classes_str}.
        Return ONLY a valid JSON array with name, ticker, description and assetClass fields for each recommendation.
        Include a diverse range of products appropriate for the risk level.
        For aggressive investors, include some individual stocks and potentially cryptocurrency.
        """

        json_response = generate_response(prompt, max_tokens=800)

        # Try to extract and process JSON
        json_pattern = r"\[\s*\{.*?\}\s*(?:,\s*\{.*?\}\s*)*\]"
        matches = re.findall(json_pattern, json_response, re.DOTALL)

        if matches:
            securities = json.loads(matches[0])
            return securities
        else:
            # Last resort - create basic recommendations
            securities = []
            for asset_class in asset_classes:
                securities.append(
                    {
                        "name": f"Recommended {asset_class} Investment",
                        "ticker": "N/A",
                        "description": f"A suitable {asset_class.lower()} investment for {risk_profile} investors.",
                        "assetClass": asset_class,
                    }
                )
            return securities

    except Exception as e:
        print(f"Error in fallback security generation: {e}")
        # Empty securities list as last resort
        return []


def extract_securities_from_text(text, portfolio_allocation):
    """
    Extract securities information from text when JSON parsing fails.

    Parameters:
    - text: The LLM response text
    - portfolio_allocation: The portfolio allocation to determine asset classes

    Returns:
    - securities: List of dictionaries with security information
    """
    securities = []
    asset_classes = [item["name"] for item in portfolio_allocation if item["value"] > 0]

    for asset_class in asset_classes:
        # Look for sections that might correspond to this asset class
        class_pattern = rf'{asset_class}[:\s-]+(.*?)(?:(?:{"|".join(asset_classes)})[:\s-]+|$)'
        class_match = re.search(class_pattern, text, re.DOTALL | re.IGNORECASE)

        if class_match:
            class_text = class_match.group(1)

            # Try to find security names and tickers
            name_ticker_pattern = r"([^()]+)\s*\(([^)]+)\)"
            for match in re.finditer(name_ticker_pattern, class_text):
                name = match.group(1).strip()
                ticker = match.group(2).strip()

                # Extract a description if possible
                desc_pattern = rf"{re.escape(name)}\s*\({re.escape(ticker)}\)[^.]*\.([^.]+)"
                desc_match = re.search(desc_pattern, class_text)
                description = (
                    desc_match.group(1).strip() if desc_match else f"A {asset_class.lower()} investment option."
                )

                securities.append(
                    {"name": name, "ticker": ticker, "description": description, "assetClass": asset_class}
                )

    # If we couldn't extract any securities, create at least one per asset class
    if not securities:
        for asset_class in asset_classes:
            securities.append(
                {
                    "name": f"Recommended {asset_class} Fund",
                    "ticker": "N/A",
                    "description": f"A diversified {asset_class.lower()} investment appropriate for {asset_class.lower()} allocation.",
                    "assetClass": asset_class,
                }
            )

    return securities


def get_financial_tips():
    """Get financial tips for the loading screen"""
    return [
        "Dollar-cost averaging can help reduce the impact of market volatility on your investments.",
        "Consider rebalancing your portfolio annually to maintain your target asset allocation.",
        "Tax-advantaged accounts like 401(k)s and IRAs can significantly boost long-term returns.",
        "Emergency funds should typically cover 3-6 months of expenses before aggressive investing.",
        "Diversification across asset classes can help manage risk in your portfolio.",
        "Past performance doesn't guarantee future results - focus on long-term strategy.",
        "Low-cost index funds often outperform actively managed funds over long periods.",
        "Compounding returns are most powerful over long time horizons.",
        "Consider your risk tolerance when designing your investment strategy.",
        "High fees can significantly reduce your long-term investment returns.",
        "Emotional decisions during market downturns often lead to buying high and selling low.",
        "Investment goals should be specific, measurable, achievable, relevant, and time-bound (SMART).",
        "Regular contributions to your investment accounts can be more important than timing the market.",
        "Inflation can erode the purchasing power of cash over time.",
        "International diversification can reduce risk and provide exposure to global growth.",
    ]
