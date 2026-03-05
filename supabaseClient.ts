import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.ts';

export const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project-url') &&
  !SUPABASE_ANON_KEY.includes('your-anon-public-key');

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn(
    "Supabase is not configured. Please update supabaseConfig.ts. The app will show a configuration screen."
  );
}

export const supabase = supabaseInstance;
