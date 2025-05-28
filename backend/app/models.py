from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to portfolio
    portfolios = db.relationship('Portfolio', backref='user', lazy=True)
    
    def set_password(self, password):
        """Sets the password hash from a plaintext password"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        
    def check_password(self, password):
        """Checks if the provided password matches the stored hash"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Portfolio(db.Model):
    __tablename__ = 'portfolios'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Questionnaire answers
    investment_goal = db.Column(db.String(50), nullable=False)
    time_horizon = db.Column(db.Integer, nullable=False)
    risk_reaction = db.Column(db.String(50), nullable=False)
    return_preference = db.Column(db.String(50), nullable=False)
    financial_obligations = db.Column(db.JSON, nullable=False)  # Store as JSON array
    experience = db.Column(db.String(50), nullable=False)
    
    # Analysis results
    risk_profile = db.Column(db.String(50), nullable=False)
    portfolio_allocation = db.Column(db.JSON, nullable=False)  # Store as JSON array
    securities = db.Column(db.JSON, nullable=False)  # Store as JSON array
    insights = db.Column(db.Text, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Portfolio {self.id} for User {self.user_id}>' 