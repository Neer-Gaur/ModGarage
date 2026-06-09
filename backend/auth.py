"""JWT-based authentication helpers for Mod Syndicate."""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

JWT_SECRET = os.environ.get("JWT_SECRET", "mod-syndicate-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 14  # 14 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    """FastAPI dependency that returns the authenticated user document.

    Raises 401 if token missing/invalid.
    """
    from db import get_db  # local import to avoid circulars

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    db = get_db()
    user = await db.fetchrow("SELECT id, email, name, created_at, onboarded, phone, city, car_model, car_year, car_color, car_photo_url, specs FROM users WHERE id = $1", payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)):
    """Returns the user if a valid token is supplied, otherwise None."""
    from db import get_db

    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    db = get_db()
    return await db.fetchrow("SELECT id, email, name, created_at, onboarded, phone, city, car_model, car_year, car_color, car_photo_url, specs FROM users WHERE id = $1", payload["sub"])
