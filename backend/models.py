"""Pydantic models for Mod Syndicate API."""
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator


_EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


def _validate_email(v: str) -> str:
    if not isinstance(v, str):
        raise ValueError("Email is required")
    v = v.strip().lower()
    if not _EMAIL_RE.match(v):
        raise ValueError("Please enter a valid email address")
    return v


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ===== Auth =====
class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)
    name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _v_email(cls, v):
        return _validate_email(v)


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _v_email(cls, v):
        return _validate_email(v)


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ===== Profile / Onboarding =====
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    car_model: Optional[str] = None
    car_year: Optional[int] = None
    car_color: Optional[str] = None
    car_photo_url: Optional[str] = None
    specs: Optional[str] = None
    onboarded: Optional[bool] = None


# ===== Products =====
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    brand: str
    category: str  # wheels, wraps, performance, lighting, interior, detailing
    price: float
    sale_price: Optional[float] = None
    rating: float = 4.7
    reviews_count: int = 0
    images: List[str] = []
    description: str = ""
    specs: dict = {}
    fitment: List[str] = []  # e.g. ['Universal (All Cars)']
    tags: List[str] = []
    in_stock: bool = True
    created_at: datetime = Field(default_factory=_now)


# ===== Garage =====
class GarageAddIn(BaseModel):
    product_id: str
    note: Optional[str] = None


class GarageItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    note: Optional[str] = None
    status: str = "saved"  # saved | installed | wishlist
    added_at: datetime = Field(default_factory=_now)


# ===== Bookings =====
class BookingCreate(BaseModel):
    product_ids: List[str]
    scheduled_date: str  # ISO date string (yyyy-mm-dd)
    scheduled_slot: str  # e.g. "10:00-12:00"
    car_model: Optional[str] = None
    notes: Optional[str] = None
    payment_method: Optional[str] = "card"  # mocked
    exclude_install: Optional[bool] = False


class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    booking_code: str = Field(default_factory=lambda: "MS-" + uuid.uuid4().hex[:8].upper())
    product_ids: List[str]
    products_snapshot: List[dict] = []
    scheduled_date: str
    scheduled_slot: str
    car_model: Optional[str] = None
    notes: Optional[str] = None
    subtotal: float = 0.0
    install_fee: float = 0.0
    taxes: float = 0.0
    total: float = 0.0
    payment_method: str = "card"
    payment_status: str = "paid_mock"  # mocked
    status: str = "confirmed"  # pending|confirmed|in_progress|completed|cancelled
    delivery_eta: Optional[str] = None  # human readable
    exclude_install: Optional[bool] = False
    created_at: datetime = Field(default_factory=_now)


# ===== Community =====
class PostCreate(BaseModel):
    title: str
    body: str = ""
    image_url: Optional[str] = None
    car_model: Optional[str] = None
    tags: List[str] = []


class Post(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    author_name: str = ""
    title: str
    body: str = ""
    image_url: Optional[str] = None
    car_model: Optional[str] = None
    tags: List[str] = []
    likes: int = 0
    created_at: datetime = Field(default_factory=_now)


class ReviewCreate(BaseModel):
    target: str  # e.g. product name or garage
    rating: int = Field(ge=1, le=5)
    title: str
    body: str


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    author_name: str = ""
    target: str
    rating: int
    title: str
    body: str
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=_now)


class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    city: str
    venue: str = ""
    date: str  # ISO yyyy-mm-dd
    time: str = ""
    image_url: Optional[str] = None
    tags: List[str] = []


class ContactIn(BaseModel):
    name: str
    email: str
    message: str
    phone: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _v_email(cls, v):
        return _validate_email(v)
