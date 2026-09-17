import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzQ1NzQsImV4cCI6MjEwNTExMDU3NH0.UwI73FLqf2SxItqjj_IAxf1PN6lLkMrUSHxZpOunQHc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
