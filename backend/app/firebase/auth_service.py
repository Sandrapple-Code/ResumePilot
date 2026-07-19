import logging
from typing import Dict, Any, Optional
from fastapi import Header, HTTPException, status
from app.core.user_db import verify_token

logger = logging.getLogger("app.firebase.auth")

def verify_id_token(token: str) -> Dict[str, Any]:
    """Verifies the custom signature session token."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
    return {
        "uid": payload["user_id"],
        "username": payload["username"],
        "email": f"{payload['username']}@resumepilot.ai"
    }

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency that extracts user from Authorization Bearer token."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required."
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '"
        )

    token = authorization.split(" ")[1]
    return verify_id_token(token)
