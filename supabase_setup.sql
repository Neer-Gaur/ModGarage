-- ============================================================================
-- ModSyndicate / ModGarage — Supabase Complete Setup Script
-- ============================================================================
-- HOW TO RUN:
--   1. Create a new Supabase project at https://supabase.com
--   2. Open Dashboard → SQL Editor → New Query
--   3. Paste this ENTIRE file and click "Run"
--   4. The script is idempotent — safe to re-run.
--
-- WHAT THIS SCRIPT CREATES:
--   • 14 tables with proper indexes
--   • Trigger to auto-create profile when a user signs up via Supabase Auth
--   • Row-Level Security policies for all user-scoped tables
--   • 4 public storage buckets: post-media, car-images, product-images, avatars
--   • Storage RLS policies (public read, authenticated write)
--   • Seed data: 15 products, 8 community channels, 28 booking slots, 4 sample posts
--
-- AFTER RUNNING THIS SCRIPT:
--   1. Dashboard → Authentication → Providers → enable Google OAuth
--      (use your Google Cloud OAuth Client ID + Secret)
--   2. Dashboard → Authentication → URL Configuration:
--      - Site URL:           https://modsyndicate.in
--      - Redirect URLs:      https://modsyndicate.in/auth/callback,
--                            http://localhost:3000/auth/callback
--   3. Dashboard → Project Settings → API → copy:
--      - Project URL          → REACT_APP_SUPABASE_URL (frontend)
--      - anon public key      → REACT_APP_SUPABASE_ANON_KEY (frontend)
--      - service_role key     → SUPABASE_SERVICE_KEY (backend)
--      - JWT Secret           → SUPABASE_JWT_SECRET (backend)
--   4. Dashboard → Project Settings → Database → Connection String → "Transaction Pooler":
--      - postgresql://postgres.xxx:PWD@aws-0-REGION.pooler.supabase.com:6543/postgres
--                             → DATABASE_URL (backend)
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ---------- profiles (mirrors auth.users + app metadata) -------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY,
    email           TEXT NOT NULL,
    name            TEXT DEFAULT '',
    picture         TEXT DEFAULT '',
    phone           TEXT DEFAULT '',
    role            TEXT NOT NULL DEFAULT 'user',
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles(role);

-- ---------- cars -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cars (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    make            TEXT NOT NULL,
    model           TEXT NOT NULL,
    year            INT  NOT NULL,
    variant         TEXT DEFAULT '',
    color           TEXT DEFAULT '',
    image_url       TEXT DEFAULT '',
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON public.cars(user_id);

-- ---------- products ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    category            TEXT NOT NULL,
    brand               TEXT NOT NULL,
    price               NUMERIC(12,2) NOT NULL,
    installation_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
    description         TEXT DEFAULT '',
    images              TEXT[] NOT NULL DEFAULT '{}',
    compatible_makes    TEXT[] NOT NULL DEFAULT '{}',
    in_stock            BOOLEAN NOT NULL DEFAULT TRUE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON public.products(slug);

-- ---------- garage_items -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.garage_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_id          UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity        INT  NOT NULL DEFAULT 1,
    customization   JSONB NOT NULL DEFAULT '{}'::jsonb,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, car_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_garage_user_car ON public.garage_items(user_id, car_id);

-- ---------- booking_slots ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE NOT NULL,
    start_time      TEXT NOT NULL,
    end_time        TEXT NOT NULL,
    capacity        INT  NOT NULL DEFAULT 5,
    booked_count    INT  NOT NULL DEFAULT 0,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slots_date ON public.booking_slots(date);

-- ---------- bookings ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code        TEXT NOT NULL UNIQUE,
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_id              UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
    slot_id             UUID NOT NULL REFERENCES public.booking_slots(id) ON DELETE RESTRICT,
    status              TEXT NOT NULL DEFAULT 'confirmed',
    pickup_address      TEXT NOT NULL,
    total_parts_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_labour_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
    items               JSONB NOT NULL DEFAULT '[]'::jsonb,
    slot_date           DATE,
    slot_time           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_user        ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at  ON public.bookings(created_at DESC);

-- ---------- channels ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT DEFAULT '',
    created_by      UUID,
    member_count    INT  NOT NULL DEFAULT 0,
    post_count      INT  NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_channels_slug ON public.channels(slug);

-- ---------- channel_members --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channel_members (
    channel_id      UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

-- ---------- posts ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_id              UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    channel_id          UUID REFERENCES public.channels(id) ON DELETE SET NULL,
    caption             TEXT NOT NULL,
    media_urls          TEXT[] NOT NULL DEFAULT '{}',
    tagged_products     UUID[] NOT NULL DEFAULT '{}',
    likes_count         INT NOT NULL DEFAULT 0,
    comments_count      INT NOT NULL DEFAULT 0,
    upvotes             INT NOT NULL DEFAULT 0,
    downvotes           INT NOT NULL DEFAULT 0,
    vote_count          INT NOT NULL DEFAULT 0,
    is_published        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_created_at  ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_channel     ON public.posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_posts_vote_count  ON public.posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user        ON public.posts(user_id);

-- ---------- post_votes -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_votes (
    post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote        TEXT NOT NULL CHECK (vote IN ('up','down')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- ---------- post_likes -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- ---------- post_comments ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    parent_comment_id   UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.post_comments(post_id, created_at);

-- ---------- saved_posts ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_posts (
    post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- ============================================================================
-- 3. AUTO-PROFILE TRIGGER
--   When a user signs up via Supabase Auth (auth.users INSERT), create a
--   matching profile row using the same UUID as auth.users.id.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, picture)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email   = EXCLUDED.email,
        name    = COALESCE(NULLIF(EXCLUDED.name, ''),    public.profiles.name),
        picture = COALESCE(NULLIF(EXCLUDED.picture, ''), public.profiles.picture),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. ROW-LEVEL SECURITY (RLS)
--   - Backend uses the service_role key which BYPASSES RLS.
--   - Frontend uses the anon key with the user's JWT — RLS enforced.
--   - Public read access for products, channels, slots, posts (community feed).
-- ============================================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts     ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read public profile; only the owner can update
DROP POLICY IF EXISTS "profiles_read_all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_read_all"   ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- cars: only owner can CRUD their cars
DROP POLICY IF EXISTS "cars_owner_all" ON public.cars;
CREATE POLICY "cars_owner_all" ON public.cars FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- products: public read, no public write (admin via service_role only)
DROP POLICY IF EXISTS "products_read_all" ON public.products;
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (is_active = TRUE);

-- garage_items: only owner
DROP POLICY IF EXISTS "garage_owner_all" ON public.garage_items;
CREATE POLICY "garage_owner_all" ON public.garage_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- booking_slots: public read, write via service_role only
DROP POLICY IF EXISTS "slots_read_all" ON public.booking_slots;
CREATE POLICY "slots_read_all" ON public.booking_slots FOR SELECT USING (TRUE);

-- bookings: only owner
DROP POLICY IF EXISTS "bookings_owner_all" ON public.bookings;
CREATE POLICY "bookings_owner_all" ON public.bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- channels: public read, authenticated create
DROP POLICY IF EXISTS "channels_read_all"     ON public.channels;
DROP POLICY IF EXISTS "channels_auth_create"  ON public.channels;
CREATE POLICY "channels_read_all"    ON public.channels FOR SELECT USING (TRUE);
CREATE POLICY "channels_auth_create" ON public.channels FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- channel_members: only owner
DROP POLICY IF EXISTS "channel_members_self" ON public.channel_members;
CREATE POLICY "channel_members_self" ON public.channel_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- posts: public read; only owner can write/update/delete their posts
DROP POLICY IF EXISTS "posts_read_published" ON public.posts;
DROP POLICY IF EXISTS "posts_owner_write"    ON public.posts;
DROP POLICY IF EXISTS "posts_owner_update"   ON public.posts;
DROP POLICY IF EXISTS "posts_owner_delete"   ON public.posts;
CREATE POLICY "posts_read_published" ON public.posts FOR SELECT USING (is_published = TRUE);
CREATE POLICY "posts_owner_write"    ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_owner_update"   ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_owner_delete"   ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- post_votes / post_likes / saved_posts: only owner
DROP POLICY IF EXISTS "post_votes_owner" ON public.post_votes;
DROP POLICY IF EXISTS "post_likes_owner" ON public.post_likes;
DROP POLICY IF EXISTS "saved_posts_owner" ON public.saved_posts;
CREATE POLICY "post_votes_owner" ON public.post_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_owner" ON public.post_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_posts_owner" ON public.saved_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- post_comments: public read; only owner can create/edit
DROP POLICY IF EXISTS "comments_read_all"   ON public.post_comments;
DROP POLICY IF EXISTS "comments_owner_write" ON public.post_comments;
CREATE POLICY "comments_read_all"    ON public.post_comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_owner_write" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. STORAGE BUCKETS (4 public buckets)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('post-media',     'post-media',     TRUE),
    ('car-images',     'car-images',     TRUE),
    ('product-images', 'product-images', TRUE),
    ('avatars',        'avatars',        TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage RLS policies (public read, authenticated write owner-scoped)
DROP POLICY IF EXISTS "public_read_buckets" ON storage.objects;
CREATE POLICY "public_read_buckets" ON storage.objects FOR SELECT USING (
    bucket_id IN ('post-media','car-images','product-images','avatars')
);

DROP POLICY IF EXISTS "auth_upload_post_media" ON storage.objects;
CREATE POLICY "auth_upload_post_media" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_upload_car_images" ON storage.objects;
CREATE POLICY "auth_upload_car_images" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'car-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_upload_avatars" ON storage.objects;
CREATE POLICY "auth_upload_avatars" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- product-images: write only via service_role (admin)
-- (no public INSERT policy → only service_role bypass works)

-- Owners can update/delete their own uploaded files
DROP POLICY IF EXISTS "users_modify_own_files" ON storage.objects;
CREATE POLICY "users_modify_own_files" ON storage.objects FOR UPDATE
    USING (auth.uid() = owner) WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "users_delete_own_files" ON storage.objects;
CREATE POLICY "users_delete_own_files" ON storage.objects FOR DELETE
    USING (auth.uid() = owner);

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- ---------- System / official user (for sample posts) -----------------------
-- Fixed UUID; profile rows are NOT FK-constrained to auth.users so this is safe.
INSERT INTO public.profiles (id, email, name, picture, role, is_system)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'official@modsyndicate.in',
    'ModSyndicate Official',
    '',
    'admin',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ---------- Products (15) ---------------------------------------------------
WITH img AS (
    SELECT
        'https://images.unsplash.com/photo-1745439988955-da4eee57918a?w=600&h=400&fit=crop' AS rim,
        'https://images.unsplash.com/photo-1771623915340-d3c68845e400?w=600&h=400&fit=crop' AS engine,
        'https://images.unsplash.com/photo-1773502605492-5d5e8c0c17a2?w=600&h=400&fit=crop' AS carbon,
        'https://images.unsplash.com/photo-1774576320208-9914d1fc5be5?w=600&h=400&fit=crop' AS car1,
        'https://images.unsplash.com/photo-1628273148878-b9ebaec15818?w=600&h=400&fit=crop' AS car2,
        'https://images.pexels.com/photos/9139586/pexels-photo-9139586.jpeg?w=600&h=400&fit=crop' AS sports
)
INSERT INTO public.products
    (name, slug, category, brand, price, installation_cost, description, images, compatible_makes)
SELECT * FROM (VALUES
    ('OZ Racing Ultraleggera HLT',    'oz-racing-ultraleggera', 'rims',       'OZ Racing',          72000,  5000,  'Forged aluminum alloy wheels with HLT technology. Ultra-lightweight construction for maximum performance.', ARRAY[(SELECT rim FROM img)],    ARRAY[]::TEXT[]),
    ('Enkei RPF1 Competition',        'enkei-rpf1',             'rims',       'Enkei',              55000,  5000,  'MAT process forged wheels. Track-proven performance with aggressive concave design.',                       ARRAY[(SELECT rim FROM img)],    ARRAY[]::TEXT[]),
    ('BBS Super RS Forged',           'bbs-super-rs',           'rims',       'BBS',                95000,  5000,  'Premium forged two-piece wheels with iconic mesh design. Motorsport heritage meets street luxury.',         ARRAY[(SELECT rim FROM img)],    ARRAY[]::TEXT[]),
    ('Akrapovic Slip-On Titanium',    'akrapovic-titanium',     'exhaust',    'Akrapovic',         125000, 12000,  'Full titanium construction with carbon fiber tips. Aggressive sound profile with 15% weight reduction.',    ARRAY[(SELECT engine FROM img)], ARRAY['BMW','Mercedes','Audi']),
    ('Borla ATAK Cat-Back System',    'borla-atak',             'exhaust',    'Borla',              68000,  8000,  'Aggressive Thunder sound level. T-304 stainless steel with patented multi-core technology.',                ARRAY[(SELECT engine FROM img)], ARRAY['Honda','Hyundai','Maruti Suzuki']),
    ('APR Carbon Fiber Wing',         'apr-carbon-wing',        'spoiler',    'APR Performance',    45000,  6000,  'GTC-200 adjustable wing with real carbon fiber construction. Wind tunnel tested for maximum downforce.',    ARRAY[(SELECT car1 FROM img)],   ARRAY[]::TEXT[]),
    ('Voltex GT Wing Type V',         'voltex-gt-wing',         'spoiler',    'Voltex',            180000, 15000,  'Japanese-made full carbon GT wing. Championship-proven aerodynamics with adjustable angle.',                ARRAY[(SELECT car1 FROM img)],   ARRAY['Honda','Toyota','Maruti Suzuki']),
    ('Morimoto XB LED Pro',           'morimoto-xb-led',        'headlights', 'Morimoto',           42000,  5000,  'Plug-and-play LED headlight upgrade. Sequential turn signals with DRL strip.',                              ARRAY[(SELECT sports FROM img)], ARRAY[]::TEXT[]),
    ('Oracle ColorSHIFT Halo Kit',    'oracle-colorshift',      'headlights', 'Oracle Lighting',    28000,  4000,  'RGB color-changing halo rings with Bluetooth control. Over 16 million colors.',                             ARRAY[(SELECT sports FROM img)], ARRAY[]::TEXT[]),
    ('KW Coilover V3 Kit',            'kw-v3-coilover',         'suspension', 'KW Suspensions',    135000, 18000,  'Triple-adjustable coilovers with separate rebound and compression damping. Track to street versatility.',   ARRAY[(SELECT carbon FROM img)], ARRAY['BMW','Mercedes','Audi','Volkswagen']),
    ('Bilstein B16 PSS10',            'bilstein-b16',           'suspension', 'Bilstein',           98000, 15000,  '10-stage adjustable damping with progressive rate springs. German engineering for precision handling.',     ARRAY[(SELECT carbon FROM img)], ARRAY['BMW','Mercedes','Honda']),
    ('Sparco QRT-R Bucket Seat',      'sparco-qrt-r',           'interior',   'Sparco',             85000,  8000,  'FIA-approved carbon fiber racing seat. Alcantara upholstery with integrated head restraint.',               ARRAY[(SELECT car2 FROM img)],   ARRAY[]::TEXT[]),
    ('Seibon Carbon Fiber Hood',      'seibon-cf-hood',         'hood',       'Seibon',             65000,  8000,  'OEM-style carbon fiber hood with UV-resistant clear coat. 60% lighter than stock.',                         ARRAY[(SELECT engine FROM img)], ARRAY['Honda','Hyundai','Maruti Suzuki','Tata']),
    ('3M 2080 Satin Black Full Wrap', '3m-satin-black',         'vinyl',      '3M',                 45000, 15000,  'Full body satin black wrap with Comply adhesive and Controltac technology. Self-healing properties.',       ARRAY[(SELECT car1 FROM img)],   ARRAY[]::TEXT[]),
    ('NRG Quick Release Hub Kit',     'nrg-quick-release',      'interior',   'NRG Innovations',    12000,  2000,  'Steering wheel quick release with SFI-rated ball locking mechanism. Anodized finish.',                       ARRAY[(SELECT car2 FROM img)],   ARRAY[]::TEXT[])
) AS p(name, slug, category, brand, price, installation_cost, description, images, compatible_makes)
ON CONFLICT (slug) DO NOTHING;

-- ---------- Channels (8) ----------------------------------------------------
INSERT INTO public.channels (name, slug, description, member_count) VALUES
    ('Mahindra Thar Club',  'mahindra-thar-club',  'All things Thar — lifts, bumpers, winches and trail stories.',                  342),
    ('Toyota Supra Builds', 'toyota-supra-builds', 'MK4 and MK5 Supra build diaries, dyno results and tuning tips.',                518),
    ('BMW M Series',        'bmw-m-series',        'M2, M3, M4 and beyond. Performance mods and track setups.',                     672),
    ('JDM Legends',         'jdm-legends',         'Skyline, RX-7, NSX, EVO — the icons of Japanese performance.',                  891),
    ('Mustang Nation',      'mustang-nation',      'From classic 5.0 to modern GT500. American muscle at its finest.',              423),
    ('Off-Road Warriors',   'off-road-warriors',   'Jeeps, trucks, 4x4s — mud, rocks and everything in between.',                   287),
    ('Track Day Diaries',   'track-day-diaries',   'Lap times, suspension setups, and aero data from the circuit.',                 156),
    ('Show and Shine',      'show-and-shine',      'Detailing, wraps, paint correction — make it look as good as it drives.',      734)
ON CONFLICT (slug) DO NOTHING;

-- ---------- Booking slots (next 14 days, 2 per day) -------------------------
INSERT INTO public.booking_slots (date, start_time, end_time, capacity)
SELECT (CURRENT_DATE + d)::DATE, '09:00', '13:00', 5
FROM generate_series(1, 14) AS d
WHERE NOT EXISTS (
    SELECT 1 FROM public.booking_slots
    WHERE date = (CURRENT_DATE + d)::DATE AND start_time = '09:00'
);
INSERT INTO public.booking_slots (date, start_time, end_time, capacity)
SELECT (CURRENT_DATE + d)::DATE, '14:00', '18:00', 5
FROM generate_series(1, 14) AS d
WHERE NOT EXISTS (
    SELECT 1 FROM public.booking_slots
    WHERE date = (CURRENT_DATE + d)::DATE AND start_time = '14:00'
);

-- ---------- Sample posts (4) ------------------------------------------------
DO $$
DECLARE
    sys_user UUID := '00000000-0000-0000-0000-000000000001';
    p_ids UUID[];
    ch_show UUID;
    ch_bmw UUID;
    ch_jdm UUID;
    ch_track UUID;
BEGIN
    SELECT array_agg(id) INTO p_ids FROM (SELECT id FROM public.products LIMIT 3) sub;
    SELECT id INTO ch_show  FROM public.channels WHERE slug = 'show-and-shine'    LIMIT 1;
    SELECT id INTO ch_bmw   FROM public.channels WHERE slug = 'bmw-m-series'      LIMIT 1;
    SELECT id INTO ch_jdm   FROM public.channels WHERE slug = 'jdm-legends'       LIMIT 1;
    SELECT id INTO ch_track FROM public.channels WHERE slug = 'track-day-diaries' LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM public.posts WHERE user_id = sys_user) THEN
        INSERT INTO public.posts (user_id, channel_id, caption, media_urls, tagged_products,
                                  likes_count, comments_count, upvotes, downvotes, vote_count)
        VALUES
            (sys_user, ch_show,  'Fresh build complete! Full carbon aero kit with titanium exhaust. The sound is absolutely insane.',
                ARRAY['https://images.unsplash.com/photo-1774576320208-9914d1fc5be5?w=600&h=400&fit=crop'],
                p_ids[1:2], 47, 12, 47, 3, 44),
            (sys_user, ch_bmw,   'Weekend project turned masterpiece. KW V3 coilovers + BBS RS wheels. Sits perfect.',
                ARRAY['https://images.unsplash.com/photo-1628273148878-b9ebaec15818?w=600&h=400&fit=crop'],
                p_ids[2:3], 83, 24, 83, 5, 78),
            (sys_user, ch_jdm,   'Engine bay goals. Every bolt, every hose - perfection. Who else obsesses over the details?',
                ARRAY['https://images.unsplash.com/photo-1771623915340-d3c68845e400?w=600&h=400&fit=crop'],
                p_ids[1:1], 156, 38, 156, 8, 148),
            (sys_user, ch_track, 'Track day ready. Full suspension overhaul and aero package installed. Shaved 3 seconds off our lap time!',
                ARRAY['https://images.unsplash.com/photo-1774088249014-b0d7d907ad16?w=600&h=400&fit=crop'],
                p_ids, 210, 52, 210, 12, 198);

        UPDATE public.channels SET post_count = post_count + 1
            WHERE id IN (ch_show, ch_bmw, ch_jdm, ch_track);
    END IF;
END $$;

-- ============================================================================
-- 7. UTILITY VIEWS (optional — used by backend joins)
-- ============================================================================

-- Posts with author info
CREATE OR REPLACE VIEW public.posts_with_author AS
SELECT
    p.*,
    pr.name      AS author_name,
    pr.picture   AS author_picture,
    c.name       AS channel_name,
    c.slug       AS channel_slug
FROM public.posts p
LEFT JOIN public.profiles pr ON pr.id = p.user_id
LEFT JOIN public.channels c  ON c.id = p.channel_id;

GRANT SELECT ON public.posts_with_author TO anon, authenticated, service_role;

-- ============================================================================
-- DONE!  Verify with these queries:
--   SELECT count(*) FROM public.products;        -- expect 15
--   SELECT count(*) FROM public.channels;        -- expect 8
--   SELECT count(*) FROM public.booking_slots;   -- expect 28
--   SELECT count(*) FROM public.posts;           -- expect 4
--   SELECT id, name, public FROM storage.buckets;-- expect 4 buckets
-- ============================================================================
