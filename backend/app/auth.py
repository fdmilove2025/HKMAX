from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
import re
import traceback

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
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
        
        # Create access token
        access_token = create_access_token(identity=new_user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'age': new_user.age
            },
            'access_token': access_token
        }), 201
    
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
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
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check password
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid password'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'age': user.age
            },
            'access_token': access_token
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/profile/update', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        if not request.is_json:
            return jsonify({'error': f'Expected JSON but got {request.content_type}'}), 400
            
        data = request.json
        if not data:
            return jsonify({'error': 'Empty request data'}), 400
        
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update email if provided
        if 'email' in data and data['email'] != user.email:
            # Check if new email is already taken
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already in use'}), 400
            user.email = data['email']
        
        # Update username if provided
        if 'username' in data and data['username'] != user.username:
            # Check if new username is already taken
            if User.query.filter_by(username=data['username']).first():
                return jsonify({'error': 'Username already in use'}), 400
            user.username = data['username']
        
        # Update password if provided
        if 'current_password' in data and 'new_password' in data:
            if not user.check_password(data['current_password']):
                return jsonify({'error': 'Current password is incorrect'}), 401
            if len(data['new_password']) < 8:
                return jsonify({'error': 'New password must be at least 8 characters long'}), 400
            user.set_password(data['new_password'])
        
        # Save changes
        db.session.commit()
        
        # Create new access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'age': user.age
            },
            'access_token': access_token
        })
        
    except Exception as e:
        print(f"Profile update error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Profile update failed: {str(e)}'}), 500

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'age': user.age
            }
        })
        
    except Exception as e:
        print(f"Get user error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500 