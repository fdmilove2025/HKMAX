from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, create_refresh_token
from app.models import db, User, FaceEncoding
from werkzeug.security import generate_password_hash, check_password_hash
from app.face_encoding import faceEncoding, checkFaceExists, compareFaces
import re
import traceback
import pyotp
import qrcode
import io
import base64

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
            age=age,
            has_faceid=data.get('faceid', False)
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
                'age': new_user.age,
                'has_faceid': new_user.has_faceid
            },
            'access_token': access_token
        }), 201
    
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/register-face', methods=['POST'])
@jwt_required()
def register_face():
    """Register facial data for a user"""
    try:
        if not request.is_json:
            return jsonify({'error': f'Expected JSON but got {request.content_type}'}), 400
        
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if face exists in image
        if not checkFaceExists(data['image']):
            return jsonify({'error': 'No face detected in the image'}), 400
        
        # Get face encoding
        encoding = faceEncoding(data['image'])
        if not encoding:
            return jsonify({'error': 'Failed to encode face'}), 400
        
        # Save face encoding
        user.set_face_encoding(encoding)
        db.session.commit()
        
        return jsonify({
            'message': 'Face registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'has_faceid': user.has_faceid
            }
        })
        
    except Exception as e:
        print(f"Face registration error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Face registration failed: {str(e)}'}), 500

@auth_bp.route('/verify-face', methods=['POST'])
def verify_face():
    """Verify facial data for login"""
    try:
        if not request.is_json:
            return jsonify({'error': f'Expected JSON but got {request.content_type}'}), 400
        
        data = request.json
        if not data or 'image' not in data or 'email' not in data:
            return jsonify({'error': 'Missing required data'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.has_faceid:
            return jsonify({'error': 'User has not registered facial data'}), 400
        
        # Check if face exists in image
        if not checkFaceExists(data['image']):
            return jsonify({'error': 'No face detected in the image'}), 400
        
        # Get face encoding
        encoding = faceEncoding(data['image'])
        if not encoding:
            return jsonify({'error': 'Failed to encode face'}), 400
        
        # Compare faces
        stored_encoding = user.get_face_encoding()
        if not stored_encoding:
            return jsonify({'error': 'No stored face data found'}), 400
        
        if not compareFaces(stored_encoding, encoding):
            return jsonify({'error': 'Face verification failed'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Face verification successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'has_faceid': user.has_faceid
            },
            'access_token': access_token
        })
        
    except Exception as e:
        print(f"Face verification error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Face verification failed: {str(e)}'}), 500

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
        
        if user.is_two_factor_enabled:
            # If 2FA is enabled, return a temporary token and a message
            # that 2FA is required.
            temp_access_token = create_access_token(identity=user.id, fresh=False)
            return jsonify({
                'message': '2FA required',
                '2fa_required': True,
                'temp_access_token': temp_access_token
            }), 200

        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'age': user.age,
                'has_faceid': user.has_faceid
            },
            'access_token': access_token
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/generate-2fa', methods=['POST'])
@jwt_required()
def generate_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Generate a new 2FA secret
    user.two_factor_secret = pyotp.random_base32()
    db.session.commit()

    # Generate QR code
    totp = pyotp.TOTP(user.two_factor_secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name='InvestBuddy')
    
    img = qrcode.make(provisioning_uri)
    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)
    
    # Encode image to base64
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

    return jsonify({
        'message': '2FA QR code generated. Please scan with your authenticator app.',
        'qr_code': f'data:image/png;base64,{img_base64}',
        'secret': user.two_factor_secret
    })

@auth_bp.route('/verify-2fa', methods=['POST'])
@jwt_required()
def verify_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if 'token' not in data:
        return jsonify({'error': 'Missing 2FA token'}), 400

    totp = pyotp.TOTP(user.two_factor_secret)

    if totp.verify(data['token']):
        if not user.is_two_factor_enabled:
            user.is_two_factor_enabled = True
            db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': '2FA verified successfully.',
            'access_token': access_token
        }), 200
    else:
        return jsonify({'error': 'Invalid 2FA token'}), 401

@auth_bp.route('/disable-2fa', methods=['POST'])
@jwt_required()
def disable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if 'password' not in data:
        return jsonify({'error': 'Missing password'}), 400

    if not user.check_password(data['password']):
        return jsonify({'error': 'Invalid password'}), 401

    user.is_two_factor_enabled = False
    user.two_factor_secret = None
    db.session.commit()

    return jsonify({'message': 'Two-factor authentication disabled successfully.'})

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
                'age': user.age,
                'has_faceid': user.has_faceid
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
                'age': user.age,
                'has_faceid': user.has_faceid
            }
        })
        
    except Exception as e:
        print(f"Get user error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500 