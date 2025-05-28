from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_login import LoginManager
from app.models import db, User

load_dotenv()  # Load environment variables from .env file

def create_app():
    app = Flask(__name__)
    
    # Configure the app
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    
    # Database configuration - MySQL only
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with proper CORS configuration
    CORS(app, resources={r"/*": {"origins": "http://localhost:3000", "supports_credentials": True}})
    db.init_app(app)
    
    # Initialize LoginManager
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp)
    
    from app.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    return app
