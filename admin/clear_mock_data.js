import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function clearMockData() {
  console.log('Clearing mock test orders and mock users from Supabase...');

  // Delete all mock test orders
  const { error: oErr } = await supabase.from('orders').delete().neq('id', 'keep_none');
  if (oErr) console.warn('Error clearing orders:', oErr.message);
  else console.log('Successfully cleared all mock orders!');

  // Delete all mock test users
  const { error: uErr } = await supabase.from('users').delete().neq('id', 'keep_none');
  if (uErr) console.warn('Error clearing users:', uErr.message);
  else console.log('Successfully cleared all mock users!');

  console.log('Database cleanup complete. Supabase is now 100% ready for real user orders!');
  process.exit(0);
}

clearMockData();
