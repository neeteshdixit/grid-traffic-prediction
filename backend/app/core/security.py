import os
import time
import json
import hmac
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from backend.app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def base64url_encode(data: bytes) -> str:
    """
    Encodes bytes to base64url string.
    """
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    """
    Decodes base64url string to bytes.
    """
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

# --- Password Hashing using PBKDF2 ---
def get_password_hash(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a unique salt.
    Format: salt$hash
    """
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{base64url_encode(salt)}${base64url_encode(key)}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the stored salt$hash representation.
    """
    try:
        salt_b64, key_b64 = hashed_password.split('$')
        salt = base64url_decode(salt_b64)
        stored_key = base64url_decode(key_b64)
        test_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(stored_key, test_key)
    except Exception:
        return False

# --- Custom Base64 JWT Implementation ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT token using HMAC-SHA256.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    
    if expires_delta:
        expire_seconds = expires_delta.total_seconds()
    else:
        expire_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        
    payload["exp"] = int(time.time() + expire_seconds)
    
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    msg = f"{header_b64}.{payload_b64}".encode('utf-8')
    sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), msg, hashlib.sha256).digest()
    sig_b64 = base64url_encode(sig)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def _decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token string. Returns payload dict or None.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_b64, payload_b64, sig_b64 = parts
        
        # Validate signature
        msg = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), msg, hashlib.sha256).digest()
        expected_sig_b64 = base64url_encode(expected_sig)
        
        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return None
            
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        
        # Verify expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None


def verify_access_token(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency that extracts the Bearer token from the Authorization
    header and decodes/validates it. Returns the payload dict or None.
    """
    if token is None:
        return None
    return _decode_token(token)
