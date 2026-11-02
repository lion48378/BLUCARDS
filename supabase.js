
const SUPABASE_URL = "https://sulvrhozhqkdtzuimuye.supabase.co";

// Paste your publishable key here locally.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BpIhWw-Z21K-3acwgVv9dg_xIKk-euu"

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;

console.log("BLUCARDS connected to Supabase!");
