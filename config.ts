// Supabase configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
}

// Optional: Validate configuration
if (import.meta.env.DEV && (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey)) {
  console.warn('⚠ Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file')
}
