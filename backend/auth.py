# ============================================================================
# auth.py — Verify Supabase Auth JWTs and load user profile
# ============================================================================
import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from fastapi import Request, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from database import get_db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')
if not SUPABASE_JWT_SECRET:
    raise RuntimeError("SUPABASE_JWT_SECRET is not set")

JWT_AUDIENCE = "authenticated"
JWT_ALGO = "HS256"


def _extract_token(request: Request) -> Optional[str]:
    """Pull JWT from Authorization header (Bearer ...) or session_token cookie."""
    auth = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth and auth.startswith("Bearer "):
        return auth.split(" ", 1)[1].strip()
    cookie = request.cookies.get("sb-access-token") or request.cookies.get("access_token")
    return cookie


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[JWT_ALGO],
            audience=JWT_AUDIENCE,
            options={"verify_aud": True},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def _ensure_profile(db: AsyncSession, user_id: str, email: str,
                          name: str = "", picture: str = "") -> dict:
    """Idempotent upsert of profile row matching auth.users.id."""
    row = await db.execute(
        text("SELECT id, email, name, picture, phone, role FROM profiles WHERE id = :id"),
        {"id": user_id},
    )
    profile = row.mappings().first()
    if profile:
        return dict(profile)
    # Insert if missing (in case the auth trigger didn't fire — defensive)
    await db.execute(
        text("""
            INSERT INTO profiles (id, email, name, picture)
            VALUES (:id, :email, :name, :picture)
            ON CONFLICT (id) DO NOTHING
        """),
        {"id": user_id, "email": email, "name": name, "picture": picture},
    )
    await db.commit()
    row = await db.execute(
        text("SELECT id, email, name, picture, phone, role FROM profiles WHERE id = :id"),
        {"id": user_id},
    )
    return dict(row.mappings().first())


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_jwt(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing 'sub'")

    email = payload.get("email", "")
    metadata = payload.get("user_metadata") or {}
    name = metadata.get("full_name") or metadata.get("name") or ""
    picture = metadata.get("avatar_url") or metadata.get("picture") or ""

    profile = await _ensure_profile(db, user_id, email, name, picture)
    return profile


async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user
