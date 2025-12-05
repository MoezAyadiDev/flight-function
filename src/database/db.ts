// In your database file (e.g., `db.ts` or `supabase.ts`)
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceKey = process.env.API_KEY ?? "";

// 🚀 Initialize the Supabase Client once
const db = createClient(supabaseUrl, serviceKey);

// 🔑 Export the initialized client instance
export { db };
