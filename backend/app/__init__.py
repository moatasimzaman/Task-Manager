from flask import Flask
from flask_mysqldb import MySQL
from flask_bcrypt import Bcrypt
from flask_session import Session
from flask_cors import CORS
from .config import Config
import os
import logging

# Initialize extensions without app context
mysql = MySQL()
bcrypt = Bcrypt()
sess = Session()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.logger.info("Flask app created and configured.")

    # --- Explicit Session Cookie Settings ---
    # Set SameSite='Lax' for compatibility (works for top-level navigation)
    # Set Secure=False because we are using HTTP locally. Change to True for HTTPS deployment.
    app.config.update(
        SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=False # IMPORTANT: Set to True if deploying with HTTPS
    )
    app.logger.info(f"Session cookie SameSite set to: {app.config['SESSION_COOKIE_SAMESITE']}")
    app.logger.info(f"Session cookie Secure set to: {app.config['SESSION_COOKIE_SECURE']}")
    # --- End Session Cookie Settings ---

    # Ensure the session file directory exists
    abs_session_dir = os.path.abspath(app.config['SESSION_FILE_DIR']) # /app/.flask_session
    if not os.path.exists(abs_session_dir):
        try:
            os.makedirs(abs_session_dir)
            app.logger.info(f"Created session directory: {abs_session_dir}")
        except OSError as e:
            app.logger.error(f"Error creating session directory {abs_session_dir}: {e}")

    # Initialize extensions
    mysql.init_app(app)
    bcrypt.init_app(app)
    sess.init_app(app)
    # CORS allows credentials (cookies) and requests from any origin (*) for dev
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})

    # Import and register blueprints
    from .auth import auth_bp
    from .routes import tasks_bp
    # If you created main_routes.py for the root '/' path:
    # from .main_routes import main_bp
    # app.register_blueprint(main_bp)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api')

    app.logger.info("Blueprints registered.")
    return app

def init_db(app_instance): # Pass the actual app instance
    with app_instance.app_context(): # Crucial to have app context for DB operations
        try:
            cursor = mysql.connection.cursor()
            app_instance.logger.info("Initializing database tables...")
            # Users table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            app_instance.logger.info("Users table schema ensured.")
            # Tasks table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                due_date DATE,
                due_time TIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            app_instance.logger.info("Tasks table schema ensured.")
            mysql.connection.commit()
            cursor.close()
            app_instance.logger.info("Database tables initialization complete.")
        except Exception as e:
            app_instance.logger.error(f"Error initializing database: {e}")