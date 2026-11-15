import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Browser-safe client. It can only do what the database security rules (RLS) allow.
export const supabase = url && key ? createClient(url, key) : null;
