"""Mod Syndicate FastAPI backend.

All endpoints live behind the ``/api`` prefix.
"""
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Body, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth import (  # noqa: E402
    create_access_token,
    get_current_user,
    get_optional_user,
    hash_password,
    verify_password,
)
from db import close_db, get_db, init_db  # noqa: E402
from models import (  # noqa: E402
    AuthOut,
    Booking,
    BookingCreate,
    ContactIn,
    Event,
    GarageAddIn,
    GarageItem,
    LoginIn,
    Post,
    PostCreate,
    Product,
    ProfileUpdate,
    RegisterIn,
    Review,
    ReviewCreate,
)
from seed_data import ensure_seed  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("mod-syndicate")

app = FastAPI(title="Mod Syndicate API", version="0.1.0")
api = APIRouter(prefix="/api")


# ---- root ------------------------------------------------------------------
@api.get("/")
async def root():
    return {"message": "Mod Syndicate API online", "version": "0.1.0"}


@api.get("/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


# ---- AUTH ------------------------------------------------------------------
@api.post("/auth/register", response_model=AuthOut)
async def register(payload: RegisterIn):
    db = get_db()
    email = payload.email.lower().strip()
    existing = await db.fetchrow("SELECT id FROM users WHERE email = $1", email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    import uuid

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name or email.split("@")[0],
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "onboarded": False,
        "phone": None,
        "city": None,
        "car_model": None,
        "car_year": None,
        "car_color": None,
        "car_photo_url": None,
        "specs": None,
    }
    await db.execute(
        """
        INSERT INTO users (id, email, name, password_hash, created_at, onboarded, phone, city, car_model, car_year, car_color, car_photo_url, specs)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        """,
        user_doc["id"], user_doc["email"], user_doc["name"], user_doc["password_hash"], user_doc["created_at"],
        user_doc["onboarded"], user_doc["phone"], user_doc["city"], user_doc["car_model"], user_doc["car_year"],
        user_doc["car_color"], user_doc["car_photo_url"], user_doc["specs"]
    )
    token = create_access_token(user_id, email)
    user_doc.pop("password_hash", None)
    return AuthOut(access_token=token, user=user_doc)


@api.post("/auth/login", response_model=AuthOut)
async def login(payload: LoginIn):
    db = get_db()
    email = payload.email.lower().strip()
    user = await db.fetchrow("SELECT * FROM users WHERE email = $1", email)
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    user.pop("password_hash", None)
    return AuthOut(access_token=token, user=user)


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api.put("/auth/profile")
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates:
        if any(k in updates for k in ("car_model", "phone")) and "onboarded" not in updates:
            updates["onboarded"] = True
            
        keys = list(updates.keys())
        values = list(updates.values())
        set_clause = ", ".join([f"{k} = ${i+1}" for i, k in enumerate(keys)])
        query = f"UPDATE users SET {set_clause} WHERE id = ${len(keys)+1}"
        await db.execute(query, *values, user["id"])
        
    fresh = await db.fetchrow(
        "SELECT id, email, name, created_at, onboarded, phone, city, car_model, car_year, car_color, car_photo_url, specs FROM users WHERE id = $1",
        user["id"]
    )
    return fresh


# ---- PRODUCTS --------------------------------------------------------------
@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    fitment: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = Query("new", description="new|price_asc|price_desc|rating"),
    limit: int = 60,
):
    db = get_db()
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if category and category != "all":
        params.append(category)
        query += f" AND category = ${len(params)}"
    if fitment and fitment != "all":
        params.append(f"%{fitment}%")
        query += f" AND CAST(fitment AS TEXT) ILIKE ${len(params)}"
    if search:
        params.append(f"%{search}%")
        idx1 = len(params)
        params.append(f"%{search}%")
        idx2 = len(params)
        params.append(f"%{search}%")
        idx3 = len(params)
        params.append(f"%{search}%")
        idx4 = len(params)
        query += f" AND (name ILIKE ${idx1} OR brand ILIKE ${idx2} OR description ILIKE ${idx3} OR CAST(tags AS TEXT) ILIKE ${idx4})"
    if min_price is not None:
        params.append(min_price)
        query += f" AND price >= ${len(params)}"
    if max_price is not None:
        params.append(max_price)
        query += f" AND price <= ${len(params)}"
        
    if sort == "price_asc":
        query += " ORDER BY price ASC"
    elif sort == "price_desc":
        query += " ORDER BY price DESC"
    elif sort == "rating":
        query += " ORDER BY rating DESC"
    else:
        query += " ORDER BY created_at DESC"
        
    params.append(limit)
    query += f" LIMIT ${len(params)}"
    
    items = await db.fetch(query, *params)
    return items


@api.get("/products/categories")
async def product_categories():
    db = get_db()
    rows = await db.fetch("SELECT DISTINCT category FROM products")
    cats = [r["category"] for r in rows if r["category"]]
    return sorted(cats)


@api.get("/products/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    p = await db.fetchrow("SELECT * FROM products WHERE id = $1", product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


# ---- GARAGE ----------------------------------------------------------------
@api.get("/garage")
async def list_garage(user=Depends(get_current_user)):
    db = get_db()
    query = """
        SELECT g.id AS garage_id, g.user_id, g.product_id, g.note, g.status, g.added_at,
               p.name, p.brand, p.category, p.price, p.sale_price, p.rating, p.reviews_count,
               p.images, p.description, p.specs, p.fitment, p.tags, p.in_stock, p.created_at AS p_created_at
        FROM garage g
        LEFT JOIN products p ON g.product_id = p.id
        WHERE g.user_id = $1
        ORDER BY g.added_at DESC
    """
    rows = await db.fetch(query, user["id"])
    
    items = []
    for r in rows:
        item = {
            "id": r["garage_id"],
            "user_id": r["user_id"],
            "product_id": r["product_id"],
            "note": r["note"],
            "status": r["status"],
            "added_at": r["added_at"],
            "product": {
                "id": r["product_id"],
                "name": r["name"],
                "brand": r["brand"],
                "category": r["category"],
                "price": r["price"],
                "sale_price": r["sale_price"],
                "rating": r["rating"],
                "reviews_count": r["reviews_count"],
                "images": r["images"],
                "description": r["description"],
                "specs": r["specs"],
                "fitment": r["fitment"],
                "tags": r["tags"],
                "in_stock": r["in_stock"],
                "created_at": r["p_created_at"]
            } if r["name"] else None
        }
        items.append(item)
    return items


@api.post("/garage")
async def add_to_garage(payload: GarageAddIn, user=Depends(get_current_user)):
    db = get_db()
    p = await db.fetchrow("SELECT id FROM products WHERE id = $1", payload.product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = await db.fetchrow(
        "SELECT * FROM garage WHERE user_id = $1 AND product_id = $2 AND status = 'saved'",
        user["id"], payload.product_id
    )
    if existing:
        return existing
    import uuid
    item_id = str(uuid.uuid4())
    added_at = datetime.utcnow().isoformat()
    await db.execute(
        """
        INSERT INTO garage (id, user_id, product_id, note, status, added_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        """,
        item_id, user["id"], payload.product_id, payload.note, "saved", added_at
    )
    return {
        "id": item_id,
        "user_id": user["id"],
        "product_id": payload.product_id,
        "note": payload.note,
        "status": "saved",
        "added_at": added_at
    }


@api.delete("/garage/{item_id}")
async def remove_from_garage(item_id: str, user=Depends(get_current_user)):
    db = get_db()
    rc = await db.execute("DELETE FROM garage WHERE id = $1 AND user_id = $2", item_id, user["id"])
    if rc == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}


# ---- BOOKINGS --------------------------------------------------------------
def _quote(products: list[dict], exclude_install: bool = False) -> dict:
    subtotal = sum((p.get("sale_price") or p.get("price") or 0) for p in products)
    install_fee = 0.0 if exclude_install else round(subtotal * 0.08, 2)  # 8% install or 0
    taxes = round((subtotal + install_fee) * 0.18, 2)  # 18% GST
    total = round(subtotal + install_fee + taxes, 2)
    return {"subtotal": round(subtotal, 2), "install_fee": install_fee, "taxes": taxes, "total": total}


@api.post("/bookings/quote")
async def quote_booking(payload: BookingCreate, user=Depends(get_current_user)):
    db = get_db()
    if not payload.product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    
    placeholders = ", ".join([f"${i+1}" for i in range(len(payload.product_ids))])
    query = f"SELECT * FROM products WHERE id IN ({placeholders})"
    products = await db.fetch(query, *payload.product_ids)
    if not products:
        raise HTTPException(status_code=400, detail="No valid products in selection")
    q = _quote(products, exclude_install=payload.exclude_install)
    return {**q, "products": products}


@api.post("/bookings", response_model=Booking)
async def create_booking(payload: BookingCreate, user=Depends(get_current_user)):
    db = get_db()
    if not payload.product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    
    placeholders = ", ".join([f"${i+1}" for i in range(len(payload.product_ids))])
    query = f"SELECT * FROM products WHERE id IN ({placeholders})"
    products = await db.fetch(query, *payload.product_ids)
    if not products:
        raise HTTPException(status_code=400, detail="No valid products in selection")
    q = _quote(products, exclude_install=payload.exclude_install)
    
    import uuid
    booking_id = str(uuid.uuid4())
    booking_code = "MS-" + uuid.uuid4().hex[:8].upper()
    created_at = datetime.utcnow().isoformat()
    delivery_eta = "3-5 business days after order date" if payload.exclude_install else "3-5 business days after install date"
    
    booking = Booking(
        id=booking_id,
        user_id=user["id"],
        booking_code=booking_code,
        product_ids=payload.product_ids,
        products_snapshot=products,
        scheduled_date=payload.scheduled_date,
        scheduled_slot=payload.scheduled_slot,
        car_model=payload.car_model or user.get("car_model"),
        notes=payload.notes,
        subtotal=q["subtotal"],
        install_fee=q["install_fee"],
        taxes=q["taxes"],
        total=q["total"],
        payment_method=payload.payment_method or "card",
        payment_status="paid_mock",
        status="confirmed",
        delivery_eta=delivery_eta,
        exclude_install=payload.exclude_install,
        created_at=created_at,
    )
    
    await db.execute(
        """
        INSERT INTO bookings (id, user_id, booking_code, product_ids, products_snapshot, scheduled_date, scheduled_slot, car_model, notes, subtotal, install_fee, taxes, total, payment_method, payment_status, status, delivery_eta, exclude_install, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        """,
        booking.id, booking.user_id, booking.booking_code, booking.product_ids, booking.products_snapshot,
        booking.scheduled_date, booking.scheduled_slot, booking.car_model, booking.notes, booking.subtotal,
        booking.install_fee, booking.taxes, booking.total, booking.payment_method, booking.payment_status,
        booking.status, booking.delivery_eta, booking.exclude_install, created_at
    )
    
    # Mark garage items as installed (best-effort)
    update_placeholders = ", ".join([f"${i+2}" for i in range(len(payload.product_ids))])
    update_query = f"UPDATE garage SET status = 'installed' WHERE user_id = $1 AND product_id IN ({update_placeholders})"
    await db.execute(update_query, user["id"], *payload.product_ids)
    
    return booking


@api.get("/bookings")
async def list_bookings(user=Depends(get_current_user)):
    db = get_db()
    items = await db.fetch("SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC", user["id"])
    return items


@api.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user=Depends(get_current_user)):
    db = get_db()
    b = await db.fetchrow("SELECT * FROM bookings WHERE id = $1 AND user_id = $2", booking_id, user["id"])
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b


# ---- COMMUNITY: POSTS ------------------------------------------------------
@api.get("/community/posts")
async def list_posts(limit: int = 60):
    db = get_db()
    posts = await db.fetch("SELECT * FROM posts ORDER BY created_at DESC LIMIT $1", limit)
    if not posts:
        demo = [
            {"id": "demo-1", "author_name": "NightOwl_Hatch", "title": "Starry Night build — under the bridge lights", "body": "Got the satin wrap and stage 1 tune done last weekend. She glows.", "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80", "car_model": "Hot Hatch", "tags": ["wrap", "hatchback", "night"], "likes": 248, "created_at": datetime.utcnow().isoformat()},
            {"id": "demo-2", "author_name": "TrailDog_SUV", "title": "Offroad build after 800km of trails", "body": "Beadlocks holding up like champs. Roof rack + light bar = night runs unlocked.", "image_url": "https://images.unsplash.com/photo-1532009877282-3340270e0529?auto=format&fit=crop&w=1200&q=80", "car_model": "Offroad SUV", "tags": ["offroad", "suv"], "likes": 184, "created_at": datetime.utcnow().isoformat()},
            {"id": "demo-3", "author_name": "ApexHunter", "title": "First trackday in the wrapped beast", "body": "Cold air intake makes the dump valve sing. Sub-2 min lap incoming.", "image_url": "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80", "car_model": "Performance Hatch", "tags": ["track", "hatchback"], "likes": 162, "created_at": datetime.utcnow().isoformat()},
            {"id": "demo-4", "author_name": "WheelGazer", "title": "New forged carbon-7s installed", "body": "Matte gunmetal. Honestly looks fake good in person.", "image_url": "https://images.unsplash.com/photo-1626668893632-6f3a4466d109?auto=format&fit=crop&w=1200&q=80", "car_model": "Coupe", "tags": ["wheels"], "likes": 311, "created_at": datetime.utcnow().isoformat()},
            {"id": "demo-5", "author_name": "ShadowSyndicate", "title": "Matte stealth wrap + tint trio", "body": "Whole car disappears at night. 10/10.", "image_url": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80", "car_model": "Performance Sedan", "tags": ["wrap", "stealth"], "likes": 142, "created_at": datetime.utcnow().isoformat()},
            {"id": "demo-6", "author_name": "BeadlockBro", "title": "Trail tested, dust approved", "body": "Lonavala run was absolute fire. The SUV feels reborn.", "image_url": "https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=1200&q=80", "car_model": "4x4 SUV", "tags": ["offroad"], "likes": 89, "created_at": datetime.utcnow().isoformat()},
        ]
        return demo
    return posts


@api.post("/community/posts", response_model=Post)
async def create_post(payload: PostCreate, user=Depends(get_current_user)):
    db = get_db()
    import uuid
    post_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    
    post = Post(
        id=post_id,
        user_id=user["id"],
        author_name=user.get("name") or user["email"].split("@")[0],
        title=payload.title,
        body=payload.body,
        image_url=payload.image_url,
        car_model=payload.car_model or user.get("car_model"),
        tags=payload.tags,
        likes=0,
        created_at=created_at
    )
    
    await db.execute(
        """
        INSERT INTO posts (id, user_id, author_name, title, body, image_url, car_model, tags, likes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """,
        post.id, post.user_id, post.author_name, post.title, post.body, post.image_url, post.car_model,
        post.tags, post.likes, created_at
    )
    return post


@api.post("/community/posts/{post_id}/like")
async def like_post(post_id: str, user=Depends(get_optional_user)):
    db = get_db()
    rc = await db.execute("UPDATE posts SET likes = likes + 1 WHERE id = $1", post_id)
    if rc == 0:
        return {"ok": True, "demo": True}
    return {"ok": True}


# ---- COMMUNITY: EVENTS / REVIEWS ------------------------------------------
@api.get("/community/events")
async def list_events():
    db = get_db()
    return await db.fetch("SELECT * FROM events ORDER BY date ASC")


@api.get("/community/reviews")
async def list_reviews():
    db = get_db()
    return await db.fetch("SELECT * FROM reviews ORDER BY created_at DESC")


@api.post("/community/reviews", response_model=Review)
async def create_review(payload: ReviewCreate, user=Depends(get_current_user)):
    db = get_db()
    import uuid
    review_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    
    review = Review(
        id=review_id,
        user_id=user["id"],
        author_name=user.get("name") or user["email"].split("@")[0],
        target=payload.target,
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
        created_at=created_at
    )
    
    await db.execute(
        """
        INSERT INTO reviews (id, user_id, author_name, target, rating, title, body, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """,
        review.id, review.user_id, review.author_name, review.target, review.rating, review.title,
        review.body, created_at
    )
    return review


# ---- CONTACT ---------------------------------------------------------------
@api.post("/contact")
async def contact_submit(payload: ContactIn):
    db = get_db()
    import uuid
    doc_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    await db.execute(
        """
        INSERT INTO contact_messages (id, name, email, phone, message, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        """,
        doc_id, payload.name, payload.email, payload.phone, payload.message, created_at
    )
    return {"ok": True, "id": doc_id}


# ---- mount router + middleware --------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    init_db()
    db = get_db()
    await db.connect()
    try:
        await ensure_seed()
        logger.info("Seed check complete")
    except Exception as e:  # noqa: BLE001
        logger.exception("Seed failed: %s", e)


@app.on_event("shutdown")
async def on_shutdown():
    await close_db()
