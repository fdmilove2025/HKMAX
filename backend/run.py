from app import create_app

#!/usr/bin/env python3
"""
InvestBuddy Backend Server
Run this script to start the Flask server.
"""
app = create_app()

if __name__ == "__main__":
    print("Starting InvestBuddy API server...")
    print("Go to http://localhost:5001/api to access the API")
    app.run(debug=True, host="0.0.0.0", port=5001)
