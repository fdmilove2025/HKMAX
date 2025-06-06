from flask import Flask, make_response, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from app.models import db, User

load_dotenv()  # Load environment variables from .env file

def create_app():
    app = Flask(__name__)
    
    # Configure the app
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')  # Use the same secret key for JWT
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 hour in seconds
    
    # Database configuration - MySQL only
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
            "supports_credentials": True
        }
    })
    
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
    
    return app
