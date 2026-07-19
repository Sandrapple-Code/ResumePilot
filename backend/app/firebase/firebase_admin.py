import os
import logging
import firebase_admin
from firebase_admin import credentials, firestore, storage

logger = logging.getLogger("app.firebase.admin")

def initialize_firebase():
    """Initializes the Firebase Admin SDK. Exits gracefully if credentials are missing."""
    try:
        # Check if already initialized
        return firebase_admin.get_app()
    except ValueError:
        pass

    # 1. Check environment variable
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            bucket = os.getenv("FIREBASE_STORAGE_BUCKET")
            return firebase_admin.initialize_app(cred, {
                'storageBucket': bucket
            })
        except Exception as e:
            logger.error(f"Failed to load Firebase certificate from {cred_path}: {str(e)}")

    # 2. Check local key
    # Look in the backend folder root
    local_key = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "service-account.json")
    if os.path.exists(local_key):
        try:
            cred = credentials.Certificate(local_key)
            bucket = os.getenv("FIREBASE_STORAGE_BUCKET")
            return firebase_admin.initialize_app(cred, {
                'storageBucket': bucket
            })
        except Exception as e:
            logger.error(f"Failed to load service-account.json: {str(e)}")

    # 3. Default credentials (e.g. App Engine / Cloud Run environment)
    try:
        return firebase_admin.initialize_app()
    except Exception as e:
        logger.warning(f"Could not load default Firebase credentials. Setting up mock credentials: {str(e)}")
        
    # 4. Mock credentials configuration to prevent startup failure in local/test sandbox
    try:
        mock_cred = credentials.Certificate({
            "type": "service_account",
            "project_id": "resumepilot-ai-mock",
            "private_key_id": "mock-private-key-id",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n",
            "client_email": "mock@resumepilot-ai-mock.iam.gserviceaccount.com",
            "client_id": "1234567890",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/mock%40resumepilot-ai-mock.iam.gserviceaccount.com"
        })
        return firebase_admin.initialize_app(mock_cred, {
            'storageBucket': 'resumepilot-ai-mock.appspot.com'
        })
    except Exception as mock_e:
        logger.critical(f"Failed to initialize mock Firebase Admin SDK: {str(mock_e)}")
        return None

# Initialize app on module load
firebase_app = initialize_firebase()

def get_db():
    """Returns Firestore client if initialized, else None."""
    if not firebase_app:
        return None
    try:
        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to get Firestore client: {str(e)}")
        return None

def get_bucket():
    """Returns Cloud Storage bucket if initialized, else None."""
    if not firebase_app:
        return None
    try:
        return storage.bucket()
    except Exception as e:
        logger.error(f"Failed to get Cloud Storage bucket: {str(e)}")
        return None
