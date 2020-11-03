import os
from dotenv import load_dotenv
from pathlib import Path
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

CLIENT_SECRETS_FILENAME = os.getenv('CLIENT_SECRETS_FILENAME')
TEMP_FILES_FOLDER = os.getenv('TEMP_FILES_FOLDER')
TOP_GOOGLE_DRIVE_FOLDER_ID = os.getenv('TOP_GOOGLE_DRIVE_FOLDER_ID')
FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
FLASK_SERVER_NAME = os.getenv('FLASK_SERVER_NAME')