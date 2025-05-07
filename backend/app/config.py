import os
from dotenv import load_dotenv

# This load_dotenv is mainly for running `python run.py` directly,
# outside of Docker Compose. Docker Compose's `env_file` handles it for containers.
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

class Config:
    # --- TEMPORARY DEBUG PRINTS ---
    print("--- [config.py] Loading Environment Variables ---")
    _secret_key = os.environ.get('SECRET_KEY')
    _mysql_host = os.environ.get('MYSQL_HOST')
    _mysql_user = os.environ.get('MYSQL_USER')
    _mysql_password = os.environ.get('MYSQL_PASSWORD')
    _mysql_db = os.environ.get('MYSQL_DB')
    _mysql_cursorclass = os.environ.get('MYSQL_CURSORCLASS')

    print(f"Raw SECRET_KEY: {_secret_key}")
    print(f"Raw MYSQL_HOST: {_mysql_host}")
    print(f"Raw MYSQL_USER: {_mysql_user}")
    print(f"Raw MYSQL_PASSWORD: {'SET' if _mysql_password else 'NOT SET'}") # Avoid printing password
    print(f"Raw MYSQL_DB: {_mysql_db}")
    print(f"Raw MYSQL_CURSORCLASS: {_mysql_cursorclass}")
    print("--- [config.py] End of Raw Environment Variables ---")
    # --- END OF TEMPORARY DEBUG PRINTS ---

    SECRET_KEY = _secret_key or 'fallback-secret-key-if-not-set-change-me'
    
    MYSQL_HOST = _mysql_host
    MYSQL_USER = _mysql_user
    MYSQL_PASSWORD = _mysql_password
    MYSQL_DB = _mysql_db
    MYSQL_CURSORCLASS = _mysql_cursorclass or 'DictCursor'

    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_FILE_DIR = './.flask_session' # Relative to app root (/app in Docker)