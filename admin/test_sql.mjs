
const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const sql = `
CREATE TABLE IF NOT EXISTS public.home_banners (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  badge TEXT,
  image_url TEXT,
  mobile_image_url TEXT,
  cta_label TEXT,
  destination_type TEXT,
  destination_id TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all home_banners" ON public.home_banners;
CREATE POLICY "Allow public all home_banners" ON public.home_banners FOR ALL USING (true) WITH CHECK (true);
`;

async function testSql() {
  const res1 = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });
  console.log('/pg/query:', res1.status, await res1.text().catch(e => e.message));

  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ sql })
  });
  console.log('/rpc/exec_sql:', res2.status, await res2.text().catch(e => e.message));
}

testSql();
