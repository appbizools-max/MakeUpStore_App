-- Supabase Database Schema for Salbeau App (Mobile App & Admin Panel)

-- 1. Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT,
  brand_name TEXT,
  category TEXT,
  mrp NUMERIC DEFAULT 0,
  salon_price NUMERIC DEFAULT 0,
  artist_price NUMERIC DEFAULT 0,
  beautician_price NUMERIC DEFAULT 0,
  stock INT DEFAULT 0,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'general',
  business_name TEXT,
  branch TEXT,
  verification_status TEXT DEFAULT 'pending',
  cancellation_count INT DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  phone TEXT,
  avatar TEXT,
  item_description TEXT,
  user_role TEXT,
  branch TEXT,
  delivery_type TEXT DEFAULT 'delivery',
  delivery_address TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'placed',
  rejection_reason TEXT DEFAULT '',
  placed_at TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  items JSONB
);

-- Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write on brands" ON public.brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime Broadcast for all 4 tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
