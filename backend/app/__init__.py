from flask import Flask, make_response, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from app.models import db, User

load_dotenv()  # Load environment variables from .env file

def create_app(config=None):
    app = Flask(__name__)
    
    if config == 'testing':
        # Use SQLite for testing
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key'
        app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    else:
        # Configure the app for production/development
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
        app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 hour in seconds
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize CORS with more permissive settings
    CORS(app, 
         resources={r"/api/*": {
             "origins": ["http://localhost:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600
         }},
         supports_credentials=True)
    
    # Add after_request handler to ensure CORS headers are set
    @app.after_request
    def after_request(response):
        if request.method == 'OPTIONS':
            response = make_response()
            response.status_code = 200
            # Only set CORS headers for OPTIONS requests
            response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept,Origin,X-Requested-With'
            response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    db.init_app(app)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp)
    
    from app.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    # Print all registered routes for debugging
    print("\nRegistered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule.methods} {rule}")
    print("\n")
    
    return app
