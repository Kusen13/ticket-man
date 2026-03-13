import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lgvxipvgtquqqcmyzjug.supabase.co";
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_EUNDJ2QDw4rL593bnzEHsQ_tI_bY571";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
