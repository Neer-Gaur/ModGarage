# ============================================================================
# server.py — ModSyndicate / ModGarage backend (Supabase Postgres + Auth)
# ============================================================================
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database import engine, get_db
from auth import get_current_user, get_current_admin

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="ModSyndicate API")
api_router = APIRouter(prefix="/api")


# ============================================================================
# MODELS (request bodies)
# ============================================================================
class CarCreate(BaseModel):
    make: str
    model: str
    year: int
    variant: str = ""
    color: str = ""
    image_url: str = ""


class GarageAdd(BaseModel):
    car_id: str
    product_id: str
    quantity: int = 1


class BookingCreate(BaseModel):
    car_id: str
    slot_id: str
    pickup_address: str


class ChannelCreate(BaseModel):
    name: str
    description: str = ""


class PostCreate(BaseModel):
    caption: str
    media_urls: List[str] = []
    tagged_products: List[str] = []
    car_id: Optional[str] = None
    channel_id: Optional[str] = None


class VoteCreate(BaseModel):
    vote: str  # "up" or "down"


class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None


class SlotCreate(BaseModel):
    date: str
    start_time: str
    end_time: str
    capacity: int = 5


class StatusUpdate(BaseModel):
    status: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None
    phone: Optional[str] = None


# ============================================================================
# HELPERS
# ============================================================================
def _row(rows):
    return [dict(r) for r in rows.mappings().all()]


def _one(rows):
    r = rows.mappings().first()
    return dict(r) if r else None


# ============================================================================
# AUTH ROUTES
# ============================================================================
@api_router.get("/auth/me")
async def auth_me(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("SELECT count(*) AS n FROM cars WHERE user_id = :uid"),
        {"uid": user["id"]},
    )
    has_cars = (rows.scalar() or 0) > 0
    return {**user, "user_id": user["id"], "has_cars": has_cars}


@api_router.put("/auth/me")
async def update_profile(
    body: ProfileUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        return user
    sets = ", ".join(f"{k} = :{k}" for k in fields)
    await db.execute(
        text(f"UPDATE profiles SET {sets}, updated_at = NOW() WHERE id = :uid"),
        {**fields, "uid": user["id"]},
    )
    await db.commit()
    row = await db.execute(
        text("SELECT id, email, name, picture, phone, role FROM profiles WHERE id = :uid"),
        {"uid": user["id"]},
    )
    return _one(row)


# ============================================================================
# CARS
# ============================================================================
CAR_MAKES = {
    "Maruti Suzuki": ["Swift", "Baleno", "WagonR", "Alto", "Brezza", "Ciaz", "Ertiga"],
    "Honda": ["City", "Civic", "Amaze", "Jazz", "WR-V"],
    "Hyundai": ["Creta", "i20", "Venue", "Verna", "Tucson"],
    "Tata": ["Nexon", "Harrier", "Safari", "Punch", "Altroz"],
    "Toyota": ["Fortuner", "Innova", "Camry", "Glanza", "Urban Cruiser"],
    "Mahindra": ["Thar", "XUV700", "Scorpio", "Bolero", "XUV300"],
    "BMW": ["3 Series", "5 Series", "X1", "X3", "X5", "M3", "M5"],
    "Mercedes": ["C-Class", "E-Class", "GLA", "GLC", "A-Class", "AMG GT"],
    "Audi": ["A4", "A6", "Q3", "Q5", "Q7", "RS5"],
    "Volkswagen": ["Polo", "Vento", "Taigun", "Virtus"],
}


@api_router.get("/cars/makes")
async def get_car_makes():
    return {"makes": CAR_MAKES}


@api_router.get("/cars")
async def get_user_cars(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""SELECT id::text AS car_id, user_id::text, make, model, year, variant, color,
                       image_url, is_primary, created_at
                FROM cars WHERE user_id = :uid ORDER BY is_primary DESC, created_at DESC"""),
        {"uid": user["id"]},
    )
    return _row(rows)


@api_router.post("/cars")
async def create_car(
    car: CarCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cnt = await db.execute(
        text("SELECT count(*) FROM cars WHERE user_id = :uid"),
        {"uid": user["id"]},
    )
    is_primary = (cnt.scalar() or 0) == 0
    rows = await db.execute(
        text("""INSERT INTO cars (user_id, make, model, year, variant, color, image_url, is_primary)
                VALUES (:uid, :make, :model, :year, :variant, :color, :image_url, :is_primary)
                RETURNING id::text AS car_id, user_id::text, make, model, year, variant, color,
                          image_url, is_primary, created_at"""),
        {"uid": user["id"], **car.model_dump(), "is_primary": is_primary},
    )
    await db.commit()
    return _one(rows)


@api_router.delete("/cars/{car_id}")
async def delete_car(
    car_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        text("DELETE FROM cars WHERE id = :cid AND user_id = :uid"),
        {"cid": car_id, "uid": user["id"]},
    )
    await db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    return {"message": "Car deleted"}


# ============================================================================
# PRODUCTS
# ============================================================================
@api_router.get("/products")
async def get_products(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    make: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
):
    conds = ["is_active = TRUE"]
    params: dict = {}
    if category:
        conds.append("category = :category")
        params["category"] = category
    if make:
        conds.append("(cardinality(compatible_makes) = 0 OR :make = ANY(compatible_makes))")
        params["make"] = make
    if min_price is not None:
        conds.append("price >= :min_price")
        params["min_price"] = min_price
    if max_price is not None:
        conds.append("price <= :max_price")
        params["max_price"] = max_price
    if search:
        conds.append("(name ILIKE :q OR brand ILIKE :q OR description ILIKE :q)")
        params["q"] = f"%{search}%"
    sql = f"""
        SELECT id::text AS product_id, name, slug, category, brand,
               price::float, installation_cost::float, description,
               images, compatible_makes, in_stock, is_active, created_at
        FROM products
        WHERE {' AND '.join(conds)}
        ORDER BY created_at DESC
        LIMIT 100
    """
    rows = await db.execute(text(sql), params)
    return _row(rows)


@api_router.get("/products/{slug}")
async def get_product_detail(slug: str, db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        text("""SELECT id::text AS product_id, name, slug, category, brand,
                       price::float, installation_cost::float, description,
                       images, compatible_makes, in_stock, is_active, created_at
                FROM products WHERE slug = :slug AND is_active = TRUE"""),
        {"slug": slug},
    )
    p = _one(rows)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


# ============================================================================
# GARAGE
# ============================================================================
@api_router.get("/garage/{car_id}")
async def get_garage_items(
    car_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""
            SELECT g.id::text  AS item_id,
                   g.user_id::text,
                   g.car_id::text,
                   g.product_id::text,
                   g.quantity,
                   g.customization,
                   g.added_at,
                   row_to_json(p.*) AS product_raw
            FROM garage_items g
            LEFT JOIN (
                SELECT id::text AS product_id, name, slug, category, brand,
                       price::float, installation_cost::float, description,
                       images, compatible_makes, in_stock, is_active
                FROM products
            ) p ON p.product_id = g.product_id::text
            WHERE g.user_id = :uid AND g.car_id = :cid
            ORDER BY g.added_at DESC
        """),
        {"uid": user["id"], "cid": car_id},
    )
    items = []
    for r in rows.mappings().all():
        d = dict(r)
        d["product"] = d.pop("product_raw")
        items.append(d)
    return items


@api_router.post("/garage")
async def add_to_garage(
    item: GarageAdd,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("""
            INSERT INTO garage_items (user_id, car_id, product_id, quantity)
            VALUES (:uid, :cid, :pid, :qty)
            ON CONFLICT (user_id, car_id, product_id)
            DO UPDATE SET quantity = garage_items.quantity + EXCLUDED.quantity
        """),
        {"uid": user["id"], "cid": item.car_id, "pid": item.product_id, "qty": item.quantity},
    )
    await db.commit()
    return {"message": "Added to garage"}


@api_router.delete("/garage/{item_id}")
async def remove_from_garage(
    item_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        text("DELETE FROM garage_items WHERE id = :id AND user_id = :uid"),
        {"id": item_id, "uid": user["id"]},
    )
    await db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Removed from garage"}


@api_router.get("/garage/{car_id}/total")
async def get_garage_total(
    car_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""
            SELECT
                COALESCE(SUM(p.price * g.quantity), 0)::float              AS total_parts,
                COALESCE(SUM(p.installation_cost * g.quantity), 0)::float  AS total_labour
            FROM garage_items g
            JOIN products p ON p.id = g.product_id
            WHERE g.user_id = :uid AND g.car_id = :cid
        """),
        {"uid": user["id"], "cid": car_id},
    )
    r = rows.mappings().first()
    parts = float(r["total_parts"] or 0)
    labour = float(r["total_labour"] or 0)
    return {"total_parts": parts, "total_labour": labour, "total": parts + labour}


# ============================================================================
# SLOTS
# ============================================================================
@api_router.get("/slots")
async def get_available_slots(
    db: AsyncSession = Depends(get_db),
    date: Optional[str] = None,
):
    if date:
        rows = await db.execute(
            text("""SELECT id::text AS slot_id, date::text, start_time, end_time,
                           capacity, booked_count, is_available
                    FROM booking_slots
                    WHERE is_available = TRUE AND date = :d AND booked_count < capacity
                    ORDER BY date, start_time"""),
            {"d": date},
        )
    else:
        rows = await db.execute(
            text("""SELECT id::text AS slot_id, date::text, start_time, end_time,
                           capacity, booked_count, is_available
                    FROM booking_slots
                    WHERE is_available = TRUE AND date >= CURRENT_DATE AND booked_count < capacity
                    ORDER BY date, start_time""")
        )
    return _row(rows)


# ============================================================================
# BOOKINGS
# ============================================================================
@api_router.post("/bookings")
async def create_booking(
    booking: BookingCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    slot_row = await db.execute(
        text("""SELECT id::text AS slot_id, date::text AS slot_date,
                       start_time, end_time, capacity, booked_count, is_available
                FROM booking_slots WHERE id = :sid FOR UPDATE"""),
        {"sid": booking.slot_id},
    )
    slot = _one(slot_row)
    if not slot or not slot["is_available"] or slot["booked_count"] >= slot["capacity"]:
        raise HTTPException(status_code=400, detail="Slot not available")

    items_rows = await db.execute(
        text("""SELECT g.product_id::text, g.quantity,
                       p.price::float, p.installation_cost::float, p.name AS product_name
                FROM garage_items g JOIN products p ON p.id = g.product_id
                WHERE g.user_id = :uid AND g.car_id = :cid"""),
        {"uid": user["id"], "cid": booking.car_id},
    )
    items = _row(items_rows)
    if not items:
        raise HTTPException(status_code=400, detail="Garage is empty")

    total_parts = sum(i["price"] * i["quantity"] for i in items)
    total_labour = sum(i["installation_cost"] * i["quantity"] for i in items)
    total = total_parts + total_labour
    booking_items = [
        {
            "product_id": i["product_id"], "quantity": i["quantity"],
            "unit_price": i["price"], "product_name": i["product_name"],
        }
        for i in items
    ]

    cnt = await db.execute(text("SELECT count(*) FROM bookings"))
    booking_code = f"MS-{datetime.now(timezone.utc).year}-{str((cnt.scalar() or 0) + 1).zfill(4)}"
    slot_time = f"{slot['start_time']} - {slot['end_time']}"

    import json as _json
    from datetime import date as date_type
    # Convert slot_date string to date object
    slot_date_obj = date_type.fromisoformat(slot["slot_date"]) if isinstance(slot["slot_date"], str) else slot["slot_date"]
    
    rows = await db.execute(
        text("""
            INSERT INTO bookings
                (booking_code, user_id, car_id, slot_id, status, pickup_address,
                 total_parts_cost, total_labour_cost, total_amount, items, slot_date, slot_time)
            VALUES
                (:code, :uid, :cid, :sid, 'confirmed', :addr,
                 :parts, :labour, :total, CAST(:items AS JSONB), :sdate, :stime)
            RETURNING id::text AS booking_id, booking_code, user_id::text, car_id::text,
                      slot_id::text, status, pickup_address,
                      total_parts_cost::float, total_labour_cost::float, total_amount::float,
                      items, slot_date::text, slot_time, created_at, updated_at
        """),
        {
            "code": booking_code, "uid": user["id"], "cid": booking.car_id, "sid": booking.slot_id,
            "addr": booking.pickup_address, "parts": total_parts, "labour": total_labour,
            "total": total, "items": _json.dumps(booking_items),
            "sdate": slot_date_obj, "stime": slot_time,
        },
    )
    new_booking = _one(rows)

    await db.execute(
        text("UPDATE booking_slots SET booked_count = booked_count + 1 WHERE id = :sid"),
        {"sid": booking.slot_id},
    )
    await db.execute(
        text("DELETE FROM garage_items WHERE user_id = :uid AND car_id = :cid"),
        {"uid": user["id"], "cid": booking.car_id},
    )
    await db.commit()
    return new_booking


@api_router.get("/bookings")
async def get_user_bookings(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""SELECT id::text AS booking_id, booking_code, user_id::text, car_id::text,
                       slot_id::text, status, pickup_address,
                       total_parts_cost::float, total_labour_cost::float, total_amount::float,
                       items, slot_date::text, slot_time, created_at, updated_at
                FROM bookings WHERE user_id = :uid ORDER BY created_at DESC LIMIT 50"""),
        {"uid": user["id"]},
    )
    return _row(rows)


@api_router.get("/bookings/{booking_id}")
async def get_booking_detail(
    booking_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""SELECT id::text AS booking_id, booking_code, user_id::text, car_id::text,
                       slot_id::text, status, pickup_address,
                       total_parts_cost::float, total_labour_cost::float, total_amount::float,
                       items, slot_date::text, slot_time, created_at, updated_at
                FROM bookings WHERE id = :bid AND user_id = :uid"""),
        {"bid": booking_id, "uid": user["id"]},
    )
    b = _one(rows)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b


@api_router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""SELECT id::text AS booking_id, status, slot_id::text
                FROM bookings WHERE id = :bid AND user_id = :uid"""),
        {"bid": booking_id, "uid": user["id"]},
    )
    b = _one(rows)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if b["status"] in ("in_workshop", "ready", "delivered", "cancelled"):
        raise HTTPException(status_code=400, detail="Cannot cancel at this stage")
    await db.execute(
        text("UPDATE bookings SET status='cancelled', updated_at = NOW() WHERE id = :bid"),
        {"bid": booking_id},
    )
    await db.execute(
        text("UPDATE booking_slots SET booked_count = GREATEST(booked_count - 1, 0) WHERE id = :sid"),
        {"sid": b["slot_id"]},
    )
    await db.commit()
    return {"message": "Booking cancelled"}


# ============================================================================
# CHANNELS
# ============================================================================
@api_router.get("/channels")
async def get_channels(db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        text("""SELECT id::text AS channel_id, name, slug, description,
                       member_count, post_count, created_at
                FROM channels ORDER BY member_count DESC LIMIT 100""")
    )
    return _row(rows)


@api_router.post("/channels")
async def create_channel(
    channel: ChannelCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    slug = channel.name.lower().replace(" ", "-").replace("&", "and")
    exists = await db.execute(text("SELECT 1 FROM channels WHERE slug = :s"), {"s": slug})
    if exists.first():
        raise HTTPException(status_code=400, detail="Channel with this name already exists")
    rows = await db.execute(
        text("""INSERT INTO channels (name, slug, description, created_by, member_count)
                VALUES (:name, :slug, :desc, :uid, 1)
                RETURNING id::text AS channel_id, name, slug, description,
                          member_count, post_count, created_at"""),
        {"name": channel.name, "slug": slug, "desc": channel.description, "uid": user["id"]},
    )
    await db.commit()
    return _one(rows)


@api_router.post("/channels/{channel_id}/join")
async def join_channel(
    channel_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    exists = await db.execute(
        text("SELECT 1 FROM channel_members WHERE channel_id = :c AND user_id = :u"),
        {"c": channel_id, "u": user["id"]},
    )
    if exists.first():
        await db.execute(
            text("DELETE FROM channel_members WHERE channel_id = :c AND user_id = :u"),
            {"c": channel_id, "u": user["id"]},
        )
        await db.execute(
            text("UPDATE channels SET member_count = GREATEST(member_count - 1, 0) WHERE id = :c"),
            {"c": channel_id},
        )
        await db.commit()
        return {"joined": False}
    await db.execute(
        text("INSERT INTO channel_members (channel_id, user_id) VALUES (:c, :u)"),
        {"c": channel_id, "u": user["id"]},
    )
    await db.execute(
        text("UPDATE channels SET member_count = member_count + 1 WHERE id = :c"),
        {"c": channel_id},
    )
    await db.commit()
    return {"joined": True}


# ============================================================================
# COMMUNITY POSTS
# ============================================================================
@api_router.get("/posts")
async def get_posts(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    channel: Optional[str] = None,
    sort_by: Optional[str] = "new",
):
    where = ["p.is_published = TRUE"]
    params: dict = {"skip": skip, "limit": limit}
    if channel:
        where.append("c.slug = :ch")
        params["ch"] = channel
    order = "p.created_at DESC"
    if sort_by in ("top", "hot"):
        order = "p.vote_count DESC"
    sql = f"""
        SELECT p.id::text AS post_id, p.user_id::text, p.car_id::text, p.channel_id::text,
               p.caption, p.media_urls, p.tagged_products::text[] AS tagged_products,
               p.likes_count, p.comments_count, p.upvotes, p.downvotes, p.vote_count,
               p.is_published, p.created_at,
               pr.name AS author_name, pr.picture AS author_picture, pr.id::text AS author_id,
               c.name AS channel_name, c.slug AS channel_slug
        FROM posts p
        LEFT JOIN profiles pr ON pr.id = p.user_id
        LEFT JOIN channels c ON c.id = p.channel_id
        WHERE {' AND '.join(where)}
        ORDER BY {order}
        OFFSET :skip LIMIT :limit
    """
    rows = await db.execute(text(sql), params)
    posts = []
    for r in rows.mappings().all():
        d = dict(r)
        d["author"] = {
            "user_id": d.pop("author_id") or "",
            "name": d.pop("author_name") or "Unknown",
            "picture": d.pop("author_picture") or "",
        }
        if d.get("channel_id"):
            d["channel"] = {
                "channel_id": d["channel_id"],
                "name": d.pop("channel_name"),
                "slug": d.pop("channel_slug"),
            }
        else:
            d.pop("channel_name", None)
            d.pop("channel_slug", None)
        # tagged_products array of UUID strings → fetch product details
        tagged_ids = d.get("tagged_products") or []
        if tagged_ids:
            prod_rows = await db.execute(
                text("""SELECT id::text AS product_id, name, price::float, slug
                        FROM products WHERE id::text = ANY(:ids)"""),
                {"ids": tagged_ids},
            )
            d["tagged_product_details"] = _row(prod_rows)
        posts.append(d)
    return posts


@api_router.post("/posts")
async def create_post(
    post: PostCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""INSERT INTO posts
                (user_id, car_id, channel_id, caption, media_urls, tagged_products)
                VALUES (:uid,
                        CASE WHEN :cid = '' THEN NULL ELSE CAST(:cid AS UUID) END,
                        CASE WHEN :ch = '' THEN NULL ELSE CAST(:ch AS UUID) END,
                        :caption, :media, CAST(:tagged AS UUID[]))
                RETURNING id::text AS post_id, user_id::text, car_id::text, channel_id::text,
                          caption, media_urls, tagged_products::text[] AS tagged_products,
                          likes_count, comments_count, upvotes, downvotes, vote_count,
                          is_published, created_at"""),
        {
            "uid": user["id"],
            "cid": post.car_id or "",
            "ch": post.channel_id or "",
            "caption": post.caption,
            "media": post.media_urls,
            "tagged": post.tagged_products,
        },
    )
    new_post = _one(rows)
    if post.channel_id:
        await db.execute(
            text("UPDATE channels SET post_count = post_count + 1 WHERE id = :c"),
            {"c": post.channel_id},
        )
    await db.commit()
    return new_post


@api_router.post("/posts/{post_id}/vote")
async def vote_post(
    post_id: str,
    vote: VoteCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if vote.vote not in ("up", "down"):
        raise HTTPException(status_code=400, detail="Vote must be 'up' or 'down'")
    existing = await db.execute(
        text("SELECT vote FROM post_votes WHERE post_id = :p AND user_id = :u"),
        {"p": post_id, "u": user["id"]},
    )
    row = existing.mappings().first()
    if row:
        old = row["vote"]
        if old == vote.vote:
            await db.execute(
                text("DELETE FROM post_votes WHERE post_id = :p AND user_id = :u"),
                {"p": post_id, "u": user["id"]},
            )
            if old == "up":
                await db.execute(
                    text("UPDATE posts SET upvotes = upvotes - 1, vote_count = vote_count - 1 WHERE id = :p"),
                    {"p": post_id},
                )
            else:
                await db.execute(
                    text("UPDATE posts SET downvotes = downvotes - 1, vote_count = vote_count + 1 WHERE id = :p"),
                    {"p": post_id},
                )
            await db.commit()
            return {"vote": None}
        else:
            await db.execute(
                text("UPDATE post_votes SET vote = :v WHERE post_id = :p AND user_id = :u"),
                {"v": vote.vote, "p": post_id, "u": user["id"]},
            )
            if vote.vote == "up":
                await db.execute(
                    text("UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1, vote_count = vote_count + 2 WHERE id = :p"),
                    {"p": post_id},
                )
            else:
                await db.execute(
                    text("UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1, vote_count = vote_count - 2 WHERE id = :p"),
                    {"p": post_id},
                )
            await db.commit()
            return {"vote": vote.vote}
    else:
        await db.execute(
            text("INSERT INTO post_votes (post_id, user_id, vote) VALUES (:p, :u, :v)"),
            {"p": post_id, "u": user["id"], "v": vote.vote},
        )
        if vote.vote == "up":
            await db.execute(
                text("UPDATE posts SET upvotes = upvotes + 1, vote_count = vote_count + 1 WHERE id = :p"),
                {"p": post_id},
            )
        else:
            await db.execute(
                text("UPDATE posts SET downvotes = downvotes + 1, vote_count = vote_count - 1 WHERE id = :p"),
                {"p": post_id},
            )
        await db.commit()
        return {"vote": vote.vote}


@api_router.post("/posts/{post_id}/save")
async def save_post(
    post_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        text("SELECT 1 FROM saved_posts WHERE post_id = :p AND user_id = :u"),
        {"p": post_id, "u": user["id"]},
    )
    if existing.first():
        await db.execute(
            text("DELETE FROM saved_posts WHERE post_id = :p AND user_id = :u"),
            {"p": post_id, "u": user["id"]},
        )
        await db.commit()
        return {"saved": False}
    await db.execute(
        text("INSERT INTO saved_posts (post_id, user_id) VALUES (:p, :u)"),
        {"p": post_id, "u": user["id"]},
    )
    await db.commit()
    return {"saved": True}


@api_router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        text("SELECT 1 FROM post_likes WHERE post_id = :p AND user_id = :u"),
        {"p": post_id, "u": user["id"]},
    )
    if existing.first():
        await db.execute(
            text("DELETE FROM post_likes WHERE post_id = :p AND user_id = :u"),
            {"p": post_id, "u": user["id"]},
        )
        await db.execute(
            text("UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = :p"),
            {"p": post_id},
        )
        await db.commit()
        return {"liked": False}
    await db.execute(
        text("INSERT INTO post_likes (post_id, user_id) VALUES (:p, :u)"),
        {"p": post_id, "u": user["id"]},
    )
    await db.execute(
        text("UPDATE posts SET likes_count = likes_count + 1 WHERE id = :p"),
        {"p": post_id},
    )
    await db.commit()
    return {"liked": True}


@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        text("""SELECT c.id::text AS comment_id, c.post_id::text, c.user_id::text,
                       c.content, c.parent_comment_id::text, c.created_at,
                       p.name AS author_name, p.picture AS author_picture
                FROM post_comments c LEFT JOIN profiles p ON p.id = c.user_id
                WHERE c.post_id = :p ORDER BY c.created_at ASC LIMIT 200"""),
        {"p": post_id},
    )
    out = []
    for r in rows.mappings().all():
        d = dict(r)
        d["author"] = {
            "name": d.pop("author_name") or "Unknown",
            "picture": d.pop("author_picture") or "",
        }
        out.append(d)
    return out


@api_router.post("/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    comment: CommentCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Handle optional parent_comment_id
    parent_id = comment.parent_comment_id if comment.parent_comment_id else None
    rows = await db.execute(
        text("""INSERT INTO post_comments (post_id, user_id, content, parent_comment_id)
                VALUES (:p, :u, :c, CAST(:pc AS UUID))
                RETURNING id::text AS comment_id, post_id::text, user_id::text,
                          content, parent_comment_id::text, created_at"""),
        {"p": post_id, "u": user["id"], "c": comment.content, "pc": parent_id},
    )
    new_comment = _one(rows)
    await db.execute(
        text("UPDATE posts SET comments_count = comments_count + 1 WHERE id = :p"),
        {"p": post_id},
    )
    await db.commit()
    return new_comment


# ============================================================================
# ADMIN
# ============================================================================
@api_router.post("/admin/init")
async def admin_init(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cnt = await db.execute(text("SELECT count(*) FROM profiles WHERE role = 'admin' AND is_system = FALSE"))
    if (cnt.scalar() or 0) > 0:
        raise HTTPException(status_code=400, detail="Admin already exists")
    await db.execute(
        text("UPDATE profiles SET role = 'admin' WHERE id = :uid"),
        {"uid": user["id"]},
    )
    await db.commit()
    return {"message": "You are now admin"}


@api_router.put("/admin/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    body: StatusUpdate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    valid = {"pending", "confirmed", "picked_up", "in_workshop", "ready", "delivered", "cancelled"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {sorted(valid)}")
    res = await db.execute(
        text("UPDATE bookings SET status = :s, updated_at = NOW() WHERE id = :b"),
        {"s": body.status, "b": booking_id},
    )
    await db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Status updated"}


@api_router.post("/admin/slots")
async def create_slot(
    slot: SlotCreate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date as date_type
    # Convert date string to date object
    slot_date_obj = date_type.fromisoformat(slot.date) if isinstance(slot.date, str) else slot.date
    
    rows = await db.execute(
        text("""INSERT INTO booking_slots (date, start_time, end_time, capacity, created_by)
                VALUES (:d, :s, :e, :c, :u)
                RETURNING id::text AS slot_id, date::text, start_time, end_time,
                          capacity, booked_count, is_available"""),
        {"d": slot_date_obj, "s": slot.start_time, "e": slot.end_time,
         "c": slot.capacity, "u": admin["id"]},
    )
    await db.commit()
    return _one(rows)


@api_router.get("/admin/bookings")
async def admin_get_bookings(
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""SELECT b.id::text AS booking_id, b.booking_code, b.user_id::text, b.car_id::text,
                       b.slot_id::text, b.status, b.pickup_address,
                       b.total_parts_cost::float, b.total_labour_cost::float, b.total_amount::float,
                       b.items, b.slot_date::text, b.slot_time, b.created_at, b.updated_at,
                       p.name AS user_name
                FROM bookings b LEFT JOIN profiles p ON p.id = b.user_id
                ORDER BY b.created_at DESC LIMIT 200""")
    )
    return _row(rows)


# ============================================================================
# HEALTH
# ============================================================================
@api_router.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    try:
        r = await db.execute(text("SELECT 1"))
        ok = r.scalar() == 1
        return {"status": "ok" if ok else "degraded", "db": ok}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ============================================================================
# APP WIRING
# ============================================================================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    logger.info("Starting ModSyndicate API — Supabase Postgres mode")


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
