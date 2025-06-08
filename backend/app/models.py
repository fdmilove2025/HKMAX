from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    age = db.Column(db.Integer, nullable=False)
    has_faceid = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to face encoding
    face_encoding = db.relationship('FaceEncoding', backref='user', lazy=True, uselist=False)

    # Relationship to portfolio
    portfolios = db.relationship('Portfolio', backref='user', lazy=True)
    
    def set_password(self, password):
        """Sets the password hash from a plaintext password"""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Checks if the provided password matches the stored hash"""
        return check_password_hash(self.password_hash, password)
    
    def set_face_encoding(self, encoding):
        """Sets the face encoding for the user"""
        if not self.face_encoding:
            self.face_encoding = FaceEncoding(user_id=self.id)
        self.face_encoding.encoding = json.dumps(encoding)
        self.has_faceid = True
    
    def get_face_encoding(self):
        """Gets the face encoding for the user"""
        if self.face_encoding and self.face_encoding.encoding:
            return json.loads(self.face_encoding.encoding)
        return None
    
    def __repr__(self):
        return f'<User {self.username}>'
    
class FaceEncoding(db.Model):
    __tablename__ = 'face_encodings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    encoding = db.Column(db.Text, nullable=False)  # Store as JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
    portfolio_allocation = db.Column(db.JSON, nullable=False)  # Store as JSON object
    securities = db.Column(db.JSON, nullable=False)  # Store as JSON array
    insights = db.Column(db.Text, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Portfolio {self.id} for User {self.user_id}>' 