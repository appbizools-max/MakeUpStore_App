import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzQ1NzQsImV4cCI6MjEwNTExMDU3NH0.UwI73FLqf2SxItqjj_IAxf1PN6lLkMrUSHxZpOunQHc';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'salbeau-admin-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    storageKey: 'salbeau-admin-service-token',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
export default supabase;
