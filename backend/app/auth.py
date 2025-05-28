from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app.models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
import re
import traceback

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Get JSON data, handle potential errors
        if not request.is_json:
            return jsonify({'error': f'Expected JSON but got {request.content_type}'}), 400
        
        data = request.json
        if not data:
            return jsonify({'error': 'Empty request data'}), 400
        
        # Validate required fields
        if not all(key in data for key in ['email', 'password', 'username', 'age']):
            missing = [key for key in ['email', 'password', 'username', 'age'] if key not in data]
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if len(data['password']) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Validate age
        try:
            age = int(data['age'])
            if age < 18:
                return jsonify({'error': 'You must be at least 18 years old to use this application'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Age must be a valid number'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        # Create new user
        new_user = User(
            email=data['email'],
            username=data['username'],
            age=age
        )
        new_user.set_password(data['password'])
        
        # Save to database
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'age': new_user.age
            }
        }), 201
    
    except Exception as e:
        # Log the full traceback for debugging
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login an existing user"""
    try:
        # Get JSON data, handle potential errors
        if not request.is_json:
            return jsonify({'error': f'Expected JSON but got {request.content_type}'}), 400
            
        data = request.json
        if not data:
            return jsonify({'error': 'Empty request data'}), 400
        
        # Validate required fields
        if not all(key in data for key in ['email', 'password']):
            return jsonify({'error': 'Missing email or password'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Log in the user
        login_user(user)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'age': user.age
            }
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout the current user"""
    logout_user()
    return jsonify({'message': 'Logout successful'})

@auth_bp.route('/user', methods=['GET'])
@login_required
def get_user():
    """Get the current user's information"""
    return jsonify({
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'age': current_user.age
        }
    }) 