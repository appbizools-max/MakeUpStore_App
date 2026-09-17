import fetch from 'node-fetch';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const sql = `
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT,
  brand_name TEXT,
  category TEXT,
  mrp NUMERIC,
  salon_price NUMERIC,
  artist_price NUMERIC,
  beautician_price NUMERIC,
  stock INT DEFAULT 0,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  business_name TEXT,
  branch TEXT,
  verification_status TEXT DEFAULT 'pending',
  cancellation_count INT DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  phone TEXT,
  avatar TEXT,
  item_description TEXT,
  user_role TEXT,
  branch TEXT,
  delivery_type TEXT,
  delivery_address TEXT,
  total_amount NUMERIC,
  status TEXT DEFAULT 'placed',
  rejection_reason TEXT,
  placed_at TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  items JSONB
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
`;

async function createTables() {
  console.log('Attempting table creation via Supabase endpoints...');
  
  // Try calling pg endpoint / sql endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('SQL Exec Status:', res.status);
  const text = await res.text();
  console.log('SQL Exec Response:', text);
}

createTables();
