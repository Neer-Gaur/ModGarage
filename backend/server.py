from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import uuid
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========== MODELS ==========
class SessionExchange(BaseModel):
    session_id: str

class CarCreate(BaseModel):
    make: str
    model: str
    year: int
    variant: str = ""
    color: str = ""

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

# ========== AUTH HELPER ==========
async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ========== AUTH ROUTES ==========
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def exchange_session(body: SessionExchange, response: Response):
    async with httpx.AsyncClient() as http:
        resp = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session ID")
    data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "phone": "", "role": "user", "created_at": datetime.now(timezone.utc).isoformat()
        })

    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    has_cars = await db.cars.count_documents({"user_id": user_id}) > 0
    return {**user, "has_cars": has_cars}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    has_cars = await db.cars.count_documents({"user_id": user["user_id"]}) > 0
    return {**user, "has_cars": has_cars}

@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ========== CARS ROUTES ==========
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
    "Volkswagen": ["Polo", "Vento", "Taigun", "Virtus"]
}

@api_router.get("/cars/makes")
async def get_car_makes():
    return {"makes": CAR_MAKES}

@api_router.get("/cars")
async def get_user_cars(request: Request):
    user = await get_current_user(request)
    return await db.cars.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(50)

@api_router.post("/cars")
async def create_car(car: CarCreate, request: Request):
    user = await get_current_user(request)
    count = await db.cars.count_documents({"user_id": user["user_id"]})
    doc = {
        "car_id": f"car_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "make": car.make, "model": car.model, "year": car.year,
        "variant": car.variant, "color": car.color,
        "is_primary": count == 0, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cars.insert_one(doc)
    return await db.cars.find_one({"car_id": doc["car_id"]}, {"_id": 0})

@api_router.delete("/cars/{car_id}")
async def delete_car(car_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.cars.delete_one({"car_id": car_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    return {"message": "Car deleted"}

# ========== PRODUCTS ROUTES ==========
@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    make: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    query = {"is_active": True}
    if category:
        query["category"] = category
    if make:
        query["$or"] = [{"compatible_makes": {"$size": 0}}, {"compatible_makes": make}]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{slug}")
async def get_product_detail(slug: str):
    product = await db.products.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ========== GARAGE ROUTES ==========
@api_router.get("/garage/{car_id}")
async def get_garage_items(car_id: str, request: Request):
    user = await get_current_user(request)
    items = await db.garage_items.find(
        {"user_id": user["user_id"], "car_id": car_id}, {"_id": 0}
    ).to_list(100)
    for item in items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            item["product"] = product
    return items

@api_router.post("/garage")
async def add_to_garage(item: GarageAdd, request: Request):
    user = await get_current_user(request)
    existing = await db.garage_items.find_one({
        "user_id": user["user_id"], "car_id": item.car_id, "product_id": item.product_id
    })
    if existing:
        await db.garage_items.update_one(
            {"user_id": user["user_id"], "car_id": item.car_id, "product_id": item.product_id},
            {"$inc": {"quantity": item.quantity}}
        )
    else:
        doc = {
            "item_id": f"gi_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"], "car_id": item.car_id,
            "product_id": item.product_id, "quantity": item.quantity,
            "customization": {}, "added_at": datetime.now(timezone.utc).isoformat()
        }
        await db.garage_items.insert_one(doc)
    return {"message": "Added to garage"}

@api_router.delete("/garage/{item_id}")
async def remove_from_garage(item_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.garage_items.delete_one({"item_id": item_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Removed from garage"}

@api_router.get("/garage/{car_id}/total")
async def get_garage_total(car_id: str, request: Request):
    user = await get_current_user(request)
    items = await db.garage_items.find(
        {"user_id": user["user_id"], "car_id": car_id}, {"_id": 0}
    ).to_list(100)
    total_parts = 0
    total_labour = 0
    for item in items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            total_parts += product["price"] * item["quantity"]
            total_labour += product["installation_cost"] * item["quantity"]
    return {"total_parts": total_parts, "total_labour": total_labour, "total": total_parts + total_labour}

# ========== SLOTS ROUTES ==========
@api_router.get("/slots")
async def get_available_slots(date: Optional[str] = None):
    query = {"is_available": True}
    if date:
        query["date"] = date
    else:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["date"] = {"$gte": today}
    slots = await db.booking_slots.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return [s for s in slots if s.get("booked_count", 0) < s.get("capacity", 5)]

# ========== BOOKINGS ROUTES ==========
@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, request: Request):
    user = await get_current_user(request)
    slot = await db.booking_slots.find_one({"slot_id": booking.slot_id}, {"_id": 0})
    if not slot or not slot.get("is_available") or slot.get("booked_count", 0) >= slot.get("capacity", 5):
        raise HTTPException(status_code=400, detail="Slot not available")

    items = await db.garage_items.find(
        {"user_id": user["user_id"], "car_id": booking.car_id}, {"_id": 0}
    ).to_list(100)
    if not items:
        raise HTTPException(status_code=400, detail="Garage is empty")

    total_parts = 0
    total_labour = 0
    booking_items = []
    for item in items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            total_parts += product["price"] * item["quantity"]
            total_labour += product["installation_cost"] * item["quantity"]
            booking_items.append({
                "product_id": item["product_id"], "quantity": item["quantity"],
                "unit_price": product["price"], "product_name": product["name"]
            })

    booking_count = await db.bookings.count_documents({})
    booking_code = f"MG-2026-{str(booking_count + 1).zfill(4)}"
    booking_doc = {
        "booking_id": f"bk_{uuid.uuid4().hex[:12]}",
        "booking_code": booking_code, "user_id": user["user_id"],
        "car_id": booking.car_id, "slot_id": booking.slot_id,
        "status": "confirmed", "pickup_address": booking.pickup_address,
        "total_parts_cost": total_parts, "total_labour_cost": total_labour,
        "total_amount": total_parts + total_labour,
        "items": booking_items,
        "slot_date": slot.get("date", ""), "slot_time": f"{slot.get('start_time', '')} - {slot.get('end_time', '')}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    await db.booking_slots.update_one({"slot_id": booking.slot_id}, {"$inc": {"booked_count": 1}})
    await db.garage_items.delete_many({"user_id": user["user_id"], "car_id": booking.car_id})
    return await db.bookings.find_one({"booking_id": booking_doc["booking_id"]}, {"_id": 0})

@api_router.get("/bookings")
async def get_user_bookings(request: Request):
    user = await get_current_user(request)
    return await db.bookings.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/bookings/{booking_id}")
async def get_booking_detail(booking_id: str, request: Request):
    user = await get_current_user(request)
    booking = await db.bookings.find_one({"booking_id": booking_id, "user_id": user["user_id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@api_router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, request: Request):
    user = await get_current_user(request)
    booking = await db.bookings.find_one({"booking_id": booking_id, "user_id": user["user_id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] in ["in_workshop", "ready", "delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel at this stage")
    await db.bookings.update_one({"booking_id": booking_id}, {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}})
    await db.booking_slots.update_one({"slot_id": booking["slot_id"]}, {"$inc": {"booked_count": -1}})
    return {"message": "Booking cancelled"}

# ========== CHANNEL ROUTES ==========
@api_router.get("/channels")
async def get_channels():
    channels = await db.channels.find({}, {"_id": 0}).sort("member_count", -1).to_list(100)
    return channels

@api_router.post("/channels")
async def create_channel(channel: ChannelCreate, request: Request):
    user = await get_current_user(request)
    slug = channel.name.lower().replace(" ", "-").replace("&", "and")
    existing = await db.channels.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=400, detail="Channel with this name already exists")
    doc = {
        "channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": channel.name, "slug": slug,
        "description": channel.description, "created_by": user["user_id"],
        "member_count": 1, "post_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.channels.insert_one(doc)
    return await db.channels.find_one({"channel_id": doc["channel_id"]}, {"_id": 0})

@api_router.post("/channels/{channel_id}/join")
async def join_channel(channel_id: str, request: Request):
    user = await get_current_user(request)
    existing = await db.channel_members.find_one({"channel_id": channel_id, "user_id": user["user_id"]})
    if existing:
        await db.channel_members.delete_one({"channel_id": channel_id, "user_id": user["user_id"]})
        await db.channels.update_one({"channel_id": channel_id}, {"$inc": {"member_count": -1}})
        return {"joined": False}
    await db.channel_members.insert_one({"channel_id": channel_id, "user_id": user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()})
    await db.channels.update_one({"channel_id": channel_id}, {"$inc": {"member_count": 1}})
    return {"joined": True}

# ========== COMMUNITY ROUTES ==========
@api_router.get("/posts")
async def get_posts(skip: int = 0, limit: int = 20, channel: Optional[str] = None, sort_by: Optional[str] = "new"):
    query = {"is_published": True}
    if channel:
        ch = await db.channels.find_one({"slug": channel})
        if ch:
            query["channel_id"] = ch["channel_id"]
    sort_field = "created_at"
    if sort_by == "top":
        sort_field = "vote_count"
    elif sort_by == "hot":
        sort_field = "vote_count"
    posts = await db.posts.find(query, {"_id": 0}).sort(sort_field, -1).skip(skip).limit(limit).to_list(limit)
    for post in posts:
        user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0})
        post["author"] = {"name": user["name"], "picture": user.get("picture", ""), "user_id": user["user_id"]} if user else {"name": "Unknown", "picture": "", "user_id": ""}
        if post.get("tagged_products"):
            tagged = []
            for pid in post["tagged_products"]:
                p = await db.products.find_one({"product_id": pid}, {"_id": 0})
                if p:
                    tagged.append({"product_id": p["product_id"], "name": p["name"], "price": p["price"], "slug": p["slug"]})
            post["tagged_product_details"] = tagged
        if post.get("channel_id"):
            ch = await db.channels.find_one({"channel_id": post["channel_id"]}, {"_id": 0})
            post["channel"] = ch
    return posts

@api_router.post("/posts")
async def create_post(post: PostCreate, request: Request):
    user = await get_current_user(request)
    doc = {
        "post_id": f"post_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "car_id": post.car_id, "caption": post.caption, "channel_id": post.channel_id,
        "media_urls": post.media_urls, "tagged_products": post.tagged_products,
        "likes_count": 0, "comments_count": 0,
        "upvotes": 0, "downvotes": 0, "vote_count": 0,
        "is_published": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.posts.insert_one(doc)
    if post.channel_id:
        await db.channels.update_one({"channel_id": post.channel_id}, {"$inc": {"post_count": 1}})
    return await db.posts.find_one({"post_id": doc["post_id"]}, {"_id": 0})

@api_router.post("/posts/{post_id}/vote")
async def vote_post(post_id: str, vote: VoteCreate, request: Request):
    user = await get_current_user(request)
    if vote.vote not in ("up", "down"):
        raise HTTPException(status_code=400, detail="Vote must be 'up' or 'down'")
    existing = await db.post_votes.find_one({"post_id": post_id, "user_id": user["user_id"]})
    if existing:
        old_vote = existing["vote"]
        if old_vote == vote.vote:
            # Remove vote
            await db.post_votes.delete_one({"post_id": post_id, "user_id": user["user_id"]})
            inc = {"upvotes": -1, "vote_count": -1} if old_vote == "up" else {"downvotes": -1, "vote_count": 1}
            await db.posts.update_one({"post_id": post_id}, {"$inc": inc})
            return {"vote": None}
        else:
            # Change vote
            await db.post_votes.update_one({"post_id": post_id, "user_id": user["user_id"]}, {"$set": {"vote": vote.vote}})
            if vote.vote == "up":
                await db.posts.update_one({"post_id": post_id}, {"$inc": {"upvotes": 1, "downvotes": -1, "vote_count": 2}})
            else:
                await db.posts.update_one({"post_id": post_id}, {"$inc": {"upvotes": -1, "downvotes": 1, "vote_count": -2}})
            return {"vote": vote.vote}
    else:
        await db.post_votes.insert_one({"post_id": post_id, "user_id": user["user_id"], "vote": vote.vote, "created_at": datetime.now(timezone.utc).isoformat()})
        inc = {"upvotes": 1, "vote_count": 1} if vote.vote == "up" else {"downvotes": 1, "vote_count": -1}
        await db.posts.update_one({"post_id": post_id}, {"$inc": inc})
        return {"vote": vote.vote}

@api_router.post("/posts/{post_id}/save")
async def save_post(post_id: str, request: Request):
    user = await get_current_user(request)
    existing = await db.saved_posts.find_one({"post_id": post_id, "user_id": user["user_id"]})
    if existing:
        await db.saved_posts.delete_one({"post_id": post_id, "user_id": user["user_id"]})
        return {"saved": False}
    await db.saved_posts.insert_one({"post_id": post_id, "user_id": user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()})
    return {"saved": True}

@api_router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, request: Request):
    user = await get_current_user(request)
    existing = await db.post_likes.find_one({"post_id": post_id, "user_id": user["user_id"]})
    if existing:
        await db.post_likes.delete_one({"post_id": post_id, "user_id": user["user_id"]})
        await db.posts.update_one({"post_id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False}
    else:
        await db.post_likes.insert_one({"post_id": post_id, "user_id": user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()})
        await db.posts.update_one({"post_id": post_id}, {"$inc": {"likes_count": 1}})
        return {"liked": True}

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    comments = await db.post_comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    for c in comments:
        u = await db.users.find_one({"user_id": c["user_id"]}, {"_id": 0})
        c["author"] = {"name": u["name"], "picture": u.get("picture", "")} if u else {"name": "Unknown", "picture": ""}
    return comments

@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, comment: CommentCreate, request: Request):
    user = await get_current_user(request)
    doc = {
        "comment_id": f"cmt_{uuid.uuid4().hex[:12]}", "post_id": post_id,
        "user_id": user["user_id"], "content": comment.content,
        "parent_comment_id": comment.parent_comment_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.post_comments.insert_one(doc)
    await db.posts.update_one({"post_id": post_id}, {"$inc": {"comments_count": 1}})
    return await db.post_comments.find_one({"comment_id": doc["comment_id"]}, {"_id": 0})

# ========== ADMIN ROUTES ==========
@api_router.post("/admin/init")
async def admin_init(request: Request):
    user = await get_current_user(request)
    admin_count = await db.users.count_documents({"role": "admin"})
    if admin_count > 0:
        raise HTTPException(status_code=400, detail="Admin already exists")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": "admin"}})
    return {"message": "You are now admin"}

@api_router.put("/admin/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, body: StatusUpdate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    valid = ["pending", "confirmed", "picked_up", "in_workshop", "ready", "delivered", "cancelled"]
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": body.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Status updated"}

@api_router.post("/admin/slots")
async def create_slot(slot: SlotCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    doc = {
        "slot_id": f"slot_{uuid.uuid4().hex[:12]}", "date": slot.date,
        "start_time": slot.start_time, "end_time": slot.end_time,
        "capacity": slot.capacity, "booked_count": 0, "is_available": True,
        "created_by": user["user_id"]
    }
    await db.booking_slots.insert_one(doc)
    return await db.booking_slots.find_one({"slot_id": doc["slot_id"]}, {"_id": 0})

@api_router.get("/admin/bookings")
async def admin_get_bookings(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for b in bookings:
        u = await db.users.find_one({"user_id": b["user_id"]}, {"_id": 0})
        b["user_name"] = u["name"] if u else "Unknown"
    return bookings

# ========== SEED DATA ==========
IMG_RIM = "https://images.unsplash.com/photo-1745439988955-da4eee57918a?w=600&h=400&fit=crop"
IMG_ENGINE = "https://images.unsplash.com/photo-1771623915340-d3c68845e400?w=600&h=400&fit=crop"
IMG_CARBON = "https://images.unsplash.com/photo-1773502605492-5d5e8c0c17a2?w=600&h=400&fit=crop"
IMG_CAR1 = "https://images.unsplash.com/photo-1774576320208-9914d1fc5be5?w=600&h=400&fit=crop"
IMG_CAR2 = "https://images.unsplash.com/photo-1628273148878-b9ebaec15818?w=600&h=400&fit=crop"
IMG_SPORTS = "https://images.pexels.com/photos/9139586/pexels-photo-9139586.jpeg?w=600&h=400&fit=crop"
IMG_GARAGE = "https://images.unsplash.com/photo-1774088249014-b0d7d907ad16?w=600&h=400&fit=crop"

SEED_PRODUCTS = [
    {"name": "OZ Racing Ultraleggera HLT", "slug": "oz-racing-ultraleggera", "category": "rims", "brand": "OZ Racing", "price": 72000, "installation_cost": 5000, "description": "Forged aluminum alloy wheels with HLT technology. Ultra-lightweight construction for maximum performance.", "images": [IMG_RIM], "compatible_makes": []},
    {"name": "Enkei RPF1 Competition", "slug": "enkei-rpf1", "category": "rims", "brand": "Enkei", "price": 55000, "installation_cost": 5000, "description": "MAT process forged wheels. Track-proven performance with aggressive concave design.", "images": [IMG_RIM], "compatible_makes": []},
    {"name": "BBS Super RS Forged", "slug": "bbs-super-rs", "category": "rims", "brand": "BBS", "price": 95000, "installation_cost": 5000, "description": "Premium forged two-piece wheels with iconic mesh design. Motorsport heritage meets street luxury.", "images": [IMG_RIM], "compatible_makes": []},
    {"name": "Akrapovic Slip-On Titanium", "slug": "akrapovic-titanium", "category": "exhaust", "brand": "Akrapovic", "price": 125000, "installation_cost": 12000, "description": "Full titanium construction with carbon fiber tips. Aggressive sound profile with 15% weight reduction.", "images": [IMG_ENGINE], "compatible_makes": ["BMW", "Mercedes", "Audi"]},
    {"name": "Borla ATAK Cat-Back System", "slug": "borla-atak", "category": "exhaust", "brand": "Borla", "price": 68000, "installation_cost": 8000, "description": "Aggressive Thunder sound level. T-304 stainless steel with patented multi-core technology.", "images": [IMG_ENGINE], "compatible_makes": ["Honda", "Hyundai", "Maruti Suzuki"]},
    {"name": "APR Carbon Fiber Wing", "slug": "apr-carbon-wing", "category": "spoiler", "brand": "APR Performance", "price": 45000, "installation_cost": 6000, "description": "GTC-200 adjustable wing with real carbon fiber construction. Wind tunnel tested for maximum downforce.", "images": [IMG_CAR1], "compatible_makes": []},
    {"name": "Voltex GT Wing Type V", "slug": "voltex-gt-wing", "category": "spoiler", "brand": "Voltex", "price": 180000, "installation_cost": 15000, "description": "Japanese-made full carbon GT wing. Championship-proven aerodynamics with adjustable angle.", "images": [IMG_CAR1], "compatible_makes": ["Honda", "Toyota", "Maruti Suzuki"]},
    {"name": "Morimoto XB LED Pro", "slug": "morimoto-xb-led", "category": "headlights", "brand": "Morimoto", "price": 42000, "installation_cost": 5000, "description": "Plug-and-play LED headlight upgrade. Sequential turn signals with DRL strip.", "images": [IMG_SPORTS], "compatible_makes": []},
    {"name": "Oracle ColorSHIFT Halo Kit", "slug": "oracle-colorshift", "category": "headlights", "brand": "Oracle Lighting", "price": 28000, "installation_cost": 4000, "description": "RGB color-changing halo rings with Bluetooth control. Over 16 million colors.", "images": [IMG_SPORTS], "compatible_makes": []},
    {"name": "KW Coilover V3 Kit", "slug": "kw-v3-coilover", "category": "suspension", "brand": "KW Suspensions", "price": 135000, "installation_cost": 18000, "description": "Triple-adjustable coilovers with separate rebound and compression damping. Track to street versatility.", "images": [IMG_CARBON], "compatible_makes": ["BMW", "Mercedes", "Audi", "Volkswagen"]},
    {"name": "Bilstein B16 PSS10", "slug": "bilstein-b16", "category": "suspension", "brand": "Bilstein", "price": 98000, "installation_cost": 15000, "description": "10-stage adjustable damping with progressive rate springs. German engineering for precision handling.", "images": [IMG_CARBON], "compatible_makes": ["BMW", "Mercedes", "Honda"]},
    {"name": "Sparco QRT-R Bucket Seat", "slug": "sparco-qrt-r", "category": "interior", "brand": "Sparco", "price": 85000, "installation_cost": 8000, "description": "FIA-approved carbon fiber racing seat. Alcantara upholstery with integrated head restraint.", "images": [IMG_CAR2], "compatible_makes": []},
    {"name": "Seibon Carbon Fiber Hood", "slug": "seibon-cf-hood", "category": "hood", "brand": "Seibon", "price": 65000, "installation_cost": 8000, "description": "OEM-style carbon fiber hood with UV-resistant clear coat. 60% lighter than stock.", "images": [IMG_ENGINE], "compatible_makes": ["Honda", "Hyundai", "Maruti Suzuki", "Tata"]},
    {"name": "3M 2080 Satin Black Full Wrap", "slug": "3m-satin-black", "category": "vinyl", "brand": "3M", "price": 45000, "installation_cost": 15000, "description": "Full body satin black wrap with Comply adhesive and Controltac technology. Self-healing properties.", "images": [IMG_CAR1], "compatible_makes": []},
    {"name": "NRG Quick Release Hub Kit", "slug": "nrg-quick-release", "category": "interior", "brand": "NRG Innovations", "price": 12000, "installation_cost": 2000, "description": "Steering wheel quick release with SFI-rated ball locking mechanism. Anodized finish.", "images": [IMG_CAR2], "compatible_makes": []},
]

async def seed_database():
    product_count = await db.products.count_documents({})
    if product_count == 0:
        logger.info("Seeding products...")
        now = datetime.now(timezone.utc).isoformat()
        for p in SEED_PRODUCTS:
            p["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
            p["in_stock"] = True
            p["is_active"] = True
            p["created_at"] = now
        await db.products.insert_many(SEED_PRODUCTS)
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products")

    slot_count = await db.booking_slots.count_documents({})
    if slot_count == 0:
        logger.info("Seeding booking slots...")
        slots = []
        for day_offset in range(1, 15):
            d = (datetime.now(timezone.utc) + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            slots.append({"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "date": d, "start_time": "09:00", "end_time": "13:00", "capacity": 5, "booked_count": 0, "is_available": True})
            slots.append({"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "date": d, "start_time": "14:00", "end_time": "18:00", "capacity": 5, "booked_count": 0, "is_available": True})
        await db.booking_slots.insert_many(slots)
        logger.info(f"Seeded {len(slots)} booking slots")

    # Seed channels
    channel_count = await db.channels.count_documents({})
    if channel_count == 0:
        channels = [
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "Mahindra Thar Club", "slug": "mahindra-thar-club", "description": "All things Thar — lifts, bumpers, winches and trail stories.", "created_by": "system", "member_count": 342, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "Toyota Supra Builds", "slug": "toyota-supra-builds", "description": "MK4 and MK5 Supra build diaries, dyno results and tuning tips.", "created_by": "system", "member_count": 518, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "BMW M Series", "slug": "bmw-m-series", "description": "M2, M3, M4 and beyond. Performance mods and track setups.", "created_by": "system", "member_count": 672, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "JDM Legends", "slug": "jdm-legends", "description": "Skyline, RX-7, NSX, EVO — the icons of Japanese performance.", "created_by": "system", "member_count": 891, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "Mustang Nation", "slug": "mustang-nation", "description": "From classic 5.0 to modern GT500. American muscle at its finest.", "created_by": "system", "member_count": 423, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "Off-Road Warriors", "slug": "off-road-warriors", "description": "Jeeps, trucks, 4x4s — mud, rocks and everything in between.", "created_by": "system", "member_count": 287, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "Track Day Diaries", "slug": "track-day-diaries", "description": "Lap times, suspension setups, and aero data from the circuit.", "created_by": "system", "member_count": 156, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"channel_id": f"ch_{uuid.uuid4().hex[:12]}", "name": "Show and Shine", "slug": "show-and-shine", "description": "Detailing, wraps, paint correction — make it look as good as it drives.", "created_by": "system", "member_count": 734, "post_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.channels.insert_many(channels)
        logger.info(f"Seeded {len(channels)} community channels")

    # Seed community posts (from a system user)
    post_count = await db.posts.count_documents({})
    if post_count == 0:
        system_user = await db.users.find_one({"email": "modgarage@system.com"}, {"_id": 0})
        if not system_user:
            system_user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": system_user_id, "email": "modgarage@system.com", "name": "ModGarage Official",
                "picture": "", "phone": "", "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        else:
            system_user_id = system_user["user_id"]

        all_channels = await db.channels.find({}, {"_id": 0}).to_list(10)
        ch_map = {c["slug"]: c["channel_id"] for c in all_channels}
        products = await db.products.find({}, {"_id": 0}).to_list(5)
        tagged_ids = [p["product_id"] for p in products[:3]] if products else []
        posts = [
            {"post_id": f"post_{uuid.uuid4().hex[:12]}", "user_id": system_user_id, "car_id": None, "channel_id": ch_map.get("show-and-shine"), "caption": "Fresh build complete! Full carbon aero kit with titanium exhaust. The sound is absolutely insane.", "media_urls": [IMG_CAR1], "tagged_products": tagged_ids[:2], "likes_count": 47, "comments_count": 12, "upvotes": 47, "downvotes": 3, "vote_count": 44, "is_published": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"post_id": f"post_{uuid.uuid4().hex[:12]}", "user_id": system_user_id, "car_id": None, "channel_id": ch_map.get("bmw-m-series"), "caption": "Weekend project turned masterpiece. KW V3 coilovers + BBS RS wheels. Sits perfect.", "media_urls": [IMG_CAR2], "tagged_products": tagged_ids[1:3] if len(tagged_ids) > 1 else [], "likes_count": 83, "comments_count": 24, "upvotes": 83, "downvotes": 5, "vote_count": 78, "is_published": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"post_id": f"post_{uuid.uuid4().hex[:12]}", "user_id": system_user_id, "car_id": None, "channel_id": ch_map.get("jdm-legends"), "caption": "Engine bay goals. Every bolt, every hose - perfection. Who else obsesses over the details?", "media_urls": [IMG_ENGINE], "tagged_products": tagged_ids[:1], "likes_count": 156, "comments_count": 38, "upvotes": 156, "downvotes": 8, "vote_count": 148, "is_published": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"post_id": f"post_{uuid.uuid4().hex[:12]}", "user_id": system_user_id, "car_id": None, "channel_id": ch_map.get("track-day-diaries"), "caption": "Track day ready. Full suspension overhaul and aero package installed. Shaved 3 seconds off our lap time!", "media_urls": [IMG_GARAGE], "tagged_products": tagged_ids, "likes_count": 210, "comments_count": 52, "upvotes": 210, "downvotes": 12, "vote_count": 198, "is_published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.posts.insert_many(posts)
        for ch_id in set(p["channel_id"] for p in posts if p.get("channel_id")):
            count = sum(1 for p in posts if p.get("channel_id") == ch_id)
            await db.channels.update_one({"channel_id": ch_id}, {"$inc": {"post_count": count}})
        logger.info("Seeded community posts with channels")

@app.on_event("startup")
async def startup():
    await seed_database()

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
