-- ===========================================================================
-- MOD SYNDICATE SUPABASE SCHEMAS & SEEDING SCRIPT
-- ===========================================================================
-- Execute this script in your Supabase SQL Editor to set up all tables,
-- foreign keys, RLS policies, Storage buckets, and pre-populate catalog data.

-- ---------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (IF ANY)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS garage CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ---------------------------------------------------------------------------
-- 2. CREATE TABLES
-- ---------------------------------------------------------------------------

-- A. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    onboarded BOOLEAN DEFAULT FALSE,
    phone VARCHAR(50),
    city VARCHAR(100),
    car_model VARCHAR(100),
    car_year INTEGER,
    car_color VARCHAR(100),
    car_photo_url TEXT,
    specs TEXT
);

-- B. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    sale_price DECIMAL(12, 2),
    rating DECIMAL(3, 2) DEFAULT 4.7,
    reviews_count INTEGER DEFAULT 0,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    fitment JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Garage Table
CREATE TABLE garage (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    note TEXT,
    status VARCHAR(50) DEFAULT 'saved',
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    products_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheduled_date VARCHAR(50) NOT NULL,
    scheduled_slot VARCHAR(50) NOT NULL,
    car_model VARCHAR(100),
    notes TEXT,
    subtotal DECIMAL(12, 2) NOT NULL,
    install_fee DECIMAL(12, 2) NOT NULL,
    taxes DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'card',
    payment_status VARCHAR(50) DEFAULT 'paid_mock',
    status VARCHAR(50) DEFAULT 'confirmed',
    delivery_eta TEXT,
    exclude_install BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. Posts Table
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    image_url TEXT,
    car_model VARCHAR(100),
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    target VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- G. Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    city VARCHAR(100) NOT NULL,
    venue VARCHAR(255),
    date VARCHAR(50) NOT NULL,
    time VARCHAR(50),
    image_url TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- H. Contact Messages Table
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. SUPABASE STORAGE BUCKET CREATION & POLICIES
-- ---------------------------------------------------------------------------

-- Enable the storage extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a storage bucket for build/car/profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('build-photos', 'build-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'build-photos');

DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
CREATE POLICY "Public Insert Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'build-photos');

DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
CREATE POLICY "Public Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'build-photos');

DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;
CREATE POLICY "Public Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'build-photos');


-- ---------------------------------------------------------------------------
-- 4. SEED PRODUCTS DATA
-- ---------------------------------------------------------------------------
INSERT INTO products (id, name, brand, category, price, sale_price, rating, reviews_count, images, description, specs, fitment, tags, in_stock, created_at)
VALUES
  (
    '1e62a262-b9b5-471a-9694-ee8c54157ebc',
    'Neo Royal 16" Alloys (Set of 4)',
    'Neo Wheels',
    'wheels',
    38500.00,
    34999.00,
    4.9,
    142,
    '["/products/neo_alloy_wheels.png"]'::jsonb,
    'Premium multi-spoke high-grade alloy wheels from Neo Wheels. Lightweight construction, superior heat dissipation, and rugged tarmac durability.',
    '{"size": "16 inch", "width": "7J", "PCD": "4x100", "offset": "ET38", "finish": "Hyper Silver / Matte Black"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["hot", "forged"]'::jsonb,
    true,
    NOW()
  ),
  (
    '2a12a874-a637-4b77-8c3b-d1e57c63aa87',
    'Plati Premium 15" Black Alloys (Set of 4)',
    'Plati Wheels',
    'wheels',
    26500.00,
    24500.00,
    4.7,
    63,
    '["/products/neo_alloy_wheels.png"]'::jsonb,
    'Stylish 15-inch alloy wheels from Plati. Features a black machined face, lighter weight for improved fuel efficiency, and custom street styling.',
    '{"size": "15 inch", "width": "6.5J", "PCD": "4x100", "offset": "ET40", "finish": "Black Machined Face"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["new", "wheels"]'::jsonb,
    true,
    NOW()
  ),
  (
    '3b92a278-df16-43ad-8d34-f81dcc39bb87',
    'M-Performance Style Carbon Fiber Spoiler Wing',
    'Tuning Monster',
    'spoilers',
    8500.00,
    6999.00,
    4.8,
    56,
    '["/products/spoiler_gt_wing.png"]'::jsonb,
    'Aerodynamically tuned carbon fiber trunk spoiler. Enhances high-speed downforce and gives your car a menacing motorsport stance.',
    '{"material": "ABS Carbon Weave", "weight": "1.2 kg", "attachment": "3M Double-Sided Adhesive", "finish": "Glossy Carbon"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["aerodynamic", "carbon"]'::jsonb,
    true,
    NOW()
  ),
  (
    '4c02f782-b1d5-45a7-96ff-ee81b15fbc78',
    'V-Style Glossy Black Bumper Lip Splitter',
    'AutoTect',
    'splitters',
    3800.00,
    2999.00,
    4.6,
    87,
    '["/products/front_splitter.png"]'::jsonb,
    'Three-stage adjustable front bumper lip splitter. Lowers the visual profile of your car and protects your bumper from scrapes.',
    '{"material": "Polypropylene (PP)", "color": "Gloss Black", "adjustment": "Universal slide fit"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["new", "aerodynamic"]'::jsonb,
    true,
    NOW()
  ),
  (
    '5d12e892-c11f-4ef8-82cc-1f81d11fbd92',
    'Avery Dennison Satin Metallic Blue Car Wrap',
    'Avery Dennison',
    'wraps',
    72000.00,
    65000.00,
    4.9,
    38,
    '["/products/satin_metallic_blue_wrap.png"]'::jsonb,
    'Premium dual-layer premium wrap film with satin finish. Protects original paint and gives a premium, metallic deep ocean blue sheen.',
    '{"material": "Satin Vinyl 7yr", "finish": "Satin Metallic", "durability": "7 years"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["premium", "wrap"]'::jsonb,
    true,
    NOW()
  ),
  (
    '6e13da82-df21-4ea7-8bcf-c2ee12d5ab82',
    'Garware Paint Protection Film (PPF) — Full Body',
    'Garware Hi-Tech',
    'ppf',
    95000.00,
    89000.00,
    4.9,
    104,
    '["/products/garware_ppf.png"]'::jsonb,
    'TPU self-healing paint protection film. Ultra-clear finish with extreme puncture resistance. Heals minor swirls and scratches automatically with heat.',
    '{"thickness": "8.5 mil", "material": "TPU", "warranty": "5 years", "finish": "High Gloss"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["bestseller", "protection"]'::jsonb,
    true,
    NOW()
  ),
  (
    '7f14ea98-bd32-4fb8-9cde-d3ee8a49ba98',
    'CarPro CQuartz Professional 9H Ceramic Coating Kit',
    'CarPro',
    'ceramic',
    22000.00,
    18500.00,
    4.8,
    210,
    '["/products/carpro_ceramic.png"]'::jsonb,
    'Professional grade nano-ceramic coating kit. Extreme gloss, high hydrophobic properties, chemical protection, and UV blocker.',
    '{"hardness": "9H", "durability": "2+ years", "volume": "50 ml kit", "solvent": "Quartz base"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["shine", "protection"]'::jsonb,
    true,
    NOW()
  ),
  (
    '8a15ea22-ad42-4eb8-adbf-e4ee7a89ba88',
    'Pioneer DMH-Z5290BT Touchscreen Head Unit',
    'Pioneer',
    'music',
    26990.00,
    23990.00,
    4.7,
    312,
    '["/products/pioneer_screen.png"]'::jsonb,
    '6.8-inch WVGA capacitive touchscreen with built-in Apple CarPlay, Android Auto, Bluetooth, WebLink, and 13-band equalizer.',
    '{"screen_size": "6.8 inch", "connectivity": "Android Auto, Apple CarPlay, Bluetooth", "audio_output": "50W x 4"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["infotainment", "hot"]'::jsonb,
    true,
    NOW()
  ),
  (
    '9b16ea56-bd56-4cf8-adbc-c1ee8a39ba92',
    'Cardia 18-in-1 Flowing RGB Acrylic Ambient LED Kit',
    'Cardia Lighting',
    'lighting',
    6500.00,
    4999.00,
    4.6,
    184,
    '["/products/k4_ambient_light.png"]'::jsonb,
    'Advanced RGB flowing ambient lighting kit with acrylic strips. Custom control via mobile app. Features speed control, music sync, and color wheel selector.',
    '{"leds": "Flowing RGB (18-in-1)", "control": "Bluetooth App / Remote", "material": "Thin Acrylic Strips"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["interior", "aesthetic"]'::jsonb,
    true,
    NOW()
  ),
  (
    '0c17ea12-cd12-4cf8-bdce-e1ee8a29ba32',
    'Autoform Signature Custom Fit Seat Covers',
    'Autoform',
    'seats',
    14500.00,
    12499.00,
    4.8,
    92,
    '["/products/autoform_seat_covers.png"]'::jsonb,
    'Custom-molded premium seat covers with orthopedic bucket styling. Made from high-durability breathable Nappa leatherette.',
    '{"material": "Nappa Leatherette", "fit": "Orthopedic Custom Bucket Fit", "upholstery": "High-density foam"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["luxury", "interior"]'::jsonb,
    true,
    NOW()
  ),
  (
    '1d18ea78-bd78-4cf8-bdff-c1ee3a29ba45',
    'Elegant 7D Custom Fit Floor Mats',
    'Elegant',
    'mats',
    5500.00,
    4200.00,
    4.7,
    68,
    '["/products/luxury_7d_mats.png"]'::jsonb,
    '7-layer custom fitted waterproof floor mats. Reaches every corner of the footwell, trapping dirt and liquid. Anti-skid bottom layer.',
    '{"layers": "7 Layers", "waterproof": "Yes", "material": "PU Leather + Coil Mat"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["utility", "interior"]'::jsonb,
    true,
    NOW()
  ),
  (
    '2e19ea89-bd89-4cf8-bdfe-c1ee4a59ba78',
    'TPH Covers Pilot Series Premium All-Weather Car Cover',
    'TPH Covers',
    'covers',
    7999.00,
    6499.00,
    4.8,
    74,
    '["/products/tph_car_cover.png"]'::jsonb,
    'Water-resistant, dust-proof, and soft fleece-lined premium car cover. Protects your paint from UV rays, scratches, bird droppings, and bad weather.',
    '{"material": "Multi-layer Polyester + Fleece", "weatherproof": "Yes", "uv_protection": "99% UV resistant"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["protection", "outdoor"]'::jsonb,
    true,
    NOW()
  ),
  (
    '3f20ea99-bd99-4cf8-bdfe-c1ee5a69ba89',
    'Roar SS304 Dual-Tip Valvetronic Performance Exhaust',
    'Roar Exhausts',
    'exhausts',
    24500.00,
    19999.00,
    4.9,
    115,
    '["/products/valvetronic_exhaust.png"]'::jsonb,
    'High-grade SS304 stainless steel valvetronic exhaust muffler with wireless remote. Open the valves for a loud roaring rumble, close them for stock quietness.',
    '{"material": "SS304 Stainless Steel", "valve": "Remote Valvetronic", "tips": "Dual Glossy Carbon Tips"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["performance", "hot", "ECU"]'::jsonb,
    true,
    NOW()
  ),
  (
    '4a21ea10-bd10-4cf8-bdfe-c1ee6a79ba90',
    'Qubo Smart Dash Cam Pro (GPS Edition)',
    'Qubo (Hero Group)',
    'accessories',
    5490.00,
    4290.00,
    4.7,
    218,
    '["/products/qubo_dash_cam.png"]'::jsonb,
    '1080p Full HD dash camera with built-in GPS log, ADAS alerts, night vision, and Wi-Fi connection for mobile app streaming.',
    '{"resolution": "1080p Full HD", "gps": "Built-in", "adas": "Advanced Driver Assistance System", "storage": "MicroSD up to 256GB"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["gadget", "essential"]'::jsonb,
    true,
    NOW()
  ),
  (
    '5b22ea20-bd20-4cf8-bdfe-c1ee7a89ba01',
    'Bergmann Typhoon Heavy Duty Metal Car Tyre Inflator',
    'Bergmann',
    'accessories',
    2400.00,
    1899.00,
    4.6,
    139,
    '["/products/tyre_inflator.png"]'::jsonb,
    '100% brass motor heavy-duty metal tyre inflator. Inflates 0-30 psi in under 2 minutes. Features an accurate analog gauge and bright LED worklight.',
    '{"motor": "100% Brass Motor", "pressure": "Up to 150 psi", "power": "12V socket"}'::jsonb,
    '["Universal (All Cars)"]'::jsonb,
    '["essential", "utility"]'::jsonb,
    true,
    NOW()
  );

-- ---------------------------------------------------------------------------
-- 5. SEED EVENTS DATA
-- ---------------------------------------------------------------------------
INSERT INTO events (id, title, description, city, venue, date, time, image_url, tags)
VALUES
  (
    'a2c81e8b-59d8-4f9b-ae71-2be33dbcb5b1',
    'Midnight Cars & Coffee — Mumbai',
    'Late-night meet for tuners, build enthusiasts and the Mod Syndicate crew.',
    'Mumbai',
    'Marine Drive',
    '2026-06-02',
    '22:00 - 02:00',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    '["meet", "night"]'::jsonb
  ),
  (
    'b3d92e9c-6ae9-4fa0-be82-3cf44ecdc6c2',
    'Offroad Trail Run — Lonavala',
    'All-day overlanding run for modified 4x4s, SUVs and offroad vehicles.',
    'Lonavala',
    'Pavana Lake Trail',
    '2026-06-09',
    '06:00 - 18:00',
    'https://images.unsplash.com/photo-1532009877282-3340270e0529?auto=format&fit=crop&w=1200&q=80',
    '["offroad", "day"]'::jsonb
  ),
  (
    'c4fa3f0d-7bf0-4fb1-bf93-4df55fede7d3',
    'Drift Sundays — Delhi NCR',
    'Tandem drift sessions. Bring tires, leave rubber.',
    'Greater Noida',
    'BIC Karting Track',
    '2026-06-16',
    '09:00 - 17:00',
    'https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=1200&q=80',
    '["drift"]'::jsonb
  ),
  (
    'd5fb4f1e-8cf1-4fc2-cf04-5ef66fefe8e4',
    'Modified Auto Expo — Bengaluru',
    'India''s largest custom builds exhibition. Wraps, wheels, builds, talks.',
    'Bengaluru',
    'KTPO Whitefield',
    '2026-06-25',
    '10:00 - 21:00',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
    '["expo"]'::jsonb
  ),
  (
    'e6fc5f2f-9df2-4fd3-df05-6ff77f0fef05',
    'Track Day — Coimbatore',
    'Open pit lane, timed sessions, professional coaching.',
    'Coimbatore',
    'Kari Motor Speedway',
    '2026-07-10',
    '07:00 - 16:00',
    'https://images.unsplash.com/photo-1518306727298-4c17e1bf6943?auto=format&fit=crop&w=1200&q=80',
    '["track"]'::jsonb
  );

-- ---------------------------------------------------------------------------
-- 6. SEED REVIEWS DATA
-- ---------------------------------------------------------------------------
INSERT INTO reviews (id, author_name, target, rating, title, body, image_url, created_at)
VALUES
  (
    'fb16a278-df78-43d9-96de-d812fa49ba32',
    'Arjun M.',
    'Roar SS304 Dual-Tip Valvetronic Performance Exhaust',
    5,
    'My car finally breathes',
    'Felt like a different car. Exhaust note is razor sharp now. Mod Syndicate''s tune team really knows their craft.',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    NOW()
  ),
  (
    'ac27b389-ef89-44ea-87ef-e913fb59cb43',
    'Riya K.',
    'Avery Dennison Satin Metallic Blue Car Wrap',
    5,
    'Showroom finish at a meet',
    'Color shifts under streetlights like nothing else. Worth every rupee.',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    NOW()
  ),
  (
    'bd38c490-ff90-45eb-98ef-fa24fc69dc54',
    'Vikram S.',
    'Neo Royal 16" Alloys (Set of 4)',
    5,
    'Built for abuse',
    'Took my car through three road trips this month. Wheels look stunning.',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
    NOW()
  ),
  (
    'cd49d5a1-0f01-46fc-a9fe-0b35fd7ada65',
    'Neha P.',
    'CarPro CQuartz Professional 9H Ceramic Coating Kit',
    5,
    'Water just slides off',
    'Three months in monsoons, still beading like day one.',
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80',
    NOW()
  );
