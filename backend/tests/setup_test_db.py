import os
import pymysql
from dotenv import load_dotenv

def setup_test_db():
    """Set up the test database with required tables"""
    # Load environment variables
    load_dotenv()
    
    # Get database connection details
    host = os.getenv('DB_HOST', 'localhost')
    port = int(os.getenv('DB_PORT', 3306))
    user = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', 'root')
    db_name = os.getenv('DB_NAME', 'investbuddy_test')
    
    # Connect to MySQL server
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password
    )
    
    try:
        with conn.cursor() as cursor:
            # Create test database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            cursor.execute(f"USE {db_name}")
            
            # Create tables
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(80) UNIQUE NOT NULL,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    password_hash VARCHAR(128) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS portfolios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS holdings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    portfolio_id INT NOT NULL,
                    ticker VARCHAR(10) NOT NULL,
                    shares DECIMAL(10,2) NOT NULL,
                    average_price DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id)
                )
            """)
            
        conn.commit()
        print(f"Test database '{db_name}' setup completed successfully")
        
    except Exception as e:
        print(f"Error setting up test database: {e}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    setup_test_db() 