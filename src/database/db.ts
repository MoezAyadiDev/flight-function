import { createClient } from "@supabase/supabase-js";
import { Database } from "./supabase";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceKey = process.env.API_KEY ?? "";

const db = createClient<Database>(supabaseUrl, serviceKey);

export { db };
