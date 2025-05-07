# backend/app/auth.py
from flask import Blueprint, request, jsonify, session, current_app
from . import mysql, bcrypt
from functools import wraps

auth_bp = Blueprint('auth_bp', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Missing fields"}), 400

    # FIX: Remove dictionary=True
    cursor = mysql.connection.cursor() 
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
        existing_user = cursor.fetchone() # Will be a dictionary due to MYSQL_CURSORCLASS

        if existing_user:
            return jsonify({"message": "Username or email already exists"}), 409

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        cursor.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                       (username, email, hashed_password))
        mysql.connection.commit()
        user_id = cursor.lastrowid
        
        session['user_id'] = user_id
        session['username'] = username
        current_app.logger.info(f"User {username} (ID: {user_id}) signed up successfully.")
        return jsonify({"message": "User created successfully", "user_id": user_id, "username": username}), 201
    except Exception as e:
        mysql.connection.rollback()
        current_app.logger.error(f"Error during signup for {username}: {e}")
        return jsonify({"message": "Could not create user", "error": str(e)}), 500
    finally:
        if cursor: # Ensure cursor exists before trying to close
            cursor.close()


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('identifier')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"message": "Missing credentials"}), 400

    # FIX: Remove dictionary=True
    cursor = mysql.connection.cursor() 
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (identifier, identifier))
        user = cursor.fetchone() # Will be a dictionary

        if user and bcrypt.check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            current_app.logger.info(f"User {user['username']} (ID: {user['id']}) logged in successfully.")
            return jsonify({"message": "Login successful", "user_id": user['id'], "username": user['username']}), 200
        else:
            current_app.logger.warning(f"Failed login attempt for: {identifier}")
            return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        current_app.logger.error(f"Error during login for {identifier}: {e}")
        return jsonify({"message": "Login failed due to an internal error", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    username = session.get('username', 'Unknown user')
    session.pop('user_id', None)
    session.pop('username', None)
    session.clear() 
    current_app.logger.info(f"User {username} logged out.")
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route('/status', methods=['GET'])
def status():
    if 'user_id' in session:
        return jsonify({
            "logged_in": True,
            "user_id": session['user_id'],
            "username": session.get('username', 'N/A')
        }), 200
    return jsonify({"logged_in": False}), 200