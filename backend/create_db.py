import os
import pymysql
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Get database URI
DATABASE_URI = os.getenv('DATABASE_URI')

# For backward compatibility
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'password')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
MYSQL_DB = os.getenv('MYSQL_DB', 'investbuddy')

def create_mysql_database():
    """Create the MySQL database if it doesn't exist"""
    try:
        # Parse MySQL connection details from DATABASE_URI
        # Example format: mysql+pymysql://user:password@host:port/database
        mysql_pattern = r"mysql(?:\+pymysql)?:\/\/(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:]+):(?P<port>\d+)\/(?P<database>.+)"
        match = re.match(mysql_pattern, DATABASE_URI)
        
        if match:
            db_info = match.groupdict()
            host = db_info['host']
            user = db_info['user']
            password = db_info['password']
            port = int(db_info['port'])
            database = db_info['database']
        else:
            # Fallback to individual environment variables
            host = MYSQL_HOST
            user = MYSQL_USER
            password = MYSQL_PASSWORD
            port = MYSQL_PORT
            database = MYSQL_DB
        
        # Connect to MySQL server (without specifying a database)
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            port=port
        )
        
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        print(f"Creating database {database} if it doesn't exist...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
        
        # Switch to the database
        cursor.execute(f"USE {database}")
        
        # Create users table if it doesn't exist
        print("Creating users table if it doesn't exist...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(120) NOT NULL UNIQUE,
                username VARCHAR(80) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                age INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Create portfolios table if it doesn't exist
        print("Creating portfolios table if it doesn't exist...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                investment_goal VARCHAR(50) NOT NULL,
                time_horizon INT NOT NULL,
                risk_reaction VARCHAR(50) NOT NULL,
                return_preference VARCHAR(50) NOT NULL,
                financial_obligations JSON NOT NULL,
                experience VARCHAR(50) NOT NULL,
                risk_profile VARCHAR(50) NOT NULL,
                portfolio_allocation JSON NOT NULL,
                securities JSON NOT NULL,
                insights TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        print("MySQL database setup completed successfully!")
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_mysql_database() 