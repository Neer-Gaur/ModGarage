"""Seed the SQL database with premium product catalog and events on startup."""
import uuid
import json
from datetime import datetime, timedelta

from db import get_db


def seed_products():
    items = [
        # ALLOY WHEELS
        {
            "name": "Neo Royal 16\" Alloys (Set of 4)",
            "brand": "Neo Wheels",
            "category": "wheels",
            "price": 38500,
            "sale_price": 34999,
            "rating": 4.9,
            "reviews_count": 142,
            "images": ["/products/neo_alloy_wheels.png"],
            "description": "Premium multi-spoke high-grade alloy wheels from Neo Wheels. Lightweight construction, superior heat dissipation, and rugged tarmac durability.",
            "specs": {"size": "16 inch", "width": "7J", "PCD": "4x100", "offset": "ET38", "finish": "Hyper Silver / Matte Black"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["hot", "forged"]
        },
        {
            "name": "Plati Premium 15\" Black Alloys (Set of 4)",
            "brand": "Plati Wheels",
            "category": "wheels",
            "price": 26500,
            "sale_price": 24500,
            "rating": 4.7,
            "reviews_count": 63,
            "images": ["/products/neo_alloy_wheels.png"],
            "description": "Stylish 15-inch alloy wheels from Plati. Features a black machined face, lighter weight for improved fuel efficiency, and custom street styling.",
            "specs": {"size": "15 inch", "width": "6.5J", "PCD": "4x100", "offset": "ET40", "finish": "Black Machined Face"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["new", "wheels"]
        },
        # SPOILERS
        {
            "name": "M-Performance Style Carbon Fiber Spoiler Wing",
            "brand": "Tuning Monster",
            "category": "spoilers",
            "price": 8500,
            "sale_price": 6999,
            "rating": 4.8,
            "reviews_count": 56,
            "images": ["/products/spoiler_gt_wing.png"],
            "description": "Aerodynamically tuned carbon fiber trunk spoiler. Enhances high-speed downforce and gives your car a menacing motorsport stance.",
            "specs": {"material": "ABS Carbon Weave", "weight": "1.2 kg", "attachment": "3M Double-Sided Adhesive", "finish": "Glossy Carbon"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["aerodynamic", "carbon"]
        },
        # SPLITTERS
        {
            "name": "V-Style Glossy Black Bumper Lip Splitter",
            "brand": "AutoTect",
            "category": "splitters",
            "price": 3800,
            "sale_price": 2999,
            "rating": 4.6,
            "reviews_count": 87,
            "images": ["/products/front_splitter.png"],
            "description": "Three-stage adjustable front bumper lip splitter. Lowers the visual profile of your car and protects your bumper from scrapes.",
            "specs": {"material": "Polypropylene (PP)", "color": "Gloss Black", "adjustment": "Universal slide fit"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["new", "aerodynamic"]
        },
        # WRAPS
        {
            "name": "Avery Dennison Satin Metallic Blue Car Wrap",
            "brand": "Avery Dennison",
            "category": "wraps",
            "price": 72000,
            "sale_price": 65000,
            "rating": 4.9,
            "reviews_count": 38,
            "images": ["/products/satin_metallic_blue_wrap.png"],
            "description": "Premium dual-layer premium wrap film with satin finish. Protects original paint and gives a premium, metallic deep ocean blue sheen.",
            "specs": {"material": "Satin Vinyl 7yr", "finish": "Satin Metallic", "durability": "7 years"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["premium", "wrap"]
        },
        # PPF COATING
        {
            "name": "Garware Paint Protection Film (PPF) — Full Body",
            "brand": "Garware Hi-Tech",
            "category": "ppf",
            "price": 95000,
            "sale_price": 89000,
            "rating": 4.9,
            "reviews_count": 104,
            "images": ["/products/garware_ppf.png"],
            "description": "TPU self-healing paint protection film. Ultra-clear finish with extreme puncture resistance. Heals minor swirls and scratches automatically with heat.",
            "specs": {"thickness": "8.5 mil", "material": "TPU", "warranty": "5 years", "finish": "High Gloss"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["bestseller", "protection"]
        },
        # CERAMIC COATING
        {
            "name": "CarPro CQuartz Professional 9H Ceramic Coating Kit",
            "brand": "CarPro",
            "category": "ceramic",
            "price": 22000,
            "sale_price": 18500,
            "rating": 4.8,
            "reviews_count": 210,
            "images": ["/products/carpro_ceramic.png"],
            "description": "Professional grade nano-ceramic coating kit. Extreme gloss, high hydrophobic properties, chemical protection, and UV blocker.",
            "specs": {"hardness": "9H", "durability": "2+ years", "volume": "50 ml kit", "solvent": "Quartz base"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["shine", "protection"]
        },
        # MUSIC SYSTEMS
        {
            "name": "Pioneer DMH-Z5290BT Touchscreen Head Unit",
            "brand": "Pioneer",
            "category": "music",
            "price": 26990,
            "sale_price": 23990,
            "rating": 4.7,
            "reviews_count": 312,
            "images": ["/products/pioneer_screen.png"],
            "description": "6.8-inch WVGA capacitive touchscreen with built-in Apple CarPlay, Android Auto, Bluetooth, WebLink, and 13-band equalizer.",
            "specs": {"screen_size": "6.8 inch", "connectivity": "Android Auto, Apple CarPlay, Bluetooth", "audio_output": "50W x 4"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["infotainment", "hot"]
        },
        # AMBIENT LIGHT
        {
            "name": "Cardia 18-in-1 Flowing RGB Acrylic Ambient LED Kit",
            "brand": "Cardia Lighting",
            "category": "lighting",
            "price": 6500,
            "sale_price": 4999,
            "rating": 4.6,
            "reviews_count": 184,
            "images": ["/products/k4_ambient_light.png"],
            "description": "Advanced RGB flowing ambient lighting kit with acrylic strips. Custom control via mobile app. Features speed control, music sync, and color wheel selector.",
            "specs": {"leds": "Flowing RGB (18-in-1)", "control": "Bluetooth App / Remote", "material": "Thin Acrylic Strips"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["interior", "aesthetic"]
        },
        # SEAT COVERS
        {
            "name": "Autoform Signature Custom Fit Seat Covers",
            "brand": "Autoform",
            "category": "seats",
            "price": 14500,
            "sale_price": 12499,
            "rating": 4.8,
            "reviews_count": 92,
            "images": ["/products/autoform_seat_covers.png"],
            "description": "Custom-molded premium seat covers with orthopedic bucket styling. Made from high-durability breathable Nappa leatherette.",
            "specs": {"material": "Nappa Leatherette", "fit": "Orthopedic Custom Bucket Fit", "upholstery": "High-density foam"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["luxury", "interior"]
        },
        # SEAT MATS
        {
            "name": "Elegant 7D Custom Fit Floor Mats",
            "brand": "Elegant",
            "category": "mats",
            "price": 5500,
            "sale_price": 4200,
            "rating": 4.7,
            "reviews_count": 68,
            "images": ["/products/luxury_7d_mats.png"],
            "description": "7-layer custom fitted waterproof floor mats. Reaches every corner of the footwell, trapping dirt and liquid. Anti-skid bottom layer.",
            "specs": {"layers": "7 Layers", "waterproof": "Yes", "material": "PU Leather + Coil Mat"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["utility", "interior"]
        },
        # CAR COVERS
        {
            "name": "TPH Covers Pilot Series Premium All-Weather Car Cover",
            "brand": "TPH Covers",
            "category": "covers",
            "price": 7999,
            "sale_price": 6499,
            "rating": 4.8,
            "reviews_count": 74,
            "images": ["/products/tph_car_cover.png"],
            "description": "Water-resistant, dust-proof, and soft fleece-lined premium car cover. Protects your paint from UV rays, scratches, bird droppings, and bad weather.",
            "specs": {"material": "Multi-layer Polyester + Fleece", "weatherproof": "Yes", "uv_protection": "99% UV resistant"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["protection", "outdoor"]
        },
        # EXHAUSTS
        {
            "name": "Roar SS304 Dual-Tip Valvetronic Performance Exhaust",
            "brand": "Roar Exhausts",
            "category": "exhausts",
            "price": 24500,
            "sale_price": 19999,
            "rating": 4.9,
            "reviews_count": 115,
            "images": ["/products/valvetronic_exhaust.png"],
            "description": "High-grade SS304 stainless steel valvetronic exhaust muffler with wireless remote. Open the valves for a loud roaring rumble, close them for stock quietness.",
            "specs": {"material": "SS304 Stainless Steel", "valve": "Remote Valvetronic", "tips": "Dual Glossy Carbon Tips"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["performance", "hot", "ECU"]
        },
        # CAR ACCESSORIES
        {
            "name": "Qubo Smart Dash Cam Pro (GPS Edition)",
            "brand": "Qubo (Hero Group)",
            "category": "accessories",
            "price": 5490,
            "sale_price": 4290,
            "rating": 4.7,
            "reviews_count": 218,
            "images": ["/products/qubo_dash_cam.png"],
            "description": "1080p Full HD dash camera with built-in GPS log, ADAS alerts, night vision, and Wi-Fi connection for mobile app streaming.",
            "specs": {"resolution": "1080p Full HD", "gps": "Built-in", "adas": "Advanced Driver Assistance System", "storage": "MicroSD up to 256GB"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["gadget", "essential"]
        },
        {
            "name": "Bergmann Typhoon Heavy Duty Metal Car Tyre Inflator",
            "brand": "Bergmann",
            "category": "accessories",
            "price": 2400,
            "sale_price": 1899,
            "rating": 4.6,
            "reviews_count": 139,
            "images": ["/products/tyre_inflator.png"],
            "description": "100% brass motor heavy-duty metal tyre inflator. Inflates 0-30 psi in under 2 minutes. Features an accurate analog gauge and bright LED worklight.",
            "specs": {"motor": "100% Brass Motor", "pressure": "Up to 150 psi", "power": "12V socket"},
            "fitment": ["Universal (All Cars)"],
            "tags": ["essential", "utility"]
        }
    ]
    seeded = []
    for it in items:
        doc = {
            "id": str(uuid.uuid4()),
            "in_stock": True,
            "created_at": datetime.utcnow().isoformat(),
            **it,
        }
        seeded.append(doc)
    return seeded


def seed_events():
    today = datetime.utcnow()
    items = [
        {"title": "Midnight Cars & Coffee — Mumbai", "city": "Mumbai", "venue": "Marine Drive", "date": (today + timedelta(days=7)).strftime("%Y-%m-%d"), "time": "22:00 - 02:00", "description": "Late-night meet for tuners, build enthusiasts and the Mod Syndicate crew.", "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80", "tags": ["meet", "night"]},
        {"title": "Offroad Trail Run — Lonavala", "city": "Lonavala", "venue": "Pavana Lake Trail", "date": (today + timedelta(days=14)).strftime("%Y-%m-%d"), "time": "06:00 - 18:00", "description": "All-day overlanding run for modified 4x4s, SUVs and offroad vehicles.", "image_url": "https://images.unsplash.com/photo-1532009877282-3340270e0529?auto=format&fit=crop&w=1200&q=80", "tags": ["offroad", "day"]},
        {"title": "Drift Sundays — Delhi NCR", "city": "Greater Noida", "venue": "BIC Karting Track", "date": (today + timedelta(days=21)).strftime("%Y-%m-%d"), "time": "09:00 - 17:00", "description": "Tandem drift sessions. Bring tires, leave rubber.", "image_url": "https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=1200&q=80", "tags": ["drift"]},
        {"title": "Modified Auto Expo — Bengaluru", "city": "Bengaluru", "venue": "KTPO Whitefield", "date": (today + timedelta(days=30)).strftime("%Y-%m-%d"), "time": "10:00 - 21:00", "description": "India's largest custom builds exhibition. Wraps, wheels, builds, talks.", "image_url": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80", "tags": ["expo"]},
        {"title": "Track Day — Coimbatore", "city": "Coimbatore", "venue": "Kari Motor Speedway", "date": (today + timedelta(days=45)).strftime("%Y-%m-%d"), "time": "07:00 - 16:00", "description": "Open pit lane, timed sessions, professional coaching.", "image_url": "https://images.unsplash.com/photo-1518306727298-4c17e1bf6943?auto=format&fit=crop&w=1200&q=80", "tags": ["track"]},
    ]
    return [{"id": str(uuid.uuid4()), **it} for it in items]


def seed_reviews():
    items = [
        {"target": "Roar SS304 Dual-Tip Valvetronic Performance Exhaust", "rating": 5, "author_name": "Arjun M.", "title": "My car finally breathes", "body": "Felt like a different car. Exhaust note is razor sharp now. Mod Syndicate's tune team really knows their craft.", "image_url": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80"},
        {"target": "Avery Dennison Satin Metallic Blue Car Wrap", "rating": 5, "author_name": "Riya K.", "title": "Showroom finish at a meet", "body": "Color shifts under streetlights like nothing else. Worth every rupee.", "image_url": "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80"},
        {"target": "Neo Royal 16\" Alloys (Set of 4)", "rating": 5, "author_name": "Vikram S.", "title": "Built for abuse", "body": "Took my car through three road trips this month. Wheels look stunning.", "image_url": "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80"},
        {"target": "CarPro CQuartz Professional 9H Ceramic Coating Kit", "rating": 5, "author_name": "Neha P.", "title": "Water just slides off", "body": "Three months in monsoons, still beading like day one.", "image_url": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80"},
    ]
    return [{"id": str(uuid.uuid4()), "created_at": datetime.utcnow().isoformat(), **it} for it in items]


async def ensure_seed():
    db = get_db()
    # Drop existing tables
    if db.is_sqlite:
        await db.execute("DROP TABLE IF EXISTS contact_messages;")
        await db.execute("DROP TABLE IF EXISTS reviews;")
        await db.execute("DROP TABLE IF EXISTS posts;")
        await db.execute("DROP TABLE IF EXISTS bookings;")
        await db.execute("DROP TABLE IF EXISTS garage;")
        await db.execute("DROP TABLE IF EXISTS products;")
        await db.execute("DROP TABLE IF EXISTS users;")
        await db.execute("DROP TABLE IF EXISTS events;")
    else:
        await db.execute("DROP TABLE IF EXISTS contact_messages CASCADE;")
        await db.execute("DROP TABLE IF EXISTS reviews CASCADE;")
        await db.execute("DROP TABLE IF EXISTS posts CASCADE;")
        await db.execute("DROP TABLE IF EXISTS bookings CASCADE;")
        await db.execute("DROP TABLE IF EXISTS garage CASCADE;")
        await db.execute("DROP TABLE IF EXISTS products CASCADE;")
        await db.execute("DROP TABLE IF EXISTS users CASCADE;")
        await db.execute("DROP TABLE IF EXISTS events CASCADE;")

    # Recreate tables
    # (Notice: images, specs, fitment, tags, product_ids, products_snapshot are stored as JSON/TEXT)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            onboarded BOOLEAN DEFAULT FALSE,
            phone TEXT,
            city TEXT,
            car_model TEXT,
            car_year INTEGER,
            car_color TEXT,
            car_photo_url TEXT,
            specs TEXT
        );
    """)

    # Depending on sqlite or postgres, we can use JSONB or TEXT for JSON columns
    products_images_type = "JSONB" if not db.is_sqlite else "TEXT"
    
    await db.execute(f"""
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            sale_price REAL,
            rating REAL DEFAULT 4.7,
            reviews_count INTEGER DEFAULT 0,
            images {products_images_type} NOT NULL,
            description TEXT,
            specs {products_images_type} NOT NULL,
            fitment {products_images_type} NOT NULL,
            tags {products_images_type} NOT NULL,
            in_stock BOOLEAN DEFAULT TRUE,
            created_at TEXT NOT NULL
        );
    """)

    await db.execute("""
        CREATE TABLE IF NOT EXISTS garage (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            note TEXT,
            status TEXT DEFAULT 'saved',
            added_at TEXT NOT NULL
        );
    """)

    await db.execute(f"""
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            booking_code TEXT UNIQUE NOT NULL,
            product_ids {products_images_type} NOT NULL,
            products_snapshot {products_images_type} NOT NULL,
            scheduled_date TEXT NOT NULL,
            scheduled_slot TEXT NOT NULL,
            car_model TEXT,
            notes TEXT,
            subtotal REAL NOT NULL,
            install_fee REAL NOT NULL,
            taxes REAL NOT NULL,
            total REAL NOT NULL,
            payment_method TEXT DEFAULT 'card',
            payment_status TEXT DEFAULT 'paid_mock',
            status TEXT DEFAULT 'confirmed',
            delivery_eta TEXT,
            exclude_install BOOLEAN DEFAULT FALSE,
            created_at TEXT NOT NULL
        );
    """)

    await db.execute(f"""
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            author_name TEXT,
            title TEXT NOT NULL,
            body TEXT,
            image_url TEXT,
            car_model TEXT,
            tags {products_images_type} NOT NULL,
            likes INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );
    """)

    await db.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            author_name TEXT,
            target TEXT NOT NULL,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            title TEXT NOT NULL,
            body TEXT,
            image_url TEXT,
            created_at TEXT NOT NULL
        );
    """)

    await db.execute(f"""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            city TEXT NOT NULL,
            venue TEXT,
            date TEXT NOT NULL,
            time TEXT,
            image_url TEXT,
            tags {products_images_type} NOT NULL
        );
    """)

    await db.execute("""
        CREATE TABLE IF NOT EXISTS contact_messages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    """)

    # Seed initial datasets
    for p in seed_products():
        await db.execute(
            """
            INSERT INTO products (id, name, brand, category, price, sale_price, rating, reviews_count, images, description, specs, fitment, tags, in_stock, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            """,
            p["id"], p["name"], p["brand"], p["category"], p["price"], p["sale_price"],
            p["rating"], p["reviews_count"], p["images"], p["description"], p["specs"],
            p["fitment"], p["tags"], p["in_stock"], p["created_at"]
        )

    for ev in seed_events():
        await db.execute(
            """
            INSERT INTO events (id, title, description, city, venue, date, time, image_url, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """,
            ev["id"], ev["title"], ev["description"], ev["city"], ev["venue"], ev["date"],
            ev["time"], ev["image_url"], ev["tags"]
        )

    for rev in seed_reviews():
        await db.execute(
            """
            INSERT INTO reviews (id, author_name, target, rating, title, body, image_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            rev["id"], rev["author_name"], rev["target"], rev["rating"], rev["title"],
            rev["body"], rev["image_url"], rev["created_at"]
        )
