import pytest
import uuid
from app import create_app
from app.models import db, User
from flask_jwt_extended import create_access_token


@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    return app


@pytest.fixture(scope="function")
def _db(app):
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        # Use SQLAlchemy 2.0 syntax for executing raw SQL
        with db.engine.connect() as conn:
            # Check if we're using SQLite or MySQL and use appropriate commands
            if 'sqlite' in str(db.engine.url).lower():
                conn.execute(db.text("PRAGMA foreign_keys=OFF"))
                conn.commit()
            else:
                # MySQL
                conn.execute(db.text("SET FOREIGN_KEY_CHECKS = 0"))
                conn.commit()
        db.drop_all()
        with db.engine.connect() as conn:
            if 'sqlite' in str(db.engine.url).lower():
                conn.execute(db.text("PRAGMA foreign_keys=ON"))
                conn.commit()
            else:
                # MySQL
                conn.execute(db.text("SET FOREIGN_KEY_CHECKS = 1"))
                conn.commit()


@pytest.fixture(scope="function")
def client(app, _db):
    with app.test_client() as client:
        yield client


@pytest.fixture(scope="function")
def test_user(app, _db):
    unique_id = str(uuid.uuid4())[:8]
    user = User(username=f"testuser_{unique_id}", email=f"test_{unique_id}@example.com", age=25)
    user.set_password("password123")
    _db.session.add(user)
    _db.session.commit()
    return user


@pytest.fixture(scope="function")
def auth_headers(app, client, test_user):
    with app.app_context():
        token = create_access_token(identity=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_user_with_2fa(app, _db):
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        username=f"testuser2fa_{unique_id}",
        email=f"test2fa_{unique_id}@example.com",
        age=25,
        is_two_factor_enabled=True,
        two_factor_secret="test_secret",
    )
    user.set_password("password123")
    _db.session.add(user)
    _db.session.commit()
    return user


@pytest.fixture(scope="function")
def auth_headers_with_2fa(app, client, test_user_with_2fa):
    with app.app_context():
        token = create_access_token(identity=str(test_user_with_2fa.id))
    return {"Authorization": f"Bearer {token}"}
