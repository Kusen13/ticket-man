import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lgvxipvgtquqqcmyzjug.supabase.co";
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndnhpcHZndHF1cXFjbXl6anVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjUwMDMsImV4cCI6MjA4ODYwMTAwM30.c3_1MrF6-_7R5JE4PMzauI-IU6FGv19W3druYYCBDGk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
