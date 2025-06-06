import pytest
import json
import os
from dotenv import load_dotenv
from app import create_app
from app.models import db, User

# Load environment variables
load_dotenv()

@pytest.fixture
def client():
    """Create a test client for the app"""
    app = create_app()
    app.config['TESTING'] = True
    
    # Use a test-specific database on the real MySQL instance
    mysql_uri = os.getenv('DATABASE_URI')
    test_db_name = 'investbuddy_test'
    
    # Replace the database name in the URI to use a test-specific database
    if 'mysql' in mysql_uri:
        # Split URI at the last slash and replace the database name
        base_uri = mysql_uri.rsplit('/', 1)[0]
        app.config['SQLALCHEMY_DATABASE_URI'] = f"{base_uri}/{test_db_name}"
    else:
        # Fallback if URI format is unexpected
        app.config['SQLALCHEMY_DATABASE_URI'] = mysql_uri
    
    app.config['SECRET_KEY'] = 'test_secret_key'
    
    with app.test_client() as client:
        with app.app_context():
            # Create test database if it doesn't exist
            db.engine.execute(f"CREATE DATABASE IF NOT EXISTS {test_db_name}")
            db.engine.execute(f"USE {test_db_name}")
            
            # Recreate all tables for a clean test environment
            db.drop_all()
            db.create_all()
            
            yield client
            
            # Clean up the test database after tests
            db.drop_all()

def test_user_registration(client):
    """Test user registration process"""
    # Register a new user
    response = client.post('/api/auth/register', 
                          data=json.dumps({
                              'email': 'test@example.com',
                              'username': 'testuser',
                              'password': 'password123'
                          }),
                          content_type='application/json')
    
    # Check if registration was successful
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'user' in data
    assert data['user']['email'] == 'test@example.com'
    assert data['user']['username'] == 'testuser'
    
    # Check if user exists in database
    with create_app().app_context():
        user = User.query.filter_by(email='test@example.com').first()
        assert user is not None
        assert user.username == 'testuser'

def test_login_logout(client):
    """Test login and logout process"""
    # First register a user
    client.post('/api/auth/register', 
               data=json.dumps({
                   'email': 'test@example.com',
                   'username': 'testuser',
                   'password': 'password123'
               }),
               content_type='application/json')
    
    # Then try to login
    login_response = client.post('/api/auth/login', 
                                data=json.dumps({
                                    'email': 'test@example.com',
                                    'password': 'password123'
                                }),
                                content_type='application/json')
    
    # Check if login was successful
    assert login_response.status_code == 200
    login_data = json.loads(login_response.data)
    assert 'user' in login_data
    assert login_data['user']['email'] == 'test@example.com'
    
    # Now try to logout
    logout_response = client.post('/api/auth/logout')
    assert logout_response.status_code == 200
    logout_data = json.loads(logout_response.data)
    assert 'message' in logout_data
    assert logout_data['message'] == 'Logout successful'

def test_invalid_login(client):
    """Test login with invalid credentials"""
    # Register a user
    client.post('/api/auth/register', 
               data=json.dumps({
                   'email': 'test@example.com',
                   'username': 'testuser',
                   'password': 'password123'
               }),
               content_type='application/json')
    
    # Try to login with wrong password
    response = client.post('/api/auth/login', 
                          data=json.dumps({
                              'email': 'test@example.com',
                              'password': 'wrongpassword'
                          }),
                          content_type='application/json')
    
    # Check if login was unsuccessful
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_duplicate_registration(client):
    """Test registering a user with duplicate email or username"""
    # Register first user
    client.post('/api/auth/register', 
               data=json.dumps({
                   'email': 'test@example.com',
                   'username': 'testuser',
                   'password': 'password123'
               }),
               content_type='application/json')
    
    # Try to register with same email
    response = client.post('/api/auth/register', 
                          data=json.dumps({
                              'email': 'test@example.com',
                              'username': 'different_user',
                              'password': 'password123'
                          }),
                          content_type='application/json')
    
    # Check if registration was unsuccessful
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Email already registered' in data['error']
    
    # Try to register with same username
    response = client.post('/api/auth/register', 
                          data=json.dumps({
                              'email': 'different@example.com',
                              'username': 'testuser',
                              'password': 'password123'
                          }),
                          content_type='application/json')
    
    # Check if registration was unsuccessful
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Username already taken' in data['error'] 