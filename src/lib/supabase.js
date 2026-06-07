// Supabase is pre-wired but OPTIONAL. You don't need it for Month 1.
// In a later month, paste your Supabase URL + anon key into config.js and
// this client becomes available for any tool that needs a real database.
import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "../config.js";

export const supabase =
  CONFIG.supabaseUrl && CONFIG.supabaseAnonKey
    ? createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey)
    : null;
