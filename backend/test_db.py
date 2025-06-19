import os
from dotenv import load_dotenv
from flask import Flask
from app.models import db, User
from sqlalchemy import text

# Load environment variables
load_dotenv()


def test_database_connection():
    """Test database connection and basic operations"""
    app = Flask(__name__)

    # Configure the app
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    with app.app_context():
        # Test database connection
        try:
            print("Testing database connection...")
            # Execute a simple query to test connection
            result = db.session.execute(text("SELECT 1")).fetchone()
            print(f"Database connection successful: {result}")

            # Test creating a table
            print("Testing if tables exist...")
            tables = db.session.execute(text("SHOW TABLES")).fetchall()
            print(f"Tables in database: {tables}")

            # Test User model
            print("Testing User model operations...")
            try:
                # Try to query users
                users = User.query.all()
                print(f"Found {len(users)} users")

                # Display information about existing users
                if users:
                    print("\nExisting users:")
                    print("--------------")
                    for user in users:
                        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
                    print("--------------\n")

                # Try to create a test user
                test_user = User(username="testuser", email="test@example.com")
                test_user.set_password("password123")

                # Check if user already exists
                existing_user = User.query.filter_by(username="testuser").first()
                if not existing_user:
                    db.session.add(test_user)
                    db.session.commit()
                    print("Test user created successfully")
                else:
                    print("Test user already exists")

            except Exception as e:
                print(f"Error with User model: {e}")
                raise

        except Exception as e:
            print(f"Database connection error: {e}")
            raise

        print("All database tests completed successfully!")


if __name__ == "__main__":
    test_database_connection()
