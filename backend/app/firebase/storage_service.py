import os
import logging
from typing import Optional
from app.firebase.firebase_admin import get_bucket

logger = logging.getLogger("app.firebase.storage")

def upload_file(local_path: str, remote_path: str) -> Optional[str]:
    """Uploads a local file to Firebase Storage. Returns the gs:// URI path."""
    bucket = get_bucket()
    if not bucket:
        logger.warning("Firebase Storage bucket not initialized. Mocking upload path.")
        return f"gs://mock-bucket/{remote_path}"

    try:
        blob = bucket.blob(remote_path)
        blob.upload_from_filename(local_path)
        logger.info(f"Successfully uploaded {local_path} to Firebase Storage: {remote_path}")
        return f"gs://{bucket.name}/{remote_path}"
    except Exception as e:
        logger.error(f"Failed to upload file to Firebase Storage: {str(e)}")
        return None

def download_file(remote_path: str, local_path: str) -> bool:
    """Downloads a file from Firebase Storage to local path."""
    # Check if remote path starts with gs://, and strip it
    if remote_path.startswith("gs://"):
        # Strip gs://bucket-name/
        parts = remote_path.replace("gs://", "").split("/", 1)
        if len(parts) > 1:
            remote_path = parts[1]

    bucket = get_bucket()
    if not bucket:
        logger.warning(f"Firebase Storage bucket not initialized. Cannot download {remote_path}.")
        return False

    try:
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        blob = bucket.blob(remote_path)
        blob.download_to_filename(local_path)
        logger.info(f"Successfully downloaded {remote_path} from Firebase Storage to {local_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to download file from Firebase Storage: {str(e)}")
        return False

def delete_file(remote_path: str) -> bool:
    """Deletes a file in Firebase Storage."""
    if remote_path.startswith("gs://"):
        parts = remote_path.replace("gs://", "").split("/", 1)
        if len(parts) > 1:
            remote_path = parts[1]

    bucket = get_bucket()
    if not bucket:
        return False

    try:
        blob = bucket.blob(remote_path)
        blob.delete()
        logger.info(f"Successfully deleted {remote_path} from Firebase Storage")
        return True
    except Exception as e:
        logger.error(f"Failed to delete file from Firebase Storage: {str(e)}")
        return False
