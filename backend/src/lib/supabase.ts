import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Server-side Supabase admin client with service role key
// NEVER expose this to the frontend!
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
