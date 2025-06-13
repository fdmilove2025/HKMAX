from flask import Flask
from flask_migrate import Migrate
from app import create_app
from app.models import db

app = create_app()
migrate = Migrate(app, db)

if __name__ == '__main__':
    with app.app_context():
        # Run migrations
        migrate.upgrade() 